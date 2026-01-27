import { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { loadFamilyData } from '../../utils/dataLoader'
import { withMinimumDelay } from '../../utils/loadingDelay'
import { getAllFamilyIdsFromTree } from '../../utils/treeLoader'
import FamilyTreeViewer from '../../components/FamilyTree/FamilyTreeViewer'
import TreeControls from '../../components/FamilyTree/TreeControls'
import SimpleListView from '../../components/FamilyTree/SimpleListView'
import Navbar from '../../components/Navbar'

const Container = styled.div`
  max-width: 100%;
  margin: 0 auto;
  padding: 2rem 1rem;
  text-align: center;
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

const TreeContainer = styled.div`
  width: 100%;
  max-width: 100%;
  margin-top: 2rem;
  overflow: hidden;
`

/**
 * GlobalTree LandingPage - Root landing page for apna.family
 * Displays interactive family tree visualization (unified tree showing all families)
 */
export default function LandingPage() {
  const [viewMode, setViewMode] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('familyTreeViewMode')
    return saved === 'list' ? 'list' : 'tree'
  })
  const [selectedPersonId, setSelectedPersonId] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('familyTreeSelectedPerson')
    return saved || null
  })
  const [useIndianTerms, setUseIndianTerms] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('familyTreeUseIndianTerms')
    return saved === 'true'
  })
  const [families, setFamilies] = useState([])
  const [loading, setLoading] = useState(true)
  const treeViewerRef = useRef(null)

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
            // This is expected behavior - not all families need config files
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

  if (loading) {
    return (
      <>
        <Navbar />
        <Container>
          <LoadingText>Loading families...</LoadingText>
        </Container>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <Container>
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
            familyId={null}
            selectedPersonId={selectedPersonId}
            useIndianTerms={useIndianTerms}
          />
        </TreeContainer>
      ) : (
        <SimpleListView familyId={null} />
      )}
      </Container>
    </>
  )
}
