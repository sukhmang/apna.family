import { supabase } from '../utils/supabaseClient'

/**
 * Check if user has permission to edit a family
 * @param {string} userEmail - User's email
 * @param {string|null} familyId - Family ID to check (null for root domain / any family)
 * @returns {Promise<{canEdit: boolean, role: string|null}>}
 */
export const checkFamilyPermission = async (userEmail, familyId) => {
  if (!userEmail) {
    return { canEdit: false, role: null }
  }

  try {
    // Check for super_admin (can edit all families)
    const { data: superAdmin } = await supabase
      .from('user_permissions')
      .select('role')
      .eq('user_email', userEmail)
      .eq('role', 'super_admin')
      .is('family_id', null)
      .single()

    if (superAdmin) {
      return { canEdit: true, role: 'super_admin' }
    }

    // If familyId is null (root domain), check if user has ANY family permission
    if (familyId === null) {
      const { data: anyPermission } = await supabase
        .from('user_permissions')
        .select('role')
        .eq('user_email', userEmail)
        .in('role', ['admin', 'editor'])
        .limit(1)
        .single()

      if (anyPermission) {
        return { canEdit: true, role: anyPermission.role }
      }
      return { canEdit: false, role: null }
    }

    // Check for family-specific permission
    const { data: permission } = await supabase
      .from('user_permissions')
      .select('role')
      .eq('user_email', userEmail)
      .eq('family_id', familyId)
      .in('role', ['admin', 'editor'])
      .single()

    if (permission) {
      return { canEdit: true, role: permission.role }
    }

    return { canEdit: false, role: null }
  } catch (error) {
    console.error('Error checking permissions:', error)
    return { canEdit: false, role: null }
  }
}

/**
 * Get user's permissions
 * @param {string} userEmail - User's email
 * @returns {Promise<Array>} - Array of user permissions
 */
export const getUserPermissions = async (userEmail) => {
  if (!userEmail) return []

  const { data, error } = await supabase
    .from('user_permissions')
    .select('*')
    .eq('user_email', userEmail)

  if (error) throw error
  return data || []
}
