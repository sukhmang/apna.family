import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { useFamily } from '../../contexts/FamilyContext'
import { getFamilyPeopleFromTree } from '../../utils/treeLoader'
import { parseTreeId } from '../../utils/treeUtils'
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

const LoadingText = styled.p`
  font-size: ${props => props.theme.typography.sizes.base};
  color: ${props => props.theme.colors.text.secondary};
`

/**
 * FamilyPortal Hero - Landing page for a specific family
 * Displays family name and links to family members and home videos
 */
export default function FamilyHero({ familyData }) {
  const { familyId } = useFamily()
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!familyId) {
      setLoading(false)
      return
    }

    // Load people for this family from tree.json (master directory)
    const loadPeople = async () => {
      try {
        // Get all people for this family from tree.json
        const familyPeople = await getFamilyPeopleFromTree(familyId)
        
        // Convert tree entries to display format
        const peopleList = familyPeople.map(person => {
          const { personId } = parseTreeId(person.id)
          const fullName = `${person.firstName} ${person.lastName}`.trim()
          
          return {
            id: personId, // Use personId for routing (e.g., "baljit")
            treeId: person.id, // Keep tree ID for reference (e.g., "baljit_grewal")
            name: fullName,
            hasFullProfile: person.hasFullProfile === true,
            isDeceased: person.isDeceased === true
          }
        })

        // Ensure minimum delay for smooth animations
        await withMinimumDelay(Promise.resolve(peopleList), 1000)
        
        setPeople(peopleList)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load family people:', error)
        setPeople([])
        setLoading(false)
      }
    }

    loadPeople()
  }, [familyId])

  if (loading) {
    return (
      <Container>
        <Title>{familyData?.displayName || familyData?.name || 'Family Portal'}</Title>
        <Description>
          {familyData?.description || 'Welcome to our family network'}
        </Description>
        <LoadingText>Loading family members...</LoadingText>
      </Container>
    )
  }

  return (
    <Container>
      <Title>{familyData?.displayName || familyData?.name || 'Family Portal'}</Title>
      <Description>
        {familyData?.description || 'Welcome to our family network'}
      </Description>
      
      <LinkList>
        {people.length > 0 ? (
          people.map(person => (
            <StyledLink key={person.id} to={`/${person.id}`}>
              View {person.name}'s Memorial
            </StyledLink>
          ))
        ) : (
          <LoadingText>No family members available yet.</LoadingText>
        )}
        <StyledLink to="/homevideos">
          Home Videos
        </StyledLink>
      </LinkList>
    </Container>
  )
}
