/**
 * Tree Loader
 * 
 * Utilities for loading and querying tree.json data
 * tree.json is the master directory of all people in the network
 */

// Pre-load tree.json using Vite's glob import
const treeModule = import.meta.glob('/src/data/tree.json', { eager: false })

let treeCache = null

/**
 * Load tree.json data
 * @returns {Promise<Object>} - Tree data with people array
 */
export async function loadTreeData() {
  if (treeCache) {
    return treeCache
  }

  try {
    const module = treeModule['/src/data/tree.json']
    if (!module) {
      throw new Error('Tree data file not found: tree.json')
    }

    const data = await module()
    const treeData = data.default || data
    treeCache = treeData
    return treeData
  } catch (error) {
    console.error('Error loading tree data:', error)
    throw error
  }
}

/**
 * Get person entry from tree.json by tree ID
 * @param {string} treeId - Person ID from tree.json (e.g., "baljit_grewal")
 * @returns {Promise<Object|null>} - Person entry or null if not found
 */
export async function getPersonFromTree(treeId) {
  const treeData = await loadTreeData()
  return treeData.people?.find(person => person.id === treeId) || null
}

/**
 * Get person entry from tree.json by familyId and personId
 * @param {string} familyId - Family ID (e.g., "grewal")
 * @param {string} personId - Person ID (e.g., "baljit")
 * @returns {Promise<Object|null>} - Person entry or null if not found
 */
export async function getPersonFromTreeByIds(familyId, personId) {
  const treeId = `${personId}_${familyId}`
  return getPersonFromTree(treeId)
}

/**
 * Get all people for a specific family from tree.json
 * @param {string} familyId - Family ID (e.g., "grewal")
 * @returns {Promise<Array>} - Array of person entries
 */
export async function getFamilyPeopleFromTree(familyId) {
  const treeData = await loadTreeData()
  if (!treeData.people) {
    return []
  }

  return treeData.people.filter(person => {
    // Check explicit familyId field first
    if (person.familyId === familyId) {
      return true
    }

    // Parse from ID
    const personFamilyId = person.id?.split('_').pop()
    return personFamilyId === familyId
  })
}

/**
 * Get all people with full profiles (hasFullProfile: true)
 * @param {string} familyId - Optional family ID to filter
 * @returns {Promise<Array>} - Array of person entries with full profiles
 */
export async function getPeopleWithFullProfiles(familyId = null) {
  const treeData = await loadTreeData()
  if (!treeData.people) {
    return []
  }

  let people = treeData.people.filter(person => person.hasFullProfile === true)

  if (familyId) {
    people = people.filter(person => {
      if (person.familyId === familyId) {
        return true
      }
      const personFamilyId = person.id?.split('_').pop()
      return personFamilyId === familyId
    })
  }

  return people
}

/**
 * Get all unique family IDs from tree.json
 * @returns {Promise<Array<string>>} - Array of unique family IDs
 */
export async function getAllFamilyIdsFromTree() {
  const treeData = await loadTreeData()
  if (!treeData.people) {
    return []
  }

  const familyIds = new Set()
  
  treeData.people.forEach(person => {
    // Check explicit familyId field first
    if (person.familyId) {
      familyIds.add(person.familyId)
    } else {
      // Parse from ID (last part after underscore)
      const parts = person.id?.split('_')
      if (parts && parts.length > 1) {
        const familyId = parts[parts.length - 1]
        familyIds.add(familyId)
      }
    }
  })

  return Array.from(familyIds).sort()
}

/**
 * Clear tree cache (useful for development/testing)
 */
export function clearTreeCache() {
  treeCache = null
}
