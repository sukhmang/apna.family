import styled from 'styled-components'

const SkeletonContainer = styled.div`
  width: 100%;
  height: 80vh;
  min-height: 600px;
  background-color: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.md};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    height: 70vh;
    min-height: 400px;
  }
`

const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  width: 100%;
  max-width: 1200px;
  padding: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1.5rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
  }
`

const SkeletonNode = styled.div`
  width: 200px;
  height: 250px;
  background-color: ${props => props.theme.colors.cardBackground};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.sm};
  overflow: hidden;
  position: relative;

  @media (max-width: 768px) {
    width: 160px;
    height: 200px;
  }

  @media (max-width: 480px) {
    width: 140px;
    height: 180px;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    );
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% {
      left: -100%;
    }
    100% {
      left: 100%;
    }
  }
`

const SkeletonImage = styled.div`
  width: 100%;
  height: 150px;
  background: linear-gradient(
    135deg,
    ${props => props.theme.colors.border} 0%,
    ${props => props.theme.colors.background} 100%
  );

  @media (max-width: 768px) {
    height: 120px;
  }

  @media (max-width: 480px) {
    height: 100px;
  }
`

const SkeletonContent = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const SkeletonLine = styled.div`
  height: 12px;
  background: linear-gradient(
    90deg,
    ${props => props.theme.colors.border} 0%,
    ${props => props.theme.colors.background} 50%,
    ${props => props.theme.colors.border} 100%
  );
  background-size: 200% 100%;
  border-radius: ${props => props.theme.borderRadius.sm};
  animation: shimmer 1.5s infinite;

  &:nth-child(1) {
    width: 80%;
  }

  &:nth-child(2) {
    width: 60%;
  }

  @media (max-width: 768px) {
    height: 10px;
  }
`

const LoadingText = styled.p`
  font-size: ${props => props.theme.typography.sizes.lg};
  color: ${props => props.theme.colors.text.secondary};
  margin-top: 2rem;
  text-align: center;
`

/**
 * TreeSkeleton - Loading state for family tree
 * Shows animated skeleton nodes while tree is loading
 */
export default function TreeSkeleton() {
  // Generate skeleton nodes (6-8 nodes for visual effect)
  const skeletonNodes = Array.from({ length: 8 }, (_, i) => i)

  return (
    <SkeletonContainer>
      <SkeletonGrid>
        {skeletonNodes.map((index) => (
          <SkeletonNode key={index}>
            <SkeletonImage />
            <SkeletonContent>
              <SkeletonLine />
              <SkeletonLine />
            </SkeletonContent>
          </SkeletonNode>
        ))}
      </SkeletonGrid>
      <LoadingText>Loading family tree...</LoadingText>
    </SkeletonContainer>
  )
}
