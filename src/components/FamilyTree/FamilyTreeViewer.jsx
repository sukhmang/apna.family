import { useState, useEffect, useCallback, useImperativeHandle, forwardRef, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  useViewport
} from 'reactflow'
import 'reactflow/dist/style.css'
import dagre from 'dagre'
import styled from 'styled-components'
import { loadTreeData } from '../../utils/treeLoader'
import { buildGraphFromTree } from '../../utils/treeGraphBuilder'
import { withMinimumDelay } from '../../utils/loadingDelay'
import { calculateRelationship } from '../RelationshipEngine/relationshipCalculator'
import { calculateGenerations, normalizeGenerations } from '../../utils/generationCalculator'
import { getFamilyColorSync } from '../../utils/familyColors'
import { buildClusterGraph } from '../../utils/familyClusterUtils'
import { TreeErrorBoundary } from '../ErrorBoundary'
import PersonNode from './PersonNode'
import FamilyLegend from './FamilyLegend'
import FamilyGrouping from './FamilyGrouping'
import TreeSkeleton from './TreeSkeleton'

// Register custom node types (must be outside component to avoid React Flow warning)
import FamilyClusterCard from './FamilyClusterCard'

const nodeTypes = {
  personNode: PersonNode,
  familyCluster: FamilyClusterCard
}

const Container = styled.div`
  width: 100%;
  height: 80vh;
  min-height: 600px;
  background-color: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.md};
  overflow: hidden;

  @media (max-width: 768px) {
    height: 70vh;
    min-height: 400px;
  }

  @media (max-width: 480px) {
    height: 60vh;
    min-height: 300px;
  }
`

const LoadingContainer = styled.div`
  width: 100%;
  height: 80vh;
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.md};
`

const LoadingText = styled.p`
  font-size: ${props => props.theme.typography.sizes.lg};
  color: ${props => props.theme.colors.text.secondary};
`

const ErrorText = styled.p`
  font-size: ${props => props.theme.typography.sizes.base};
  color: ${props => props.theme.colors.error || '#ef4444'};
  text-align: center;
  padding: 2rem;
`

const ClusterModeToggle = styled.div`
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: ${props => props.theme.colors.cardBackground};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.sm};
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: ${props => props.theme.typography.sizes.base};
    font-weight: ${props => props.theme.typography.weights.semibold};
    color: ${props => props.theme.colors.text.primary};

    input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
  }
`

// Dagre layout configuration
const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const nodeWidth = 200
const nodeHeight = 250

/**
 * Calculate node positions using dagre layout algorithm
 * @param {Array} nodes - React Flow nodes
 * @param {Array} edges - React Flow edges
 * @param {boolean} isMobile - Whether to use mobile-optimized spacing
 * @returns {Array} - Nodes with calculated positions
 */
