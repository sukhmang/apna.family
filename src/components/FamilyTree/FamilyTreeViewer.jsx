import { useEffect, useMemo, useState, forwardRef, useImperativeHandle, useRef } from 'react'
import styled from 'styled-components'
import { getMockFamilies, getMockPeople, getMockMemberships } from '../../mock/mockWorldApi'
import { buildWorldGraph } from '../../utils/worldGraphBuilder'
import TreeSkeleton from './TreeSkeleton'

const Container = styled.div`
  width: 100%;
  height: 80vh;
  min-height: 600px;
  background: linear-gradient(#f8fafc, #f1f5f9);
  border-radius: ${props => props.theme.borderRadius.md};
  position: relative;
  overflow: auto;
`

const Canvas = styled.div`
  position: relative;
  min-width: 1200px;
  min-height: 700px;
  padding: 2rem 3rem 4rem;
  background-image: radial-gradient(#cbd5e1 1px, transparent 0);
  background-size: 24px 24px;
`

const EdgeLayer = styled.svg`
  position: absolute;
  inset: 0;
  pointer-events: none;
`

const NodeCard = styled.div`
  position: absolute;
  width: 180px;
  height: 180px;
  background: #ffffff;
  border: 3px solid #94a3b8;
  border-radius: 999px;
  box-shadow: 0 8px 0 rgba(15, 23, 42, 0.08);
  overflow: hidden;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

const NodeHeader = styled.div`
  height: 64px;
  width: 64px;
  border-radius: 999px;
  background: linear-gradient(135deg, #e0e7ff, #fce7f3);
  border: 2px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  image-rendering: pixelated;
`

const NodeBody = styled.div`
  margin-top: 0.5rem;
  padding: 0 0.5rem;
`

const NodeName = styled.div`
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
`

const NodeMeta = styled.div`
  font-size: 0.85rem;
  color: #64748b;
`

const GuestBadge = styled.div`
  display: inline-block;
  margin-top: 0.4rem;
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 999px;
  border: 1px dashed #94a3b8;
  color: #64748b;
`

const PortalCard = styled.div`
  position: absolute;
  width: 70px;
  height: 70px;
  border-radius: 999px;
  border: 2px dashed #94a3b8;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
`

const PortalLabel = styled.div`
  position: absolute;
  top: 74px;
  width: 140px;
  left: -35px;
  text-align: center;
  font-size: 0.7rem;
  color: #64748b;
`

const FamilyTreeViewer = forwardRef(function FamilyTreeViewer({
  initialWorldId = 'grewal_main',
  focusPersonId = 'baljit_grewal'
}, ref) {
  const [loading, setLoading] = useState(true)
  const [graph, setGraph] = useState({ nodes: [], edges: [] })
  const [currentWorldId, setCurrentWorldId] = useState(initialWorldId)
  const [currentFocus, setCurrentFocus] = useState(focusPersonId)
  const containerRef = useRef(null)
  const canvasRef = useRef(null)

  useImperativeHandle(ref, () => ({
    fitView: () => centerOnFamily(),
    setViewport: () => {}
  }))

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [families, people, memberships] = await Promise.all([
        getMockFamilies(),
        getMockPeople(),
        getMockMemberships()
      ])

      const familiesMetadata = families.reduce((acc, family) => {
        acc[family.id] = {
          label: family.display_name,
          head: family.head_id
        }
        return acc
      }, {})

      const nextGraph = buildWorldGraph({
        people,
        memberships,
        familiesMetadata,
        worldId: currentWorldId,
        focusPersonId: currentFocus,
        getFamilyColorSync: () => ({ primary: '#94a3b8' }),
        onNavigateWorld: (nextWorldId, nextFocusId) => {
          setCurrentWorldId(nextWorldId)
          setCurrentFocus(nextFocusId || null)
        }
      })

      setGraph(nextGraph)
      setLoading(false)
    }

    load()
  }, [currentWorldId, currentFocus])

  const centerOnFamily = () => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas || graph.nodes.length === 0) return
    const bounds = graph.bounds
    if (!bounds) return

    canvas.style.width = `${bounds.width}px`
    canvas.style.height = `${bounds.height}px`

    const scrollLeft = Math.max(0, bounds.centerX - container.clientWidth / 2)
    const scrollTop = Math.max(0, bounds.centerY - container.clientHeight / 2)

    container.scrollTo({
      left: scrollLeft,
      top: scrollTop,
      behavior: 'auto'
    })
  }

  useEffect(() => {
    if (!loading) {
      requestAnimationFrame(() => {
        centerOnFamily()
        setTimeout(centerOnFamily, 0)
      })
    }
  }, [loading, graph.nodes.length, currentWorldId])

  const nodesById = useMemo(() => {
    const map = new Map()
    graph.nodes.forEach(node => map.set(node.id, node))
    return map
  }, [graph.nodes])

  if (loading) {
    return <TreeSkeleton />
  }

  return (
    <Container ref={containerRef}>
      <Canvas ref={canvasRef}>
        <EdgeLayer width="100%" height="100%">
          {graph.edges.map(edge => {
            const source = nodesById.get(edge.source)
            const target = nodesById.get(edge.target)
            if (!source || !target) return null

            const sourceX = source.position.x + source.width / 2
            const sourceY = source.position.y + source.height
            const targetX = target.position.x + target.width / 2
            const targetY = target.position.y
            const midY = (sourceY + targetY) / 2
            const path = `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`
            return (
              <path
                key={edge.id}
                d={path}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeDasharray={edge.style?.strokeDasharray || '0'}
              />
            )
          })}
        </EdgeLayer>

        {graph.nodes.map(node => {
          const isPortal = node.type === 'worldPortal'
          const style = {
            left: node.position.x,
            top: node.position.y
          }
          if (isPortal) {
            return (
              <PortalCard key={node.id} style={style}>
                <span>🧭</span>
                <PortalLabel>{node.data?.worldName}</PortalLabel>
              </PortalCard>
            )
          }

          return (
            <NodeCard
              key={node.id}
              style={{
                ...style,
                borderStyle: node.data?.role?.includes('spouse') ? 'dashed' : 'solid'
              }}
            >
              <NodeHeader>{node.data?.sprite || '⭐'}</NodeHeader>
              <NodeBody>
                <NodeName>{node.data?.name}</NodeName>
                <NodeMeta>{node.data?.dob ? new Date(node.data.dob).toLocaleDateString() : ''}</NodeMeta>
                {node.data?.isGuest && <GuestBadge>Guest</GuestBadge>}
              </NodeBody>
            </NodeCard>
          )
        })}
      </Canvas>
    </Container>
  )
})

export default FamilyTreeViewer
