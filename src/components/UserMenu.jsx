import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getUserPermissions } from '../services/permissionService'
import { getFamilyById } from '../services/familyService'
import { isRootDomain } from '../utils/subdomain'
import styled from 'styled-components'
import { ChevronDown, LogOut, Shield } from 'lucide-react'

const UserMenuContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin-left: auto;
  z-index: 10;
`

const GoogleSignInButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: ${props => props.theme.typography.sizes.sm};
  font-weight: ${props => props.theme.typography.weights.medium};
  color: #3c4043;
  background-color: #ffffff;
  border: 1px solid #dadce0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);

  &:hover {
    box-shadow: 0 1px 3px 0 rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15);
    background-color: #f8f9fa;
  }

  &:active {
    box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <g fill="#000" fillRule="evenodd">
      <path d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z" fill="#EA4335"/>
      <path d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.21 1.18-.84 2.47-2.04 3.46l2.84 2.2c2.01-1.85 3.17-4.57 3.17-7.16z" fill="#4285F4"/>
      <path d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z" fill="#FBBC05"/>
      <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.4-1.57-5.12-3.74L.96 13.04C2.45 15.98 5.48 18 9 18z" fill="#34A853"/>
    </g>
  </svg>
)

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: none;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.full};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.background};
    border-color: ${props => props.theme.colors.accent};
  }
`

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${props => props.theme.borderRadius.full};
  background: linear-gradient(135deg, ${props => props.theme.colors.accent} 0%, ${props => props.theme.colors.accentHover} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${props => props.theme.typography.weights.semibold};
  font-size: ${props => props.theme.typography.sizes.sm};
  flex-shrink: 0;
`

const AvatarImage = styled.img`
  width: 32px;
  height: 32px;
  border-radius: ${props => props.theme.borderRadius.full};
  object-fit: cover;
  flex-shrink: 0;
`

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 280px;
  background-color: ${props => props.theme.colors.cardBackground};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.lg};
  z-index: 1000;
  overflow: hidden;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transform: ${props => props.$isOpen ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all 0.2s ease;
`

const DropdownHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`

const UserEmail = styled.div`
  font-size: ${props => props.theme.typography.sizes.sm};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 0.25rem;
`

const UserRole = styled.div`
  font-size: ${props => props.theme.typography.sizes.xs};
  color: ${props => props.theme.colors.text.secondary};
`

const DropdownSection = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`

const SectionTitle = styled.div`
  font-size: ${props => props.theme.typography.sizes.xs};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
`

const FamilyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const FamilyItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.text.primary};
`

const DropdownAction = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  text-align: left;
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.background};
  }

  svg {
    width: 16px;
    height: 16px;
    color: ${props => props.theme.colors.text.secondary};
  }
`

export function UserMenu() {
  const { user, signInWithGoogle, signOut, loading: authLoading } = useAuth()
  const isRoot = isRootDomain()
  const [isOpen, setIsOpen] = useState(false)
  const [permissions, setPermissions] = useState([])
  const [familyNames, setFamilyNames] = useState({})
  const [loadingPermissions, setLoadingPermissions] = useState(false)
  const dropdownRef = useRef(null)

  // Debug: Log to verify component is rendering
  useEffect(() => {
    console.log('🔍 UserMenu Debug:', { 
      isRoot, 
      authLoading, 
      hasUser: !!user,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A'
    })
  }, [isRoot, authLoading, user])

  useEffect(() => {
    if (user && user.email) {
      setLoadingPermissions(true)
      getUserPermissions(user.email)
        .then(async (perms) => {
          setPermissions(perms || [])
          
          // Fetch family display names for family permissions
          const familyIds = perms
            .filter(p => p.family_id && p.role !== 'super_admin')
            .map(p => p.family_id)
          
          if (familyIds.length > 0) {
            const names = {}
            await Promise.all(
              familyIds.map(async (familyId) => {
                try {
                  const family = await getFamilyById(familyId)
                  if (family) {
                    names[familyId] = family.display_name || familyId
                  }
                } catch (error) {
                  names[familyId] = familyId
                }
              })
            )
            setFamilyNames(names)
          }
          
          setLoadingPermissions(false)
        })
        .catch(() => {
          setPermissions([])
          setLoadingPermissions(false)
        })
    } else {
      setPermissions([])
      setFamilyNames({})
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Google sign-in error:', error)
      alert('Google sign-in is not configured. Please enable Google OAuth in Supabase Dashboard → Authentication → Providers.')
    }
  }

  const getInitials = (email) => {
    if (!email) return '?'
    const parts = email.split('@')[0].split('.')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return email[0].toUpperCase()
  }

  const getDisplayName = (email) => {
    if (!email) return 'User'
    const parts = email.split('@')[0].split('.')
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  }

  const superAdminPermission = permissions.find(p => p.role === 'super_admin' && !p.family_id)
  const familyPermissions = permissions.filter(p => p.family_id && p.role !== 'super_admin')

  // Only show on root domain
  if (!isRoot) {
    console.log('🔍 UserMenu: Not on root domain, returning null')
    return null
  }

  console.log('🔍 UserMenu: On root domain, rendering. authLoading:', authLoading, 'user:', !!user)

  // Show loading state (but still show the button)
  if (authLoading) {
    console.log('🔍 UserMenu: Showing loading state')
    return (
      <UserMenuContainer>
        <GoogleSignInButton disabled style={{ opacity: 0.6 }}>
          <GoogleIcon />
          Loading...
        </GoogleSignInButton>
      </UserMenuContainer>
    )
  }

  // Show sign in button when not logged in
  if (!user) {
    console.log('🔍 UserMenu: No user, showing sign in button')
    return (
      <UserMenuContainer>
        <GoogleSignInButton onClick={handleGoogleSignIn} type="button">
          <GoogleIcon />
          Sign in with Google
        </GoogleSignInButton>
      </UserMenuContainer>
    )
  }

  console.log('🔍 UserMenu: User logged in, showing user menu')

  return (
    <UserMenuContainer ref={dropdownRef}>
      <UserButton onClick={() => setIsOpen(!isOpen)}>
        {user.user_metadata?.avatar_url ? (
          <AvatarImage src={user.user_metadata.avatar_url} alt={getDisplayName(user.email)} />
        ) : (
          <Avatar>{getInitials(user.email)}</Avatar>
        )}
        <ChevronDown size={16} />
      </UserButton>

      <Dropdown $isOpen={isOpen}>
        <DropdownHeader>
          <UserEmail>{getDisplayName(user.email)}</UserEmail>
          <UserRole>{user.email}</UserRole>
        </DropdownHeader>

        {(superAdminPermission || familyPermissions.length > 0) && (
          <DropdownSection>
            <SectionTitle>
              <Shield size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
              Permissions
            </SectionTitle>
            {superAdminPermission && (
              <FamilyItem>
                <Shield size={14} />
                <span>Super Admin (All Families)</span>
              </FamilyItem>
            )}
            {familyPermissions.length > 0 && (
              <FamilyList>
                {familyPermissions.map((perm) => (
                  <FamilyItem key={perm.id}>
                    <Shield size={14} />
                    <span>{familyNames[perm.family_id] || perm.family_id} ({perm.role})</span>
                  </FamilyItem>
                ))}
              </FamilyList>
            )}
          </DropdownSection>
        )}

        <DropdownAction onClick={signOut}>
          <LogOut />
          Sign Out
        </DropdownAction>
      </Dropdown>
    </UserMenuContainer>
  )
}
