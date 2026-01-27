import { useState } from 'react'
import styled from 'styled-components'
import { ChevronDown, ChevronRight } from 'lucide-react'

const GroupingContainer = styled.div`
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: ${props => props.theme.colors.cardBackground};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.sm};
`

const GroupingTitle = styled.h3`
  font-size: ${props => props.theme.typography.sizes.base};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 0.75rem;
`

const GroupList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const GroupItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.background};
  }
`

const ToggleIcon = styled.div`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.text.secondary};
`

const GroupLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  cursor: pointer;
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.text.primary};
`

const ColorSwatch = styled.div`
  width: 16px;
  height: 16px;
  border-radius: ${props => props.theme.borderRadius.sm};
  background-color: ${props => props.$color};
  border: 1px solid ${props => props.theme.colors.border};
  flex-shrink: 0;
`

const Checkbox = styled.input`
  cursor: pointer;
`

/**
 * FamilyGrouping - Control panel for showing/hiding families in the tree
 * 
 * @param {Object} props
 * @param {Array} props.families - Array of family objects with {id, name, color}
 * @param {Set<string>} props.visibleFamilies - Set of visible family IDs
 * @param {Function} props.onToggleFamily - Callback when family visibility is toggled
 */
export default function FamilyGrouping({ 
  families = [], 
  visibleFamilies = new Set(), 
  onToggleFamily 
}) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (families.length <= 1) {
    return null // Don't show grouping if only one family
  }

  const handleToggle = (familyId) => {
    onToggleFamily(familyId)
  }

  return (
    <GroupingContainer>
      <GroupingTitle onClick={() => setIsExpanded(!isExpanded)} style={{ cursor: 'pointer' }}>
        {isExpanded ? <ChevronDown size={16} style={{ display: 'inline', marginRight: '0.5rem' }} /> : <ChevronRight size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />}
        Show/Hide Families
      </GroupingTitle>
      
      {isExpanded && (
        <GroupList>
          {families.map(family => (
            <GroupItem key={family.id}>
              <Checkbox
                type="checkbox"
                checked={visibleFamilies.has(family.id)}
                onChange={() => handleToggle(family.id)}
                id={`family-${family.id}`}
              />
              <GroupLabel htmlFor={`family-${family.id}`}>
                <ColorSwatch $color={family.color} />
                <span>{family.name}</span>
              </GroupLabel>
            </GroupItem>
          ))}
        </GroupList>
      )}
    </GroupingContainer>
  )
}
