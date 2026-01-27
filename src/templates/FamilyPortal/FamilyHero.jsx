import styled from 'styled-components'
import { Link } from 'react-router-dom'

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

const Description = styled.p`
  font-size: ${props => props.theme.typography.sizes.lg};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 3rem;
`

const LinkList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
`

const StyledLink = styled(Link)`
  display: inline-block;
  padding: 0.875rem 1.75rem;
  font-size: ${props => props.theme.typography.sizes.base};
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
 * FamilyPortal Hero - Landing page for a specific family
 * Displays family name and links to family members and home videos
 */
export default function FamilyHero({ familyData }) {
  // TODO: Load people dynamically from data/people/ folder filtered by family
  const people = [
    { id: 'baljit', name: 'Baljit Grewal' }
  ]

  return (
    <Container>
      <Title>{familyData?.displayName || familyData?.name || 'Family Portal'}</Title>
      <Description>
        {familyData?.description || 'Welcome to our family network'}
      </Description>
      
      <LinkList>
        {people.map(person => (
          <StyledLink key={person.id} to={`/${person.id}`}>
            View {person.name}'s Memorial
          </StyledLink>
        ))}
        <StyledLink to="/homevideos">
          Home Videos
        </StyledLink>
      </LinkList>
    </Container>
  )
}
