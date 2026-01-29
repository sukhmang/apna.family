import { supabase } from '../utils/supabaseClient'

/**
 * Get all world memberships
 * @returns {Promise<Array>} - Array of membership rows
 */
export const getAllMemberships = async () => {
  const { data, error } = await supabase
    .from('person_world_memberships')
    .select('*')

  if (error) throw error
  return data
}

/**
 * Get memberships for a specific world
 * @param {string} worldId - World/family ID
 * @returns {Promise<Array>} - Array of membership rows
 */
export const getMembershipsByWorld = async (worldId) => {
  const { data, error } = await supabase
    .from('person_world_memberships')
    .select('*')
    .eq('world_id', worldId)

  if (error) throw error
  return data
}
