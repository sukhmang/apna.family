import { useState, useEffect, useRef, useContext } from 'react'
import { useLocation } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { Heart, User, Images, Home, ChevronRight } from 'lucide-react'
import { PersonContext } from '../contexts/PersonContext'
import { FamilyContext } from '../contexts/FamilyContext'
import { parseSubdomain, isRootDomain } from '../utils/subdomain'

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`

const Nav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  width: 100%;
  max-width: 100vw;
  background-color: ${props => props.theme.colors.cardBackground};
  box-shadow: ${props => props.theme.shadows.md};
  transition: box-shadow 0.3s ease;
  box-sizing: border-box;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  /* Ensure solid background for fixed positioning */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
`

const NavContainer = styled.div`
  margin: 0 auto;
  max-width: min(600px, 100vw);
  width: 100%;
  padding: 0 1rem;
  box-sizing: border-box;
  overflow: visible;
`

const BreadcrumbSection = styled.div`
  padding: 0.25rem 0;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  gap: 0.1875rem;
  flex-wrap: wrap;
  
  @media (min-width: 640px) {
    padding: 0.375rem 0;
    gap: 0.25rem;
  }
`

const BreadcrumbLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.1875rem;
  padding: 0.25rem 0.5rem;
  font-size: ${props => props.theme.typography.sizes.sm};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.text.primary};
  text-decoration: none;
  border-radius: ${props => props.theme.borderRadius.sm};
  transition: all 0.2s ease;
  background-color: transparent;
  min-height: 36px; /* Elder-friendly touch target */
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.accent};
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  svg {
    width: 0.75rem;
    height: 0.75rem;
    flex-shrink: 0;
  }
  
  @media (min-width: 640px) {
    font-size: ${props => props.theme.typography.sizes.sm};
    padding: 0.375rem 0.75rem;
    gap: 0.25rem;
    
    svg {
      width: 0.875rem;
      height: 0.875rem;
    }
  }
`

const BreadcrumbText = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.1875rem;
  padding: 0.25rem 0.5rem;
  font-size: ${props => props.theme.typography.sizes.sm};
  font-weight: ${props => props.theme.typography.weights.normal};
  color: ${props => props.theme.colors.text.secondary};
  
  svg {
    width: 0.75rem;
    height: 0.75rem;
    flex-shrink: 0;
  }
  
  @media (min-width: 640px) {
    font-size: ${props => props.theme.typography.sizes.sm};
    padding: 0.375rem 0.75rem;
    gap: 0.25rem;
    
    svg {
      width: 0.875rem;
      height: 0.875rem;
    }
  }
`

const BreadcrumbSeparator = styled(ChevronRight)`
  width: 0.875rem;
  height: 0.875rem;
  color: ${props => props.theme.colors.text.tertiary};
  flex-shrink: 0;
  margin: 0 0.125rem;
  
  @media (min-width: 640px) {
    width: 1rem;
    height: 1rem;
    margin: 0 0.1875rem;
  }
`

const BreadcrumbSkeleton = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  min-height: 36px;
  border-radius: ${props => props.theme.borderRadius.sm};
  background: linear-gradient(
    90deg,
    ${props => props.theme.colors.background} 0%,
    ${props => props.theme.colors.border} 50%,
    ${props => props.theme.colors.background} 100%
  );
  background-size: 1000px 100%;
  animation: ${shimmer} 2s infinite;
  width: ${props => props.$width || '80px'};
  
  @media (min-width: 640px) {
    padding: 0.375rem 0.75rem;
    width: ${props => props.$width || '100px'};
  }
`

const NavContent = styled.div`
  display: flex;
  align-items: center;
  padding: 0.375rem 0;
  gap: 0;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  
  @media (min-width: 640px) {
    padding: 0.5rem 0;
  }
`

const PortraitWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${props => props.$show ? '4.5rem' : '0'};
  padding-left: ${props => props.$show ? '1rem' : '0'};
  opacity: ${props => props.$show ? 1 : 0};
  transform: ${props => props.$show ? 'translateX(0)' : 'translateX(-20px)'};
  transition: opacity 0.3s ease, transform 0.3s ease, width 0.3s ease, padding-left 0.3s ease;
  pointer-events: ${props => props.$show ? 'auto' : 'none'};
  overflow: hidden;
  flex-shrink: 0;
  box-sizing: border-box;
`

