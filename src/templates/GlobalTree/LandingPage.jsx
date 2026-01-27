import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { loadFamilyData } from '../../utils/dataLoader'
import { withMinimumDelay } from '../../utils/loadingDelay'

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
    // Load all families from data/families/ folder
    // For now, we'll use a known list, but in the future this could be dynamic
    // To add a new family, create src/data/families/{familyId}.json and add the ID here
    const knownFamilies = ['grewal', 'wong'] // Can be expanded as more families are added
    
    const loadFamilies = async () => {
      const familyList = []
      
      // Load all families
      const loadPromises = knownFamilies.map(async (familyId) => {
        try {
          const familyData = await loadFamilyData(familyId)
          return {
            id: familyId,
            name: familyData.displayName || familyData.name || `${familyId} Family`,
            ...familyData
          }
        } catch (error) {
          // Family file doesn't exist, skip it
          console.warn(`Family ${familyId} not found, skipping`)
          return null
        }
      })

      // Wait for all loads with minimum delay
      const results = await Promise.all(loadPromises)
      const validFamilies = results.filter(f => f !== null)
      
      // Ensure minimum delay for smooth animations
      await withMinimumDelay(Promise.resolve(validFamilies), 1000)
      
      setFamilies(validFamilies)
      setLoading(false)
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
