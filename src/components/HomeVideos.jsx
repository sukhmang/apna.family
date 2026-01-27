import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { MapPin, Calendar, Users, ArrowLeft, Lock, Eye, EyeOff, LayoutGrid, List, GitBranch } from 'lucide-react'
import { HOME_VIDEOS } from '../constants'

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem 2rem;
  min-height: 100vh;
`

const Header = styled.div`
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: ${props => props.theme.colors.background};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  margin: 0 -1rem 1.5rem;
  padding: 0.75rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  width: calc(100% + 2rem);

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    padding: 0.75rem 1rem;
    margin: 0 -1rem 1.5rem;
    flex-wrap: wrap;
  }
`

const Breadcrumbs = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.text.secondary};
`

const BreadcrumbLink = styled.a`
  color: ${props => props.theme.colors.text.primary};
  text-decoration: none;
  font-weight: ${props => props.theme.typography.weights.semibold};
  transition: color 0.2s ease;

  &:hover {
    color: ${props => props.theme.colors.accent};
  }
`

const BreadcrumbSeparator = styled.span`
  color: ${props => props.theme.colors.text.tertiary};
`

const BreadcrumbCurrent = styled.span`
  color: ${props => props.theme.colors.text.secondary};
  font-weight: ${props => props.theme.typography.weights.normal};
`

const LayoutToggle = styled.div`
  display: flex;
  gap: 0.5rem;
  background-color: ${props => props.theme.colors.cardBackground};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: 0.25rem;
  box-shadow: ${props => props.theme.shadows.sm};
  border: 1px solid ${props => props.theme.colors.border};

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    align-self: center;
  }
`

const LayoutButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border: none;
  background-color: ${props => props.$isActive ? props.theme.colors.accent : 'transparent'};
  color: ${props => props.$isActive ? 'white' : props.theme.colors.text.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: ${props => props.theme.typography.sizes.sm};
  font-weight: ${props => props.theme.typography.weights.semibold};

  &:hover {
    background-color: ${props => props.$isActive ? props.theme.colors.accent : props.theme.colors.background};
    color: ${props => props.$isActive ? 'white' : props.theme.colors.text.primary};
  }

  svg {
    width: 1.125rem;
    height: 1.125rem;
    margin-right: 0.5rem;
  }
`


const Title = styled.h1`
  font-size: ${props => props.theme.typography.sizes['4xl']};
  font-weight: ${props => props.theme.typography.weights.bold};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 1rem;
`

const Subtitle = styled.p`
  font-size: ${props => props.theme.typography.sizes.lg};
  color: ${props => props.theme.colors.text.secondary};
`

// Timeline Layout
const TimelineContainer = styled.div`
  position: relative;
  padding: 2rem 0;
  margin-bottom: 3rem;
  scroll-snap-type: y proximity;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    padding-left: 2rem;
    padding-right: 2rem;
  }

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    padding-left: 0;
    padding-right: 0;
  }
`

const TimelineLine = styled.div`
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(
    to bottom,
    ${props => props.theme.colors.accent}40,
    ${props => props.theme.colors.accent}80
  );
  transform: translateX(-50%);
  z-index: 0;

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    left: 1.5rem;
    transform: none;
  }
`

const TimelineItem = styled.div`
  position: relative;
  display: flex;
  align-items: flex-start;
  margin-bottom: 4rem;
  z-index: 1;
  scroll-snap-align: start;
  scroll-snap-stop: always;

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    padding-left: 3.5rem;
    align-items: flex-start;
  }
`

const TimelineNode = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.accent};
  border: 3px solid ${props => props.theme.colors.cardBackground};
  box-shadow: 0 0 0 3px ${props => props.theme.colors.accent}20;
  z-index: 2;
  flex-shrink: 0;
  top: 0.5rem;

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    left: 1.5rem;
    transform: none;
    top: 0.5rem;
  }
`

