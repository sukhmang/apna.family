import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import styled from 'styled-components'
import { MapPin, PawPrint } from 'lucide-react'
import { ErrorBoundary } from '../ErrorBoundary'

const NodeContainer = styled.div`
  width: 200px;
  min-height: 250px;
  background-color: ${props => props.theme.colors.cardBackground};
  border: 2px solid ${props => {
    if (props.$isSelected) {
      return props.$familyColor?.primary || props.theme.colors.accent
    }
    return props.$familyColor?.border || props.theme.colors.border
  }};
  border-radius: ${props => props.$isPet 
    ? props.theme.borderRadius.full 
    : props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.md};
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.theme.shadows.lg};
    border-color: ${props => props.$familyColor?.primary || props.theme.colors.accent};
  }

  @media (max-width: 768px) {
    width: 160px;
    min-height: 200px;
  }

  @media (max-width: 480px) {
    width: 140px;
    min-height: 180px;
  }
`

const ImageWrapper = styled.div`
  width: 100%;
  height: 150px;
  background-color: ${props => props.theme.colors.background};
  position: relative;
  overflow: hidden;
`

const PersonImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`

const ImageOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  padding: 0.5rem;
`

const Content = styled.div`
  padding: 0.75rem;
  text-align: center;
`

const Name = styled.div`
  font-size: ${props => props.theme.typography.sizes.base};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 0.25rem;
  line-height: 1.2;
  word-wrap: break-word;
  display: ${props => props.$hideText ? 'none' : 'block'};
`

const Dates = styled.div`
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 0.5rem;
  display: ${props => props.$hideText ? 'none' : 'block'};
`


const Badge = styled.div`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: ${props => props.theme.typography.sizes.xs};
  font-weight: ${props => props.theme.typography.weights.semibold};
  background-color: ${props => props.$isDeceased 
    ? props.theme.colors.error || '#ef4444'
    : props.theme.colors.accent}15;
  color: ${props => props.$isDeceased 
    ? props.theme.colors.error || '#ef4444'
    : props.theme.colors.accent};
  border-radius: ${props => props.theme.borderRadius.sm};
  border: 1px solid ${props => props.$isDeceased 
    ? props.theme.colors.error || '#ef4444'
    : props.theme.colors.accent}40;
`

const RelationshipBadge = styled.div`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: ${props => props.theme.typography.sizes.xs};
  font-weight: ${props => props.theme.typography.weights.semibold};
  background-color: ${props => props.theme.colors.accent}20;
  color: ${props => props.theme.colors.accent};
  border-radius: ${props => props.theme.borderRadius.sm};
  border: 1px solid ${props => props.theme.colors.accent}50;
  margin-top: 0.25rem;
`

const DefaultImage = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, ${props => {
    // Different colors for pets vs people
    if (props.$isPet) {
      return '#f59e0b15 0%, #f59e0b30 100%' // Amber gradient for pets
    }
    // Gender-based colors with fallback
    if (props.$gender === 'M') {
      return `${props.theme.colors.accent}15 0%, ${props.theme.colors.accent}30 100%`
    }
    if (props.$gender === 'F') {
      return '#ec489915 0%, #ec489930 100%' // Pink gradient for females
    }
    // Unknown/other gender - purple/grey
    return '#8b5cf615 0%, #8b5cf630 100%'
  }});
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.sizes['2xl']};
  font-weight: ${props => props.theme.typography.weights.bold};
`

const LocationIcon = styled(MapPin)`
  width: 14px;
  height: 14px;
  color: ${props => props.theme.colors.text.secondary};
  margin-right: 0.25rem;
  flex-shrink: 0;
`

const LocationText = styled.span`
  font-size: ${props => props.theme.typography.sizes.xs};
  color: ${props => props.theme.colors.text.secondary};
  display: flex;
  align-items: center;
  margin-top: 0.25rem;
`

const PetIcon = styled(PawPrint)`
  width: 48px;
  height: 48px;
  color: ${props => props.theme.colors.text.secondary};
  opacity: 0.6;
