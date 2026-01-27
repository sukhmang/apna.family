/**
 * Relationship Calculator
 * 
 * Calculates family relationships between two people based on their path in the family tree
 * Handles both English and Indian (Punjabi) relationship terminology
 * Based on FAMILYRELATIONGUIDE.md
 */

import { findPath } from './pathFinder'
import { getRelationshipLabel } from './relationshipLabels'

/**
 * Calculate relationship between root person and target person
 * @param {string} rootId - Tree ID of root person (e.g., "sukhman_grewal")
 * @param {string} targetId - Tree ID of target person (e.g., "baljit_grewal")
 * @param {Array} people - Array of person objects from tree.json
 * @param {boolean} useIndianTerms - Whether to use Indian terms (default: false)
 * @returns {Object|null} - Relationship object with labels, or null if no relationship found
 * 
 * @example
 * calculateRelationship("sukhman_grewal", "baljit_grewal", people, false)
 * // Returns: { type: "father", english: "Father", indian: "Baba ji", path: [...] }
 */
export function calculateRelationship(rootId, targetId, people, useIndianTerms = false) {
  if (!rootId || !targetId || !people || people.length === 0) {
    return null
  }

  if (rootId === targetId) {
    return {
      type: 'self',
      english: '',
      indian: '',
      path: [rootId]
    }
  }

  // Find path between root and target
  const path = findPath(rootId, targetId, people)
  
  if (!path || path.length < 2) {
    return null
  }

  // Create person map for quick lookup
  const personMap = new Map()
  people.forEach(person => {
    personMap.set(person.id, person)
  })

  const rootPerson = personMap.get(rootId)
  const targetPerson = personMap.get(targetId)

  if (!rootPerson || !targetPerson) {
    return null
  }

  // Determine relationship type based on path
  const relationshipType = determineRelationshipType(path, rootPerson, targetPerson, personMap)
  
  if (!relationshipType) {
    return null
  }

  // Get labels
  const englishLabel = getRelationshipLabel(relationshipType, false, targetPerson.gender)
  const indianLabel = getRelationshipLabel(relationshipType, true, targetPerson.gender)

  return {
    type: relationshipType,
    english: englishLabel,
    indian: indianLabel,
    path: path,
    generationDistance: path.length - 1
  }
}

/**
 * Determine relationship type from path
 * @param {Array<string>} path - Path array of person IDs
 * @param {Object} rootPerson - Root person object
 * @param {Object} targetPerson - Target person object
 * @param {Map} personMap - Map of person ID to person object
 * @returns {string|null} - Relationship type identifier
 */