const TimelineContent = styled.div`
  width: calc(50% - 2rem);
  margin: 0 1rem;

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    width: 100%;
    margin: 0;
    padding-right: 1rem;
  }
`

const TimelineContentLeft = styled(TimelineContent)`
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    margin-right: auto;
    text-align: right;
  }

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    text-align: left;
  }
`

const TimelineContentRight = styled(TimelineContent)`
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    margin-left: auto;
    text-align: left;
  }

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    text-align: left;
  }
`

const YearLabel = styled.div`
  font-size: ${props => props.theme.typography.sizes['2xl']};
  font-weight: ${props => props.theme.typography.weights.bold};
  color: ${props => props.theme.colors.accent};
  margin-bottom: 0.5rem;
  opacity: 0.9;
`

// Grid Layout
const VideosGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`

// List Layout
const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 3rem;
  background-color: ${props => props.theme.colors.cardBackground};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
  overflow: hidden;
`

const ListItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  cursor: pointer;
  transition: background-color 0.15s ease;
  text-decoration: none;
  color: inherit;
  min-height: 56px;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${props => props.theme.colors.background};
  }

  &:active {
    background-color: ${props => props.theme.colors.border}40;
  }
`

const ListThumbnail = styled.div`
  flex-shrink: 0;
  width: 100px;
  height: 56px;
  position: relative;
  background-color: #000;
  border-radius: ${props => props.theme.borderRadius.sm};
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
    pointer-events: none;
    opacity: 0;
  }
`

const ListContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-width: 0;
`

const ListInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
`

const ListTitle = styled.h3`
  font-size: ${props => props.theme.typography.sizes.sm};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.text.primary};
  margin: 0;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const ListMetadata = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: ${props => props.theme.typography.sizes.xs};
  color: ${props => props.theme.colors.text.secondary};
  margin-top: 0.125rem;
  flex-wrap: wrap;
`

const CollectionCard = styled.div`
  background-color: ${props => props.theme.colors.cardBackground};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.lg};
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  grid-column: 1 / -1; /* Span full width in grid */

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.theme.shadows.lg};
  }
`

const CollectionVideosGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 1.5rem;

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`

const CollectionVideoWrapper = styled.div`
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  background-color: #000;
  overflow: hidden;
  border-radius: ${props => props.theme.borderRadius.sm};

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
`

const VideoCard = styled.div`
  background-color: ${props => props.theme.colors.cardBackground};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.lg};
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.theme.shadows.lg};
  }
`

const VideoWrapper = styled.div`
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  background-color: #000;
  overflow: hidden;

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
`

const CardContent = styled.div`
  padding: 1.5rem;
`

const CardTitle = styled.h3`
  font-size: ${props => props.theme.typography.sizes.xl};
  font-weight: ${props => props.theme.typography.weights.bold};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 0.75rem;
  line-height: 1.3;
`

const CardDescription = styled.p`
  font-size: ${props => props.theme.typography.sizes.base};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 1rem;
  line-height: 1.6;
`

const MetadataContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid ${props => props.theme.colors.border};
`

const MetadataItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.text.tertiary};

  svg {
    width: 1.125rem;
    height: 1.125rem;
    flex-shrink: 0;
    margin-top: 0.125rem;
    color: ${props => props.theme.colors.text.secondary};
  }
`

const MetadataLabel = styled.span`
  font-weight: ${props => props.theme.typography.weights.semibold};
  margin-right: 0.25rem;
`

const AppearancesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
`

const AppearanceTag = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.sizes.xs};
  color: ${props => props.theme.colors.text.tertiary};
`

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${props => props.theme.colors.text.secondary};
`

const EmptyStateTitle = styled.h2`
  font-size: ${props => props.theme.typography.sizes['2xl']};
  font-weight: ${props => props.theme.typography.weights.bold};
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.text.primary};
`

const EmptyStateText = styled.p`
  font-size: ${props => props.theme.typography.sizes.base};
  line-height: 1.6;
