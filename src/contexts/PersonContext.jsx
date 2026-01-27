import { createContext, useContext, useState, useEffect } from 'react'
import { useFamily } from './FamilyContext'
import { loadPersonData } from '../utils/dataLoader'
import { withMinimumDelay } from '../utils/loadingDelay'

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

    // Load person data with minimum delay for smooth animations
    withMinimumDelay(loadPersonData(familyId, personId), 1000)
      .then(data => {
        setPersonData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load person data:', err)
        setError(err)
        setLoading(false)
      })
  }, [familyId, personId])

  const value = {
    personId,
    personData,
    loading,
    error,
    // Convenience getters
    memorialData: personData?.memorialData || null,
    eventData: personData?.eventData || null,
    homeVideos: personData?.homeVideos || null
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
