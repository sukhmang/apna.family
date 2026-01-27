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
  padding: 1rem;
  margin-bottom: 1.5rem;

  @media (min-width: 640px) {
    padding: 1.25rem;
  }
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
    gap: 1.5rem;
  }
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

const ImageSkeleton = styled(SkeletonBase)`
  width: 6rem;
  height: 6rem;
  border-radius: ${props => props.theme.borderRadius.full};
  flex-shrink: 0;

  @media (min-width: 640px) {
    width: 7rem;
    height: 7rem;
  }
`

const TextContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  width: 100%;

  @media (min-width: 640px) {
    align-items: flex-start;
    gap: 0.375rem;
  }
`

const NameSkeleton = styled(SkeletonBase)`
  height: 2rem;
  width: 60%;
  max-width: 300px;
`

const DatesSkeleton = styled(SkeletonBase)`
  height: 1.25rem;
  width: 40%;
  max-width: 200px;
`

const TextSkeleton = styled(SkeletonBase)`
  height: 1rem;
  width: 100%;
  margin-top: 0.5rem;
  
  &:nth-child(4) {
    width: 80%;
  }
`

const ButtonSkeleton = styled(SkeletonBase)`
  height: 2.75rem;
  width: 120px;
  margin-top: 0.5rem;
  
  @media (min-width: 640px) {
    height: 3rem;
    width: 140px;
  }
`

const ButtonWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  justify-content: center;

  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: flex-start;
    width: auto;
  }
`

export default function ProfileSkeleton() {
  return (
    <Card>
      <Content>
        <ImageSkeleton />
        <TextContent>
          <NameSkeleton />
          <DatesSkeleton />
          <TextSkeleton />
          <TextSkeleton />
          <ButtonWrapper>
            <ButtonSkeleton />
            <ButtonSkeleton />
          </ButtonWrapper>
        </TextContent>
      </Content>
    </Card>
  )
}