`

// Password Protection Overlay
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s ease, visibility 0.3s ease;
  opacity: ${props => props.$isVisible ? 1 : 0};
  visibility: ${props => props.$isVisible ? 'visible' : 'hidden'};
`

const PasswordForm = styled.div`
  background-color: ${props => props.theme.colors.cardBackground};
  border-radius: 24px;
  padding: 2.5rem;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  border: 1px solid ${props => props.theme.colors.border}40;
`

const LockIcon = styled(Lock)`
  width: 2.5rem;
  height: 2.5rem;
  color: ${props => props.theme.colors.accent};
  margin: 0 auto 1.25rem;
  opacity: 0.9;
`

const FormTitle = styled.h2`
  font-size: ${props => props.theme.typography.sizes.xl};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
`

const FormDescription = styled.p`
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 1.75rem;
  line-height: 1.5;
`

const InputWrapper = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
`

const PasswordInput = styled.input`
  width: 100%;
  padding: 0.875rem 3rem 0.875rem 1rem;
  font-size: ${props => props.theme.typography.sizes.base};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text.primary};
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.accent}15;
  }

  &::placeholder {
    color: ${props => props.theme.colors.text.tertiary};
  }
`

const EyeButton = styled.button`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme.colors.text.secondary};
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;

  &:hover {
    color: ${props => props.theme.colors.text.primary};
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.875rem 1.5rem;
  font-size: ${props => props.theme.typography.sizes.base};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: white;
  background-color: ${props => props.theme.colors.accent};
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.accent}dd;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${props => props.theme.colors.accent}40;
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`

const ErrorMessage = styled.p`
  color: #ef4444;
  font-size: ${props => props.theme.typography.sizes.sm};
  margin-top: 0.75rem;
  min-height: 1.25rem;
`

const BlurredContent = styled.div`
  filter: ${props => props.$isBlurred ? 'blur(10px)' : 'none'};
  transition: filter 0.3s ease;
  pointer-events: ${props => props.$isBlurred ? 'none' : 'auto'};
`

// Helper function to get YouTube embed URL
const getYouTubeEmbedUrl = (videoId, isAuthenticated = false, hideControls = false) => {
  // Return dummy URL if not authenticated to prevent loading YouTube resources
  if (!isAuthenticated) {
    return 'about:blank'
  }
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    controls: hideControls ? '0' : '1',
    showinfo: '0',
    iv_load_policy: '3',
    cc_load_policy: '0',
    fs: '0',
    disablekb: '1',
  })
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}

// Helper function to get YouTube thumbnail URL
const getYouTubeThumbnailUrl = (videoId) => {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
}

const ACCESS_PHRASE = 'smile'
const STORAGE_KEY = 'homevideos_authenticated'

// Helper function to get main domain URL (for breadcrumb links)
const getMainDomainUrl = () => {
  if (typeof window === 'undefined') return '/'
  const hostname = window.location.hostname
  if (hostname.startsWith('homevideos.')) {
    // On subdomain, return main domain
    return `https://${hostname.replace('homevideos.', '')}`
  }
  return '/'
}