`

/**
 * PersonNode - Custom React Flow node component
 * Displays person information in a card format with image, name, and dates
 */
function PersonNode({ data, selected }) {
  const { 
    name, 
    firstName, 
    lastName, 
    maidenName,
    dob, 
    dod, 
    isDeceased, 
    portraitImage,
    familyId,
    personId,
    treeId,
    relationshipLabel,
    familyColor,
    currentLocation,
    isPet,
    gender,
    zoomLevel = 1
  } = data || {}

  // Hide text when zoomed out too far (below 0.3 zoom)
  const hideText = zoomLevel < 0.3

  // Format dates for display
  const formatDate = (dateString) => {
    if (!dateString) return null
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    } catch {
      return dateString
    }
  }

  const birthDate = formatDate(dob)
  const deathDate = formatDate(dod)

  // Calculate age if we have dates
  const getAge = () => {
    if (!dob) return null
    try {
      const birth = new Date(dob)
      const end = dod ? new Date(dod) : new Date()
      const age = end.getFullYear() - birth.getFullYear()
      const monthDiff = end.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
        return age - 1
      }
      return age
    } catch {
      return null
    }
  }

  const age = getAge()
  const ageText = age !== null ? ` (${age})` : ''

  // Handle node click - navigate to person's profile
  const handleClick = () => {
    if (!familyId || !personId) return

    // Get current hostname to build subdomain URL
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
    const port = typeof window !== 'undefined' ? window.location.port : ''
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:'
    
    // Extract base domain
    const baseDomain = currentHost.includes('.') 
      ? currentHost.split('.').slice(-2).join('.') 
      : currentHost
    
    // Build URL: {familyId}.{baseDomain}/{personId}
    const profileUrl = `${protocol}//${familyId}.${baseDomain}${port ? `:${port}` : ''}/${personId}`
    
    // Navigate to profile
    window.location.href = profileUrl
  }

  // Get initials for default image (or paw icon for pets)
  const getInitials = () => {
    if (isPet) {
      return null // Will show paw icon instead
    }
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    }
    if (firstName) {
      return firstName[0].toUpperCase()
    }
    if (name) {
      const parts = name.split(' ')
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      }
      return name[0].toUpperCase()
    }
    return '?'
  }

  // Format name with maiden name
  const getDisplayName = () => {
    if (!name) return 'Unknown'
    if (maidenName && !isPet) {
      return `${name} (${maidenName})`
    }
    return name
  }

  // Provide default familyColor if missing
  const safeFamilyColor = familyColor || null

  return (
    <ErrorBoundary>
      <NodeContainer 
        $isSelected={selected}
        $familyColor={safeFamilyColor}
        $isPet={isPet}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`View ${getDisplayName()}'s profile${isPet ? ' (Pet)' : ''}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
      >
      {/* Top handle for incoming edges (from parents) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: '#94a3b8',
          width: '12px',
          height: '12px'
        }}
      />

      <ImageWrapper>
        {portraitImage && portraitImage !== '/portrait.png' ? (
          <PersonImage 
            src={portraitImage} 
            alt={name}
            onError={(e) => {
              // Fallback to default if image fails to load
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <DefaultImage 
          style={{ display: portraitImage && portraitImage !== '/portrait.png' ? 'none' : 'flex' }}
          $isPet={isPet}
          $gender={gender}
        >
          {isPet ? (
            <PetIcon />
          ) : (
            getInitials()
          )}
        </DefaultImage>
        {isDeceased && (
          <ImageOverlay>
            <Badge $isDeceased={true}>Deceased</Badge>
          </ImageOverlay>
        )}
      </ImageWrapper>

      <Content>
        <Name $hideText={hideText}>{getDisplayName()}</Name>
        <Dates $hideText={hideText}>
          {birthDate && deathDate ? (
            <>
              {birthDate} - {deathDate}
              {ageText}
            </>
          ) : birthDate ? (
            <>
              {birthDate}{ageText}
            </>
          ) : dob ? (
            <>
              {new Date(dob).getFullYear()}{ageText}
            </>
          ) : null}
        </Dates>
        {currentLocation && !hideText && (
          <LocationText>
            <LocationIcon />
            {currentLocation}
          </LocationText>
        )}
        {relationshipLabel && !hideText && (
          <RelationshipBadge>{relationshipLabel}</RelationshipBadge>
        )}
      </Content>

      {/* Bottom handle for outgoing edges (to children) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ 
          background: '#94a3b8',
          width: '12px',
          height: '12px'
        }}
      />
    </NodeContainer>
    </ErrorBoundary>
  )
}

// Memoize to prevent unnecessary re-renders
export default memo(PersonNode)
