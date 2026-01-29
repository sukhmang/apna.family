import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { loadTreeData } from '../../utils/treeLoader'
import { getFamilyPeopleFromTree } from '../../utils/treeLoader'
import { parseTreeId } from '../../utils/treeUtils'
import { withMinimumDelay } from '../../utils/loadingDelay'

const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
`

const LoadingText = styled.p`
  font-size: ${props => props.theme.typography.sizes.base};
  color: ${props => props.theme.colors.text.secondary};
  text-align: center;
  padding: 2rem;
`

const FamilySection = styled.div`
  margin-bottom: 3rem;
`

const FamilyTitle = styled.h2`
  font-size: ${props => props.theme.typography.sizes['2xl']};
  font-weight: ${props => props.theme.typography.weights.bold};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid ${props => props.theme.colors.border};
`

const PeopleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const PersonCard = styled.a`
  display: block;
  padding: 1.5rem;
  background-color: ${props => props.theme.colors.cardBackground};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: ${props => props.theme.shadows.sm};

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.theme.shadows.md};
    border-color: ${props => props.theme.colors.accent};
  }
`

const PersonName = styled.div`
  font-size: ${props => props.theme.typography.sizes.lg};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 0.5rem;
`

const PersonDetails = styled.div`
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 0.5rem;
`

const Badge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: ${props => props.theme.typography.sizes.xs};
  font-weight: ${props => props.theme.typography.weights.semibold};
  background-color: ${props => props.$isDeceased 
    ? props.theme.colors.error || '#ef4444'
    : props.theme.colors.accent}15;
  color: ${props => props.$isDeceased 
    ? props.theme.colors.error || '#ef4444'
    : props.theme.colors.accent};
  border-radius: ${props => props.theme.borderRadius.sm};
  margin-top: 0.5rem;
`

/**
 * SimpleListView - Simple list view of families and people
 * 
 * @param {Object} props
 * @param {string|null} props.familyId - Optional family ID to filter (null = all families)
 */
export default function SimpleListView({ familyId = null }) {
  const [families, setFamilies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        if (familyId) {
          // Load single family
          const familyPeople = await getFamilyPeopleFromTree(familyId)
          
          const peopleList = familyPeople.map(person => {
            const { personId } = parseTreeId(person.id)
            const fullName = `${person.firstName} ${person.lastName}`.trim()
            
            return {
              id: personId,
              treeId: person.id,
              name: fullName,
              firstName: person.firstName,
              lastName: person.lastName,
              dob: person.dob,
              dod: person.dod,
              isDeceased: person.isDeceased === true,
              hasFullProfile: person.hasFullProfile === true,
              familyId: person.familyId || familyId
            }
          })

          await withMinimumDelay(Promise.resolve(peopleList), 1000)
          
          setFamilies([{
            id: familyId,
            name: `${familyId.charAt(0).toUpperCase() + familyId.slice(1)}`,
            people: peopleList
          }])
        } else {
          // Load all families
          const treeData = await loadTreeData()
          const allPeople = treeData.people || []
          
          // Group people by family
          const familyMap = new Map()
          
          allPeople.forEach(person => {
            const personFamilyId = person.familyId || 'unknown'
            const { personId } = parseTreeId(person.id)
            const fullName = `${person.firstName} ${person.lastName}`.trim()
            
            if (!familyMap.has(personFamilyId)) {
              familyMap.set(personFamilyId, {
                id: personFamilyId,
                name: `${personFamilyId.charAt(0).toUpperCase() + personFamilyId.slice(1)}`,
                people: []
              })
            }
            
            familyMap.get(personFamilyId).people.push({
              id: personId,
              treeId: person.id,
              name: fullName,
              firstName: person.firstName,
              lastName: person.lastName,
              dob: person.dob,
              dod: person.dod,
              isDeceased: person.isDeceased === true,
              hasFullProfile: person.hasFullProfile === true,
              familyId: personFamilyId
            })
          })
          
          // Sort families and people
          const familiesList = Array.from(familyMap.values())
            .map(family => ({
              ...family,
              people: family.people.sort((a, b) => a.name.localeCompare(b.name))
            }))
            .sort((a, b) => a.name.localeCompare(b.name))
          
          await withMinimumDelay(Promise.resolve(familiesList), 1000)
          
          setFamilies(familiesList)
        }
        
        setLoading(false)
      } catch (err) {
        console.error('Error loading simple list view:', err)
        setError(err.message || 'Failed to load data')
        setLoading(false)
      }
    }

    loadData()
  }, [familyId])

  const buildPersonUrl = (person) => {
    if (!person.familyId || !person.id) return '#'
    
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
    const port = typeof window !== 'undefined' ? window.location.port : ''
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:'
    
    const baseDomain = currentHost.includes('.') 
      ? currentHost.split('.').slice(-2).join('.') 
      : currentHost
    
    return `${protocol}//${person.familyId}.${baseDomain}${port ? `:${port}` : ''}/${person.id}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return null
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <Container>
        <LoadingText>Loading...</LoadingText>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <LoadingText>Error: {error}</LoadingText>
      </Container>
    )
  }

  if (families.length === 0) {
    return (
      <Container>
        <LoadingText>No families available yet.</LoadingText>
      </Container>
    )
  }

  return (
    <Container>
      {families.map(family => (
        <FamilySection key={family.id}>
          <FamilyTitle>{family.name}</FamilyTitle>
          <PeopleGrid>
            {family.people.map(person => (
              <PersonCard
                key={person.treeId}
                href={buildPersonUrl(person)}
              >
                <PersonName>{person.name}</PersonName>
                {person.dob && (
                  <PersonDetails>
                    {formatDate(person.dob)}
                    {person.dod && ` - ${formatDate(person.dod)}`}
                  </PersonDetails>
                )}
                {person.isDeceased && (
                  <Badge $isDeceased={true}>Deceased</Badge>
                )}
                {person.hasFullProfile && (
                  <Badge $isDeceased={false}>Full Profile</Badge>
                )}
              </PersonCard>
            ))}
          </PeopleGrid>
        </FamilySection>
      ))}
    </Container>
  )
}
