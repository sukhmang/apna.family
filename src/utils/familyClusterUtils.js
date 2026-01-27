/**
 * Family Cluster Utilities
 * 
 * Utilities for managing family clusters in the tree visualization
 * Handles bridge/connector identification and family grouping
 */

import { parseTreeId, getFamilyIdFromPerson } from './treeUtils'

/**
 * Find bridge people - people who connect one family to another
 * A bridge person is someone who:
 * 1. Belongs to family A (collapsed)
 * 2. Has a partner/parent/child relationship with someone in family B (open)
 * 
 * @param {Array} allPeople - All people in the tree
 * @param {Set<string>} openFamilyIds - Set of open family IDs
 * @param {string} collapsedFamilyId - The collapsed family we're checking
 * @returns {Array<Object>} - Array of {id, name} objects for bridge people
 */
export function findBridgePeople(allPeople, openFamilyIds, collapsedFamilyId) {
  const bridgePeople = []
  const personMap = new Map()
  
  // Create person map for quick lookup
  allPeople.forEach(person => {
    personMap.set(person.id, person)
  })

  // Find all people in the collapsed family
  const collapsedFamilyPeople = allPeople.filter(person => {
    const personFamilyId = getFamilyIdFromPerson(person)
    return personFamilyId && personFamilyId === collapsedFamilyId
  })

  // Check each person in collapsed family for connections to open families
  collapsedFamilyPeople.forEach(person => {
    let isBridge = false

    // Check partners
    if (person.partners && Array.isArray(person.partners)) {
      person.partners.forEach(partnerId => {
        const partner = personMap.get(partnerId)
        if (partner) {
          const partnerFamilyId = getFamilyIdFromPerson(partner)
          if (partnerFamilyId && openFamilyIds.has(partnerFamilyId)) {
            isBridge = true
          }
        }
      })
    }

    // Check parents
    if (person.parents && Array.isArray(person.parents)) {
      person.parents.forEach(parentId => {
        const parent = personMap.get(parentId)
        if (parent) {
          const parentFamilyId = getFamilyIdFromPerson(parent)
          if (parentFamilyId && openFamilyIds.has(parentFamilyId)) {
            isBridge = true
          }
        }
      })
    }

    // Check children
    if (person.children && Array.isArray(person.children)) {
      person.children.forEach(childId => {
        const child = personMap.get(childId)
        if (child) {
          const childFamilyId = getFamilyIdFromPerson(child)
          if (childFamilyId && openFamilyIds.has(childFamilyId)) {
            isBridge = true
          }
        }
      })
    }

    if (isBridge) {
      const fullName = `${person.firstName} ${person.lastName}`.trim()
      bridgePeople.push({
        id: person.id,
        name: fullName
      })
    }
  })

  return bridgePeople
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
  if (!familyName && familyId && familyId.length > 0) {
    familyName = `${familyId.charAt(0).toUpperCase() + familyId.slice(1)} Family`
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
  const processedEdges = new Set()
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

  // Build edges
  allPeople.forEach(person => {
    const personFamilyId = getFamilyIdFromPerson(person)
    const personIsOpen = openFamilyIds.has(personFamilyId)

    // Partner edges
    if (person.partners && Array.isArray(person.partners)) {
      person.partners.forEach(partnerId => {
        const edgeKey = [person.id, partnerId].sort().join('--')
        if (processedEdges.has(edgeKey)) return
        processedEdges.add(edgeKey)

        const partner = personMap.get(partnerId)
        if (!partner) return

        const partnerFamilyId = getFamilyIdFromPerson(partner)
        const partnerIsOpen = openFamilyIds.has(partnerFamilyId)

        // Only add edge if at least one person is in an open family
        // OR if both are in the same collapsed family (edge will connect to cluster)
        if (personIsOpen || partnerIsOpen || personFamilyId === partnerFamilyId) {
          const sourceId = personIsOpen ? person.id : `cluster_${personFamilyId}`
          const targetId = partnerIsOpen ? partnerId : `cluster_${partnerFamilyId}`

          edges.push({
            id: `edge-${person.id}-${partnerId}`,
            source: sourceId,
            target: targetId,
            type: 'smoothstep',
            animated: false,
            style: {
              stroke: '#94a3b8',
              strokeWidth: 2,
              strokeDasharray: '5,5'
            }
          })
        }
      })
    }

    // Parent-child edges
    if (person.children && Array.isArray(person.children)) {
      person.children.forEach(childId => {
        const edgeKey = `${person.id}--${childId}`
        if (processedEdges.has(edgeKey)) return
        processedEdges.add(edgeKey)

        const child = personMap.get(childId)
        if (!child) return

        const childFamilyId = getFamilyIdFromPerson(child)
        const childIsOpen = openFamilyIds.has(childFamilyId)

        // Only add edge if at least one person is in an open family
        if (personIsOpen || childIsOpen || personFamilyId === childFamilyId) {
          const sourceId = personIsOpen ? person.id : `cluster_${personFamilyId}`
          const targetId = childIsOpen ? childId : `cluster_${childFamilyId}`

          edges.push({
            id: `edge-${person.id}-${childId}`,
            source: sourceId,
            target: targetId,
            type: 'smoothstep',
            animated: false,
            style: {
              stroke: '#64748b',
              strokeWidth: 2
            }
          })
        }
      })
    }
  })

  return { nodes, edges }
}
