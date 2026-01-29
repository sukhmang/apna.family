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
  const PERSON_WIDTH = 180
  const PERSON_HEIGHT = 180
  const PORTAL_WIDTH = 70
  const PORTAL_HEIGHT = 70
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

      const sourceRole = roleById.get(personId)
      const targetRole = roleById.get(partnerId)
      const isChildSpouseLink =
        (sourceRole === 'child' && targetRole === 'child_spouse') ||
        (sourceRole === 'child_spouse' && targetRole === 'child')

      edges.push({
        id: edgeKey,
        source: personId,
        target: partnerId,
        type: isChildSpouseLink ? 'step' : 'straight',
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
  const rowGap = 320
  const nodeGap = 340
  const spouseGap = 140
  const spouseOffsetX = 120

  const placeRow = (ids, y) => {
    const uniqueIds = Array.from(new Set(ids))
    const count = uniqueIds.length
    if (count === 0) return
    uniqueIds.forEach((id, index) => {
      const offset = (index - (count - 1) / 2) * nodeGap
      positions.set(id, { x: centerX + offset, y })
    })
  }

  const childSpouseMap = new Map()
  childIds.forEach(childId => {
    const child = personMap.get(childId)
    const spouses = child ? (child.partners || []).filter(id => includedIds.has(id)) : []
    childSpouseMap.set(childId, spouses)
  })

  const middleRow = [principal.id, ...principalPartners]
  placeRow(middleRow, 0)

  // Children row
  placeRow(childIds, rowGap)

  // Child spouses: below and to the right of each child
  childIds.forEach(childId => {
    const childPos = positions.get(childId)
    if (!childPos) return
    const spouses = childSpouseMap.get(childId) || []
    spouses.forEach((spouseId, index) => {
      const offset = (index - (spouses.length - 1) / 2) * (nodeGap * 0.25)
      positions.set(spouseId, {
        x: childPos.x + spouseOffsetX + offset,
        y: childPos.y + spouseGap
      })
    })
  })

  // Place guests in their generation row, after main nodes
  guestIds.forEach(guestId => {
    if (positions.has(guestId)) return
    const generation = generationMap.get(guestId) ?? 0
    const y = generation >= 1 ? rowGap : 0
    const baseCount = generation >= 1 ? childIds.length : middleRow.length
    const x = centerX + (baseCount / 2 + 1) * nodeGap
    positions.set(guestId, { x, y })
  })

  // Apply positions to nodes
  nodes.forEach(node => {
    const pos = positions.get(node.id)
    if (pos) {
      node.position = pos
    }
  })

  // Dynamic portal placement to avoid overlap
  const occupied = []
  const addRect = (id, pos, width, height) => {
    occupied.push({
      id,
      x: pos.x,
      y: pos.y,
      width,
      height
    })
  }
  const intersects = (rect) => {
    const buffer = 16
    return occupied.some(existing => {
      return !(
        rect.x + rect.width + buffer < existing.x ||
        rect.x > existing.x + existing.width + buffer ||
        rect.y + rect.height + buffer < existing.y ||
        rect.y > existing.y + existing.height + buffer
      )
    })
  }

  nodes.forEach(node => {
    if (node.type === 'worldPortal') return
    const width = node.width || PERSON_WIDTH
    const height = node.height || PERSON_HEIGHT
    addRect(node.id, node.position, width, height)
  })

  const baseCenterX = middleRow.length > 0
    ? middleRow.reduce((sum, id) => sum + (positions.get(id)?.x || 0), 0) / middleRow.length
    : 0

  nodes.forEach(node => {
    if (node.type !== 'worldPortal') return
    const anchorId = node.data?.anchorPersonId
    if (!anchorId) return
    const anchorPos = positions.get(anchorId)
    if (!anchorPos) return

    const relationType = node.data?.relationType
    const preferRight = anchorPos.x < baseCenterX
    const verticalOffset = relationType === 'parent'
      ? -rowGap * 0.9
      : spouseGap + 120
    const lateral = nodeGap * 0.55

    const candidates = [
      { x: anchorPos.x, y: anchorPos.y + verticalOffset },
      { x: anchorPos.x + (preferRight ? lateral : -lateral), y: anchorPos.y + verticalOffset },
      { x: anchorPos.x + (preferRight ? lateral * 1.6 : -lateral * 1.6), y: anchorPos.y + verticalOffset }
    ]

    let chosen = candidates[0]
    for (const candidate of candidates) {
      const rect = {
        x: candidate.x,
        y: candidate.y,
        width: PORTAL_WIDTH,
        height: PORTAL_HEIGHT
      }
      if (!intersects(rect)) {
        chosen = candidate
        break
      }
    }

    node.position = chosen
    positions.set(node.id, node.position)
    addRect(node.id, node.position, PORTAL_WIDTH, PORTAL_HEIGHT)
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
    const width = node.width || PERSON_WIDTH
    const height = node.height || PERSON_HEIGHT
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

  // Move portals to nearest edge of bounds
  nodes.forEach(node => {
    if (node.type !== 'worldPortal') return
    const anchorId = node.data?.anchorPersonId
    if (!anchorId) return
    const anchorPos = positions.get(anchorId)
    if (!anchorPos) return
    const edges = {
      left: padding * 0.6,
      right: bounds.width - PORTAL_WIDTH - padding * 0.6,
      top: padding * 0.4,
      bottom: bounds.height - PORTAL_HEIGHT - padding * 0.4
    }
    const distTo = {
      left: Math.abs(anchorPos.x - edges.left),
      right: Math.abs(anchorPos.x - edges.right),
      top: Math.abs(anchorPos.y - edges.top),
      bottom: Math.abs(anchorPos.y - edges.bottom)
    }
    const nearest = Object.entries(distTo).sort((a, b) => a[1] - b[1])[0]?.[0] || 'right'
    const clampedX = Math.min(Math.max(anchorPos.x, edges.left), edges.right)
    const clampedY = Math.min(Math.max(anchorPos.y, edges.top), edges.bottom)
    if (nearest === 'left') node.position = { x: edges.left, y: clampedY }
    if (nearest === 'right') node.position = { x: edges.right, y: clampedY }
    if (nearest === 'top') node.position = { x: clampedX, y: edges.top }
    if (nearest === 'bottom') node.position = { x: clampedX, y: edges.bottom }
  })

  return {
    nodes,
    edges,
    generationMap,
    focusPersonId: principalId,
    worldMembers,
    bounds
  }
}
