/**
 * Family Cluster Utilities
 * 
 * Utilities for managing family clusters in the tree visualization
 * Handles bridge/connector identification and family grouping
 */

import { parseTreeId, getFamilyIdFromPerson } from './treeUtils'

/**
 * Find bridge people from OPEN families that connect to a collapsed family.
 * A bridge person is someone who:
 * 1. Belongs to an OPEN family
 * 2. Has a partner/parent/child relationship with someone in the collapsed family
 *
 * @param {Array} allPeople - All people in the tree
 * @param {Set<string>} openFamilyIds - Set of open family IDs
 * @param {string} collapsedFamilyId - The collapsed family we're checking
 * @returns {Array<Object>} - Array of {id, name} objects for bridge people
 */
export function findBridgePeople(allPeople, openFamilyIds, collapsedFamilyId) {
  if (!openFamilyIds || openFamilyIds.size === 0) {
    return []
  }

  const personMap = new Map()
  allPeople.forEach(person => {
    personMap.set(person.id, person)
  })

  // Build a set of person IDs in the collapsed family for quick lookup
  const collapsedIds = new Set(
    allPeople
      .filter(person => getFamilyIdFromPerson(person) === collapsedFamilyId)
      .map(person => person.id)
  )

  const bridgePeople = new Map()

  allPeople.forEach(person => {
    const personFamilyId = getFamilyIdFromPerson(person)
    if (!personFamilyId || !openFamilyIds.has(personFamilyId)) {
      return
    }

    const relatedIds = [
      ...(person.partners || []),
      ...(person.parents || []),
      ...(person.children || [])
    ]

    const connectsToCollapsed = relatedIds.some(relatedId => collapsedIds.has(relatedId))
    if (connectsToCollapsed) {
      const fullName = `${person.firstName} ${person.lastName}`.trim()
      bridgePeople.set(person.id, fullName)
    }
  })

  return Array.from(bridgePeople.entries()).map(([id, name]) => ({ id, name }))
}

function addFamilyEdge(familyEdges, fromPerson, toPerson, relationshipType) {
  const fromFamily = getFamilyIdFromPerson(fromPerson)
  const toFamily = getFamilyIdFromPerson(toPerson)
  if (!fromFamily || !toFamily || fromFamily === toFamily) {
    return
  }

  const key = [fromFamily, toFamily].sort().join('--')
  if (!familyEdges.has(key)) {
    familyEdges.set(key, {
      familyA: fromFamily,
      familyB: toFamily,
      relationshipType,
      via: {
        fromPersonId: fromPerson.id,
        toPersonId: toPerson.id
      }
    })
  }
}

function buildFamilyEdges(allPeople) {
  const personMap = new Map()
  allPeople.forEach(person => {
    personMap.set(person.id, person)
  })

  const familyEdges = new Map()

  allPeople.forEach(person => {
    if (person.partners && Array.isArray(person.partners)) {
      person.partners.forEach(partnerId => {
        const partner = personMap.get(partnerId)
        if (partner) {
          addFamilyEdge(familyEdges, person, partner, 'partner')
        }
      })
    }

    if (person.parents && Array.isArray(person.parents)) {
      person.parents.forEach(parentId => {
        const parent = personMap.get(parentId)
        if (parent) {
          addFamilyEdge(familyEdges, parent, person, 'parentChild')
        }
      })
    }

    if (person.children && Array.isArray(person.children)) {
      person.children.forEach(childId => {
        const child = personMap.get(childId)
        if (child) {
          addFamilyEdge(familyEdges, person, child, 'parentChild')
        }
      })
    }
  })

  return familyEdges
}

/**
 * Get family metadata (name, member count, etc.)
 * @param {Array} allPeople - All people in the tree
 * @param {string} familyId - Family ID
 * @param {Object} familiesMetadata - Optional families metadata from tree.json
 * @returns {Object} - Family metadata
 */
