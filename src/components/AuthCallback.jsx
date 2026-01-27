import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
  text-align: center;
`

const LoadingText = styled.p`
  font-size: ${props => props.theme.typography.sizes.lg};
  color: ${props => props.theme.colors.text.secondary};
  margin-top: 1rem;
`

/**
 * AuthCallback - Handles OAuth callback from Google/Microsoft
 * Redirects user back to the app after successful authentication
 */
export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Handle OAuth callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Redirect to home or previous page
          const returnTo = sessionStorage.getItem('returnTo') || '/'
          sessionStorage.removeItem('returnTo')
          navigate(returnTo, { replace: true })
        } else if (event === 'SIGNED_OUT') {
          navigate('/', { replace: true })
        }
      }
    )

    // Also check current session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const returnTo = sessionStorage.getItem('returnTo') || '/'
        sessionStorage.removeItem('returnTo')
        navigate(returnTo, { replace: true })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [navigate])

  return (
    <Container>
      <LoadingText>Signing you in...</LoadingText>
    </Container>
  )
}
