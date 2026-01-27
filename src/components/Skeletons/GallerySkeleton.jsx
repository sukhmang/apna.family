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
  width: 40%;
  max-width: 200px;
  margin-bottom: 1.5rem;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  
  @media (min-width: 640px) {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
  }
`

const ImageSkeleton = styled(SkeletonBase)`
  width: 100%;
  padding-bottom: 100%; /* Square aspect ratio */
  border-radius: ${props => props.theme.borderRadius.md};
`

export default function GallerySkeleton() {
  return (
    <Card>
      <TitleSkeleton />
      <Grid>
        {[...Array(6)].map((_, i) => (
          <ImageSkeleton key={i} />
        ))}
      </Grid>
    </Card>
  )
}
