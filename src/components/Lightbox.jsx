import { useEffect, useState, useRef } from 'react'
import styled from 'styled-components'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.98);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  animation: fadeIn 0.2s ease-out;
  backdrop-filter: blur(4px);

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (max-width: 640px) {
    padding: 0;
  }
`

const CloseButton = styled.button`
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: ${props => props.theme.borderRadius.full};
  width: 3.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
  z-index: 1001;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  @media (max-width: 640px) {
    top: 1rem;
    right: 1rem;
    width: 3rem;
    height: 3rem;
  }
`

const NavButton = styled.button`
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: ${props => props.theme.borderRadius.full};
  width: 4rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: opacity 0.3s ease, transform 0.2s ease;
  z-index: 1001;
  backdrop-filter: blur(10px);
  opacity: ${props => props.$visible ? 1 : 0};
  pointer-events: ${props => props.$visible ? 'auto' : 'none'};

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-50%) scale(1.1);
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }

  &:disabled {
    opacity: ${props => props.$visible ? 0.3 : 0};
    cursor: not-allowed;
  }

  svg {
    width: 2rem;
    height: 2rem;
  }

  ${props => props.$position === 'left' && 'left: 1.5rem;'}
  ${props => props.$position === 'right' && 'right: 1.5rem;'}

  @media (max-width: 640px) {
    width: 3rem;
    height: 3rem;
    ${props => props.$position === 'left' && 'left: 0.5rem;'}
    ${props => props.$position === 'right' && 'right: 0.5rem;'}
    
    svg {
      width: 1.5rem;
      height: 1.5rem;
    }
  }
`

const MediaContainer = styled.div`
  max-width: 95vw;
  max-height: 95vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transform: translateX(${props => props.$swipeOffset}px);
  transition: ${props => props.$isSwiping ? 'none' : 'transform 0.3s ease-out'};
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;

  @media (max-width: 640px) {
    max-width: 100vw;
    max-height: 100vh;
    width: 100%;
    height: 100%;
  }
