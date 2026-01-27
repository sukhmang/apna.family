/**
 * Tree Utilities
 * 
 * Utilities for working with tree.json data structure
 * Handles ID conversion between tree.json format and file system format
 */

/**
 * Convert tree.json person ID to file system format
 * tree.json: "baljit_grewal" -> file: {familyId: "grewal", personId: "baljit"}
 * 
 * @param {string} treeId - Person ID from tree.json (e.g., "baljit_grewal")
 * @returns {Object} - {familyId: string, personId: string}
 */
export function parseTreeId(treeId) {
  if (!treeId || typeof treeId !== 'string') {
    return { familyId: null, personId: null }
  }

  // Split by last underscore (handles cases like "ranjit_singh_grewal")
  const parts = treeId.split('_')
  if (parts.length < 2) {
    return { familyId: null, personId: null }
  }

  // Last part is familyId, everything before is personId
  const familyId = parts[parts.length - 1]
  const personId = parts.slice(0, -1).join('_')

  return { familyId, personId }
}

/**
 * Convert file system format to tree.json person ID
 * file: {familyId: "grewal", personId: "baljit"} -> tree.json: "baljit_grewal"
 * 
 * @param {string} familyId - Family ID (e.g., "grewal")
 * @param {string} personId - Person ID (e.g., "baljit")
 * @returns {string} - Tree ID (e.g., "baljit_grewal")
 */
export function buildTreeId(familyId, personId) {
  if (!familyId || !personId) {
    return null
  }
  return `${personId}_${familyId}`
}

/**
 * Get person file path from tree ID
 * tree.json: "baljit_grewal" -> "grewal-baljit.json"
 * 
 * @param {string} treeId - Person ID from tree.json
 * @returns {string} - File path relative to people/ folder (e.g., "grewal-baljit.json")
 */
export function getPersonFilePath(treeId) {
  const { familyId, personId } = parseTreeId(treeId)
  if (!familyId || !personId) {
    return null
  }
  return `${familyId}-${personId}.json`
}

/**
 * Get person file path from familyId and personId
 * 
 * @param {string} familyId - Family ID
 * @param {string} personId - Person ID
 * @returns {string} - File path (e.g., "grewal-baljit.json")
 */
export function getPersonFilePathFromIds(familyId, personId) {
  if (!familyId || !personId) {
    return null
  }
  return `${familyId}-${personId}.json`
}

/**
 * Extract family ID from tree.json person entry
 * Checks explicit familyId field first, then parses from ID
 * 
 * @param {Object} personEntry - Person entry from tree.json
 * @returns {string|null} - Family ID or null
 */
export function getFamilyIdFromPerson(personEntry) {
  // Check for explicit familyId field first
  if (personEntry.familyId) {
    return personEntry.familyId
  }

  // Parse from ID
  const { familyId } = parseTreeId(personEntry.id)
  return familyId
}
