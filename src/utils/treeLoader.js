/**
 * Tree Loader
 * 
 * Utilities for loading and querying tree data from Supabase
 * Uses service layer for all database queries
 */

import * as familyService from '../services/familyService'
import * as personService from '../services/personService'

// Cache per familyId
let treeCache = new Map()
let cacheTimestamp = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Load tree data with optional family filtering (Cluster Optimization)
 * @param {string|null} familyId - If provided, only fetch this family's people. If null, fetch family heads for root domain.
 * @returns {Promise<Object>} - Tree data with people array
 */
export async function loadTreeData(familyId = null) {
  const cacheKey = familyId || 'root'
  
  // Return cached data if still valid
  if (treeCache.has(cacheKey) && cacheTimestamp.has(cacheKey)) {
    const age = Date.now() - cacheTimestamp.get(cacheKey)
    if (age < CACHE_TTL) {
      return treeCache.get(cacheKey)
    }
  }

  try {
    let people = []
    
    if (familyId) {
      // CLUSTER MODE: Only fetch people from this specific family
      const rawPeople = await personService.getClusterByFamilyId(familyId)
      people = rawPeople
    } else {
      // ROOT DOMAIN MODE: Fetch only family heads (lightweight)
      const families = await familyService.getFamilyHeads()
      
      // Fetch head people and their immediate family
      const allPeople = []
      for (const family of families) {
        if (family.head_id) {
          try {
            const headData = await personService.getHeadWithImmediateFamily(family.head_id)
            if (headData) {
              allPeople.push(headData.head, ...headData.related)
            }
          } catch (error) {
            // Head person might not exist - skip this family
            console.warn(`Head person ${family.head_id} not found for family ${family.id}`, error)
          }
        }
      }
      
      // Remove duplicates
      const uniquePeople = new Map()
      allPeople.forEach(person => {
        if (!uniquePeople.has(person.id)) {
          uniquePeople.set(person.id, person)
        }
      })
      people = Array.from(uniquePeople.values())
    }

    // Always fetch all families (lightweight, needed for navigation)
    const families = await familyService.getAllFamilies()

    // Transform to match existing tree.json structure
    const treeData = {
      meta: {
        version: "3.0",
        description: "Apna Family Network Tree Data (Supabase)",
        lastUpdated: new Date().toISOString()
      },
      families: families.reduce((acc, family) => {
        acc[family.id] = {
          label: family.display_name,
          head: family.head_id
        }
        return acc
      }, {}),
      people: people.map(person => ({
        id: person.id,
        firstName: person.first_name,
        lastName: person.last_name,
        maidenName: person.maiden_name,
        nickname: person.nickname,
        gender: person.gender,
        type: person.type,
        dob: person.dob,
        dod: person.dod,
        pob: person.pob,
        currentLocation: person.current_location,
        isDeceased: person.is_deceased,
        hasFullProfile: person.has_full_profile,
        familyId: person.family_id,
        parents: person.parents || [],
        children: person.children || [],
        partners: person.partners || []
      }))
    }

    // Cache per familyId
    treeCache.set(cacheKey, treeData)
    cacheTimestamp.set(cacheKey, Date.now())
    return treeData
  } catch (error) {
    console.error('Error loading tree data from Supabase:', error)
    throw error
  }
}

/**
 * Get person entry from tree by tree ID
 * @param {string} treeId - Person ID (e.g., "baljit_grewal")
 * @returns {Promise<Object|null>} - Person entry or null if not found
 */
export async function getPersonFromTree(treeId) {
  // Extract familyId from treeId to use cluster optimization
  const parts = treeId.split('_')
  if (parts.length < 2) return null
  
  const familyId = parts[parts.length - 1]
  const treeData = await loadTreeData(familyId)
  return treeData.people?.find(person => person.id === treeId) || null
}

/**
 * Get person entry by familyId and personId
 * @param {string} familyId - Family ID (e.g., "grewal")
 * @param {string} personId - Person ID (e.g., "baljit")
 * @returns {Promise<Object|null>} - Person entry or null if not found
 */
export async function getPersonFromTreeByIds(familyId, personId) {
  const treeId = `${personId}_${familyId}`
  return getPersonFromTree(treeId)
}

/**
 * Get all people for a specific family
 * @param {string} familyId - Family ID (e.g., "grewal")
 * @returns {Promise<Array>} - Array of person entries
 */
export async function getFamilyPeopleFromTree(familyId) {
  const treeData = await loadTreeData(familyId)
  return treeData.people
}

/**
 * Get all people with full profiles
 * @param {string} familyId - Optional family ID to filter
 * @returns {Promise<Array>} - Array of person entries with full profiles
 */
export async function getPeopleWithFullProfiles(familyId = null) {
  const treeData = familyId 
    ? await loadTreeData(familyId)
    : await loadTreeData(null)
  
  return treeData.people.filter(person => person.hasFullProfile === true)
}

/**
 * Get all unique family IDs
 * @returns {Promise<Array<string>>} - Array of unique family IDs
 */
export async function getAllFamilyIdsFromTree() {
  const families = await familyService.getAllFamilies()
  return families.map(f => f.id).sort()
}

/**
 * Clear tree cache (useful for development/testing)
 */
export function clearTreeCache() {
  treeCache.clear()
  cacheTimestamp.clear()
}
