import Layout from '../../components/Layout'
import Navbar from '../../components/Navbar'
import Profile from './Profile'
import VideoSection from './VideoSection'
import Gallery from './Gallery'
import ProfileSkeleton from '../../components/Skeletons/ProfileSkeleton'
import MemoriesSkeleton from '../../components/Skeletons/MemoriesSkeleton'
import GallerySkeleton from '../../components/Skeletons/GallerySkeleton'
import { usePerson } from '../../contexts/PersonContext'

/**
 * MemorialProfile ProfilePage - Composes all memorial page components
 * Uses context hooks to get data (no props needed)
 */
export default function ProfilePage() {
  const { loading, memorialData, eventData } = usePerson()

  return (
    <>
      <Navbar />
      <div style={{ minHeight: '100vh' }}>
        <Layout>
          {loading ? (
            <>
              <ProfileSkeleton />
              <MemoriesSkeleton />
              <GallerySkeleton />
            </>
          ) : (
            <>
              <Profile />
              <VideoSection />
              <Gallery />
            </>
          )}
        </Layout>
      </div>
    </>
  )
}
