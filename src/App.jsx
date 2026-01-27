import { ThemeProvider } from 'styled-components'
import { BrowserRouter, Routes, Route, useParams, useLocation } from 'react-router-dom'
import { theme } from './styles/theme'
import { GlobalStyles } from './styles/GlobalStyles'
import { FamilyProvider } from './contexts/FamilyContext'
import { PersonProvider } from './contexts/PersonContext'
import { parseSubdomain, isRootDomain } from './utils/subdomain'
import OVERRIDES from './overrideRegistry'

// Templates
import GlobalTreeLanding from './templates/GlobalTree/LandingPage'
import FamilyPortal from './templates/FamilyPortal/FamilyPage'
import MemorialProfile from './templates/MemorialProfile/MemorialPage'
import VideoVault from './templates/VideoVault/VideoVaultPage'

/**
 * Person Route Handler - Checks for custom override or uses template
 */
function PersonRoute() {
  const { personId } = useParams()
  const { familyId } = parseSubdomain(
    typeof window !== 'undefined' ? window.location.hostname : ''
  )

  // Check for custom override first
  const CustomPersonComponent = OVERRIDES.people[familyId]?.[personId]

  if (CustomPersonComponent) {
    // Use custom component
    return (
      <FamilyProvider>
        <CustomPersonComponent />
      </FamilyProvider>
    )
  }

  // Use standard template with contexts
  return (
    <FamilyProvider>
      <PersonProvider personId={personId}>
        <MemorialProfile />
      </PersonProvider>
    </FamilyProvider>
  )
}

/**
 * Family Landing Route Handler - Checks for custom override or uses template
 */
function FamilyLandingRoute() {
  const { familyId } = parseSubdomain(
    typeof window !== 'undefined' ? window.location.hostname : ''
  )

  // Check for custom override first
  const CustomFamilyComponent = OVERRIDES.families[familyId]

  if (CustomFamilyComponent) {
    // Use custom component
    return (
      <FamilyProvider>
        <CustomFamilyComponent />
      </FamilyProvider>
    )
  }

  // Use standard template
  return (
    <FamilyProvider>
      <FamilyPortal />
    </FamilyProvider>
  )
}

/**
 * Root Routes - Handles routing based on subdomain
 */
function RootRoutes() {
  const isRoot = isRootDomain()

  // Root domain: Show GlobalTree
  if (isRoot) {
    return (
      <Routes>
        <Route path="/" element={<GlobalTreeLanding />} />
      </Routes>
    )
  }

  // Family subdomain: Route based on path
  return (
    <Routes>
      <Route path="/homevideos" element={
        <FamilyProvider>
          <VideoVault />
        </FamilyProvider>
      } />
      <Route path="/:personId" element={<PersonRoute />} />
      <Route path="/" element={<FamilyLandingRoute />} />
    </Routes>
  )
}

/**
 * Main App Component - Traffic Controller
 * Routes based on subdomain and path
 */
function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <BrowserRouter>
        <RootRoutes />
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
