import { useState, useEffect, useRef, useMemo } from 'react'
import styled from 'styled-components'
import { Images, Play, Image, Video, Mail, MessageCircle, ChevronDown } from 'lucide-react'
import Lightbox from './Lightbox'

// Utility function to generate optimized Cloudinary URLs
const getOptimizedCloudinaryUrl = (url, type = 'grid') => {
  if (!url || !url.includes('cloudinary.com')) {
    return url
  }

  // Split the URL to insert transformations
  const parts = url.split('/upload/')
  if (parts.length !== 2) return url

  const baseUrl = parts[0] + '/upload/'
  const fileId = parts[1]

  // For video grid view: optimized for mobile (480px width, economy quality, no audio)
  if (type === 'video-grid') {
    // w_480: Cap width at 480px (plenty for mobile grid)
    // q_auto:eco: Aggressive compression (saves HUGE data, looks fine on small screens)
    // f_auto: Use modern codecs (AV1/H.265) which are 30% smaller
    // ac_none: Remove audio track since videos autoplay muted (saves ~10% more)
    return `${baseUrl}w_480,q_auto:eco,f_auto,ac_none/${fileId}`
  }

  // For video thumbnail/poster: Generate a static JPG frame
  if (type === 'video-thumbnail') {
    // Generate a JPG thumbnail from the video (first frame)
    // w_400: width 400px, h_400: height 400px, c_fill: fill crop
    // f_jpg: format JPG, q_auto: auto quality
    return `${baseUrl}w_400,h_400,c_fill,f_jpg,q_auto/${fileId}`
  }

  // For lightbox: Full quality (but still optimized)
  if (type === 'video-lightbox') {
    // q_auto: Auto quality (high quality but still optimized)
    // f_auto: Modern codecs
    return `${baseUrl}q_auto,f_auto/${fileId}`
  }

  // Default: return original
  return url
}

const Card = styled.div`
  background-color: ${props => props.theme.colors.cardBackground};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.lg};
  padding: 2rem;
  margin-bottom: 1.5rem;
`

const Title = styled.h2`
  font-size: ${props => props.theme.typography.sizes['2xl']};
  font-weight: ${props => props.theme.typography.weights.bold};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
  }
`

const MediaItem = styled.div`
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  background-color: ${props => props.theme.colors.border};
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: scale(1.02);
    box-shadow: ${props => props.theme.shadows.md};
  }
`

const MediaThumbnail = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: ${props => props.$loaded ? 1 : 0};
  transition: opacity 0.3s ease;
`

const MediaVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const VideoProgressBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: rgba(255, 255, 255, 0.3);
  z-index: 2;
  overflow: hidden;
`

const VideoProgressFill = styled.div`
  height: 100%;
  background-color: ${props => props.theme.colors.accent};
  width: ${props => props.$progress}%;
  transition: width 0.1s linear;
`

const VideoIconOverlay = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: ${props => props.theme.borderRadius.sm};
  z-index: 3;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
  pointer-events: none;

  svg {
    width: 1rem;
    height: 1rem;
    color: rgba(255, 255, 255, 0.8);
  }
`

const Placeholder = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    ${props => props.theme.colors.border} 0%, 
    ${props => props.theme.colors.background} 50%, 
    ${props => props.theme.colors.border} 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`

const SkeletonItem = styled.div`
  aspect-ratio: 1;
  background: linear-gradient(90deg, 
    ${props => props.theme.colors.border} 0%, 
    ${props => props.theme.colors.background} 50%, 
    ${props => props.theme.colors.border} 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: ${props => props.theme.borderRadius.sm};
  
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`

const VideoOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  transition: background 0.2s ease;

  ${MediaItem}:hover & {
    background: rgba(0, 0, 0, 0.2);
  }
`

const PlayIcon = styled.div`
  width: 3rem;
  height: 3rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: ${props => props.theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.accent};

  svg {
    width: 1.5rem;
    height: 1.5rem;
    margin-left: 0.25rem;
  }
`

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.sizes.base};
`

const LoadingState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.sizes.base};
`

const LoadMoreTrigger = styled.div`
  height: 100px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`

const SubmitBadge = styled.div`
  display: inline-flex;
  align-items: center;
  position: relative;
  margin-left: 0.5rem;
