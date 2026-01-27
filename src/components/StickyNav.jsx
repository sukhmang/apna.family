import { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { Video, Calendar, BookOpen, Images } from 'lucide-react'
import { MEMORIAL_DATA } from '../constants'

const Nav = styled.nav`
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  max-width: 100vw;
  background-color: ${props => props.theme.colors.cardBackground};
  box-shadow: ${props => props.theme.shadows.md};
  transition: box-shadow 0.3s ease;
  box-sizing: border-box;
`

const NavContainer = styled.div`
  margin: 0 auto;
  max-width: min(600px, 100vw);
  width: 100%;
  padding: 0 1rem;
  box-sizing: border-box;
  overflow: hidden;
`

const NavContent = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem 0;
  gap: 0;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
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
  gap: 0.25rem;
  padding: 0.5rem 0.5rem;
  font-size: ${props => props.theme.typography.sizes.sm};
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
    padding: 0.5rem 1rem;
  }

  &:hover {
    color: ${props => props.theme.colors.accent};
  }


  svg {
    width: 1.5rem;
    height: 1.5rem;
    flex-shrink: 0;
    color: inherit;
  }

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
`

export default function StickyNav() {
  const [showPortrait, setShowPortrait] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const watchButtonRef = useRef(null)
  const eventDetailsButtonRef = useRef(null)
  const storiesButtonRef = useRef(null)
  const galleryButtonRef = useRef(null)
  
  const buttonRefs = {
    watch: watchButtonRef,
    'event-details': eventDetailsButtonRef,
    stories: storiesButtonRef,
    gallery: galleryButtonRef,
  }

  useEffect(() => {
    const handleScroll = () => {
      // Find the Hero section by its id
      const heroSection = document.getElementById('hero-section')
      
      if (!heroSection) return

      // Get the bottom of the hero section
      const heroBottom = heroSection.getBoundingClientRect().bottom
      
      // Show portrait when hero section is scrolled past (with a small threshold)
      setShowPortrait(heroBottom < 100) // 100px threshold for smoother transition
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
    const sections = ['watch', 'stories', 'gallery'] // 'event-details' removed - events are finished
    
    const updateActiveSection = () => {
      const navHeight = 100
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
  }, [])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      // Get the sticky nav height to offset the scroll position
      const nav = document.querySelector('nav')
      const navHeight = nav ? nav.offsetHeight : 80 // Default to 80px if nav not found
      
      // Calculate the position where we want to scroll to (element position minus nav height plus some padding)
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - navHeight - 20 // 20px extra padding
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  return (
    <Nav>
      <NavContainer>
        <NavContent>
          <PortraitWrapper $show={showPortrait}>
            <Portrait 
              src={MEMORIAL_DATA.portraitImage} 
              alt={MEMORIAL_DATA.name}
            />
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
              ref={watchButtonRef}
              onClick={() => scrollToSection('watch')}
              aria-label="Watch"
              $portraitVisible={showPortrait}
              $isActive={activeSection === 'watch'}
            >
              <Video />
              <span>Watch</span>
            </NavButton>
            
            {/* Events button hidden - events are now finished */}
            {/* <NavButton
              ref={eventDetailsButtonRef}
              onClick={() => scrollToSection('event-details')}
              aria-label="Events"
              $portraitVisible={showPortrait}
              $isActive={activeSection === 'event-details'}
            >
              <Calendar />
              <span>Events</span>
            </NavButton> */}
            
            <NavButton
              ref={storiesButtonRef}
              onClick={() => scrollToSection('stories')}
              aria-label="Stories"
              $portraitVisible={showPortrait}
              $isActive={activeSection === 'stories'}
            >
              <BookOpen />
              <span>Stories</span>
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
      </NavContainer>
    </Nav>
  )
}
