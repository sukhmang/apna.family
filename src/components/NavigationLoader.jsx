import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.theme.colors.cardBackground};
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${props => props.$isExiting ? fadeOut : fadeIn} 0.2s ease-out;
  pointer-events: ${props => props.$isExiting ? 'none' : 'auto'};
`

const Loader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`

const Spinner = styled.div`
  width: 3rem;
  height: 3rem;
  border: 3px solid ${props => props.theme.colors.border};
  border-top-color: ${props => props.theme.colors.accent};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`

const Text = styled.p`
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.text.secondary};
  margin: 0;
`

/**
 * NavigationLoader - Shows a subtle loading overlay during route transitions
 * Prevents FOUC (Flash of Unstyled Content) and page jumps
 */
export default function NavigationLoader() {
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [prevLocation, setPrevLocation] = useState(location)

  useEffect(() => {
    // Only show loader if location actually changed
    if (location.pathname !== prevLocation.pathname || 
        location.search !== prevLocation.search) {
      setIsLoading(true)
      setIsExiting(false)
      
      // Small delay to allow React Router to start rendering
      const timer = setTimeout(() => {
        setIsExiting(true)
        // Hide after fade out animation
        setTimeout(() => {
          setIsLoading(false)
          setPrevLocation(location)
        }, 200)
      }, 100) // Very short delay - just enough to prevent FOUC

      return () => clearTimeout(timer)
    }
  }, [location, prevLocation])

  if (!isLoading) return null

  return (
    <Overlay $isExiting={isExiting}>
      <Loader>
        <Spinner />
        <Text>Loading...</Text>
      </Loader>
    </Overlay>
  )
}