`

const SubmitButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background-color: ${props => props.theme.colors.accent}15;
  border: 1px solid ${props => props.theme.colors.accent}40;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.sizes.xs};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.accent};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.accent}25;
    border-color: ${props => props.theme.colors.accent}60;
  }

  svg {
    width: 0.875rem;
    height: 0.875rem;
    transition: transform 0.2s ease;
  }

  svg:last-child {
    transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  }
`

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  background-color: ${props => props.theme.colors.cardBackground};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.lg};
  min-width: 200px;
  z-index: 100;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transform: ${props => props.$isOpen ? 'translateY(0)' : 'translateY(-10px)'};
  transition: opacity 0.2s ease, visibility 0.2s ease, transform 0.2s ease;
`

const DropdownItem = styled.a`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: ${props => props.theme.colors.text.primary};
  text-decoration: none;
  font-size: ${props => props.theme.typography.sizes.sm};
  transition: background-color 0.2s ease;
  border-bottom: 1px solid ${props => props.theme.colors.border};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${props => props.theme.colors.background};
  }

  svg {
    width: 1rem;
    height: 1rem;
    color: ${props => props.theme.colors.text.secondary};
  }
`

const ToggleContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`

const ToggleLabel = styled.label`
  font-size: ${props => props.theme.typography.sizes.sm};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.text.primary};
  white-space: nowrap;
`

const ToggleWrapper = styled.div`
  position: relative;
  display: flex;
  background-color: ${props => props.theme.colors.background};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: 0.25rem;
  overflow: hidden;
`

const ToggleSlider = styled.div`
  position: absolute;
  top: 0.25rem;
  left: ${props => {
    if (props.$value === 'both') return '0.25rem'
    if (props.$value === 'images') return 'calc(33.333% + 0.125rem)'
    return 'calc(66.666% + 0.125rem)'
  }};
  width: calc(33.333% - 0.5rem);
  height: calc(100% - 0.5rem);
  background-color: ${props => props.theme.colors.accent};
  border-radius: ${props => props.theme.borderRadius.sm};
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
`

const ToggleOption = styled.button`
  position: relative;
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: ${props => props.theme.typography.sizes.sm};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.$active ? props.theme.colors.cardBackground : props.theme.colors.text.secondary};
  background: transparent;
  border: none;
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  transition: color 0.2s ease;
  z-index: 1;

  &:hover {
    color: ${props => props.$active ? props.theme.colors.cardBackground : props.theme.colors.text.primary};
  }
`

const ResultsCount = styled.div`
  text-align: center;
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 1.5rem;
`

const ITEMS_PER_BATCH = 24

