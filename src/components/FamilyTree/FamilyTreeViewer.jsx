import { useState, useEffect, useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel
} from 'reactflow'
import 'reactflow/dist/style.css'
import dagre from 'dagre'
import styled from 'styled-components'
import { loadTreeData } from '../../utils/treeLoader'
import { buildGraphFromTree } from '../../utils/treeGraphBuilder'
import { withMinimumDelay } from '../../utils/loadingDelay'
import { calculateRelationship } from '../RelationshipEngine/relationshipCalculator'
import PersonNode from './PersonNode'

// Register custom node types (must be outside component to avoid React Flow warning)
const nodeTypes = {
  personNode: PersonNode
}

const Container = styled.div`
  width: 100%;
  height: 80vh;
  min-height: 600px;
  background-color: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.md};
  overflow: hidden;
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

// Dagre layout configuration
const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const nodeWidth = 200
const nodeHeight = 250

/**
 * Calculate node positions using dagre layout algorithm
 * @param {Array} nodes - React Flow nodes
 * @param {Array} edges - React Flow edges
 * @returns {Array} - Nodes with calculated positions
 */
function getLayoutedElements(nodes, edges) {
  dagreGraph.setGraph({ 
    rankdir: 'TB', // Top to bottom
    nodesep: 50,   // Horizontal spacing between nodes
    ranksep: 100   // Vertical spacing between ranks
  })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    node.targetPosition = 'top'
    node.sourcePosition = 'bottom'
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    }
  })

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
export default function FamilyTreeViewer({ 
  familyId = null, 
  onNodeClick = null,
  selectedPersonId = null,
  useIndianTerms = false
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [allPeople, setAllPeople] = useState([])

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

        // Store all people for relationship calculations
        setAllPeople(people)

        // Build graph from tree data
        // loadImages = false for now (performance) - can be enabled later
        let graph = await buildGraphFromTree(people, false)

        // Filter by family if specified
        if (familyId) {
          const { filterGraphByFamily } = await import('../../utils/treeGraphBuilder')
          graph = filterGraphByFamily(graph, familyId)
        }

        // Calculate relationships if a person is selected
        if (selectedPersonId) {
          graph.nodes = graph.nodes.map(node => {
            let relationshipLabel = null
            try {
              const relationship = calculateRelationship(
                selectedPersonId,
                node.data.treeId,
                people,
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
                allPeople: people
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
              allPeople: people
            }
          }))
        }

        // Calculate layout with dagre
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          graph.nodes,
          graph.edges
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
  }, [familyId, selectedPersonId, useIndianTerms, setNodes, setEdges])

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingText>Loading family tree...</LoadingText>
      </LoadingContainer>
    )
  }

  if (error) {
    return (
      <Container>
        <ErrorText>Error: {error}</ErrorText>
      </Container>
    )
  }

  return (
    <Container>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        nodesDraggable={false} // Disable dragging for cleaner tree view
        nodesConnectable={false} // Disable manual connections
        elementsSelectable={true}
      >
        <Background />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            // Color nodes by family (if we have that data)
            return node.data?.familyId ? '#94a3b8' : '#cbd5e1'
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </Container>
  )
}
