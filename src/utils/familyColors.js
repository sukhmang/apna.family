/**
 * Family Colors Utility
 * 
 * Provides consistent color coding for families in the tree visualization
 * Falls back to generated colors for families without theme definitions
 */

// Default color palette for families (used when theme is not defined)
const DEFAULT_FAMILY_COLORS = [
  '#2563eb', // blue
  '#059669', // green
  '#dc2626', // red
  '#7c3aed', // purple
  '#ea580c', // orange
  '#0891b2', // cyan
  '#be185d', // pink
  '#ca8a04', // yellow
  '#64748b', // slate
  '#0d9488', // teal
]

// Cache for loaded family themes
const familyThemeCache = new Map()

/**
 * Generate a consistent color for a family ID (deterministic hash)
 * @param {string} familyId - Family ID
 * @returns {string} - Hex color code
 */
function generateFamilyColor(familyId) {
  if (!familyId) {
    return DEFAULT_FAMILY_COLORS[0]
  }

  // Simple hash function to get consistent color for same family ID
  let hash = 0
  for (let i = 0; i < familyId.length; i++) {
    hash = familyId.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const index = Math.abs(hash) % DEFAULT_FAMILY_COLORS.length
  return DEFAULT_FAMILY_COLORS[index]
}

/**
 * Get family color from theme or generate one
 * @param {string} familyId - Family ID
 * @param {Object|null} familyTheme - Theme object from family data (optional)
 * @returns {Object} - { primary, accent, accentHover, border }
 */
export function getFamilyColor(familyId, familyTheme = null) {
  if (familyTheme?.primaryColor) {
    return {
      primary: familyTheme.primaryColor,
      accent: familyTheme.accentColor || familyTheme.primaryColor,
      accentHover: familyTheme.accentHover || familyTheme.primaryColor,
      border: familyTheme.primaryColor + '40', // 40 = 25% opacity in hex
    }
  }

  // Generate color if no theme
  const generatedColor = generateFamilyColor(familyId)
  return {
    primary: generatedColor,
    accent: generatedColor,
    accentHover: generatedColor,
    border: generatedColor + '40',
  }
}

/**
 * Load family theme and cache it
 * @param {string} familyId - Family ID
 * @returns {Promise<Object>} - Family color object
 */
export async function loadFamilyColor(familyId) {
  if (!familyId) {
    return getFamilyColor(null)
  }

  // Check cache first
  if (familyThemeCache.has(familyId)) {
    return familyThemeCache.get(familyId)
  }

  try {
    // Try to load family data
    const { loadFamilyData } = await import('./dataLoader')
    const familyData = await loadFamilyData(familyId)
    const color = getFamilyColor(familyId, familyData?.theme)
    familyThemeCache.set(familyId, color)
    return color
  } catch (error) {
    // Family file doesn't exist, use generated color
    const color = getFamilyColor(familyId)
    familyThemeCache.set(familyId, color)
    return color
  }
}

/**
 * Get family color synchronously (uses cache or generates)
 * @param {string} familyId - Family ID
 * @returns {Object} - Family color object
 */
export function getFamilyColorSync(familyId) {
  if (!familyId) {
    return getFamilyColor(null)
  }

  // Check cache
  if (familyThemeCache.has(familyId)) {
    return familyThemeCache.get(familyId)
  }

  // Generate and cache
  const color = getFamilyColor(familyId)
  familyThemeCache.set(familyId, color)
  return color
}

/**
 * Clear the family theme cache
 */
export function clearFamilyColorCache() {
  familyThemeCache.clear()
}
