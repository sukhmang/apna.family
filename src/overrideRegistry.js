/**
 * Override Registry - Maps custom page components for families and people
 * 
 * This registry allows custom pages to override the standard templates:
 * - Custom family landing pages (e.g., wong.apna.family uses custom component)
 * - Custom person profiles (e.g., grewal.apna.family/vanita uses custom component)
 * 
 * If no override exists, the router falls back to the standard template.
 * 
 * Structure:
 * - families: { [familyId]: CustomComponent }
 * - people: { [familyId]: { [personId]: CustomComponent } }
 */

// Import custom components as they are created
// Example:
// import WongLanding from './custom/wong/LandingPage'
// import VanitaPage from './custom/grewal/VanitaPage'

const OVERRIDES = {
  // Custom Family Landing Pages
  // If a family ID exists here, use the custom component instead of FamilyPortal template
  families: {
    // 'wong': WongLanding,  // Example: Custom landing page for Wong family
    // 'grewal' is missing, so it uses the default FamilyPortal template
  },

  // Custom Person Profiles
  // If a familyId/personId combination exists here, use the custom component instead of MemorialProfile template
  people: {
    // 'grewal': {
    //   'vanita': VanitaPage,  // Example: Custom page for Vanita
    //   // 'baljit' is missing, so it uses the default MemorialProfile template
    // },
    // 'wong': {
    //   // 'steve' is missing, so he uses the default MemorialProfile template
    // }
  }
}

export default OVERRIDES
