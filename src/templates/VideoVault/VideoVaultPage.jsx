import { useFamily } from '../../contexts/FamilyContext'
import { useState, useEffect } from 'react'
import { loadPersonData } from '../../utils/dataLoader'
import VideoGrid from './VideoGrid'

/**
 * VideoVault Page - Wrapper that provides family context
 * This component loads home videos from the first person in the family
 * TODO: In the future, we might load home videos from family-level data
 */
export default function VideoVaultPage() {
  const { familyId, familyData } = useFamily()
  const [homeVideos, setHomeVideos] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!familyId) {
      setLoading(false)
      return
    }

    // For now, try to load home videos from the first person (baljit for grewal)
    // In the future, this could be family-level data
    const defaultPersonId = 'baljit' // TODO: Make this configurable or load from family data
    
    loadPersonData(familyId, defaultPersonId)
      .then(data => {
        setHomeVideos(data?.homeVideos || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load home videos:', err)
        setHomeVideos([])
        setLoading(false)
      })
  }, [familyId])

  if (loading) {
    return <div>Loading...</div>
  }

  return <VideoGrid homeVideos={homeVideos || []} />
}
