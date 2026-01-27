/**
 * Utility functions for parsing subdomains and routing
 */

/**
 * Parse the hostname to extract family ID and determine if we're on root domain
 * @param {string} hostname - The hostname from window.location.hostname
 * @returns {Object} - { familyId: string | null, isRoot: boolean }
 * 
 * Examples:
 * - "localhost:5173" or "apna.family" → { familyId: null, isRoot: true }
 * - "grewal.localhost:5173" or "grewal.apna.family" → { familyId: "grewal", isRoot: false }
 */
export function parseSubdomain(hostname) {
  // Remove port if present (e.g., "localhost:5173" → "localhost")
  const hostnameWithoutPort = hostname.split(':')[0]
  
  // Split by dots
  const parts = hostnameWithoutPort.split('.')
  
  // Handle localhost subdomains (e.g., "grewal.localhost")
  if (parts.length >= 2 && parts[parts.length - 1] === 'localhost') {
    const familyId = parts[0]
    return {
      familyId: familyId !== 'localhost' ? familyId : null,
      isRoot: familyId === 'localhost' || parts.length === 1
    }
  }
  
  // Handle production domains (e.g., "grewal.apna.family")
  // Root domain: "apna.family" (2 parts)
  // Family subdomain: "grewal.apna.family" (3 parts)
  if (parts.length === 2) {
    // Root domain
    return { familyId: null, isRoot: true }
  } else if (parts.length >= 3) {
    // Family subdomain - first part is the family ID
    const familyId = parts[0]
    return { familyId, isRoot: false }
  }
  
  // Fallback: treat as root
  return { familyId: null, isRoot: true }
}

/**
 * Get the current family ID from the hostname
 * @returns {string | null} - The family ID or null if on root domain
 */
export function getFamilyId() {
  if (typeof window === 'undefined') return null
  const { familyId } = parseSubdomain(window.location.hostname)
  return familyId
}

/**
 * Check if we're on the root domain
 * @returns {boolean} - True if on root domain, false if on family subdomain
 */
export function isRootDomain() {
  if (typeof window === 'undefined') return true
  const { isRoot } = parseSubdomain(window.location.hostname)
  return isRoot
}
