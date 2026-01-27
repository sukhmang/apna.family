import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { getAllFamilyIdsFromTree } from '../../utils/treeLoader'
import { loadFamilyData } from '../../utils/dataLoader'
import { getFamilyColorSync } from '../../utils/familyColors'

const LegendContainer = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: ${props => props.theme.colors.cardBackground};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: 1rem;
  box-shadow: ${props => props.theme.shadows.md};
  z-index: 10;
  max-width: 250px;
  max-height: 400px;
  overflow-y: auto;

  @media (max-width: 768px) {
    position: relative;
    top: auto;
    right: auto;
    margin-bottom: 1rem;
    max-width: 100%;
  }
`

const LegendTitle = styled.h3`
  font-size: ${props => props.theme.typography.sizes.sm};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`

const LegendList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: ${props => props.theme.typography.sizes.xs};
  color: ${props => props.theme.colors.text.secondary};
`

const ColorSwatch = styled.div`
  width: 16px;
  height: 16px;
  border-radius: ${props => props.theme.borderRadius.sm};
  background-color: ${props => props.$color};
  border: 1px solid ${props => props.theme.colors.border};
  flex-shrink: 0;
`

const FamilyName = styled.span`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

/**
 * FamilyLegend - Shows which colors represent which families
 * 
 * @param {Object} props
 * @param {string|null} props.familyId - Optional family ID to filter (null = show all)
 */
export default function FamilyLegend({ familyId = null }) {
  const [families, setFamilies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFamilies = async () => {
      try {
        if (familyId) {
          // Single family - load just that one
          try {
            const familyData = await loadFamilyData(familyId)
            const color = getFamilyColorSync(familyId)
            setFamilies([{
              id: familyId,
              name: familyData.displayName || familyData.name || `${familyId.charAt(0).toUpperCase() + familyId.slice(1)} Family`,
              color: color.primary
            }])
          } catch (error) {
            const color = getFamilyColorSync(familyId)
            setFamilies([{
              id: familyId,
              name: `${familyId.charAt(0).toUpperCase() + familyId.slice(1)} Family`,
              color: color.primary
            }])
          }
        } else {
          // All families - load from tree.json
          const familyIds = await getAllFamilyIdsFromTree()
          
          const familyPromises = familyIds.map(async (id) => {
            try {
              const familyData = await loadFamilyData(id)
              const color = getFamilyColorSync(id)
              return {
                id,
                name: familyData.displayName || familyData.name || `${id.charAt(0).toUpperCase() + id.slice(1)} Family`,
                color: color.primary
              }
            } catch (error) {
              const color = getFamilyColorSync(id)
              return {
                id,
                name: `${id.charAt(0).toUpperCase() + id.slice(1)} Family`,
                color: color.primary
              }
            }
          })
          
          const results = await Promise.all(familyPromises)
          results.sort((a, b) => a.name.localeCompare(b.name))
          setFamilies(results)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error loading family legend:', error)
        setFamilies([])
        setLoading(false)
      }
    }

    loadFamilies()
  }, [familyId])

  if (loading || families.length === 0) {
    return null
  }

  // Don't show legend if only one family
  if (families.length === 1) {
    return null
  }

  return (
    <LegendContainer>
      <LegendTitle>Families</LegendTitle>
      <LegendList>
        {families.map(family => (
          <LegendItem key={family.id}>
            <ColorSwatch $color={family.color} />
            <FamilyName>{family.name}</FamilyName>
          </LegendItem>
        ))}
      </LegendList>
    </LegendContainer>
  )
}
