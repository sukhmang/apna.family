import { createContext, useContext, useState, useEffect } from 'react'
import { getFamilyId } from '../utils/subdomain'
import { loadFamilyData } from '../utils/dataLoader'

export const FamilyContext = createContext(null)

/**
 * FamilyContext Provider
 * Provides family data (theme colors, family ID, etc.) to all components
 * Prevents prop drilling through multiple component layers
 */
export function FamilyProvider({ children }) {
  const [familyData, setFamilyData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const familyId = getFamilyId()

  useEffect(() => {
    // If no family ID (root domain), don't load family data
    if (!familyId) {
      setLoading(false)
      return
    }

    // Load family data
    loadFamilyData(familyId)
      .then(data => {
        setFamilyData({ ...data, id: familyId })
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load family data:', err)
        setError(err)
        // Set minimal data structure even on error
        setFamilyData({ id: familyId, name: familyId })
        setLoading(false)
      })
  }, [familyId])

  const value = {
    familyId,
    familyData,
    loading,
    error,
    // Helper to get theme colors (with fallback to default theme)
    getTheme: () => {
      return familyData?.theme || {
        primaryColor: '#2563eb',
        accentColor: '#3b82f6',
        accentHover: '#1d4ed8'
      }
    }
  }

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  )
}

/**
 * Hook to access family context
 * @returns {Object} - { familyId, familyData, loading, error, getTheme }
 * 
 * @example
 * const { familyId, familyData, getTheme } = useFamily()
 * const theme = getTheme()
 */
export function useFamily() {
  const context = useContext(FamilyContext)
  if (context === null) {
    throw new Error('useFamily must be used within a FamilyProvider')
  }
  return context
}