`

const MediaImage = styled.img`
  max-width: 100%;
  max-height: 95vh;
  object-fit: contain;
  border-radius: ${props => props.theme.borderRadius.sm};
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: zoomIn 0.3s ease-out;

  @keyframes zoomIn {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  @media (max-width: 640px) {
    max-height: 100vh;
    border-radius: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`

const MediaVideo = styled.video`
  max-width: 100%;
  max-height: 95vh;
  border-radius: ${props => props.theme.borderRadius.sm};
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: zoomIn 0.3s ease-out;

  @keyframes zoomIn {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  @media (max-width: 640px) {
    max-height: 100vh;
    border-radius: 0;
  }
`

const Counter = styled.div`
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: ${props => props.theme.typography.sizes.base};
  background: rgba(0, 0, 0, 0.6);
  padding: 0.75rem 1.5rem;
  border-radius: ${props => props.theme.borderRadius.full};
  backdrop-filter: blur(10px);
  z-index: 1001;
  font-weight: ${props => props.theme.typography.weights.semibold};

  @media (max-width: 640px) {
    bottom: 1rem;
    font-size: ${props => props.theme.typography.sizes.sm};
    padding: 0.5rem 1rem;
  }
`

const SwipeHint = styled.div`
  position: fixed;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: ${props => props.theme.typography.sizes.sm};
  z-index: 1001;
  display: none;

  @media (max-width: 640px) {
    display: block;
  }
`

export default function Lightbox({ item, items, currentIndex, onClose, onNext, onPrevious }) {
  const [swipeStart, setSwipeStart] = useState(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [showNavButtons, setShowNavButtons] = useState(false)
  const containerRef = useRef(null)
  const hideTimeoutRef = useRef(null)

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onPrevious()
      } else if (e.key === 'ArrowRight' && currentIndex < items.length - 1) {
        onNext()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [onClose, onNext, onPrevious, currentIndex, items.length])

  // Touch/swipe handlers
  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    setSwipeStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    })
    setIsSwiping(true)
  }

  const handleTouchMove = (e) => {
    if (!swipeStart) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - swipeStart.x
    const deltaY = touch.clientY - swipeStart.y

    // Only handle horizontal swipes (ignore vertical scrolling)
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault()
      setSwipeOffset(deltaX)
    }
  }

  const handleTouchEnd = (e) => {
    if (!swipeStart) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - swipeStart.x
    const deltaY = touch.clientY - swipeStart.y
    const deltaTime = Date.now() - swipeStart.time
    const minSwipeDistance = 50
    const maxSwipeTime = 300

    setIsSwiping(false)

    // Check if it's a valid horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && 
        Math.abs(deltaX) > minSwipeDistance && 
        deltaTime < maxSwipeTime) {
      if (deltaX > 0 && currentIndex > 0) {
        // Swipe right - go to previous
        onPrevious()
      } else if (deltaX < 0 && currentIndex < items.length - 1) {
        // Swipe left - go to next
        onNext()
      }
    }

    // Reset swipe state
    setSwipeOffset(0)
    setSwipeStart(null)
  }

  // Show/hide navigation buttons on mouse movement
  const handleMouseMove = (e) => {
    // Show buttons when mouse moves
    setShowNavButtons(true)

    // Clear existing timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }

    // Hide buttons after 1 second of inactivity
    hideTimeoutRef.current = setTimeout(() => {
      setShowNavButtons(false)
    }, 1000)

    // Also handle swipe detection if swiping
    if (swipeStart && isSwiping) {
      const deltaX = e.clientX - swipeStart.x
      const deltaY = e.clientY - swipeStart.y

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        setSwipeOffset(deltaX)
      }
    }
  }

  const handleMouseEnter = () => {
    setShowNavButtons(true)
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }
  }

  const handleMouseLeave = () => {
    // Hide immediately when mouse leaves
    setShowNavButtons(false)
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }
  }

  // Mouse drag support (for desktop)
  const handleMouseDown = (e) => {
    if (e.button !== 0) return // Only left mouse button
    setSwipeStart({
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    })
    setIsSwiping(true)
  }

  const handleMouseUp = (e) => {
    if (!swipeStart) return

    const deltaX = e.clientX - swipeStart.x
    const deltaY = e.clientY - swipeStart.y
    const deltaTime = Date.now() - swipeStart.time
    const minSwipeDistance = 50
    const maxSwipeTime = 300

    setIsSwiping(false)

    if (Math.abs(deltaX) > Math.abs(deltaY) && 
        Math.abs(deltaX) > minSwipeDistance && 
        deltaTime < maxSwipeTime) {
      if (deltaX > 0 && currentIndex > 0) {
        onPrevious()
      } else if (deltaX < 0 && currentIndex < items.length - 1) {
        onNext()
      }
    }

    setSwipeOffset(0)
    setSwipeStart(null)
  }

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [])

  if (!item) return null

  return (
    <Overlay 
      onClick={onClose}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <MediaContainer
        ref={containerRef}
        $swipeOffset={swipeOffset}
        $isSwiping={isSwiping}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <CloseButton onClick={onClose} aria-label="Close lightbox">
          <X />
        </CloseButton>

        <NavButton
          $position="left"
          $visible={showNavButtons}
          onClick={(e) => {
            e.stopPropagation()
            onPrevious()
          }}
          disabled={currentIndex === 0}
          aria-label="Previous image"
        >
          <ChevronLeft />
        </NavButton>

        <NavButton
          $position="right"
          $visible={showNavButtons}
          onClick={(e) => {
            e.stopPropagation()
            onNext()
          }}
          disabled={currentIndex === items.length - 1}
          aria-label="Next image"
        >
          <ChevronRight />
        </NavButton>

        {(item.type === 'image' || item.type === 'gif') ? (
          <MediaImage src={item.url} alt={item.alt || 'Gallery image'} />
        ) : item.type === 'video' ? (
          <MediaVideo 
            src={item.url} 
            controls 
            autoPlay 
            loop
            playsInline
          >
            Your browser does not support the video tag.
          </MediaVideo>
        ) : (
          <MediaImage src={item.url} alt={item.alt || 'Gallery image'} />
        )}

        {items.length > 1 && (
          <>
            <Counter>
              {currentIndex + 1} / {items.length}
            </Counter>
            <SwipeHint>Swipe to navigate</SwipeHint>
          </>
        )}
      </MediaContainer>
    </Overlay>
  )
}