export function getFamilyMetadata(allPeople, familyId, familiesMetadata = null) {
  // Handle null familyId
  if (!familyId) {
    return {
      id: null,
      name: 'Unknown Family',
      memberCount: 0,
      head: null,
      color: null
    }
  }

  // Get family info from metadata if available
  const familyMeta = familiesMetadata?.[familyId] || {}
  
  // Count members
  const members = allPeople.filter(person => {
    const personFamilyId = getFamilyIdFromPerson(person)
    return personFamilyId && personFamilyId === familyId
  })

  // Safely format family name
  let familyName = familyMeta.label || familyMeta.name
  if (familyName) {
    familyName = familyName.replace(/^The\s+/i, '').trim()
  }
  if (!familyName && familyId && familyId.length > 0) {
    familyName = `${familyId.charAt(0).toUpperCase() + familyId.slice(1)}`
  } else if (!familyName) {
    familyName = 'Unknown Family'
  }

  return {
    id: familyId,
    name: familyName,
    memberCount: members.length,
    head: familyMeta.head || null,
    color: familyMeta.color || null
  }
}

/**
 * Build cluster graph - converts people into nodes and edges, with collapsed families as cluster cards
 * @param {Array} allPeople - All people
 * @param {Set<string>} openFamilyIds - Set of open family IDs
 * @param {Object} familiesMetadata - Families metadata from tree.json
 * @param {Function} getFamilyColorSync - Function to get family color
 * @param {Function} onExpandFamily - Callback when family cluster is clicked
 * @returns {Object} - { nodes: Array, edges: Array }
 */
