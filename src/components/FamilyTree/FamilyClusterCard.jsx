import { Handle, Position } from 'reactflow'
import styled from 'styled-components'
import { Users, ChevronRight } from 'lucide-react'

const ClusterCard = styled.div`
  width: 200px;
  min-height: 250px;
  background: ${props => props.$color || props.theme.colors.cardBackground};
  border: 3px solid ${props => props.$borderColor || props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.theme.shadows.md};
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.theme.shadows.lg};
    border-color: ${props => props.$borderColor || props.theme.colors.primary};
  }
`

const ClusterIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${props => props.theme.colors.background};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  border: 2px solid ${props => props.$borderColor || props.theme.colors.border};
`

const ClusterTitle = styled.h3`
  font-size: ${props => props.theme.typography.sizes.lg};
  font-weight: ${props => props.theme.typography.weights.bold};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 0.5rem;
  line-height: 1.2;
`

const ClusterSubtitle = styled.p`
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 0.75rem;
  font-style: italic;
`

const ClusterStats = styled.div`
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 1rem;
`

const ExpandButton = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.text.primary};
  transition: all 0.2s ease;

  ${ClusterCard}:hover & {
    background: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.background};
    border-color: ${props => props.theme.colors.primary};
  }
`

/**
 * FamilyClusterCard - Represents a collapsed family in the tree
 * 
 * @param {Object} props
 * @param {string} props.id - Family cluster node ID
 * @param {Object} props.data - Node data
 * @param {string} props.data.familyId - Family ID
 * @param {string} props.data.familyName - Display name of the family
 * @param {string} props.data.color - Family color
 * @param {number} props.data.memberCount - Number of members in this family
 * @param {Array<Object>} props.data.bridgePeople - Array of {id, name} objects for people who connect this family to open families
 * @param {Function} props.data.onExpand - Callback when card is clicked to expand
 */
export default function FamilyClusterCard({ id, data, selected }) {
  const {
    familyId,
    familyName,
    color,
    memberCount,
    bridgePeople = [],
    onExpand
  } = data

  const handleClick = () => {
    if (onExpand) {
      onExpand(familyId)
    }
  }

  const borderColor = color?.border || color?.primary || '#cbd5e1'
  const primaryColor = color?.primary || '#94a3b8'

  // Format bridge connection text
  let bridgeText = null
  if (bridgePeople.length > 0) {
    if (bridgePeople.length === 1) {
      bridgeText = `Connected via ${bridgePeople[0].name}`
    } else {
      bridgeText = `Connected via ${bridgePeople.length} members`
    }
  }

  return (
    <>
      {/* Top handle for incoming edges */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: '#94a3b8',
          width: '12px',
          height: '12px'
        }}
      />

      <ClusterCard
        $color={primaryColor + '20'} // 20 = ~12% opacity
        $borderColor={borderColor}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`Expand ${familyName} family`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        <ClusterIcon $borderColor={borderColor}>
          <Users size={32} color={primaryColor} />
        </ClusterIcon>

        <ClusterTitle>{familyName}</ClusterTitle>

        {bridgeText && (
          <ClusterSubtitle>{bridgeText}</ClusterSubtitle>
        )}

        <ClusterStats>
          {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
        </ClusterStats>

        <ExpandButton>
          <ChevronRight size={16} />
          <span>Click to Open</span>
        </ExpandButton>
      </ClusterCard>

      {/* Bottom handle for outgoing edges */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ 
          background: '#94a3b8',
          width: '12px',
          height: '12px'
        }}
      />
    </>
  )
}
