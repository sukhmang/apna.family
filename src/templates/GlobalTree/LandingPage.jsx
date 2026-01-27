import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { loadFamilyData } from '../../utils/dataLoader'
import { withMinimumDelay } from '../../utils/loadingDelay'
import { getAllFamilyIdsFromTree } from '../../utils/treeLoader'

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
  text-align: center;
`

const Title = styled.h1`
  font-size: ${props => props.theme.typography.sizes['3xl']};
  font-weight: ${props => props.theme.typography.weights.bold};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 1rem;
`

const Subtitle = styled.p`
  font-size: ${props => props.theme.typography.sizes.lg};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 3rem;
`

const FamilyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
`

const FamilyLink = styled.a`
  display: inline-block;
  padding: 1rem 2rem;
  font-size: ${props => props.theme.typography.sizes.lg};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.cardBackground};
  background-color: ${props => props.theme.colors.accent};
  border-radius: ${props => props.theme.borderRadius.md};
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: ${props => props.theme.shadows.md};

  &:hover {
    background-color: ${props => props.theme.colors.accentHover};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.lg};
  }
`

const LoadingText = styled.p`
  font-size: ${props => props.theme.typography.sizes.base};
  color: ${props => props.theme.colors.text.secondary};
`

/**
 * GlobalTree LandingPage - Root landing page for apna.family
 * Displays a list of available families loaded dynamically
 */
export default function LandingPage() {
  const [families, setFamilies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load all families dynamically from tree.json
    // This discovers all unique families from the master directory
    const loadFamilies = async () => {
      try {
        // Get all unique family IDs from tree.json
        const familyIds = await getAllFamilyIdsFromTree()
        
        if (familyIds.length === 0) {
          setFamilies([])
          setLoading(false)
          return
        }

        // Load family data for each family ID
        // Try to load from families/ folder, but if it doesn't exist, create a default entry
        const loadPromises = familyIds.map(async (familyId) => {
          try {
            const familyData = await loadFamilyData(familyId)
            return {
              id: familyId,
              name: familyData.displayName || familyData.name || `${familyId.charAt(0).toUpperCase() + familyId.slice(1)} Family`,
              ...familyData
            }
          } catch (error) {
            // Family file doesn't exist, create a default entry from the family ID
            // This allows families to appear even without a config file
            const displayName = familyId
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ') + ' Family'
            
            return {
              id: familyId,
              name: displayName,
              displayName: displayName
            }
          }
        })

        // Wait for all loads with minimum delay
        const results = await Promise.all(loadPromises)
        const validFamilies = results.filter(f => f !== null)
        
        // Sort families alphabetically by name
        validFamilies.sort((a, b) => a.name.localeCompare(b.name))
        
        // Ensure minimum delay for smooth animations
        await withMinimumDelay(Promise.resolve(validFamilies), 1000)
        
        setFamilies(validFamilies)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load families:', error)
        setFamilies([])
        setLoading(false)
      }
    }
    
    loadFamilies()
  }, [])

  if (loading) {
    return (
      <Container>
        <Title>Apna Family Network</Title>
        <Subtitle>Connecting families through shared memories and stories</Subtitle>
        <LoadingText>Loading families...</LoadingText>
      </Container>
    )
  }

  return (
    <Container>
      <Title>Apna Family Network</Title>
      <Subtitle>Connecting families through shared memories and stories</Subtitle>
      
      {families.length === 0 ? (
        <LoadingText>No families available yet.</LoadingText>
      ) : (
        <FamilyList>
          {families.map(family => {
            // Build subdomain URL
            const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
            const port = typeof window !== 'undefined' ? window.location.port : '5173'
            const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:'
            
            // Extract base domain (e.g., "localhost" or "apna.family")
            const baseDomain = currentHost.includes('.') 
              ? currentHost.split('.').slice(-2).join('.') 
              : currentHost
            
            const subdomainUrl = `${protocol}//${family.id}.${baseDomain}${port ? `:${port}` : ''}`
            
            return (
              <FamilyLink 
                key={family.id}
                href={subdomainUrl}
              >
                {family.name}
              </FamilyLink>
            )
          })}
        </FamilyList>
      )}
    </Container>
  )
}
