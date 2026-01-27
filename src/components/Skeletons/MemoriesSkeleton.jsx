import styled, { keyframes } from 'styled-components'

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`

const Card = styled.div`
  background-color: ${props => props.theme.colors.cardBackground};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.lg};
  padding: 2rem;
  margin-bottom: 1.5rem;
`

const SkeletonBase = styled.div`
  background: linear-gradient(
    90deg,
    ${props => props.theme.colors.background} 0%,
    ${props => props.theme.colors.border} 50%,
    ${props => props.theme.colors.background} 100%
  );
  background-size: 1000px 100%;
  animation: ${shimmer} 2s infinite;
  border-radius: ${props => props.theme.borderRadius.sm};
`

const TitleSkeleton = styled(SkeletonBase)`
  height: 2rem;
  width: 50%;
  max-width: 300px;
  margin-bottom: 1.5rem;
`

const VideoSkeleton = styled(SkeletonBase)`
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: 1.5rem;
`

const StoriesSection = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid ${props => props.theme.colors.border};
`

const StoriesTitleSkeleton = styled(SkeletonBase)`
  height: 2rem;
  width: 40%;
  max-width: 250px;
  margin-bottom: 1.5rem;
`

const StoriesContentSkeleton = styled(SkeletonBase)`
  height: 4rem;
  width: 100%;
  margin-top: 1rem;
`

export default function MemoriesSkeleton() {
  return (
    <Card>
      <TitleSkeleton />
      <VideoSkeleton />
      <VideoSkeleton />
      <StoriesSection>
        <StoriesTitleSkeleton />
        <StoriesContentSkeleton />
      </StoriesSection>
    </Card>
  )
}
