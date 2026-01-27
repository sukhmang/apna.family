/**
 * Utility functions for loading data from Supabase
 * Uses service layer for all database queries
 */

import * as familyService from '../services/familyService'
import * as personService from '../services/personService'

/**
 * Load family data from Supabase
 * @param {string} familyId - The family ID (e.g., "grewal")
 * @returns {Promise<Object>} - The family data object
 */
export async function loadFamilyData(familyId) {
  try {
    const data = await familyService.getFamilyById(familyId)

    // Transform to match existing JSON structure
    return {
      id: data.id,
      name: data.display_name,
      displayName: data.display_name,
      theme: data.theme,
      homeVideosPassword: data.settings?.homeVideosPassword || null,
      description: data.description
    }
  } catch (error) {
    console.error(`Error loading family data for ${familyId}:`, error)
    // Return default structure (matches current graceful failure)
    // Return minimal data structure even on error
    return {
      id: familyId,
      name: familyId,
      displayName: familyId,
      theme: {
        primaryColor: '#2563eb',
        accentColor: '#3b82f6',
        accentHover: '#1d4ed8'
      },
      homeVideosPassword: null,
      description: null
    }
  }
}

/**
 * Load person data from Supabase
 * @param {string} familyId - The family ID (e.g., "grewal")
 * @param {string} personId - The person ID (e.g., "baljit")
 * @returns {Promise<Object>} - The person data object (profile_data JSONB)
 */
export async function loadPersonData(familyId, personId) {
  try {
    const treeId = `${personId}_${familyId}`
    const person = await personService.getPersonById(treeId)

    // If no full profile, return null (matches current behavior)
    if (!person.has_full_profile || !person.profile_data) {
      throw new Error(`No full profile found for ${familyId}-${personId}`)
    }

    // Return profile_data JSONB as-is (matches existing JSON structure)
    return person.profile_data
  } catch (error) {
    console.error(`Error loading person data for ${familyId}-${personId}:`, error)
    throw error
  }
}