function getLayoutedElements(nodes, edges, isMobile = false, generationMap = null) {
  // Responsive spacing: more space on desktop, less on mobile
  const horizontalSpacing = isMobile ? 80 : 150  // Increased from 50
  const verticalSpacing = isMobile ? 150 : 200   // Increased from 100
  
  // Ensure all nodes are included in layout, even if disconnected (orphans)
  dagreGraph.setGraph({ 
    rankdir: 'TB', // Top to bottom
    nodesep: horizontalSpacing,   // Horizontal spacing between nodes
    ranksep: verticalSpacing,      // Vertical spacing between ranks
    edgesep: 50,                   // Minimum distance between edges
    ranker: 'network-simplex',     // Better layout algorithm for trees
    // Handle disconnected nodes by allowing them to float
    acyclicer: 'greedy',
    align: 'UL' // Align to upper left
  })

  // Add nodes
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  // Add edges with constraints for generational layout
  edges.forEach((edge) => {
    const edgeConfig = {}
    
    // If we have generation data, enforce parent-child rank differences
    if (generationMap) {
      const sourceGen = generationMap.get(edge.source)
      const targetGen = generationMap.get(edge.target)
      
      // Check if this is a parent-child relationship (solid line) or partner (dashed)
      const isPartnerEdge = edge.style && edge.style.strokeDasharray
      
      if (isPartnerEdge) {
        // Partner edges: enforce same rank (minlen = 0, but we'll handle via post-processing)
        edgeConfig.minlen = 0
      } else if (sourceGen !== undefined && targetGen !== undefined) {
        // Parent-child edges: enforce rank difference of 1
        const expectedRankDiff = targetGen - sourceGen
        if (expectedRankDiff > 0) {
          edgeConfig.minlen = expectedRankDiff
        }
      }
    }
    
    dagreGraph.setEdge(edge.source, edge.target, edgeConfig)
  })

  // Run dagre layout
  dagre.layout(dagreGraph)

  // Post-process: enforce generational Y positions and horizontal spouse positioning
  if (generationMap) {
    // Group nodes by generation
    const nodesByGeneration = new Map()
    nodes.forEach(node => {
      const gen = generationMap.get(node.id) ?? 0
      if (!nodesByGeneration.has(gen)) {
        nodesByGeneration.set(gen, [])
      }
      nodesByGeneration.get(gen).push(node)
    })

    // Calculate Y positions for each generation
    const generationYPositions = new Map()
    let currentY = 0
    
    // Sort generations and assign Y positions
    const sortedGenerations = Array.from(nodesByGeneration.keys()).sort((a, b) => a - b)
    sortedGenerations.forEach(gen => {
      generationYPositions.set(gen, currentY)
      currentY += verticalSpacing + nodeHeight
    })

    // Build partner map for horizontal positioning
    const partnerMap = new Map() // personId -> array of partner IDs
    edges.forEach(edge => {
      const isPartnerEdge = edge.style && edge.style.strokeDasharray
      if (isPartnerEdge) {
        if (!partnerMap.has(edge.source)) {
          partnerMap.set(edge.source, [])
        }
        if (!partnerMap.has(edge.target)) {
          partnerMap.set(edge.target, [])
        }
        partnerMap.get(edge.source).push(edge.target)
        partnerMap.get(edge.target).push(edge.source)
      }
    })

    // For each generation, group spouses together horizontally
    sortedGenerations.forEach(gen => {
      const genNodes = nodesByGeneration.get(gen) || []
      const processed = new Set()
      const spouseGroups = []
      
      // Group spouses together
      genNodes.forEach(node => {
        if (processed.has(node.id)) return
        
        const partners = partnerMap.get(node.id) || []
        if (partners.length > 0) {
          // Create a group with this node and all its partners
          const group = [node, ...partners.map(pid => genNodes.find(n => n.id === pid)).filter(Boolean)]
          spouseGroups.push(group)
          group.forEach(n => processed.add(n.id))
        } else {
          // Single node (no partners)
          spouseGroups.push([node])
          processed.add(node.id)
        }
      })
      
      // Sort spouse groups by their dagre X position (to maintain relative order)
      spouseGroups.forEach(group => {
        group.sort((a, b) => {
          const aPos = dagreGraph.node(a.id)
          const bPos = dagreGraph.node(b.id)
          return (aPos?.x || 0) - (bPos?.x || 0)
        })
      })
      
      // Sort groups by the leftmost node's X position
      spouseGroups.sort((a, b) => {
        const aPos = dagreGraph.node(a[0].id)
        const bPos = dagreGraph.node(b[0].id)
        return (aPos?.x || 0) - (bPos?.x || 0)
      })
      
      // Assign X positions: place spouses next to each other
      let currentX = 0
      spouseGroups.forEach(group => {
        group.forEach((node, index) => {
          const enforcedY = generationYPositions.get(gen) ?? 0
          node.targetPosition = 'top'
          node.sourcePosition = 'bottom'
          node.position = {
            x: currentX,
            y: enforcedY - nodeHeight / 2,
          }
          currentX += nodeWidth + horizontalSpacing
        })
        // Add extra spacing between different spouse groups
        currentX += horizontalSpacing
      })
    })

    // Update any nodes not processed (shouldn't happen, but safety check)
    nodes.forEach((node) => {
      if (!node.position || node.position.x === undefined) {
        const nodeWithPosition = dagreGraph.node(node.id)
        const generation = generationMap.get(node.id) ?? 0
        const enforcedY = generationYPositions.get(generation) ?? 0
        
        node.targetPosition = 'top'
        node.sourcePosition = 'bottom'
        node.position = {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: enforcedY - nodeHeight / 2,
        }
      }
    })
  } else {
    // Fallback: use dagre's calculated positions
    nodes.forEach((node) => {
      const nodeWithPosition = dagreGraph.node(node.id)
      node.targetPosition = 'top'
      node.sourcePosition = 'bottom'
      node.position = {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      }
    })
  }

  return { nodes, edges }
}