function determineRelationshipType(path, rootPerson, targetPerson, personMap) {
  if (path.length === 1) {
    return 'self'
  }

  // Direct parent-child relationship (path length 2)
  if (path.length === 2) {
    const isParent = rootPerson.parents?.includes(targetPerson.id)
    const isChild = targetPerson.parents?.includes(rootPerson.id)
    const isPartner = rootPerson.partners?.includes(targetPerson.id)

    if (isParent) {
      if (targetPerson.gender === 'M') return 'father'
      if (targetPerson.gender === 'F') return 'mother'
    }
    
    if (isChild) {
      if (targetPerson.gender === 'M') return 'son'
      if (targetPerson.gender === 'F') return 'daughter'
    }

    if (isPartner) {
      if (targetPerson.gender === 'M') return 'husband'
      if (targetPerson.gender === 'F') return 'wife'
    }
  }

  // Path length 2: Could be sibling, parent, child, or partner
  // We already handled parent/child/partner above, so check siblings here
  if (path.length === 2) {
    // Check if they share parents (siblings)
    const rootParents = rootPerson.parents || []
    const targetParents = targetPerson.parents || []
    const commonParents = rootParents.filter(p => targetParents.includes(p))
    
    if (commonParents.length > 0) {
      // Determine older/younger based on DOB
      const isOlder = isPersonOlder(targetPerson, rootPerson)
      if (targetPerson.gender === 'M') {
        return isOlder ? 'brother_older' : 'brother_younger'
      } else {
        return isOlder ? 'sister_older' : 'sister_younger'
      }
    }
  }

  // Path length 3: Grandparents, uncles/aunts, nieces/nephews
  if (path.length === 3) {
    const middlePerson = personMap.get(path[1])
    if (!middlePerson) return null

    // Check if middle person is root's parent
    if (rootPerson.parents?.includes(middlePerson.id)) {
      // Check if target is middle person's parent (grandparent)
      if (middlePerson.parents?.includes(targetPerson.id)) {
        // Determine paternal vs maternal based on middle person's gender
        // If middle person is root's father, it's paternal; if mother, it's maternal
        const isPaternal = middlePerson.gender === 'M'
        
        if (targetPerson.gender === 'M') {
          return isPaternal ? 'grandfather_paternal' : 'grandfather_maternal'
        } else {
          return isPaternal ? 'grandmother_paternal' : 'grandmother_maternal'
        }
      }
      
      // Check if target is middle person's sibling (uncle/aunt)
      const middleParents = middlePerson.parents || []
      const targetParents = targetPerson.parents || []
      const areSiblings = middleParents.length > 0 && 
                         targetParents.length > 0 &&
                         middleParents.some(p => targetParents.includes(p))
      
      if (areSiblings) {
        // Determine paternal vs maternal based on middle person's gender
        // If middle person is root's father, it's paternal; if mother, it's maternal
        const isPaternal = middlePerson.gender === 'M'
        const isOlder = isPersonOlder(targetPerson, middlePerson)
        
        if (targetPerson.gender === 'M') {
          if (isPaternal) {
            return isOlder ? 'uncle_paternal_older' : 'uncle_paternal_younger'
          } else {
            return 'uncle_maternal'
          }
        } else {
          if (isPaternal) {
            return 'aunt_paternal'
          } else {
            return 'aunt_maternal'
          }
        }
      }
    }

    // Check if middle person is root's sibling
    const rootParents = rootPerson.parents || []
    const middleParents = middlePerson.parents || []
    const areSiblings = rootParents.length > 0 && 
                       middleParents.length > 0 &&
                       rootParents.some(p => middleParents.includes(p))
    
    if (areSiblings) {
      // Check if target is middle person's child (niece/nephew)
      const middlePersonObj = personMap.get(path[1])
      if (middlePersonObj && middlePersonObj.children?.includes(targetPerson.id)) {
        if (targetPerson.gender === 'M') return 'nephew'
        if (targetPerson.gender === 'F') return 'niece'
      }
    }
  }

  // Path length 4: Great-grandparents, cousins, etc.
  if (path.length === 4) {
    // Check for first cousins (share grandparents)
    const rootGrandparents = getGrandparents(rootPerson, personMap)
    const targetGrandparents = getGrandparents(targetPerson, personMap)
    const commonGrandparents = rootGrandparents.filter(g => targetGrandparents.includes(g))
    
    if (commonGrandparents.length > 0) {
      return 'cousin_first'
    }
  }

  // Default: generic relative
  return 'relative'
}

/**
 * Check if person1 is older than person2 based on DOB
 * @param {Object} person1 - First person
 * @param {Object} person2 - Second person
 * @returns {boolean} - True if person1 is older
 */
function isPersonOlder(person1, person2) {
  if (!person1.dob || !person2.dob) {
    return false // Can't determine, default to false
  }

  try {
    const date1 = new Date(person1.dob)
    const date2 = new Date(person2.dob)
    return date1 < date2
  } catch {
    return false
  }
}

/**
 * Get grandparents of a person
 * @param {Object} person - Person object
 * @param {Map} personMap - Map of person ID to person object
 * @returns {Array<string>} - Array of grandparent IDs
 */
function getGrandparents(person, personMap) {
  const grandparents = []
  const parents = person.parents || []
  
  parents.forEach(parentId => {
    const parent = personMap.get(parentId)
    if (parent && parent.parents) {
      grandparents.push(...parent.parents)
    }
  })
  
  return grandparents
}
