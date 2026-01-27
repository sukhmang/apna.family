import styled from 'styled-components'
import { Play } from 'lucide-react'
import { usePerson } from '../../contexts/PersonContext'

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
    text-align: left;
  }
`

const ImageWrapper = styled.div`
  flex-shrink: 0;
`

const Portrait = styled.img`
  width: 6rem;
  height: 6rem;
  border-radius: ${props => props.theme.borderRadius.full};
  object-fit: cover;
  border: 3px solid ${props => props.theme.colors.border};

  @media (min-width: 640px) {
    width: 7rem;
    height: 7rem;
  }
`

const TextContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
  gap: 0.5rem;

  @media (min-width: 640px) {
    align-items: flex-start;
    text-align: left;
    gap: 0.375rem;
  }
`

const Name = styled.h1`
  font-size: ${props => props.theme.typography.sizes.xl};
  font-weight: ${props => props.theme.typography.weights.bold};
  color: ${props => props.theme.colors.text.primary};
  margin: 0;
  line-height: 1.2;

  @media (min-width: 640px) {
    font-size: ${props => props.theme.typography.sizes['2xl']};
  }
`

const Dates = styled.p`
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.text.secondary};
  margin: 0;
  line-height: 1.3;

  @media (min-width: 640px) {
    font-size: ${props => props.theme.typography.sizes.base};
  }
`

const WelcomeText = styled.p`
  font-size: ${props => props.theme.typography.sizes.xs};
  color: ${props => props.theme.colors.text.tertiary};
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media (min-width: 640px) {
    font-size: ${props => props.theme.typography.sizes.sm};
    -webkit-line-clamp: 3;
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

const CTAButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: ${props => props.theme.typography.sizes.sm};
  font-weight: ${props => props.theme.typography.weights.bold};
  color: ${props => props.theme.colors.cardBackground};
  background-color: ${props => props.theme.colors.accent};
  border: none;
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  margin-top: 0.5rem;

  &:hover {
    background-color: ${props => props.theme.colors.accentHover};
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  @media (min-width: 640px) {
    font-size: ${props => props.theme.typography.sizes.base};
    padding: 0.875rem 1.75rem;
    margin-top: 0.25rem;
  }
`

export default function Profile() {
  const { memorialData } = usePerson()
  
  if (!memorialData) {
    return null
  }

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const nav = document.querySelector('nav')
      const navHeight = nav ? nav.offsetHeight : 80
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - navHeight - 20
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  return (
    <Card id="profile">
      <Content>
        <ImageWrapper>
          <Portrait
            src={memorialData.portraitImage}
            alt={memorialData.name}
          />
        </ImageWrapper>
        
        <TextContent>
          <Name>{memorialData.name}</Name>
          <Dates>
            {memorialData.birthDate && memorialData.deathDate 
              ? `${memorialData.birthDate} - ${memorialData.deathDate}`
              : `${memorialData.birthYear} – ${memorialData.deathYear}`
            }
          </Dates>
          <WelcomeText>
            {memorialData.welcomeMessage}
          </WelcomeText>
          <ButtonWrapper>
            <CTAButton onClick={() => scrollToSection('memories')} aria-label="Memories">
              <Play fill="currentColor" />
              Memories
            </CTAButton>
            <CTAButton onClick={() => scrollToSection('memories')} aria-label="Service">
              <Play fill="currentColor" />
              Service
            </CTAButton>
          </ButtonWrapper>
        </TextContent>
      </Content>
    </Card>
  )
}
