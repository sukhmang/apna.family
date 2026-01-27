import styled from 'styled-components'

const Container = styled.div`
  min-height: 100vh;
  width: 100%;
  background-color: ${props => props.theme.colors.background};
`

const ContentWrapper = styled.div`
  margin: 0 auto;
  max-width: 600px;
  width: 100%;
  padding: 1.5rem 1rem;

  @media (min-width: 640px) {
    padding: 2rem 1.5rem;
  }
`

export default function Layout({ children }) {
  return (
    <Container>
      <ContentWrapper>
        {children}
      </ContentWrapper>
    </Container>
  )
}
