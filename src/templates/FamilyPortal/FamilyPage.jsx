import Layout from '../../components/Layout'
import Navbar from '../../components/Navbar'
import { useFamily } from '../../contexts/FamilyContext'
import FamilyHero from './FamilyHero'
import FamilyHeroSkeleton from '../../components/Skeletons/FamilyHeroSkeleton'

/**
 * FamilyPortal Page - Wrapper that provides family context
 * This component uses the FamilyContext to get family data
 */
export default function FamilyPage() {
  const { familyData, loading } = useFamily()

  return (
    <>
      <Navbar />
      <Layout>
        {loading ? (
          <FamilyHeroSkeleton />
        ) : (
          <FamilyHero familyData={familyData} />
        )}
      </Layout>
    </>
  )
}
