import Layout from '../../components/Layout'
import Navbar from '../../components/Navbar'
import { useFamily } from '../../contexts/FamilyContext'
import FamilyHero from './FamilyHero'

/**
 * FamilyPortal Page - Wrapper that provides family context
 * This component uses the FamilyContext to get family data
 */
export default function FamilyPage() {
  const { familyData, loading } = useFamily()

  if (loading) {
    return (
      <>
        <Navbar />
        <Layout>
          <div>Loading...</div>
        </Layout>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <Layout>
        <FamilyHero familyData={familyData} />
      </Layout>
    </>
  )
}
