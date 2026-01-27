import { ThemeProvider } from 'styled-components'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { theme } from './styles/theme'
import { GlobalStyles } from './styles/GlobalStyles'
import Layout from './components/Layout'
import Hero from './components/Hero'
import StickyNav from './components/StickyNav'
import LivestreamCard from './components/LivestreamCard'
import EventDetailsCard from './components/EventDetailsCard'
import StoriesCard from './components/StoriesCard'
import Gallery from './components/Gallery'
import HomeVideos from './components/HomeVideos'

function MemorialPage() {
  return (
    <>
      <StickyNav />
      <Layout>
        <Hero />
        <LivestreamCard />
        {/* Events section hidden - events are now finished */}
        {/* <EventDetailsCard /> */}
        <StoriesCard />
        <Gallery />
      </Layout>
    </>
  )
}

function App() {
  // Detect if we're on the homevideos subdomain
  const isHomeVideosSubdomain = typeof window !== 'undefined' && 
    window.location.hostname.startsWith('homevideos.')

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <BrowserRouter>
        <Routes>
          {isHomeVideosSubdomain ? (
            // On subdomain: serve HomeVideos on root path
            <Route path="/" element={<HomeVideos />} />
          ) : (
            // On main domain: normal routing
            <>
              <Route path="/" element={<MemorialPage />} />
              {/* /homevideos route will redirect via vercel.json */}
            </>
          )}
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
