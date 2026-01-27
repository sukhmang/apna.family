/**
 * Relationship Labels
 * 
 * Mapping tables for Indian (Punjabi/North Indian) and English relationship terms
 * Based on FAMILYRELATIONGUIDE.md
 */

/**
 * Get relationship label based on relationship type and parameters
 * @param {string} relationshipType - Type of relationship (e.g., "father", "mother", "uncle_paternal_older", etc.)
 * @param {boolean} useIndianTerms - Whether to use Indian terms (true) or English terms (false)
 * @param {string} gender - Gender of the target person ('M' or 'F')
 * @returns {string} - Relationship label
 */
export function getRelationshipLabel(relationshipType, useIndianTerms, gender = 'M') {
  if (!relationshipType) {
    return ''
  }

  if (useIndianTerms) {
    return getIndianLabel(relationshipType, gender)
  } else {
    return getEnglishLabel(relationshipType, gender)
  }
}

/**
 * Get Indian (Punjabi) relationship label
 * @param {string} relationshipType - Relationship type
 * @param {string} gender - Gender of target person
 * @returns {string} - Indian label
 */
function getIndianLabel(relationshipType, gender) {
  const labels = {
    // Direct lineage
    'self': '',
    'father': 'Baba ji',
    'mother': 'Mummy ji',
    'grandfather_paternal': 'Dada ji',
    'grandmother_paternal': 'Dadi ji',
    'grandfather_maternal': 'Nana ji',
    'grandmother_maternal': 'Nani ji',
    
    // Paternal side (Dad's family)
    'uncle_paternal_older': 'Taiya ji',
    'uncle_paternal_younger': 'Chacha ji',
    'aunt_paternal': 'Phua',
    'uncle_paternal_spouse_older': 'Tai ji',
    'uncle_paternal_spouse_younger': 'Chachi ji',
    'aunt_paternal_spouse': 'Fufad ji',
    
    // Maternal side (Mom's family)
    'uncle_maternal': 'Mama ji',
    'aunt_maternal': 'Masi',
    'uncle_maternal_spouse': 'Mami ji',
    'aunt_maternal_spouse': 'Maser ji',
    
    // Siblings
    'brother_older': 'Veer',
    'sister_older': 'Bhain',
    'brother_younger': 'Veer',
    'sister_younger': 'Bhain',
    'brother_spouse_older': 'Bhabhi',
    'sister_spouse_older': 'Jija ji',
    
    // Direct children
    'son': 'Beta',
    'daughter': 'Beti',
    
    // In-laws (if married)
    'father_in_law': 'Bhapa ji',
    'mother_in_law': 'Mummy ji',
    'brother_in_law_husband_older': 'Jeth',
    'brother_in_law_husband_younger': 'Deor',
    'sister_in_law_husband': 'Nanad',
    'brother_in_law_wife': 'Saala',
    'sister_in_law_wife': 'Saali',
    
    // Cousins and extended
    'cousin_first': 'Cousin',
    'cousin_second': 'Cousin',
    'nephew': 'Bhanja',
    'niece': 'Bhanji',
    'grandson': 'Pota',
    'granddaughter': 'Poti',
  }

  return labels[relationshipType] || ''
}

/**
 * Get English relationship label
 * @param {string} relationshipType - Relationship type
 * @param {string} gender - Gender of target person
 * @returns {string} - English label
 */
function getEnglishLabel(relationshipType, gender) {
  const labels = {
    // Direct lineage
    'self': '',
    'father': 'Father',
    'mother': 'Mother',
    'grandfather_paternal': 'Grandfather',
    'grandmother_paternal': 'Grandmother',
    'grandfather_maternal': 'Grandfather',
    'grandmother_maternal': 'Grandmother',
    
    // Paternal side
    'uncle_paternal_older': 'Uncle',
    'uncle_paternal_younger': 'Uncle',
    'aunt_paternal': 'Aunt',
    'uncle_paternal_spouse_older': 'Uncle',
    'uncle_paternal_spouse_younger': 'Uncle',
    'aunt_paternal_spouse': 'Uncle',
    
    // Maternal side
    'uncle_maternal': 'Uncle',
    'aunt_maternal': 'Aunt',
    'uncle_maternal_spouse': 'Uncle',
    'aunt_maternal_spouse': 'Uncle',
    
    // Siblings
    'brother_older': gender === 'M' ? 'Brother' : 'Sister',
    'sister_older': gender === 'F' ? 'Sister' : 'Brother',
    'brother_younger': gender === 'M' ? 'Brother' : 'Sister',
    'sister_younger': gender === 'F' ? 'Sister' : 'Brother',
    'brother_spouse_older': 'Sister-in-law',
    'sister_spouse_older': 'Brother-in-law',
    
    // Direct children
    'son': gender === 'M' ? 'Son' : 'Daughter',
    'daughter': gender === 'F' ? 'Daughter' : 'Son',
    
    // Partners
    'husband': 'Husband',
    'wife': 'Wife',
    
    // In-laws
    'father_in_law': 'Father-in-law',
    'mother_in_law': 'Mother-in-law',
    'brother_in_law_husband_older': 'Brother-in-law',
    'brother_in_law_husband_younger': 'Brother-in-law',
    'sister_in_law_husband': 'Sister-in-law',
    'brother_in_law_wife': 'Brother-in-law',
    'sister_in_law_wife': 'Sister-in-law',
    
    // Extended
    'cousin_first': 'Cousin',
    'cousin_second': 'Cousin',
    'nephew': gender === 'M' ? 'Nephew' : 'Niece',
    'niece': gender === 'F' ? 'Niece' : 'Nephew',
    'grandson': gender === 'M' ? 'Grandson' : 'Granddaughter',
    'granddaughter': gender === 'F' ? 'Granddaughter' : 'Grandson',
  }

  return labels[relationshipType] || 'Relative'
}
