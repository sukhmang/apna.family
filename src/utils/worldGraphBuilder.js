import { parseTreeId } from './treeUtils'

function normalizeFamilyLabel(label) {
  if (!label) return null
  return label.replace(/^The\s+/i, '').trim()
}

function buildMembershipMaps(memberships, people) {
  const primaryWorldByPerson = new Map()
  const membershipByPerson = new Map()

  memberships.forEach(row => {
    if (!membershipByPerson.has(row.person_id)) {
      membershipByPerson.set(row.person_id, [])
    }
    membershipByPerson.get(row.person_id).push(row)
    if (row.is_primary && !primaryWorldByPerson.has(row.person_id)) {
      primaryWorldByPerson.set(row.person_id, row.world_id)
    }
  })

  // Fallback to family_id if no primary membership
  people.forEach(person => {
    if (!primaryWorldByPerson.has(person.id) && person.family_id) {
      primaryWorldByPerson.set(person.id, person.family_id)
    }
  })

  return { primaryWorldByPerson, membershipByPerson }
}

function collectWorldMembers(people, membershipByPerson, primaryWorldByPerson, worldId) {
  return people.filter(person => {
    const memberships = membershipByPerson.get(person.id) || []
    const hasVisibleMembership = memberships.some(m => m.world_id === worldId && m.visible_in_world)
    if (hasVisibleMembership) {
      return true
    }
    return primaryWorldByPerson.get(person.id) === worldId
  })
}

function addToSet(set, id) {
  if (id) {
    set.add(id)
  }
}

/**
 * Build a world-centric graph for React Flow.
 */