const NavItems = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex: 1;
  gap: 0.25rem;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
  position: relative;
`

const ActiveIndicator = styled.div`
  position: absolute;
  bottom: 0;
  left: ${props => props.$left}px;
  width: ${props => props.$width}px;
  height: 3px;
  background-color: ${props => props.theme.colors.accent};
  border-radius: 2px 2px 0 0;
  transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1), width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: ${props => props.$visible ? 1 : 0};
  pointer-events: none;
`

const Portrait = styled.img`
  width: 3rem;
  height: 3rem;
  border-radius: ${props => props.theme.borderRadius.full};
  object-fit: cover;
  border: 2px solid ${props => props.theme.colors.border};
  flex-shrink: 0;
`

const NavButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  padding: 0.1875rem 0.1875rem;
  font-size: ${props => props.theme.typography.sizes.xs};
  font-weight: ${props => props.$isActive ? props.theme.typography.weights.bold : props.theme.typography.weights.semibold};
  color: ${props => props.$isActive ? props.theme.colors.accent : props.theme.colors.text.primary};
  background: none;
  border: none;
  cursor: pointer;
  position: relative;
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  transition: color 0.2s ease, font-weight 0.2s ease;
  opacity: 1;

  @media (min-width: 640px) {
    padding: 0.25rem 0.5rem;
    font-size: ${props => props.theme.typography.sizes.sm};
    gap: 0.1875rem;
  }

  &:hover {
    color: ${props => props.theme.colors.accent};
  }


  svg {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    color: inherit;
    
    @media (min-width: 640px) {
      width: 1.25rem;
      height: 1.25rem;
    }
  }

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
`

