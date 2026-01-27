import { createContext, useContext, useState, useEffect } from 'react'
import { useFamily } from './FamilyContext'
import { loadPersonData } from '../utils/dataLoader'
import { withMinimumDelay } from '../utils/loadingDelay'
import { getPersonFromTreeByIds } from '../utils/treeLoader'
import { parseTreeId, getPersonFilePathFromIds } from '../utils/treeUtils'

export const PersonContext = createContext(null)

/**
 * PersonContext Provider
 * Provides person data (memorial info, events, home videos, etc.) to memorial pages
 * Prevents prop drilling through multiple component layers
 */
export function PersonProvider({ children, personId }) {
  const { familyId } = useFamily()
  const [personData, setPersonData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!familyId || !personId) {
      setLoading(false)
      return
    }

    // Load person data - supports both full profiles and minimal profiles from tree.json
    const loadPerson = async () => {
      try {
        // First, try to load full profile data from people/ file
        let fullProfileData = null
        try {
          fullProfileData = await loadPersonData(familyId, personId)
        } catch (fileError) {
          // Full profile doesn't exist - will fall back to minimal profile from database
          console.log(`No full profile found for ${familyId}-${personId}, using minimal profile from database`)
        }

        // If full profile exists, use it
        if (fullProfileData) {
          const data = await withMinimumDelay(Promise.resolve(fullProfileData), 1000)
          setPersonData(data)
          setLoading(false)
          return
        }

        // Otherwise, load minimal profile from database
        const treePerson = await getPersonFromTreeByIds(familyId, personId)
        
        if (!treePerson) {
          throw new Error(`Person not found in database: ${familyId}-${personId}`)
        }

        // Convert tree.json entry to minimal profile format
        const minimalProfile = {
          memorialData: {
            name: `${treePerson.firstName} ${treePerson.lastName}`.trim(),
            birthDate: treePerson.dob ? new Date(treePerson.dob).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }) : null,
            deathDate: treePerson.dod ? new Date(treePerson.dod).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }) : null,
            birthYear: treePerson.dob ? new Date(treePerson.dob).getFullYear() : null,
            deathYear: treePerson.dod ? new Date(treePerson.dod).getFullYear() : null,
            welcomeMessage: treePerson.isDeceased 
              ? `Remembering ${treePerson.firstName} ${treePerson.lastName}.`
              : `Welcome to ${treePerson.firstName} ${treePerson.lastName}'s profile.`,
            portraitImage: "/portrait.png" // Default portrait
          },
          eventData: null, // No event data for minimal profiles
          homeVideos: [], // No videos for minimal profiles
          isMinimalProfile: true, // Flag to indicate this is from tree.json
          treeData: treePerson // Include full tree data for reference
        }

        const data = await withMinimumDelay(Promise.resolve(minimalProfile), 1000)
        setPersonData(data)
        setLoading(false)
      } catch (err) {
        console.error('Failed to load person data:', err)
        setError(err)
        setLoading(false)
      }
    }

    loadPerson()
  }, [familyId, personId])

  const value = {
    personId,
    personData,
    loading,
    error,
    // Convenience getters
    memorialData: personData?.memorialData || null,
    eventData: personData?.eventData || null,
    homeVideos: personData?.homeVideos || null,
    // Flag to indicate if this is a minimal profile (from tree.json)
    isMinimalProfile: personData?.isMinimalProfile === true
  }

  return (
    <PersonContext.Provider value={value}>
      {children}
    </PersonContext.Provider>
  )
}

/**
 * Hook to access person context
 * @returns {Object} - { personId, personData, loading, error, memorialData, eventData, homeVideos }
 * 
 * @example
 * const { memorialData, eventData } = usePerson()
 * const name = memorialData?.name
 */
export function usePerson() {
  const context = useContext(PersonContext)
  if (context === null) {
    throw new Error('usePerson must be used within a PersonProvider')
  }
  return context
}
