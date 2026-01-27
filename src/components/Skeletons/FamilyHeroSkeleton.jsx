import styled, { keyframes } from 'styled-components'

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
  text-align: center;
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
  margin: 0 auto;
`

const TitleSkeleton = styled(SkeletonBase)`
  height: 3rem;
  width: 60%;
  max-width: 400px;
  margin-bottom: 1rem;
`

const DescriptionSkeleton = styled(SkeletonBase)`
  height: 1.5rem;
  width: 80%;
  max-width: 500px;
  margin-bottom: 3rem;
`

const LinkSkeleton = styled(SkeletonBase)`
  height: 3rem;
  width: 70%;
  max-width: 300px;
  margin-bottom: 1rem;
`

const LinkList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
`

export default function FamilyHeroSkeleton() {
  return (
    <Container>
      <TitleSkeleton />
      <DescriptionSkeleton />
      <LinkList>
        <LinkSkeleton />
        <LinkSkeleton />
        <LinkSkeleton />
      </LinkList>
    </Container>
  )
}