export default function Navbar() {
  const location = useLocation()
  // Get person context if available (may be null on family portal pages)
  const personContext = useContext(PersonContext)
  const memorialData = personContext?.memorialData
  
  // Get family context if available (may not be available on root domain)
  const familyContext = useContext(FamilyContext)
  const familyData = familyContext?.familyData
  const familyId = familyContext?.familyId || (typeof window !== 'undefined' ? parseSubdomain(window.location.hostname).familyId : null)
  
  const [showPortrait, setShowPortrait] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const navRef = useRef(null)
  const profileButtonRef = useRef(null)
  const memoriesButtonRef = useRef(null)
  const galleryButtonRef = useRef(null)
  
  const buttonRefs = {
    profile: profileButtonRef,
    memories: memoriesButtonRef,
    gallery: galleryButtonRef,
  }

  useEffect(() => {
    const handleScroll = () => {
      // Find the Profile section by its id
      const profileSection = document.getElementById('profile')
      
      if (!profileSection) return

      // Get the bottom of the profile section
      const profileBottom = profileSection.getBoundingClientRect().bottom
      
      // Show portrait when profile section is scrolled past (with a small threshold)
      setShowPortrait(profileBottom < 100) // 100px threshold for smoother transition
    }

    // Check on mount and on scroll
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  // Update indicator position when active section changes or portrait visibility changes
  useEffect(() => {
    if (!activeSection || !showPortrait) {
      setIndicatorStyle({ left: 0, width: 0 })
      return
    }

    const calculatePosition = () => {
      const button = buttonRefs[activeSection]?.current
      if (!button) return

      const navItems = button.closest('[data-nav-items]')
      if (!navItems) return

      // Calculate position relative to navItems
      const navItemsRect = navItems.getBoundingClientRect()
      const buttonRect = button.getBoundingClientRect()
      
      // Calculate left position relative to navItems
      const left = buttonRect.left - navItemsRect.left
      const width = buttonRect.width
      
      setIndicatorStyle({ left, width })
    }

    // Use double requestAnimationFrame to ensure DOM has fully updated
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Small additional delay to ensure all transitions are complete
        setTimeout(() => {
          calculatePosition()
        }, 50)
      })
    })
  }, [activeSection, showPortrait])

  // Recalculate on window resize
  useEffect(() => {
    if (!showPortrait || !activeSection) return

    const handleResize = () => {
      const button = buttonRefs[activeSection]?.current
      if (!button) return

      const navItems = button.closest('[data-nav-items]')
      if (!navItems) return

      const navItemsRect = navItems.getBoundingClientRect()
      const buttonRect = button.getBoundingClientRect()
      const left = buttonRect.left - navItemsRect.left
      const width = buttonRect.width
      
      setIndicatorStyle({ left, width })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [showPortrait, activeSection])

  // Track active section based on scroll position
  useEffect(() => {
    if (!memorialData) return
    
    const sections = ['profile', 'memories', 'gallery']
    
    const updateActiveSection = () => {
      const navHeight = navRef.current?.offsetHeight || 100
      const viewportTop = navHeight
      const triggerPoint = viewportTop + 150 // Point where section is considered "active"
      
      let activeId = ''
      let minDistance = Infinity

      // Find the section that's closest to the trigger point
      sections.forEach((id) => {
        const element = document.getElementById(id)
        if (!element) return

        const rect = element.getBoundingClientRect()
        const sectionTop = rect.top
        const sectionBottom = rect.bottom
        
        // Check if section is in the active zone (between nav and trigger point)
        if (sectionTop <= triggerPoint && sectionBottom > viewportTop) {
          // Section is in active zone - calculate how much is visible
          const visibleTop = Math.max(sectionTop, viewportTop)
          const visibleBottom = Math.min(sectionBottom, triggerPoint)
          const visibleHeight = visibleBottom - visibleTop
          
          if (visibleHeight > 0) {
            // Distance from trigger point (closer = better)
            const distance = Math.abs(sectionTop - viewportTop)
            if (distance < minDistance) {
              minDistance = distance
              activeId = id
            }
          }
        }
      })

      // If no section in active zone, find the one closest to entering it
      if (!activeId) {
        sections.forEach((id) => {
          const element = document.getElementById(id)
          if (!element) return
          
          const rect = element.getBoundingClientRect()
          const sectionTop = rect.top
          
          // Only consider sections that are below the trigger point
          if (sectionTop > triggerPoint) {
            const distance = sectionTop - triggerPoint
            if (distance < minDistance) {
              minDistance = distance
              activeId = id
            }
          }
        })
      }

      // Fallback: if still no active section, use the first section that's visible
      if (!activeId) {
        sections.forEach((id) => {
          const element = document.getElementById(id)
          if (!element) return
          
          const rect = element.getBoundingClientRect()
          if (rect.top < window.innerHeight && rect.bottom > viewportTop) {
            if (!activeId) {
              activeId = id
            }
          }
        })
      }

      if (activeId) {
        setActiveSection(activeId)
      }
    }

    // Update on scroll
    const handleScroll = () => {
      updateActiveSection()
    }

    // Update on scroll end (for smooth scrolling after click)
    let scrollTimeout
    const handleScrollEnd = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        updateActiveSection()
      }, 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('scroll', handleScrollEnd, { passive: true })
    
    // Initial check
    updateActiveSection()
    
    // Also check periodically to catch any missed updates
    const interval = setInterval(updateActiveSection, 200)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('scroll', handleScrollEnd)
      clearInterval(interval)
      clearTimeout(scrollTimeout)
    }
  }, [memorialData])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      // Get the sticky nav height to offset the scroll position
      const navHeight = navRef.current?.offsetHeight || 80 // Default to 80px if nav not found
      
      // Calculate the position where we want to scroll to (element position minus nav height plus some padding)
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - navHeight - 20 // 20px extra padding
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  // Build breadcrumb navigation
  const buildBreadcrumbs = () => {
    const isRoot = isRootDomain()
    const pathname = location.pathname
    const crumbs = []

    if (typeof window === 'undefined') return crumbs

    // Get current hostname info
    const currentHost = window.location.hostname
    const port = window.location.port
    const protocol = window.location.protocol
    
    // Build root domain URL (for "Home" link)
    // Extract base domain: for "grewal.localhost:5173" -> "localhost:5173"
    // For "grewal.apna.family" -> "apna.family"
    let rootUrl
    if (currentHost.includes('.localhost')) {
      // Localhost subdomain: extract just "localhost"
      rootUrl = `${protocol}//localhost${port ? `:${port}` : ''}`
    } else if (currentHost.includes('.')) {
      // Production: extract base domain (last 2 parts)
      const parts = currentHost.split('.')
      const baseDomain = parts.slice(-2).join('.')
      rootUrl = `${protocol}//${baseDomain}${port ? `:${port}` : ''}`
    } else {
      // Already on root
      rootUrl = `${protocol}//${currentHost}${port ? `:${port}` : ''}`
    }

    // Home link (root domain) - always goes to main site
    crumbs.push({
      label: 'Home',
      href: rootUrl,
      icon: Home
    })

    // If on family subdomain, add family link
    if (!isRoot && familyId) {
      const familyUrl = `${protocol}//${familyId}.${currentHost.includes('.localhost') ? 'localhost' : (currentHost.includes('.') ? currentHost.split('.').slice(-2).join('.') : currentHost)}${port ? `:${port}` : ''}`
      
      // Check if family data is still loading
      // Only show skeleton on family landing page, not on person pages (family already loaded)
      const isFamilyLoading = familyContext?.loading && pathname === '/'
      
      if (isFamilyLoading) {
        // Show skeleton while loading (only on family landing page)
        crumbs.push({
          label: null, // null indicates skeleton
          href: null,
          isSkeleton: true,
          skeletonWidth: '120px' // Approximate width for "The Grewals"
        })
      } else {
        // Use formatted name if available, otherwise capitalize familyId
        const familyDisplayName = familyData?.displayName || 
                                 familyData?.name || 
                                 (familyId ? familyId.charAt(0).toUpperCase() + familyId.slice(1) + ' Family' : 'Family')
        crumbs.push({
          label: familyDisplayName,
          href: familyUrl
        })
      }

      // If on person page, add person link
      if (pathname !== '/' && pathname !== '/homevideos') {
        const personId = pathname.slice(1) // Remove leading slash
        const isPersonLoading = personContext?.loading
        
        if (isPersonLoading) {
          // Show skeleton while loading person data
          crumbs.push({
            label: null,
            href: null,
            isSkeleton: true,
            skeletonWidth: '120px' // Approximate width for person name
          })
        } else if (memorialData) {
          crumbs.push({
            label: memorialData.name,
            href: null // Current page, no link
          })
        }
      } else if (pathname === '/homevideos') {
        crumbs.push({
          label: 'Home Videos',
          href: null // Current page, no link
        })
      }
    }

    return crumbs
  }

  const breadcrumbs = buildBreadcrumbs()
  const showBreadcrumbs = breadcrumbs.length > 1 // Only show if more than just "Home"
  
  // Only show section navigation (Watch, Stories, Gallery) on person pages
  const showSectionNav = !!memorialData

  return (
    <Nav ref={navRef}>
      <NavContainer>
        {showBreadcrumbs && (
          <BreadcrumbSection>
            {breadcrumbs.map((crumb, index) => {
              const Icon = crumb.icon
              const isLast = index === breadcrumbs.length - 1
              
              return (
                <span key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {crumb.isSkeleton ? (
                    <BreadcrumbSkeleton $width={crumb.skeletonWidth} />
                  ) : crumb.href ? (
                    <BreadcrumbLink href={crumb.href}>
                      {Icon && <Icon />}
                      {crumb.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbText>
                      {Icon && <Icon />}
                      {crumb.label}
                    </BreadcrumbText>
                  )}
                  {!isLast && <BreadcrumbSeparator />}
                </span>
              )
            })}
          </BreadcrumbSection>
        )}
        {showSectionNav && (
          <NavContent>
            <PortraitWrapper $show={showPortrait}>
              {memorialData && (
                <Portrait 
                  src={memorialData.portraitImage} 
                  alt={memorialData.name}
                />
              )}
            </PortraitWrapper>
            
            <NavItems data-nav-items>
              {activeSection && showPortrait && (
                <ActiveIndicator 
                  $left={indicatorStyle.left} 
                  $width={indicatorStyle.width}
                  $visible={true}
                />
              )}
              
              <NavButton
                ref={profileButtonRef}
                onClick={() => scrollToSection('profile')}
                aria-label="Profile"
                $portraitVisible={showPortrait}
                $isActive={activeSection === 'profile'}
              >
                <User />
                <span>Profile</span>
              </NavButton>
              
              <NavButton
                ref={memoriesButtonRef}
                onClick={() => scrollToSection('memories')}
                aria-label="Memories"
                $portraitVisible={showPortrait}
                $isActive={activeSection === 'memories'}
              >
                <Heart />
                <span>Memories</span>
              </NavButton>
              
              <NavButton
                ref={galleryButtonRef}
                onClick={() => scrollToSection('gallery')}
                aria-label="Gallery"
                $portraitVisible={showPortrait}
                $isActive={activeSection === 'gallery'}
              >
                <Images />
                <span>Gallery</span>
              </NavButton>
            </NavItems>
          </NavContent>
        )}
      </NavContainer>
    </Nav>
  )
}