// Lazy loaded image component with Intersection Observer and thumbnail fallback
function LazyImage({ src, alt, thumbnail, onLoad }) {
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(false)
  const [useThumbnail, setUseThumbnail] = useState(true)
  const [imageSrc, setImageSrc] = useState(thumbnail || src)
  const imgRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
      
      // Explicit initial check for items already in view
      // IntersectionObserver checks immediately, but this ensures it works
      const rect = imgRef.current.getBoundingClientRect()
      const isInViewport = rect.top < window.innerHeight + 50 && rect.bottom > -50
      if (isInViewport) {
        setInView(true)
        observer.disconnect()
      }
    }

    return () => {
      if (imgRef.current) {
        observer.disconnect()
      }
    }
  }, [])

  const handleLoad = () => {
    setLoaded(true)
    if (onLoad) onLoad()
  }

  const handleError = () => {
    // If thumbnail fails to load, fallback to full image
    if (useThumbnail && thumbnail && thumbnail !== src) {
      setUseThumbnail(false)
      setImageSrc(src)
    } else {
      // If full image also fails, just show placeholder
      setLoaded(true) // Stop showing loading state
    }
  }

  return (
    <div ref={imgRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {!loaded && <Placeholder />}
      {inView && (
        <MediaThumbnail
          src={imageSrc}
          alt={alt}
          $loaded={loaded}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
    </div>
  )
}

// Lazy loaded video component for grid view (muted, looped, autoplay)
// Uses optimized video URL for grid view to save data
function LazyVideo({ src, gridUrl, thumbnail, alt }) {
  const [inView, setInView] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const videoRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const nowInView = entry.isIntersecting
          
          setInView(nowInView)
          
          // Reset loading state when going out of view (so icon shows again if video needs to reload)
          if (!nowInView) {
            setIsVideoLoaded(false)
          }
          
          // Pause video when it goes out of view, play when in view
          if (videoRef.current) {
            if (nowInView && !isPlaying) {
              videoRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(err => console.log('Video autoplay prevented:', err))
            } else if (!nowInView && isPlaying) {
              videoRef.current.pause()
              setIsPlaying(false)
            }
          }
        })
      },
      {
        rootMargin: '50px',
        threshold: 0.5 // Trigger when 50% visible
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
      
      // Explicit initial check for videos already in view
      // IntersectionObserver checks immediately, but this ensures it works
      const rect = containerRef.current.getBoundingClientRect()
      const isInViewport = rect.top < window.innerHeight + 50 && rect.bottom > -50
      if (isInViewport) {
        const nowInView = true
        setInView(nowInView)
        
        // Try to play if in view
        if (videoRef.current && !isPlaying) {
          videoRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(err => console.log('Video autoplay prevented:', err))
        }
      }
    }

    return () => {
      if (containerRef.current) {
        observer.disconnect()
      }
    }
  }, [isPlaying])

  // Track video progress
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateProgress = () => {
      if (video.duration) {
        const currentProgress = (video.currentTime / video.duration) * 100
        setProgress(currentProgress)
        setDuration(video.duration)
      }
    }

    const handleTimeUpdate = () => {
      updateProgress()
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    const handleCanPlay = () => {
      // Video has loaded enough data to start playing
      setIsVideoLoaded(true)
    }

    const handleEnded = () => {
      // Reset progress when video loops
      setProgress(0)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('ended', handleEnded)
    }
  }, [inView, isPlaying])

  // Use optimized grid URL if available, otherwise fall back to original
  const videoSrc = gridUrl || src

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {!inView && thumbnail && (
        <MediaThumbnail
          src={thumbnail}
          alt={alt}
          $loaded={true}
        />
      )}
      {!inView && !thumbnail && <Placeholder />}
      {inView && (
        <>
          <MediaVideo
            ref={videoRef}
            src={videoSrc}
            poster={thumbnail} // Show thumbnail while loading
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
          />
          {!isVideoLoaded && (
            <VideoIconOverlay $visible={!isVideoLoaded}>
              <Video />
            </VideoIconOverlay>
          )}
          {duration > 0 && (
            <VideoProgressBar>
              <VideoProgressFill $progress={progress} />
            </VideoProgressBar>
          )}
        </>
      )}
    </div>
  )
}

