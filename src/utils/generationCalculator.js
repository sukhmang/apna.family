/**
 * Generation Calculator
 * 
 * Assigns generation numbers to people in the family tree
 * Ensures spouses are at the same generation level
 * Follows genealogy standards where generations are horizontal "stripes"
 */

/**
 * Calculate generations for all people in the tree
 * @param {Array} people - Array of person objects from tree.json
 * @returns {Map<string, number>} - Map of person ID to generation number
 */
export function calculateGenerations(people) {
  const generationMap = new Map()
  const personMap = new Map()
  
  // Create person map for quick lookup
  people.forEach(person => {
    personMap.set(person.id, person)
  })

  // Find root nodes (people with no parents)
  const rootNodes = people.filter(person => 
    !person.parents || person.parents.length === 0
  )

  // If no root nodes, find the oldest generation (people with the oldest DOB)
  if (rootNodes.length === 0) {
    // Find people with earliest DOB as roots
    const peopleWithDOB = people.filter(p => p.dob).sort((a, b) => {
      try {
        return new Date(a.dob) - new Date(b.dob)
      } catch {
        return 0
      }
    })
    
    if (peopleWithDOB.length > 0) {
      const oldestDOB = peopleWithDOB[0].dob
      rootNodes.push(...people.filter(p => p.dob === oldestDOB))
    } else {
      // Fallback: use first person as root
      rootNodes.push(people[0])
    }
  }

  // Find the absolute oldest DOB among all root nodes
  // This will be our baseline generation (0)
  let oldestDOB = null
  rootNodes.forEach(root => {
    if (root.dob) {
      try {
        const dob = new Date(root.dob)
        if (!oldestDOB || dob < oldestDOB) {
          oldestDOB = dob
        }
      } catch {}
    }
  })

  // Assign generations to root nodes based on their DOB relative to the oldest
  // All root nodes with the oldest DOB (or no DOB) get generation 0
  // Root nodes with later DOBs get higher generation numbers
  rootNodes.forEach(root => {
    if (root.dob && oldestDOB) {
      try {
        const rootDOB = new Date(root.dob)
        // Calculate generation based on ~25 year intervals
        const yearsDiff = (rootDOB - oldestDOB) / (365.25 * 24 * 60 * 60 * 1000)
        const genOffset = Math.max(0, Math.floor(yearsDiff / 25))
        generationMap.set(root.id, genOffset)
      } catch {
        generationMap.set(root.id, 0)
      }
    } else {
      generationMap.set(root.id, 0)
    }
  })

  // BFS traversal to assign generations based on parent-child relationships
  const queue = [...rootNodes]
  const visited = new Set(rootNodes.map(r => r.id))

  while (queue.length > 0) {
    const current = queue.shift()
    const currentGen = generationMap.get(current.id) ?? 0

    // Assign children to next generation
    if (current.children && Array.isArray(current.children)) {
      current.children.forEach(childId => {
        if (personMap.has(childId)) {
          const child = personMap.get(childId)
          const existingGen = generationMap.get(childId)
          
          // Only set if not already set, or if this gives a lower generation (closer to root)
          if (existingGen === undefined || currentGen + 1 < existingGen) {
            generationMap.set(childId, currentGen + 1)
          }
          
          if (!visited.has(childId)) {
            visited.add(childId)
            queue.push(child)
          }
        }
      })
    }

    // Also traverse up from children to assign parents
    if (current.parents && Array.isArray(current.parents)) {
      current.parents.forEach(parentId => {
        if (personMap.has(parentId)) {
          const existingGen = generationMap.get(parentId)
          
          // Only set if not already set, or if this gives a lower generation (closer to root)
          if (existingGen === undefined || currentGen - 1 < existingGen) {
            generationMap.set(parentId, currentGen - 1)
          }
          
          if (!visited.has(parentId)) {
            visited.add(parentId)
            queue.push(personMap.get(parentId))
          }
        }
      })
    }
  }

  // Handle disconnected nodes (orphans) - assign them generation 0 or based on DOB
  people.forEach(person => {
    if (!generationMap.has(person.id)) {
      // Try to infer from DOB if available
      if (person.dob) {
        // Find average generation of people with similar DOB
        const similarDOB = people.filter(p => 
          p.dob && Math.abs(new Date(p.dob) - new Date(person.dob)) < 365 * 20 * 24 * 60 * 60 * 1000 // 20 years
        )
        if (similarDOB.length > 0) {
          const avgGen = similarDOB
            .map(p => generationMap.get(p.id))
            .filter(g => g !== undefined)
            .reduce((sum, g, _, arr) => sum + g / arr.length, 0)
          generationMap.set(person.id, Math.round(avgGen) || 0)
        } else {
          generationMap.set(person.id, 0)
        }
      } else {
        generationMap.set(person.id, 0)
      }
    }
  })

  // Sync spouses to same generation
  people.forEach(person => {
    if (person.partners && Array.isArray(person.partners)) {
      const personGen = generationMap.get(person.id) ?? 0
      
      person.partners.forEach(partnerId => {
        if (personMap.has(partnerId)) {
          const partnerGen = generationMap.get(partnerId)
          
          // If partner has a generation, use the minimum (earlier generation)
          // Otherwise, assign partner to same generation as person
          if (partnerGen !== undefined) {
            const minGen = Math.min(personGen, partnerGen)
            generationMap.set(person.id, minGen)
            generationMap.set(partnerId, minGen)
          } else {
            generationMap.set(partnerId, personGen)
          }
        }
      })
    }
  })

  // Final pass: ensure all spouses are at same generation
  people.forEach(person => {
    if (person.partners && Array.isArray(person.partners)) {
      const personGen = generationMap.get(person.id) ?? 0
      
      person.partners.forEach(partnerId => {
        if (personMap.has(partnerId)) {
          generationMap.set(partnerId, personGen)
        }
      })
    }
  })

  return generationMap
}

/**
 * Get the minimum generation number (for normalization)
 * @param {Map<string, number>} generationMap - Generation map
 * @returns {number} - Minimum generation value
 */
export function getMinGeneration(generationMap) {
  if (generationMap.size === 0) return 0
  return Math.min(...Array.from(generationMap.values()))
}

/**
 * Normalize generations to start from 0
 * @param {Map<string, number>} generationMap - Generation map
 * @returns {Map<string, number>} - Normalized generation map
 */
export function normalizeGenerations(generationMap) {
  const minGen = getMinGeneration(generationMap)
  const normalized = new Map()
  
  generationMap.forEach((gen, personId) => {
    normalized.set(personId, gen - minGen)
  })
  
  return normalized
}
