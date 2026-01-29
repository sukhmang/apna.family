import { Handle, Position } from 'reactflow'
import styled from 'styled-components'
import { Compass } from 'lucide-react'

const PortalCard = styled.div`
  width: 180px;
  min-height: 180px;
  background: ${props => props.$color || props.theme.colors.cardBackground};
  border: 2px dashed ${props => props.$borderColor || props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.theme.shadows.sm};

  &:hover {
    transform: translateY(-3px);
    box-shadow: ${props => props.theme.shadows.md};
    border-color: ${props => props.$borderColor || props.theme.colors.primary};
  }
`

const PortalIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.theme.colors.background};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
  border: 2px solid ${props => props.$borderColor || props.theme.colors.border};
`

const PortalTitle = styled.h3`
  font-size: ${props => props.theme.typography.sizes.base};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 0.5rem;
`

const PortalSubtitle = styled.p`
  font-size: ${props => props.theme.typography.sizes.xs};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 0.75rem;
`

const PortalAction = styled.div`
  font-size: ${props => props.theme.typography.sizes.xs};
  color: ${props => props.theme.colors.text.primary};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: 0.35rem 0.75rem;
  background: ${props => props.theme.colors.background};
`

export default function WorldPortalCard({ data }) {
  const {
    worldId,
    worldName,
    color,
    viaPeople = [],
    onNavigate,
    focusPersonId
  } = data || {}

  const borderColor = color?.border || color?.primary || '#cbd5e1'
  const primaryColor = color?.primary || '#94a3b8'

  const viaText = viaPeople.length > 0
    ? `Via ${viaPeople[0].name}${viaPeople.length > 1 ? ` +${viaPeople.length - 1}` : ''}`
    : null

  const handleClick = () => {
    if (onNavigate) {
      onNavigate(worldId, focusPersonId || null)
    }
  }

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#94a3b8', width: '10px', height: '10px' }}
      />
      <PortalCard
        $color={primaryColor + '10'}
        $borderColor={borderColor}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`Travel to ${worldName} world`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        <PortalIcon $borderColor={borderColor}>
          <Compass size={24} color={primaryColor} />
        </PortalIcon>
        <PortalTitle>{worldName} World</PortalTitle>
        {viaText && <PortalSubtitle>{viaText}</PortalSubtitle>}
        <PortalAction>Travel</PortalAction>
      </PortalCard>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#94a3b8', width: '10px', height: '10px' }}
      />
    </>
  )
}