export default function HomeVideos() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [layoutView, setLayoutView] = useState('timeline') // 'timeline', 'grid', 'list'
  const timelineItemsRef = useRef([])
  const scrollTimeoutRef = useRef(null)
  const isScrollingRef = useRef(false)

  // Check if user was previously authenticated (session persistence)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setIsChecking(true)

    // Simulate a small delay for better UX
    setTimeout(() => {
      if (password.toLowerCase().trim() === ACCESS_PHRASE.toLowerCase()) {
        setIsAuthenticated(true)
        localStorage.setItem(STORAGE_KEY, 'true')
        setPassword('')
      } else {
        setError('Incorrect access phrase. Please try again.')
        setPassword('')
      }
      setIsChecking(false)
    }, 300)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  if (!HOME_VIDEOS || HOME_VIDEOS.length === 0) {
    return (
      <Container>
        <Header data-header>
          <Breadcrumbs>
            <BreadcrumbLink href={getMainDomainUrl()}>Baljit Grewal Memorial Page</BreadcrumbLink>
            <BreadcrumbSeparator>›</BreadcrumbSeparator>
            <BreadcrumbCurrent>Home Videos</BreadcrumbCurrent>
          </Breadcrumbs>
        </Header>
        <EmptyState>
          <EmptyStateTitle>No videos yet</EmptyStateTitle>
          <EmptyStateText>
            Home videos will appear here once they are added to the constants file.
          </EmptyStateText>
        </EmptyState>
      </Container>
    )
  }

  // Separate collections from individual videos
  // Collections have both 'collection' and 'videos' properties
  // Individual videos have 'id' and 'title' properties (but not 'collection' or 'videos')
  const collections = HOME_VIDEOS.filter(v => v.collection && Array.isArray(v.videos) && v.videos.length > 0)
  const individualVideos = HOME_VIDEOS.filter(v => v.id && v.title && !v.collection)

  // Combine and sort all items by year (oldest first)
  const allItems = [
    ...collections.map(c => ({ ...c, type: 'collection' })),
    ...individualVideos.map(v => ({ ...v, type: 'video' }))
  ].sort((a, b) => {
    const yearA = a.year || 0
    const yearB = b.year || 0
    return yearA - yearB
  })

  // Scroll snapping logic for timeline (desktop only)
  useEffect(() => {
    if (layoutView !== 'timeline') return

    // Check if mobile view (using theme breakpoint)
    const mobileBreakpoint = 640 // matches theme.breakpoints.mobile
    const isMobile = window.innerWidth <= mobileBreakpoint
    
    // Disable scroll snap on mobile
    if (isMobile) return

    let lastScrollTop = window.scrollY
    let scrollTimeout = null

    const handleScroll = () => {
      if (isScrollingRef.current) return

      const currentScrollTop = window.scrollY
      const scrollDirection = currentScrollTop > lastScrollTop ? 'down' : 'up'
      lastScrollTop = currentScrollTop

      // Clear existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }

      // Debounce scroll detection
      scrollTimeout = setTimeout(() => {
        // Check if we've scrolled past the header by at least 50px
        const header = document.querySelector('[data-header]')
        let headerHeight = 0
        if (header) {
          headerHeight = header.offsetHeight
        } else {
          // Fallback: estimate header height
          headerHeight = 60
        }
        const headerOffset = 50 // Fixed amount past header
        const scrollY = window.scrollY
        
        // Only activate snap scroll if we're past the header + offset
        if (scrollY < headerHeight + headerOffset) {
          return
        }

        const viewportHeight = window.innerHeight
        const nav = document.querySelector('nav')
        const navHeight = nav ? nav.offsetHeight : 0

        // Find the item that's currently in view and check if more than 1/3 is scrolled past
        timelineItemsRef.current.forEach((element, index) => {
          if (!element) return

          const rect = element.getBoundingClientRect()
          const itemHeight = rect.height
          const visibleTop = Math.max(0, -rect.top)
          const scrolledPast = visibleTop / itemHeight // How much of the item we've scrolled past

          // If we've scrolled more than 1/3 down the item, snap to next/previous
          if (scrolledPast > 0.33 && rect.top < viewportHeight && rect.bottom > 0) {
            isScrollingRef.current = true

            let snapIndex = index
            if (scrollDirection === 'down' && index < timelineItemsRef.current.length - 1) {
              snapIndex = index + 1
            } else if (scrollDirection === 'up' && index > 0 && scrolledPast < 0.67) {
              snapIndex = index - 1
            }

            const snapElement = timelineItemsRef.current[snapIndex]
            if (snapElement && snapIndex !== index) {
              const snapRect = snapElement.getBoundingClientRect()
              const snapPosition = snapRect.top + scrollY - navHeight - 20

              window.scrollTo({
                top: snapPosition,
                behavior: 'smooth'
              })

              // Reset flag after scroll completes
              setTimeout(() => {
                isScrollingRef.current = false
              }, 500)
            } else {
              isScrollingRef.current = false
            }
          }
        })
      }, 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
    }
  }, [layoutView, allItems.length])

  return (
    <>
      {/* Password Protection Overlay */}
      <Overlay $isVisible={!isAuthenticated}>
        <PasswordForm>
          <LockIcon />
          <FormTitle>Private Content</FormTitle>
          <FormDescription>
            This area contains private family videos. Please enter the access phrase to continue.
          </FormDescription>
          <form onSubmit={handleSubmit}>
            <InputWrapper>
              <PasswordInput
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                onKeyPress={handleKeyPress}
                placeholder="Enter access phrase"
                autoFocus
                disabled={isChecking}
              />
              <EyeButton
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </EyeButton>
            </InputWrapper>
            <SubmitButton type="submit" disabled={isChecking || !password.trim()}>
              {isChecking ? 'Checking...' : 'Submit'}
            </SubmitButton>
            <ErrorMessage>{error}</ErrorMessage>
          </form>
        </PasswordForm>
      </Overlay>

      {/* Main Content - Blurred when not authenticated */}
      <BlurredContent $isBlurred={!isAuthenticated}>
        <Container>
          <Header data-header>
            <Breadcrumbs>
              <BreadcrumbLink href={getMainDomainUrl()}>Baljit Grewal Memorial Page</BreadcrumbLink>
              <BreadcrumbSeparator>›</BreadcrumbSeparator>
              <BreadcrumbCurrent>Home Videos</BreadcrumbCurrent>
            </Breadcrumbs>
            <LayoutToggle>
                <LayoutButton
                  $isActive={layoutView === 'timeline'}
                  onClick={() => setLayoutView('timeline')}
                  aria-label="Timeline view"
                >
                  <GitBranch />
                  Timeline
                </LayoutButton>
                <LayoutButton
                  $isActive={layoutView === 'grid'}
                  onClick={() => setLayoutView('grid')}
                  aria-label="Grid view"
                >
                  <LayoutGrid />
                  Grid
                </LayoutButton>
                <LayoutButton
                  $isActive={layoutView === 'list'}
                  onClick={() => setLayoutView('list')}
                  aria-label="List view"
                >
                  <List />
                  List
                </LayoutButton>
              </LayoutToggle>
          </Header>

          {/* Timeline View */}
          {layoutView === 'timeline' && (
            <TimelineContainer>
            <TimelineLine />
            {allItems.map((item, index) => {
              const isLeft = index % 2 === 0
              const TimelineContentWrapper = isLeft ? TimelineContentLeft : TimelineContentRight

              return (
                <TimelineItem 
                  key={item.type === 'collection' ? `collection-${index}` : item.id || index}
                  ref={(el) => {
                    timelineItemsRef.current[index] = el
                  }}
                >
                  <TimelineNode />
                  <TimelineContentWrapper>
                    <YearLabel>{item.year}</YearLabel>
                    
                    {item.type === 'collection' ? (
                      <CollectionCard>
                        <CardContent>
                          <CardTitle>{item.collection}</CardTitle>
                          {item.description && (
                            <CardDescription>{item.description}</CardDescription>
                          )}
                          <CollectionVideosGrid>
                            {item.videos.map((video, videoIndex) => (
                              <div key={videoIndex}>
                                <CollectionVideoWrapper>
                                  <iframe
                                    src={getYouTubeEmbedUrl(video.id, isAuthenticated)}
                                    title={`${item.collection} - ${video.title}`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    loading="lazy"
                                  />
                                </CollectionVideoWrapper>
                                <div style={{ 
                                  marginTop: '0.5rem', 
                                  fontSize: '0.875rem', 
                                  color: '#475569',
                                  textAlign: 'center'
                                }}>
                                  {video.title}
                                </div>
                              </div>
                            ))}
                          </CollectionVideosGrid>
                          <MetadataContainer>
                            {item.location && (
                              <MetadataItem>
                                <MapPin />
                                <span>
                                  <MetadataLabel>Location:</MetadataLabel>
                                  {item.location}
                                </span>
                              </MetadataItem>
                            )}
                            {item.appearances && item.appearances.length > 0 && (
                              <MetadataItem>
                                <Users />
                                <div>
                                  <MetadataLabel>Appearance by:</MetadataLabel>
                                  <AppearancesList>
                                    {item.appearances.map((person, idx) => (
                                      <AppearanceTag key={idx}>{person}</AppearanceTag>
                                    ))}
                                  </AppearancesList>
                                </div>
                              </MetadataItem>
                            )}
                          </MetadataContainer>
                        </CardContent>
                      </CollectionCard>
                    ) : (
                      <VideoCard>
                        <VideoWrapper>
                          <iframe
                            src={getYouTubeEmbedUrl(item.id, isAuthenticated)}
                            title={item.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                          />
                        </VideoWrapper>
                        <CardContent>
                          <CardTitle>{item.title}</CardTitle>
                          {item.description && (
                            <CardDescription>{item.description}</CardDescription>
                          )}
                          <MetadataContainer>
                            {item.location && (
                              <MetadataItem>
                                <MapPin />
                                <span>
                                  <MetadataLabel>Location:</MetadataLabel>
                                  {item.location}
                                </span>
                              </MetadataItem>
                            )}
                            {item.appearances && item.appearances.length > 0 && (
                              <MetadataItem>
                                <Users />
                                <div>
                                  <MetadataLabel>Appearance by:</MetadataLabel>
                                  <AppearancesList>
                                    {item.appearances.map((person, idx) => (
                                      <AppearanceTag key={idx}>{person}</AppearanceTag>
                                    ))}
                                  </AppearancesList>
                                </div>
                              </MetadataItem>
                            )}
                          </MetadataContainer>
                        </CardContent>
                      </VideoCard>
                    )}
                  </TimelineContentWrapper>
                </TimelineItem>
              )
            })}
          </TimelineContainer>
          )}

          {/* Grid View */}
          {layoutView === 'grid' && (
            <VideosGrid>
              {/* Render collections first */}
              {collections.map((collection, collectionIndex) => (
                <CollectionCard key={`collection-${collectionIndex}`}>
                  <CardContent>
                    <CardTitle>{collection.collection}</CardTitle>
                    {collection.description && (
                      <CardDescription>{collection.description}</CardDescription>
                    )}
                    <CollectionVideosGrid>
                      {collection.videos.map((video, videoIndex) => (
                        <div key={videoIndex}>
                          <CollectionVideoWrapper>
                            <iframe
                              src={getYouTubeEmbedUrl(video.id, isAuthenticated)}
                              title={`${collection.collection} - ${video.title}`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              loading="lazy"
                            />
                          </CollectionVideoWrapper>
                          <div style={{ 
                            marginTop: '0.5rem', 
                            fontSize: '0.875rem', 
                            color: '#475569',
                            textAlign: 'center'
                          }}>
                            {video.title}
                          </div>
                        </div>
                      ))}
                    </CollectionVideosGrid>
                    <MetadataContainer>
                      {collection.location && (
                        <MetadataItem>
                          <MapPin />
                          <span>
                            <MetadataLabel>Location:</MetadataLabel>
                            {collection.location}
                          </span>
                        </MetadataItem>
                      )}
                      {collection.year && (
                        <MetadataItem>
                          <Calendar />
                          <span>
                            <MetadataLabel>Year:</MetadataLabel>
                            {collection.year}
                          </span>
                        </MetadataItem>
                      )}
                      {collection.appearances && collection.appearances.length > 0 && (
                        <MetadataItem>
                          <Users />
                          <div>
                            <MetadataLabel>Appearance by:</MetadataLabel>
                            <AppearancesList>
                              {collection.appearances.map((person, idx) => (
                                <AppearanceTag key={idx}>{person}</AppearanceTag>
                              ))}
                            </AppearancesList>
                          </div>
                        </MetadataItem>
                      )}
                    </MetadataContainer>
                  </CardContent>
                </CollectionCard>
              ))}

              {/* Render individual videos */}
              {individualVideos.map((video, index) => (
                <VideoCard key={video.id || index}>
                  <VideoWrapper>
                    <iframe
                      src={getYouTubeEmbedUrl(video.id, isAuthenticated)}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                  </VideoWrapper>
                  <CardContent>
                    <CardTitle>{video.title}</CardTitle>
                    {video.description && (
                      <CardDescription>{video.description}</CardDescription>
                    )}
                    <MetadataContainer>
                      {video.location && (
                        <MetadataItem>
                          <MapPin />
                          <span>
                            <MetadataLabel>Location:</MetadataLabel>
                            {video.location}
                          </span>
                        </MetadataItem>
                      )}
                      {video.year && (
                        <MetadataItem>
                          <Calendar />
                          <span>
                            <MetadataLabel>Year:</MetadataLabel>
                            {video.year}
                          </span>
                        </MetadataItem>
                      )}
                      {video.appearances && video.appearances.length > 0 && (
                        <MetadataItem>
                          <Users />
                          <div>
                            <MetadataLabel>Appearance by:</MetadataLabel>
                            <AppearancesList>
                              {video.appearances.map((person, idx) => (
                                <AppearanceTag key={idx}>{person}</AppearanceTag>
                              ))}
                            </AppearancesList>
                          </div>
                        </MetadataItem>
                      )}
                    </MetadataContainer>
                  </CardContent>
                </VideoCard>
              ))}
            </VideosGrid>
          )}

          {/* List View */}
          {layoutView === 'list' && (
            <ListContainer>
              {allItems.map((item, index) => {
                // Get YouTube URL for the item
                const youtubeUrl = item.type === 'collection' 
                  ? `https://www.youtube.com/watch?v=${item.videos[0]?.id}`
                  : `https://www.youtube.com/watch?v=${item.id}`
                
                return (
                <ListItem 
                  key={item.type === 'collection' ? `collection-${index}` : item.id || index}
                  onClick={() => {
                    window.open(youtubeUrl, '_blank', 'noopener,noreferrer')
                  }}
                >
                  <ListThumbnail>
                    {item.type === 'collection' ? (
                      <>
                        <img
                          src={getYouTubeThumbnailUrl(item.videos[0]?.id)}
                          alt={item.collection}
                          loading="lazy"
                        />
                        <iframe
                          src={getYouTubeEmbedUrl(item.videos[0]?.id, isAuthenticated, true)}
                          title={item.collection}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                        />
                      </>
                    ) : (
                      <>
                        <img
                          src={getYouTubeThumbnailUrl(item.id)}
                          alt={item.title}
                          loading="lazy"
                        />
                        <iframe
                          src={getYouTubeEmbedUrl(item.id, isAuthenticated, true)}
                          title={item.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                        />
                      </>
                    )}
                  </ListThumbnail>
                  <ListContent>
                    <ListInfo>
                      <ListTitle>{item.type === 'collection' ? item.collection : item.title}</ListTitle>
                      <ListMetadata>
                        {item.year && (
                          <span>
                            <Calendar size={14} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} />
                            {item.year}
                          </span>
                        )}
                        {item.location && (
                          <span>
                            <MapPin size={14} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} />
                            {item.location}
                          </span>
                        )}
                      </ListMetadata>
                    </ListInfo>
                  </ListContent>
                </ListItem>
                )
              })}
            </ListContainer>
          )}
        </Container>
      </BlurredContent>
    </>
  )
}

