import Layout from '../../components/Layout'
import Navbar from '../../components/Navbar'
import Profile from './Profile'
import VideoSection from './VideoSection'
import Gallery from './Gallery'

/**
 * MemorialProfile ProfilePage - Composes all memorial page components
 * Uses context hooks to get data (no props needed)
 */
export default function ProfilePage() {
  return (
    <>
      <Navbar />
      <div style={{ minHeight: '100vh' }}>
        <Layout>
          <Profile />
          <VideoSection />
          <Gallery />
        </Layout>
      </div>
    </>
  )
}