export function buildClusterGraph(
  allPeople,
  openFamilyIds,
  familiesMetadata = null,
  getFamilyColorSync,
  onExpandFamily
) {
  const nodes = []
  const edges = []
  const personMap = new Map()
  
  // Create person map
  allPeople.forEach(person => {
    personMap.set(person.id, person)
  })

  // Group people by family
  const peopleByFamily = new Map()
  allPeople.forEach(person => {
    const familyId = getFamilyIdFromPerson(person)
    if (familyId) { // Only process if familyId is valid
      if (!peopleByFamily.has(familyId)) {
        peopleByFamily.set(familyId, [])
      }
      peopleByFamily.get(familyId).push(person)
    }
  })

  // Process each family
  // If no families are open, we need to handle the initial state
  // For now, if openFamilyIds is empty, we'll show all families as clusters
  peopleByFamily.forEach((familyPeople, familyId) => {
    const isOpen = openFamilyIds.size > 0 && openFamilyIds.has(familyId)
    const familyMeta = getFamilyMetadata(allPeople, familyId, familiesMetadata)
    const familyColor = getFamilyColorSync(familyId)

    if (isOpen) {
      // Add all people in this family as individual nodes
      familyPeople.forEach(person => {
        const { personId } = parseTreeId(person.id)
        const fullName = `${person.firstName} ${person.lastName}`.trim()
        
        // Get portrait image path (simplified - can be enhanced later)
        let portraitImage = '/portrait.png'
        if (person.hasFullProfile && personId) {
          // Portrait would be loaded from person data file, but for now use default
          portraitImage = '/portrait.png'
        }
        
        nodes.push({
          id: person.id,
          type: 'personNode',
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
            isPet: person.type === 'pet',
            familyColor: familyColor,
            personData: person
          }
        })
      })
    } else {
      // Add family as a cluster card
      const bridgePeople = findBridgePeople(allPeople, openFamilyIds, familyId)
      
      nodes.push({
        id: `cluster_${familyId}`,
        type: 'familyCluster',
        position: { x: 0, y: 0 }, // Will be calculated by dagre
        data: {
          familyId: familyId,
          familyName: familyMeta.name,
          color: familyColor,
          memberCount: familyMeta.memberCount,
          bridgePeople: bridgePeople, // Array of {id, name}
          onExpand: onExpandFamily
        }
      })
    }
  })

  const openFamiliesExist = openFamilyIds.size > 0

  if (!openFamiliesExist) {
    const familyEdges = buildFamilyEdges(allPeople)
    familyEdges.forEach(edgeInfo => {
      edges.push({
        id: `edge-cluster-${edgeInfo.familyA}-${edgeInfo.familyB}`,
        source: `cluster_${edgeInfo.familyA}`,
        target: `cluster_${edgeInfo.familyB}`,
        type: 'smoothstep',
        animated: false,
        style: {
          stroke: '#94a3b8',
          strokeWidth: 2,
          strokeDasharray: edgeInfo.relationshipType === 'partner' ? '5,5' : undefined
        }
      })
    })

    return { nodes, edges }
  }

  const processedEdges = new Set()
  const bridgeEdges = new Map()
  const relationPairs = []
  const partnerPairs = new Set()

  allPeople.forEach(person => {
    if (person.parents && Array.isArray(person.parents)) {
      person.parents.forEach(parentId => {
        relationPairs.push({
          type: 'parentChild',
          source: parentId,
          target: person.id
        })
      })
    }

    if (person.partners && Array.isArray(person.partners)) {
      person.partners.forEach(partnerId => {
        const key = [person.id, partnerId].sort().join('--')
        if (partnerPairs.has(key)) return
        partnerPairs.add(key)
        relationPairs.push({
          type: 'partner',
          source: person.id,
          target: partnerId
        })
      })
    }
  })

  const addEdgeOnce = (sourceId, targetId, edgeId, style) => {
    if (processedEdges.has(edgeId)) return
    processedEdges.add(edgeId)
    edges.push({
      id: edgeId,
      source: sourceId,
      target: targetId,
      type: 'smoothstep',
      animated: false,
      style
    })
  }

  relationPairs.forEach(({ type, source, target }) => {
    const sourcePerson = personMap.get(source)
    const targetPerson = personMap.get(target)
    if (!sourcePerson || !targetPerson) return

    const sourceFamilyId = getFamilyIdFromPerson(sourcePerson)
    const targetFamilyId = getFamilyIdFromPerson(targetPerson)
    const sourceIsOpen = openFamilyIds.has(sourceFamilyId)
    const targetIsOpen = openFamilyIds.has(targetFamilyId)

    // Same-family or open-open connections
    if (sourceIsOpen && targetIsOpen) {
      const edgeId = `edge-${type}-${[source, target].sort().join('--')}`
      addEdgeOnce(
        source,
        target,
        edgeId,
        type === 'partner'
          ? { stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '5,5' }
          : { stroke: '#64748b', strokeWidth: 2 }
      )
      return
    }

    // Open family to collapsed family: single bridge edge per family pair
    if (sourceIsOpen && !targetIsOpen && targetFamilyId) {
      const bridgeKey = `${sourceFamilyId}--${targetFamilyId}`
      if (!bridgeEdges.has(bridgeKey)) {
        bridgeEdges.set(bridgeKey, {
          sourceId: source,
          targetId: `cluster_${targetFamilyId}`,
          relationshipType: type
        })
      }
      return
    }

    if (!sourceIsOpen && targetIsOpen && sourceFamilyId) {
      const bridgeKey = `${targetFamilyId}--${sourceFamilyId}`
      if (!bridgeEdges.has(bridgeKey)) {
        bridgeEdges.set(bridgeKey, {
          sourceId: target,
          targetId: `cluster_${sourceFamilyId}`,
          relationshipType: type
        })
      }
    }
  })

  bridgeEdges.forEach((edgeInfo, key) => {
    edges.push({
      id: `edge-bridge-${key}`,
      source: edgeInfo.sourceId,
      target: edgeInfo.targetId,
      type: 'smoothstep',
      animated: false,
      style: edgeInfo.relationshipType === 'partner'
        ? { stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '5,5' }
        : { stroke: '#64748b', strokeWidth: 2 }
    })
  })

  return { nodes, edges }
}
