import styled from 'styled-components'
import { BookOpen } from 'lucide-react'

const Card = styled.div`
  background-color: ${props => props.theme.colors.cardBackground};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.lg};
  padding: 2rem;
  margin-bottom: 1.5rem;
`

const Title = styled.h2`
  font-size: ${props => props.theme.typography.sizes['2xl']};
  font-weight: ${props => props.theme.typography.weights.bold};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const SubmitButton = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  background-color: ${props => props.theme.colors.accent}15;
  border: 1px solid ${props => props.theme.colors.accent}40;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.sizes.xs};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.accent};
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 0.5rem;

  &:hover {
    background-color: ${props => props.theme.colors.accent}25;
    border-color: ${props => props.theme.colors.accent}60;
  }
`

const ComingSoonBadge = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  background-color: ${props => props.theme.colors.text.secondary}15;
  border: 1px solid ${props => props.theme.colors.text.secondary}40;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.sizes.xs};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.text.secondary};
  margin-left: 0.5rem;
`

const Content = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.sizes.base};
  line-height: 1.6;
`

export default function StoriesCard() {
  const handleEmailSubmit = () => {
    const subject = encodeURIComponent('My favorite story about Bill Grewal')
    const body = encodeURIComponent('I am ______ and i know Bill in the following way: ______')
    window.location.href = `mailto:billgrewalpics@gmail.com?subject=${subject}&body=${body}`
  }

  return (
    <Card id="stories">
      <Title>
        <BookOpen size={28} />
        Stories
        <ComingSoonBadge>Coming soon</ComingSoonBadge>
        <SubmitButton
          onClick={handleEmailSubmit}
          aria-label="Submit your story"
        >
          Submit your story!
        </SubmitButton>
      </Title>
      <Content>
        Share your memories and stories about Baljit Singh Grewal. Stories will be displayed here soon.
      </Content>
    </Card>
  )
}

