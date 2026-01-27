import { useAuth } from '../contexts/AuthContext'
import { checkFamilyPermission } from '../services/permissionService'
import { getFamilyId, isRootDomain } from '../utils/subdomain'
import { useState, useEffect } from 'react'
import styled from 'styled-components'

const AuthContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
`

const AuthButtonStyled = styled.button`
  padding: 0.5rem 1rem;
  font-size: ${props => props.theme.typography.sizes.sm};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.cardBackground};
  background-color: ${props => props.theme.colors.accent};
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.accentHover};
    transform: translateY(-1px);
  }
`

const UserInfo = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.text.secondary};
`

const CanEditBadge = styled.span`
  padding: 0.25rem 0.5rem;
  font-size: ${props => props.theme.typography.sizes.xs};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: #059669;
  background-color: #d1fae5;
  border-radius: ${props => props.theme.borderRadius.sm};
`

export function AuthButton() {
  const { user, signInWithGoogle, signInWithMicrosoft, signOut, loading: authLoading } = useAuth()
  const familyId = getFamilyId() // Use subdomain utility instead of FamilyContext
  const isRoot = isRootDomain()
  const [canEdit, setCanEdit] = useState(false)
  const [permissionLoading, setPermissionLoading] = useState(true)

  // Only show on root domain
  if (!isRoot) {
    return null
  }

  useEffect(() => {
    if (user && user.email) {
      // Check if user has any edit permissions (super_admin or family admin/editor)
      checkFamilyPermission(user.email, null).then(({ canEdit: edit }) => {
        setCanEdit(edit)
        setPermissionLoading(false)
      }).catch(() => {
        setCanEdit(false)
        setPermissionLoading(false)
      })
    } else {
      setCanEdit(false)
      setPermissionLoading(false)
    }
  }, [user])

  if (authLoading || permissionLoading) {
    return null // Don't show anything while loading
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Google sign-in error:', error)
      alert('Google sign-in is not configured. Please enable Google OAuth in Supabase Dashboard → Authentication → Providers.')
    }
  }

  const handleMicrosoftSignIn = async () => {
    try {
      await signInWithMicrosoft()
    } catch (error) {
      console.error('Microsoft sign-in error:', error)
      alert('Microsoft sign-in is not configured. Please enable Azure OAuth in Supabase Dashboard → Authentication → Providers.')
    }
  }

  if (!user) {
    return (
      <AuthContainer>
        <AuthButtonStyled onClick={handleGoogleSignIn}>
          Sign in with Google
        </AuthButtonStyled>
        <AuthButtonStyled onClick={handleMicrosoftSignIn}>
          Sign in with Microsoft
        </AuthButtonStyled>
      </AuthContainer>
    )
  }

  return (
    <AuthContainer>
      <UserInfo>
        <span>Signed in as {user.email}</span>
        {canEdit && <CanEditBadge>Can Edit</CanEditBadge>}
      </UserInfo>
      <AuthButtonStyled onClick={signOut}>
        Sign Out
      </AuthButtonStyled>
    </AuthContainer>
  )
}