export function buildWorldGraph({
  people,
  memberships,
  familiesMetadata,
  worldId,
  focusPersonId,
  getFamilyColorSync,
  onNavigateWorld
}) {
  const PERSON_WIDTH = 200
  const PERSON_HEIGHT = 220
  const PORTAL_WIDTH = 170
  const PORTAL_HEIGHT = 170
  const personMap = new Map()
  people.forEach(person => personMap.set(person.id, person))

  const { primaryWorldByPerson, membershipByPerson } = buildMembershipMaps(memberships, people)
  const worldMembers = collectWorldMembers(people, membershipByPerson, primaryWorldByPerson, worldId)
  const worldMemberIds = new Set(worldMembers.map(person => person.id))
  const familyMeta = familiesMetadata?.[worldId] || {}

  const principalId = familyMeta.head || worldMembers[0]?.id || null
  if (!principalId) {
    return {
      nodes: [],
      edges: [],
      generationMap: new Map(),
      focusPersonId: null,
      worldMembers
    }
  }

  const includedIds = new Set()
  const generationMap = new Map()
  const guestIds = new Set()

  const addPerson = (personId, generation, isGuest = false) => {
    if (!personId) return
    if (!worldMemberIds.has(personId) && !isGuest) return
    includedIds.add(personId)
    if (!generationMap.has(personId)) {
      generationMap.set(personId, generation)
    }
    if (isGuest) {
      guestIds.add(personId)
    }
  }

  const addPersonOrGuest = (personId, generation) => {
    if (!personId) return
    if (worldMemberIds.has(personId)) {
      addPerson(personId, generation, false)
    } else if (personMap.has(personId)) {
      addPerson(personId, generation, true)
    }
  }

  const principal = personMap.get(principalId)
  if (!principal) {
    return {
      nodes: [],
      edges: [],
      generationMap: new Map(),
      focusPersonId: null,
      worldMembers
    }
  }

  // Principal + spouse(s)
  addPersonOrGuest(principal.id, 0)
  ;(principal.partners || []).forEach(partnerId => addPersonOrGuest(partnerId, 0))

  // Children of principal + their spouses
  ;(principal.children || []).forEach(childId => {
    addPersonOrGuest(childId, 1)
    const child = personMap.get(childId)
    if (child) {
      ;(child.partners || []).forEach(partnerId => addPersonOrGuest(partnerId, 1))
    }
  })

  // Guests: include focus person if provided and related to included nodes
  if (focusPersonId && !includedIds.has(focusPersonId)) {
    const focusPerson = personMap.get(focusPersonId)
    if (focusPerson) {
      let guestGeneration = null
      const relationships = [
        ...(focusPerson.parents || []).map(id => ({ id, role: 'parent' })),
        ...(focusPerson.children || []).map(id => ({ id, role: 'child' })),
        ...(focusPerson.partners || []).map(id => ({ id, role: 'partner' }))
      ]

      relationships.forEach(rel => {
        if (includedIds.has(rel.id)) {
          if (rel.role === 'parent') guestGeneration = 1
          if (rel.role === 'child') guestGeneration = -1
          if (rel.role === 'partner') guestGeneration = 0
        }
      })

      if (guestGeneration !== null) {
        addPerson(focusPerson.id, guestGeneration, true)
      }
    }
  }

  // Build nodes for included people
  const nodes = []
  const edges = []
  const processedEdges = new Set()
  const roleById = new Map()

  const principalPartners = (principal.partners || []).filter(id => includedIds.has(id))
  const childIds = (principal.children || []).filter(id => includedIds.has(id))
  const childPartners = childIds.flatMap(childId => {
    const child = personMap.get(childId)
    return child ? (child.partners || []).filter(id => includedIds.has(id)) : []
  })

  roleById.set(principal.id, 'principal')
  principalPartners.forEach(id => roleById.set(id, 'principal_spouse'))
  childIds.forEach(id => roleById.set(id, 'child'))
  childPartners.forEach(id => roleById.set(id, 'child_spouse'))
  guestIds.forEach(id => roleById.set(id, 'guest'))

  includedIds.forEach(personId => {
    const person = personMap.get(personId)
    if (!person) return

    const { personId: urlPersonId } = parseTreeId(person.id)
    const fullName = `${person.first_name} ${person.last_name}`.trim()
    const familyColor = getFamilyColorSync(primaryWorldByPerson.get(person.id))

    nodes.push({
      id: person.id,
      type: 'personNode',
      position: { x: 0, y: 0 },
      width: PERSON_WIDTH,
      height: PERSON_HEIGHT,
      data: {
        personId: urlPersonId,
        familyId: primaryWorldByPerson.get(person.id),
        treeId: person.id,
        name: fullName,
        firstName: person.first_name,
        lastName: person.last_name,
        maidenName: person.maiden_name || null,
        gender: person.gender || 'Unknown',
        dob: person.dob,
        dod: person.dod,
        isDeceased: person.is_deceased === true,
        currentLocation: person.current_location || null,
        portraitImage: '/portrait.png',
        hasFullProfile: person.has_full_profile === true,
        isPet: person.type === 'pet',
        isGuest: guestIds.has(person.id),
        role: roleById.get(person.id) || 'member',
        familyColor: familyColor,
        personData: person,
        sprite: person.sprite || null
      }
    })
  })

  // Person-to-person edges inside the world
  includedIds.forEach(personId => {
    const person = personMap.get(personId)
    if (!person) return

    ;(person.parents || []).forEach(parentId => {
      if (!includedIds.has(parentId)) return
      const edgeKey = `${parentId}-${personId}`
      if (processedEdges.has(edgeKey)) return
      processedEdges.add(edgeKey)
      edges.push({
        id: edgeKey,
        source: parentId,
        target: personId,
        type: 'step',
        style: { stroke: '#64748b', strokeWidth: 2 }
      })
    })

    ;(person.partners || []).forEach(partnerId => {
      if (!includedIds.has(partnerId)) return
      const edgeKey = [personId, partnerId].sort().join('--')
      if (processedEdges.has(edgeKey)) return
      processedEdges.add(edgeKey)
      edges.push({
        id: edgeKey,
        source: personId,
        target: partnerId,
        type: 'straight',
        style: { stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '5,5' }
      })
    })
  })

  // Build portal nodes for cross-world connections
  const portalMap = new Map()

  const relationPriority = {
    down: 4,
    partner: 3,
    child: 2,
    parent: 1
  }

  const maybeAddPortal = (fromPerson, relatedId, relationType) => {
    const related = personMap.get(relatedId)
    if (!related) return
    const relatedWorldId = primaryWorldByPerson.get(related.id)
    if (!relatedWorldId || relatedWorldId === worldId) return

    const relatedIncluded = includedIds.has(related.id)
    const anchorId = relatedIncluded ? related.id : fromPerson.id
    const anchorRole = roleById.get(anchorId)
    const adjustedRelationType =
      anchorRole === 'child_spouse' ? 'down' : relationType

    if (!portalMap.has(relatedWorldId)) {
      portalMap.set(relatedWorldId, {
        worldId: relatedWorldId,
        viaPeople: [],
        sourcePersonId: anchorId,
        focusPersonId: related.id,
        relationType: adjustedRelationType
      })
    }

    const portal = portalMap.get(relatedWorldId)
    const currentPriority = relationPriority[portal.relationType] || 0
    const nextPriority = relationPriority[adjustedRelationType] || 0
    if (nextPriority > currentPriority) {
      portal.relationType = adjustedRelationType
      portal.sourcePersonId = anchorId
      portal.focusPersonId = related.id
    }
    const viaName = `${fromPerson.first_name} ${fromPerson.last_name}`.trim()
    if (!portal.viaPeople.find(v => v.id === fromPerson.id)) {
      portal.viaPeople.push({ id: fromPerson.id, name: viaName })
    }
  }

  includedIds.forEach(personId => {
    const person = personMap.get(personId)
    if (!person) return

    ;(person.parents || []).forEach(parentId => {
      if (!includedIds.has(parentId)) {
        maybeAddPortal(person, parentId, 'parent')
      }
    })

    ;(person.children || []).forEach(childId => {
      if (!includedIds.has(childId)) {
        maybeAddPortal(person, childId, 'child')
      }
    })

    ;(person.partners || []).forEach(partnerId => {
      if (!includedIds.has(partnerId)) {
        maybeAddPortal(person, partnerId, 'partner')
      }
    })
  })

  portalMap.forEach(portal => {
    const meta = familiesMetadata?.[portal.worldId] || {}
    const familyLabel = normalizeFamilyLabel(meta.label || meta.name || portal.worldId)
    const color = getFamilyColorSync(portal.worldId)

    nodes.push({
      id: `portal_${portal.worldId}`,
      type: 'worldPortal',
      position: { x: 0, y: 0 },
      width: PORTAL_WIDTH,
      height: PORTAL_HEIGHT,
      data: {
        worldId: portal.worldId,
        worldName: familyLabel ? familyLabel : portal.worldId,
        color,
        viaPeople: portal.viaPeople,
        onNavigate: onNavigateWorld,
        focusPersonId: portal.focusPersonId,
        anchorPersonId: portal.sourcePersonId,
        relationType: portal.relationType
      }
    })

    edges.push({
      id: `edge-portal-${portal.worldId}-${portal.sourcePersonId}`,
      source: portal.sourcePersonId,
      target: `portal_${portal.worldId}`,
      type: 'step',
      style: { stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '3,6' }
    })

    const portalGeneration = generationMap.get(portal.sourcePersonId)
    if (portalGeneration !== undefined) {
      generationMap.set(`portal_${portal.worldId}`, portalGeneration)
    }
  })

  // Manual pyramid layout
  const positions = new Map()
  const centerX = 0
  const rowGap = 360
  const nodeGap = 320

  const placeRow = (ids, y) => {
    const uniqueIds = Array.from(new Set(ids))
    const count = uniqueIds.length
    if (count === 0) return
    uniqueIds.forEach((id, index) => {
      const offset = (index - (count - 1) / 2) * nodeGap
      positions.set(id, { x: centerX + offset, y })
    })
  }

  const buildCoupleRow = (primaryIds, spouseMap) => {
    const row = []
    primaryIds.forEach(primaryId => {
      row.push(primaryId)
      const spouses = spouseMap.get(primaryId) || []
      spouses.forEach(spouseId => row.push(spouseId))
    })
    return row
  }

  const childSpouseMap = new Map()
  childIds.forEach(childId => {
    const child = personMap.get(childId)
    const spouses = child ? (child.partners || []).filter(id => includedIds.has(id)) : []
    childSpouseMap.set(childId, spouses)
  })

  const middleRow = [principal.id, ...principalPartners]
  const childRow = buildCoupleRow(childIds, childSpouseMap)

  placeRow(middleRow, 0)
  placeRow(childRow, rowGap)

  // Place guests in their generation row, after main nodes
  guestIds.forEach(guestId => {
    if (positions.has(guestId)) return
    const generation = generationMap.get(guestId) ?? 0
    const baseRow = generation === 1 ? childRow : middleRow
    const y = generation === 1 ? rowGap : 0
    const x = centerX + (baseRow.length / 2 + 1) * nodeGap
    positions.set(guestId, { x, y })
  })

  // Apply positions to nodes
  nodes.forEach(node => {
    const pos = positions.get(node.id)
    if (pos) {
      node.position = pos
    }
  })

  // Position portals near their anchor person
  nodes.forEach(node => {
    if (node.type !== 'worldPortal') return
    const anchorId = node.data?.anchorPersonId
    if (!anchorId) return
    const anchorPos = positions.get(anchorId)
    if (!anchorPos) return
    const relationType = node.data?.relationType
    const verticalOffset = relationType === 'parent'
      ? -rowGap * 0.6
      : rowGap * 0.6
    node.position = {
      x: anchorPos.x + nodeGap * 0.45,
      y: anchorPos.y + verticalOffset
    }
    positions.set(node.id, node.position)
  })

  // Fallback: place any remaining nodes below to avoid stacking
  let fallbackIndex = 0
  nodes.forEach(node => {
    if (positions.has(node.id)) return
    node.position = {
      x: centerX + fallbackIndex * nodeGap,
      y: rowGap * 2
    }
    fallbackIndex += 1
  })

  // Normalize positions to positive space
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  nodes.forEach(node => {
    const width = node.width || 200
    const height = node.height || 220
    minX = Math.min(minX, node.position.x)
    minY = Math.min(minY, node.position.y)
    maxX = Math.max(maxX, node.position.x + width)
    maxY = Math.max(maxY, node.position.y + height)
  })

  const padding = 160
  const shiftX = padding - minX
  const shiftY = padding - minY
  nodes.forEach(node => {
    node.position = {
      x: node.position.x + shiftX,
      y: node.position.y + shiftY
    }
  })

  const bounds = {
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
    centerX: (maxX + minX) / 2 + shiftX,
    centerY: (maxY + minY) / 2 + shiftY
  }

  return {
    nodes,
    edges,
    generationMap,
    focusPersonId: principalId,
    worldMembers,
    bounds
  }
}
