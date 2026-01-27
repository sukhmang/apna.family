/**
 * Utility functions for loading JSON data files
 * Uses Vite's import.meta.glob for dynamic imports
 */

// Pre-load all family data files using Vite's glob import
const familyModules = import.meta.glob('/src/data/families/*.json', { eager: false })

// Pre-load all person data files using Vite's glob import
const personModules = import.meta.glob('/src/data/people/*.json', { eager: false })

/**
 * Load family data from JSON file
 * @param {string} familyId - The family ID (e.g., "grewal")
 * @returns {Promise<Object>} - The family data object
 */
export async function loadFamilyData(familyId) {
  try {
    const modulePath = `/src/data/families/${familyId}.json`
    const module = familyModules[modulePath]
    
    if (!module) {
      throw new Error(`Family data file not found: ${familyId}.json`)
    }
    
    const data = await module()
    return data.default || data
  } catch (error) {
    console.error(`Error loading family data for ${familyId}:`, error)
    throw error
  }
}

/**
 * Load person data from JSON file
 * @param {string} familyId - The family ID (e.g., "grewal")
 * @param {string} personId - The person ID (e.g., "baljit")
 * @returns {Promise<Object>} - The person data object
 */
export async function loadPersonData(familyId, personId) {
  try {
    const modulePath = `/src/data/people/${familyId}-${personId}.json`
    const module = personModules[modulePath]
    
    if (!module) {
      throw new Error(`Person data file not found: ${familyId}-${personId}.json`)
    }
    
    const data = await module()
    return data.default || data
  } catch (error) {
    console.error(`Error loading person data for ${familyId}-${personId}:`, error)
    throw error
  }
}
