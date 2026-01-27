import { supabase } from '../utils/supabaseClient'

/**
 * Get family by ID
 * @param {string} familyId - Family ID (e.g., "grewal")
 * @returns {Promise<Object>} - Family data
 */
export const getFamilyById = async (familyId) => {
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .single()

  if (error) throw error
  return data
}

/**
 * Get all families
 * @returns {Promise<Array>} - Array of all families
 */
export const getAllFamilies = async () => {
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .order('display_name')

  if (error) throw error
  return data
}

/**
 * Get family heads (for root domain optimization)
 * @returns {Promise<Array>} - Array of families with head_id populated
 */
export const getFamilyHeads = async () => {
  const { data, error } = await supabase
    .from('families')
    .select('id, head_id, display_name')

  if (error) throw error
  return data
}
