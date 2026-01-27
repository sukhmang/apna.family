import styled from 'styled-components'

const Container = styled.div`
  min-height: 100vh;
  width: 100%;
  background-color: ${props => props.theme.colors.background};
  /* Add padding-top to account for fixed navbar */
  padding-top: 0;
  
  /* Calculate navbar height dynamically - reduced after tightening header */
  @media (max-width: 639px) {
    padding-top: 85px;
  }
  
  @media (min-width: 640px) {
    padding-top: 95px;
  }
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
