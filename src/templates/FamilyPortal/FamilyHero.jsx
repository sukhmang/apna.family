import { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { useFamily } from '../../contexts/FamilyContext'
import FamilyTreeViewer from '../../components/FamilyTree/FamilyTreeViewer'
import TreeControls from '../../components/FamilyTree/TreeControls'
import SimpleListView from '../../components/FamilyTree/SimpleListView'

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

const TreeContainer = styled.div`
  width: 100%;
  max-width: 100%;
  margin-top: 2rem;
  overflow: hidden;
`

const HomeVideosLink = styled(Link)`
  display: inline-block;
  margin-top: 2rem;
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
 * Displays family tree visualization with controls (same as main page)
 */
export default function FamilyHero({ familyData }) {
  const { familyId } = useFamily()
  
  // State management (with localStorage persistence)
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('familyTreeViewMode')
    return saved === 'list' ? 'list' : 'tree'
  })
  const [selectedPersonId, setSelectedPersonId] = useState(() => {
    const saved = localStorage.getItem('familyTreeSelectedPerson')
    return saved || null
  })
  const [useIndianTerms, setUseIndianTerms] = useState(() => {
    const saved = localStorage.getItem('familyTreeUseIndianTerms')
    return saved === 'true'
  })
  
  const treeViewerRef = useRef(null)

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('familyTreeViewMode', viewMode)
  }, [viewMode])

  useEffect(() => {
    if (selectedPersonId) {
      localStorage.setItem('familyTreeSelectedPerson', selectedPersonId)
    } else {
      localStorage.removeItem('familyTreeSelectedPerson')
    }
  }, [selectedPersonId])

  useEffect(() => {
    localStorage.setItem('familyTreeUseIndianTerms', useIndianTerms.toString())
  }, [useIndianTerms])

  const handlePersonSelect = (personId) => {
    setSelectedPersonId(personId)
  }

  const handleLanguageToggle = (useIndian) => {
    setUseIndianTerms(useIndian)
  }

  const handleViewToggle = (mode) => {
    setViewMode(mode)
  }

  const handleZoomFit = () => {
    if (treeViewerRef.current) {
      treeViewerRef.current.fitView()
    }
  }

  const handleZoomReset = () => {
    if (treeViewerRef.current) {
      treeViewerRef.current.setViewport({ x: 0, y: 0, zoom: 1 })
    }
  }

  return (
    <Container>
      <Title>{familyData?.displayName || familyData?.name || 'Family Portal'}</Title>
      <Description>
        {familyData?.description || 'Welcome to our family network'}
      </Description>
      
      <TreeControls
        selectedPersonId={selectedPersonId}
        onPersonSelect={handlePersonSelect}
        useIndianTerms={useIndianTerms}
        onLanguageToggle={handleLanguageToggle}
        viewMode={viewMode}
        onViewToggle={handleViewToggle}
        onZoomFit={handleZoomFit}
        onZoomReset={handleZoomReset}
      />

      {viewMode === 'tree' ? (
        <TreeContainer>
          <FamilyTreeViewer 
            ref={treeViewerRef}
            familyId={familyId}
            selectedPersonId={selectedPersonId}
            useIndianTerms={useIndianTerms}
          />
        </TreeContainer>
      ) : (
        <SimpleListView familyId={familyId} />
      )}

      <HomeVideosLink to="/homevideos">
        Home Videos
      </HomeVideosLink>
    </Container>
  )
}
