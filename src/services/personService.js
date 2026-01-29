import { supabase } from '../utils/supabaseClient'

/**
 * Get person by ID (full tree ID format: "personId_familyId")
 * @param {string} personId - Person ID (e.g., "baljit_grewal")
 * @returns {Promise<Object>} - Person data
 */
export const getPersonById = async (personId) => {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('id', personId)
    .single()

  if (error) throw error
  return data
}

/**
 * Get all people in a family (CLUSTER OPTIMIZATION)
 * @param {string} familyId - Family ID (e.g., "grewal")
 * @returns {Promise<Array>} - Array of people in that family
 */
export const getClusterByFamilyId = async (familyId) => {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('family_id', familyId)
    .order('first_name')

  if (error) throw error
  return data
}

/**
 * Get people by IDs (for fetching related nodes)
 * @param {Array<string>} personIds - Array of person IDs
 * @returns {Promise<Array>} - Array of people
 */
export const getPeopleByIds = async (personIds) => {
  if (!personIds || personIds.length === 0) return []

  const { data, error } = await supabase
    .from('people')
    .select('*')
    .in('id', personIds)

  if (error) throw error
  return data
}

/**
 * Get all people
 * @returns {Promise<Array>} - Array of people
 */
export const getAllPeople = async () => {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .order('first_name')

  if (error) throw error
  return data
}

/**
 * Get family head and immediate family (for root domain)
 * @param {string} headId - Head person ID
 * @returns {Promise<Object>} - Head person with related people
 */
export const getHeadWithImmediateFamily = async (headId) => {
  try {
    // Get head person
    const head = await getPersonById(headId)
    if (!head) return null

    // Get related people (partners, first 3 children)
    const relatedIds = new Set()
    if (head.partners) {
      head.partners.forEach(id => relatedIds.add(id))
    }
    if (head.children) {
      // Limit to first 3 children for performance
      head.children.slice(0, 3).forEach(id => relatedIds.add(id))
    }

    const related = relatedIds.size > 0 
      ? await getPeopleByIds(Array.from(relatedIds))
      : []

    return {
      head,
      related
    }
  } catch (error) {
    // Person not found or other error - return null
    console.warn(`Error fetching head person ${headId}:`, error.message)
    return null
  }
}
