/**
 * Tree Graph Builder
 * 
 * Converts tree.json data structure into React Flow graph format (nodes and edges)
 * Handles parent-child relationships and partner/spouse relationships
 */

import { parseTreeId } from './treeUtils'
import { loadPersonData } from './dataLoader'
import { getFamilyColorSync } from './familyColors'

/**
 * Build React Flow graph from tree.json data
 * @param {Array} people - Array of person objects from tree.json
 * @param {boolean} loadImages - Whether to load portrait images from person data files (default: false for performance)
 * @returns {Promise<Object>} - { nodes: Array, edges: Array }
 */
export async function buildGraphFromTree(people, loadImages = false) {
  if (!people || !Array.isArray(people)) {
    return { nodes: [], edges: [] }
  }

  // Create a map for quick person lookup
  const personMap = new Map()
  people.forEach(person => {
    personMap.set(person.id, person)
  })

  const nodes = []
  const edges = []
  const processedEdges = new Set() // Track edges to avoid duplicates

  // Build nodes
  const nodePromises = people.map(async (person) => {
    const { personId, familyId } = parseTreeId(person.id)
    const fullName = `${person.firstName} ${person.lastName}`.trim()
    
    // Get portrait image
    let portraitImage = '/portrait.png' // Default fallback
    
    // Optionally load portrait image from person data file
    if (loadImages && person.hasFullProfile && familyId && personId) {
      try {
        const personData = await loadPersonData(familyId, personId)
        if (personData?.memorialData?.portraitImage) {
          portraitImage = personData.memorialData.portraitImage
        }
      } catch (error) {
        // Silently fail - use default image
        console.debug(`Could not load portrait for ${familyId}-${personId}:`, error.message)
      }
    }
    
    // Get family color for visual distinction
    const familyColor = getFamilyColorSync(familyId)

    // Determine if this is a pet
    const isPet = person.type === 'pet'
    
    // Node data structure for React Flow
    const nodeData = {
      id: person.id, // Use tree ID as node ID (e.g., "baljit_grewal")
      type: 'personNode', // Custom node type
      position: { x: 0, y: 0 }, // Will be calculated by dagre
      data: {
        personId: personId,
        familyId: familyId,
        treeId: person.id,
        name: fullName,
        firstName: person.firstName,
        lastName: person.lastName,
        maidenName: person.maidenName || null,
        gender: person.gender || 'Unknown',
        dob: person.dob,
        dod: person.dod,
        isDeceased: person.isDeceased === true,
        currentLocation: person.currentLocation || null,
        portraitImage: portraitImage,
        hasFullProfile: person.hasFullProfile === true,
        isPet: isPet,
        // Family color for visual distinction
        familyColor: familyColor,
        // Store full person data for relationship calculations
        personData: person
      }
    }

    return nodeData
  })

  // Wait for all nodes to be built (including image loading if enabled)
  const builtNodes = await Promise.all(nodePromises)
  nodes.push(...builtNodes)

  // Build edges (relationships)
  people.forEach(person => {
    const personId = person.id

    // Parent-child relationships (vertical)
    if (person.parents && Array.isArray(person.parents)) {
      person.parents.forEach(parentId => {
        if (personMap.has(parentId)) {
          const edgeKey = `${parentId}-${personId}`
          if (!processedEdges.has(edgeKey)) {
            edges.push({
              id: edgeKey,
              source: parentId,
              target: personId,
              type: 'smoothstep', // React Flow edge type
              style: { stroke: '#94a3b8', strokeWidth: 2 },
              animated: false
            })
            processedEdges.add(edgeKey)
          }
        }
      })
    }

    // Partner/spouse relationships (horizontal)
    if (person.partners && Array.isArray(person.partners)) {
      person.partners.forEach(partnerId => {
        if (personMap.has(partnerId)) {
          // Create bidirectional edge (or use a single edge with both directions)
          const edgeKey1 = `${personId}-${partnerId}`
          const edgeKey2 = `${partnerId}-${personId}`
          
          // Only add if we haven't processed either direction
          if (!processedEdges.has(edgeKey1) && !processedEdges.has(edgeKey2)) {
            edges.push({
              id: edgeKey1,
              source: personId,
              target: partnerId,
              type: 'smoothstep',
              style: { stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '5,5' }, // Dashed for partners
              animated: false
            })
            processedEdges.add(edgeKey1)
            processedEdges.add(edgeKey2)
          }
        }
      })
    }
  })

  return { nodes, edges }
}

/**
 * Filter graph to show only specific family
 * @param {Object} graph - Graph object with nodes and edges
 * @param {string} familyId - Family ID to filter by
 * @returns {Object} - Filtered graph
 */
export function filterGraphByFamily(graph, familyId) {
  if (!familyId) {
    return graph
  }

  // Filter nodes by family
  const familyNodes = graph.nodes.filter(node => {
    return node.data.familyId === familyId
  })

  const familyNodeIds = new Set(familyNodes.map(n => n.id))

  // Filter edges to only include connections between family nodes
  // Also include edges that connect to partners (even if partner is in different family)
  const familyEdges = graph.edges.filter(edge => {
    const sourceInFamily = familyNodeIds.has(edge.source)
    const targetInFamily = familyNodeIds.has(edge.target)
    
    // Include if both nodes are in family
    if (sourceInFamily && targetInFamily) {
      return true
    }
    
    // Include partner edges even if partner is in different family
    if (sourceInFamily || targetInFamily) {
      // Check if this is a partner relationship (dashed edge)
      if (edge.style && edge.style.strokeDasharray) {
        return true
      }
    }
    
    return false
  })

  return {
    nodes: familyNodes,
    edges: familyEdges
  }
}