export default function Gallery() {
  const [galleryItems, setGalleryItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visibleItems, setVisibleItems] = useState(ITEMS_PER_BATCH)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [filter, setFilter] = useState('both') // 'both', 'images', 'videos'
  const [submitDropdownOpen, setSubmitDropdownOpen] = useState(false)
  const loadMoreRef = useRef(null)
  const submitDropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (submitDropdownRef.current && !submitDropdownRef.current.contains(event.target)) {
        setSubmitDropdownOpen(false)
      }
    }

    if (submitDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [submitDropdownOpen])

  const handleEmailSubmit = () => {
    window.location.href = 'mailto:billgrewalpics@gmail.com?subject=Photo Submission for Baljit Grewal Memorial'
    setSubmitDropdownOpen(false)
  }

  const handleWhatsAppSubmit = () => {
    window.open('https://chat.whatsapp.com/LnVkCDqrNJL1jvXDMJp8iD?mode=gi_t', '_blank', 'noopener,noreferrer')
    setSubmitDropdownOpen(false)
  }

  const handleOtherSubmit = () => {
    const subject = encodeURIComponent('Upload type - other')
    const body = encodeURIComponent('Hi i have images of Baljit. can you send me upload instructions? My name is _____ and my cell is _______.')
    window.location.href = `mailto:billgrewalpics@gmail.com?subject=${subject}&body=${body}`
    setSubmitDropdownOpen(false)
  }

  // Load images from JSON file
  useEffect(() => {
    const loadGalleryData = async () => {
      try {
        const response = await fetch('/images/images.json')
        const imageList = await response.json()
        
        // Convert filenames/URLs to gallery items
        // Supports both local paths (e.g., "image.jpg") and CDN URLs (e.g., "https://res.cloudinary.com/...")
        const items = imageList.map((item) => {
          // Check if it's a CDN URL or local filename
          const isUrl = item.startsWith('http://') || item.startsWith('https://')
          
          let filename, url, thumbnail
          if (isUrl) {
            // It's a CDN URL
            url = item
            thumbnail = item
            // Extract filename from URL for display
            filename = item.split('/').pop().split('?')[0] // Get last part of URL, remove query params
          } else {
            // It's a local filename
            filename = item
            url = `/images/${item}`
          }
          
          const lowerFilename = filename.toLowerCase()
          const isGif = lowerFilename.endsWith('.gif')
          
          // Detect videos: check for file extension OR Cloudinary video URL
          const isVideo = lowerFilename.match(/\.(mp4|webm|mov)$/i) || 
                         (isUrl && url.includes('/video/upload/'))
          
          // Generate thumbnail and optimized URLs
          if (isUrl && !isVideo && !isGif && url.includes('/image/upload/')) {
            // For Cloudinary images, generate thumbnail URL with transformation
            // w_400 = width 400px, c_fill = fill crop, f_jpg = format JPG, q_auto = auto quality
            thumbnail = url.replace('/image/upload/', '/image/upload/w_400,h_400,c_fill,f_jpg,q_auto/')
          } else if (!isUrl && !isVideo && !isGif) {
            // For local images, use thumbnail (always .jpg, regardless of original format)
            const baseName = filename.replace(/\.[^/.]+$/, '')
            thumbnail = `/images/thumbnails/${baseName}.jpg`
          } else if (isVideo && isUrl && url.includes('/video/upload/')) {
            // For Cloudinary videos:
            // - thumbnail: Generate a static JPG frame from the video
            // - gridUrl: Optimized video for grid view (smaller file size)
            // - lightboxUrl: Full quality for lightbox
            thumbnail = getOptimizedCloudinaryUrl(url, 'video-thumbnail')
            // Store both optimized and full quality URLs
            return {
              filename,
              url: getOptimizedCloudinaryUrl(url, 'video-lightbox'), // Full quality for lightbox
              gridUrl: getOptimizedCloudinaryUrl(url, 'video-grid'), // Optimized for grid
              thumbnail,
              type: 'video',
              alt: filename.replace(/\.[^/.]+$/, '')
            }
          } else {
            // For local videos/GIFs, use the file itself
            thumbnail = url
          }
          
          return {
            filename,
            url,
            thumbnail,
            type: isGif ? 'gif' : isVideo ? 'video' : 'image',
            alt: filename.replace(/\.[^/.]+$/, '') // Remove extension for alt text
          }
        })
        
        setGalleryItems(items)
      } catch (error) {
        console.error('Error loading gallery images:', error)
        setGalleryItems([])
      } finally {
        setLoading(false)
      }
    }

    loadGalleryData()
  }, [])

  // Filter items based on selected filter
  const filteredItems = useMemo(() => {
    if (filter === 'both') {
      return galleryItems
    } else if (filter === 'images') {
      return galleryItems.filter(item => item.type === 'image')
    } else if (filter === 'videos') {
      return galleryItems.filter(item => item.type === 'gif' || item.type === 'video')
    }
    return galleryItems
  }, [galleryItems, filter])

  // Reset visible items when filter changes
  useEffect(() => {
    setVisibleItems(ITEMS_PER_BATCH)
  }, [filter])

  // Infinite scroll - observe when user scrolls near bottom
  useEffect(() => {
    if (loading || visibleItems >= filteredItems.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true)
          
          // Simulate a small delay for better UX (shows loading skeletons)
          setTimeout(() => {
            setVisibleItems(prev => Math.min(prev + ITEMS_PER_BATCH, filteredItems.length))
            setIsLoadingMore(false)
          }, 300) // Small delay to show loading state
        }
      },
      {
        rootMargin: '200px', // Start loading when 200px before trigger
        threshold: 0.1
      }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => {
      if (loadMoreRef.current) {
        observer.disconnect()
      }
    }
  }, [loading, visibleItems, filteredItems.length, isLoadingMore])

  // Get items to display
  const displayedItems = filteredItems.slice(0, visibleItems)
  const hasMore = visibleItems < filteredItems.length

  const openLightbox = (index) => {
    // Find the actual index in the filtered items array
    const actualIndex = filteredItems.findIndex(
      item => item === displayedItems[index]
    )
    setCurrentIndex(actualIndex)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const goToNext = () => {
    if (currentIndex < filteredItems.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  if (loading) {
    return (
      <Card id="gallery">
        <Title>
          <Images size={28} />
          Gallery
        </Title>
        <LoadingState>Loading gallery...</LoadingState>
      </Card>
    )
  }

  if (galleryItems.length === 0) {
    return (
      <Card id="gallery">
        <Title>
          <Images size={28} />
          Gallery
        </Title>
        <EmptyState>
          Gallery images will be added soon. Please add images to the <code>public/images/</code> folder and update <code>public/images/images.json</code>.
        </EmptyState>
      </Card>
    )
  }

  return (
    <>
      <Card id="gallery">
        <Title>
          <Images size={28} />
          Gallery
          <SubmitBadge ref={submitDropdownRef}>
            <SubmitButton
              onClick={() => setSubmitDropdownOpen(!submitDropdownOpen)}
              $isOpen={submitDropdownOpen}
              aria-label="Submit your pictures"
            >
              Submit your pictures!
              <ChevronDown size={14} />
            </SubmitButton>
            <Dropdown $isOpen={submitDropdownOpen}>
              <DropdownItem
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  handleEmailSubmit()
                }}
              >
                <Mail size={16} />
                Email Files
              </DropdownItem>
              <DropdownItem
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  handleWhatsAppSubmit()
                }}
              >
                <MessageCircle size={16} />
                Share via WhatsApp
              </DropdownItem>
              <DropdownItem
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  handleOtherSubmit()
                }}
              >
                <Mail size={16} />
                Other
              </DropdownItem>
            </Dropdown>
          </SubmitBadge>
        </Title>

        <ToggleContainer>
          <ToggleLabel>Media Type</ToggleLabel>
          <ToggleWrapper>
            <ToggleSlider $value={filter} />
            <ToggleOption
              $active={filter === 'both'}
              onClick={() => setFilter('both')}
              aria-label="Show all media"
            >
              Both
            </ToggleOption>
            <ToggleOption
              $active={filter === 'images'}
              onClick={() => setFilter('images')}
              aria-label="Show images only"
            >
              Images
            </ToggleOption>
            <ToggleOption
              $active={filter === 'videos'}
              onClick={() => setFilter('videos')}
              aria-label="Show videos only"
            >
              Videos
            </ToggleOption>
          </ToggleWrapper>
        </ToggleContainer>

        <ResultsCount>
          Showing {displayedItems.length} of {filteredItems.length} {filter === 'both' ? 'items' : filter === 'images' ? 'images' : 'videos'}
        </ResultsCount>

        <Grid>
          {displayedItems.map((item, index) => (
            <MediaItem
              key={`${item.filename}-${index}`}
              onClick={() => openLightbox(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openLightbox(index)
                }
              }}
              aria-label={`View ${item.alt || item.filename}`}
            >
              {item.type === 'video' ? (
                <LazyVideo
                  src={item.url}
                  gridUrl={item.gridUrl}
                  thumbnail={item.thumbnail}
                  alt={item.alt || item.filename}
                />
              ) : item.type === 'gif' ? (
                <LazyImage
                  src={item.url}
                  thumbnail={item.thumbnail}
                  alt={item.alt || item.filename}
                />
              ) : (
                <LazyImage
                  src={item.url}
                  thumbnail={item.thumbnail}
                  alt={item.alt || item.filename}
                />
              )}
            </MediaItem>
          ))}

          {/* Loading skeletons when loading more */}
          {isLoadingMore && hasMore && Array.from({ length: ITEMS_PER_BATCH }).map((_, i) => (
            <SkeletonItem key={`skeleton-${i}`} />
          ))}
        </Grid>

        {/* Trigger element for infinite scroll */}
        {hasMore && (
          <LoadMoreTrigger ref={loadMoreRef}>
            {isLoadingMore && (
              <LoadingState style={{ padding: '1rem' }}>
                Loading more images...
              </LoadingState>
            )}
          </LoadMoreTrigger>
        )}

        {!hasMore && displayedItems.length > 0 && (
          <ResultsCount style={{ marginTop: '2rem' }}>
            All images loaded
          </ResultsCount>
        )}
      </Card>

      {lightboxOpen && filteredItems.length > 0 && (
        <Lightbox
          item={filteredItems[currentIndex]}
          items={filteredItems}
          currentIndex={currentIndex}
          onClose={closeLightbox}
          onNext={goToNext}
          onPrevious={goToPrevious}
        />
      )}
    </>
  )
}
