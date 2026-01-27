import styled from 'styled-components'

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

/**
 * GlobalTree LandingPage - Root landing page for apna.family
 * Displays a list of available families
 */
export default function LandingPage() {
  // TODO: Load families dynamically from data/families/ folder
  const families = [
    { id: 'grewal', name: 'Grewal Family' },
    { id: 'wong', name: 'Wong Family' }
  ]

  return (
    <Container>
      <Title>Apna Family Network</Title>
      <Subtitle>Connecting families through shared memories and stories</Subtitle>
      
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
    </Container>
  )
}