/**
 * FamilyTreeViewer - Interactive family tree visualization
 * 
 * @param {Object} props
 * @param {string} props.familyId - Optional family ID to filter tree (null = all families)
 * @param {Function} props.onNodeClick - Callback when node is clicked
 * @param {string} props.selectedPersonId - Optional person ID for relationship calculations
 * @param {boolean} props.useIndianTerms - Whether to use Indian relationship terms
 */
const FamilyTreeViewer = forwardRef(function FamilyTreeViewer({ 
  familyId = null, 
  onNodeClick = null,
  selectedPersonId = null,
  useIndianTerms = false
}, ref) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [allPeople, setAllPeople] = useState([])
  const reactFlowInstanceRef = useRef(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [visibleFamilies, setVisibleFamilies] = useState(() => {
    // Load from localStorage or default to all families visible
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('visibleFamilies')
      if (saved) {
        try {
          return new Set(JSON.parse(saved))
        } catch {
          return null // Will be set to all families
        }
      }
    }
    return null // null means all families visible
  })
  const [availableFamilies, setAvailableFamilies] = useState([])
  
  // Family Cluster Mode state
  const [clusterMode, setClusterMode] = useState(() => {
    // Load from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('clusterMode')
      return saved === 'true'
    }
    return false // Default to off
  })
  const [openFamilyIds, setOpenFamilyIds] = useState(() => {
    // Load from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('openFamilyIds')
      if (saved) {
        try {
          return new Set(JSON.parse(saved))
        } catch {
          return new Set()
        }
      }
    }
    return new Set() // Start with no families open (all collapsed)
  })
  const MAX_OPEN_FAMILIES = 1 // Auto-collapse when this limit is reached

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    fitView: () => {
      if (reactFlowInstanceRef.current) {
        reactFlowInstanceRef.current.fitView()
      }
    },
    setViewport: (viewport) => {
      if (reactFlowInstanceRef.current) {
        reactFlowInstanceRef.current.setViewport(viewport)
      }
    }
  }))

  useEffect(() => {
    const loadTree = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load tree data
        const treeData = await loadTreeData()
        const people = treeData.people || []

        if (people.length === 0) {
          setError('No people found in family tree')
          setLoading(false)
          return
        }

        // Store all people for relationship calculations (always use full dataset)
        setAllPeople(people)

        // Build list of available families for grouping
        const familiesSet = new Set()
        const familiesData = []
        people.forEach(person => {
          const personFamilyId = person.familyId || (person.id ? person.id.split('_').pop() : null)
          if (personFamilyId && !familiesSet.has(personFamilyId)) {
            familiesSet.add(personFamilyId)
            // Get family color (synchronous function)
            const color = getFamilyColorSync(personFamilyId)
            const familyName = personFamilyId && personFamilyId.length > 0
              ? `${personFamilyId.charAt(0).toUpperCase() + personFamilyId.slice(1)} Family`
              : 'Unknown Family'
            familiesData.push({
              id: personFamilyId,
              name: familyName,
              color: color.primary
            })
          }
        })
        setAvailableFamilies(familiesData.sort((a, b) => a.name.localeCompare(b.name)))

        // Initialize visible families if not set (all families visible by default)
        if (visibleFamilies === null) {
          const allFamilyIds = new Set(familiesData.map(f => f.id))
          setVisibleFamilies(allFamilyIds)
          if (typeof window !== 'undefined') {
            localStorage.setItem('visibleFamilies', JSON.stringify(Array.from(allFamilyIds)))
          }
        }

        // Filter people by visible families before building graph
        let filteredPeople = people
        if (visibleFamilies && visibleFamilies.size > 0 && visibleFamilies.length > 0) {
          filteredPeople = people.filter(person => {
            const personFamilyId = person.familyId || (person.id ? person.id.split('_').pop() : null)
            return personFamilyId && visibleFamilies.has(personFamilyId)
          })
        }

        // Get families metadata from tree.json if available (reuse treeData already loaded)
        const familiesMetadata = treeData.families || null

        // Build graph - use cluster mode if enabled
        let graph
        if (clusterMode) {
          // Cluster mode: build graph with collapsed families
          // If no families are open, show all as clusters (initial state)
          const effectiveOpenFamilyIds = openFamilyIds.size > 0 
            ? openFamilyIds 
            : new Set() // Empty set = all families collapsed
          
          graph = buildClusterGraph(
            filteredPeople,
            effectiveOpenFamilyIds,
            familiesMetadata,
            getFamilyColorSync,
            handleExpandFamily
          )
        } else {
          // Normal mode: build full graph
          // Calculate generations for proper genealogical layout
          const generationMap = calculateGenerations(filteredPeople)
          const normalizedGenerations = normalizeGenerations(generationMap)

          // Build graph from filtered tree data
          // loadImages = false for now (performance) - can be enabled later
          graph = await buildGraphFromTree(filteredPeople, false)
          
          // Apply generation constraints in layout
          const generationMapForLayout = calculateGenerations(filteredPeople)
          const normalizedGenerationsForLayout = normalizeGenerations(generationMapForLayout)
          
          // Store for use in layout calculation
          graph._normalizedGenerations = normalizedGenerationsForLayout
        }

        // Filter by family if specified (additional filter on top of visible families)
        if (familyId) {
          const { filterGraphByFamily } = await import('../../utils/treeGraphBuilder')
          graph = filterGraphByFamily(graph, familyId)
        }

        // Calculate relationships if a person is selected
        // Use all people (not filtered) for relationship calculations to ensure accuracy
        if (selectedPersonId) {
          graph.nodes = graph.nodes.map(node => {
            let relationshipLabel = null
            try {
              const relationship = calculateRelationship(
                selectedPersonId,
                node.data.treeId,
                people, // Use all people for accurate relationship calculation
                useIndianTerms
              )
              
              if (relationship) {
                relationshipLabel = useIndianTerms ? relationship.indian : relationship.english
              }
            } catch (error) {
              console.debug('Error calculating relationship:', error)
              // Continue without relationship label
            }
            
            return {
              ...node,
              data: {
                ...node.data,
                selectedPersonId,
                useIndianTerms,
                relationshipLabel,
                allPeople: people,
                zoomLevel: zoomLevel // Use current zoom level
              }
            }
          })
        } else {
          // Add relationship data structure even when no selection
          graph.nodes = graph.nodes.map(node => ({
            ...node,
            data: {
              ...node.data,
              selectedPersonId: null,
              useIndianTerms,
              relationshipLabel: null,
              allPeople: people,
              zoomLevel: zoomLevel // Use current zoom level
            }
          }))
        }

        // Detect mobile for responsive spacing
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
        
        // Calculate layout with dagre, using generation constraints
        const normalizedGenerationsForLayout = graph._normalizedGenerations || null
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          graph.nodes,
          graph.edges,
          isMobile,
          normalizedGenerationsForLayout
        )

        // Ensure minimum delay for smooth animations
        await withMinimumDelay(Promise.resolve(), 1000)

        setNodes(layoutedNodes)
        setEdges(layoutedEdges)
        setLoading(false)
      } catch (err) {
        console.error('Error loading family tree:', err)
        setError(err.message || 'Failed to load family tree')
        setLoading(false)
      }
    }

    loadTree()
  }, [familyId, selectedPersonId, useIndianTerms, visibleFamilies, clusterMode, openFamilyIds, setNodes, setEdges])

  const handleExpandFamily = (familyIdToExpand) => {
    setOpenFamilyIds(prev => {
      const newSet = new Set(prev)
      
      // If we're at the limit, remove the oldest (first) family
      if (newSet.size >= MAX_OPEN_FAMILIES) {
        const firstFamily = Array.from(newSet)[0]
        newSet.delete(firstFamily)
      }
      
      // Add the new family
      newSet.add(familyIdToExpand)
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('openFamilyIds', JSON.stringify(Array.from(newSet)))
      }
      
      return newSet
    })
  }

  const handleToggleFamily = (familyId) => {
    setVisibleFamilies(prev => {
      const newSet = new Set(prev || [])
      if (newSet.has(familyId)) {
        newSet.delete(familyId)
      } else {
        newSet.add(familyId)
      }
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('visibleFamilies', JSON.stringify(Array.from(newSet)))
      }
      
      return newSet
    })
  }

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onInit = useCallback((reactFlowInstance) => {
    reactFlowInstanceRef.current = reactFlowInstance
  }, [])

  const onMove = useCallback((event, viewport) => {
    const newZoom = viewport.zoom
    setZoomLevel(newZoom)
    
    // Update all nodes with new zoom level for text hiding
    setNodes((currentNodes) => 
      currentNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          zoomLevel: newZoom
        }
      }))
    )
  }, [setNodes])

  if (loading) {
    return <TreeSkeleton />
  }

  if (error) {
    return (
      <Container>
        <ErrorText>Error: {error}</ErrorText>
      </Container>
    )
  }

  return (
    <TreeErrorBoundary>
      <Container>
        {!familyId && availableFamilies.length > 1 && (
          <>
            <ClusterModeToggle>
              <label>
                <input
                  type="checkbox"
                  checked={clusterMode}
                  onChange={(e) => {
                    const newValue = e.target.checked
                    setClusterMode(newValue)
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('clusterMode', String(newValue))
                    }
                    // If enabling cluster mode and no families are open, open the first one
                    if (newValue && openFamilyIds.size === 0 && availableFamilies.length > 0) {
                      handleExpandFamily(availableFamilies[0].id)
                    }
                  }}
                />
                <span>Family Cluster Mode</span>
              </label>
              <span style={{ fontSize: '0.875rem', color: '#64748b', marginLeft: '1rem' }}>
                {clusterMode ? 'Click family cards to expand' : 'Collapse families to reduce complexity'}
              </span>
            </ClusterModeToggle>
            {!clusterMode && (
              <FamilyGrouping
                families={availableFamilies}
                visibleFamilies={visibleFamilies || new Set(availableFamilies.map(f => f.id))}
                onToggleFamily={handleToggleFamily}
              />
            )}
          </>
        )}
        <FamilyLegend familyId={familyId} />
        <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        onMove={onMove}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        nodesDraggable={false} // Disable dragging for cleaner tree view
        nodesConnectable={false} // Disable manual connections
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        preventScrolling={false}
        minZoom={0.1}
        maxZoom={2}
      >
          <Background />
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              // Color nodes by family for visual distinction
              if (node.data?.familyColor?.primary) {
                return node.data.familyColor.primary
              }
              return node.data?.familyId ? '#94a3b8' : '#cbd5e1'
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </Container>
    </TreeErrorBoundary>
  )
})

export default FamilyTreeViewer
