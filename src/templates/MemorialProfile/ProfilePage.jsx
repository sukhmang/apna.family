import Layout from '../../components/Layout'
import Navbar from '../../components/Navbar'
import Hero from './Hero'
import VideoSection from './VideoSection'
import Events from './Events'
import Stories from './Stories'
import Gallery from './Gallery'

/**
 * MemorialProfile ProfilePage - Composes all memorial page components
 * Uses context hooks to get data (no props needed)
 */
export default function ProfilePage() {
  return (
    <>
      <Navbar />
      <Layout>
        <Hero />
        <VideoSection />
        {/* Events section - can be shown/hidden based on data */}
        {/* <Events /> */}
        <Stories />
        <Gallery />
      </Layout>
    </>
  )
}
