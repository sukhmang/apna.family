import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { loadTreeData } from '../../utils/treeLoader'
import { getFamilyId } from '../../utils/subdomain'

const ControlsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: ${props => props.theme.colors.cardBackground};
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: 1.5rem;
  box-shadow: ${props => props.theme.shadows.sm};

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`

const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`

const Label = styled.label`
  font-size: ${props => props.theme.typography.sizes.sm};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.text.secondary};
  white-space: nowrap;
`

const Select = styled.select`
  padding: 0.5rem 1rem;
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.text.primary};
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 200px;

  &:hover {
    border-color: ${props => props.theme.colors.accent};
  }

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.accent}20;
  }

  @media (max-width: 768px) {
    flex: 1;
    min-width: 0;
  }
`

const ToggleButton = styled.button`
  padding: 0.5rem 1rem;
  font-size: ${props => props.theme.typography.sizes.sm};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.$active 
    ? props.theme.colors.cardBackground 
    : props.theme.colors.text.secondary};
  background-color: ${props => props.$active 
    ? props.theme.colors.accent 
    : props.theme.colors.cardBackground};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background-color: ${props => props.$active 
      ? props.theme.colors.accentHover 
      : props.theme.colors.border};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const Divider = styled.div`
  width: 1px;
  height: 2rem;
  background-color: ${props => props.theme.colors.border};
  margin: 0 0.5rem;

  @media (max-width: 768px) {
    display: none;
  }
`

/**
 * TreeControls - Control panel for family tree viewer
 * 
 * @param {Object} props
 * @param {string|null} props.selectedPersonId - Currently selected person ID (tree ID format)
 * @param {Function} props.onPersonSelect - Callback when person is selected
 * @param {boolean} props.useIndianTerms - Whether to use Indian relationship terms
 * @param {Function} props.onLanguageToggle - Callback when language toggle changes
 * @param {string} props.viewMode - Current view mode ('tree' | 'list')
 * @param {Function} props.onViewToggle - Callback when view mode changes
 * @param {Function} props.onZoomFit - Callback for fit to screen
 * @param {Function} props.onZoomReset - Callback for reset zoom
 */
export default function TreeControls({
  selectedPersonId,
  onPersonSelect,
  useIndianTerms,
  onLanguageToggle,
  viewMode,
  onViewToggle,
  onZoomFit,
  onZoomReset
}) {
  // Get familyId from subdomain (works on both root and family subdomains)
  const familyId = getFamilyId()
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPeople = async () => {
      try {
        // Use familyId for cluster optimization
        const treeData = await loadTreeData(familyId)
        const allPeople = treeData.people || []
        
        // Sort people by name for easier selection
        const sortedPeople = allPeople
          .map(person => ({
            id: person.id,
            name: `${person.firstName} ${person.lastName}`.trim(),
            firstName: person.firstName,
            lastName: person.lastName
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
        
        setPeople(sortedPeople)
        setLoading(false)
      } catch (error) {
        console.error('Error loading people for selector:', error)
        setPeople([])
        setLoading(false)
      }
    }

    loadPeople()
  }, [familyId])

  const handlePersonChange = (e) => {
    const value = e.target.value
    onPersonSelect(value === '' ? null : value)
  }

  return (
    <ControlsContainer>
      {/* Who am I? Selector */}
      <ControlGroup>
        <Label htmlFor="person-select">Who am I?</Label>
        <Select
          id="person-select"
          value={selectedPersonId || ''}
          onChange={handlePersonChange}
          disabled={loading}
        >
          <option value="">Select a person...</option>
          {people.map(person => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </Select>
      </ControlGroup>

      <Divider />

      {/* View Toggle */}
      <ControlGroup>
        <ToggleButton
          $active={viewMode === 'tree'}
          onClick={() => onViewToggle('tree')}
        >
          Tree View
        </ToggleButton>
        <ToggleButton
          $active={viewMode === 'list'}
          onClick={() => onViewToggle('list')}
        >
          List View
        </ToggleButton>
      </ControlGroup>

      <Divider />

      {/* Language Toggle */}
      <ControlGroup>
        <ToggleButton
          $active={!useIndianTerms}
          onClick={() => onLanguageToggle(false)}
          disabled={!selectedPersonId}
          title={!selectedPersonId ? 'Select a person first to see relationships' : ''}
        >
          English
        </ToggleButton>
        <ToggleButton
          $active={useIndianTerms}
          onClick={() => onLanguageToggle(true)}
          disabled={!selectedPersonId}
          title={!selectedPersonId ? 'Select a person first to see relationships' : ''}
        >
          Punjabi
        </ToggleButton>
      </ControlGroup>

      {/* Zoom Controls (only show in tree view) */}
      {viewMode === 'tree' && (
        <>
          <Divider />
          <ControlGroup>
            <ToggleButton
              onClick={onZoomFit}
              $active={false}
            >
              Fit to Screen
            </ToggleButton>
            <ToggleButton
              onClick={onZoomReset}
              $active={false}
            >
              Reset Zoom
            </ToggleButton>
          </ControlGroup>
        </>
      )}
    </ControlsContainer>
  )
}
