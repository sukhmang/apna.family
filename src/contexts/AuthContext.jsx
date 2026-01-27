import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`
    
    console.log('='.repeat(60))
    console.log('🔍 OAuth Debug Info - Google Sign In')
    console.log('='.repeat(60))
    console.log('📍 Current Page Info:')
    console.log('  - Origin:', window.location.origin)
    console.log('  - Hostname:', window.location.hostname)
    console.log('  - Port:', window.location.port || '(default)')
    console.log('  - Protocol:', window.location.protocol)
    console.log('  - Full URL:', window.location.href)
    console.log('')
    console.log('🎯 Redirect Configuration:')
    console.log('  - redirectTo parameter:', redirectTo)
    console.log('  - Expected in Google Console:', redirectTo)
    console.log('')
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo
        }
      })
      
      if (error) {
        console.error('❌ Supabase Error:', error)
        console.error('  - Message:', error.message)
        console.error('  - Status:', error.status)
        throw error
      }
      
      if (data?.url) {
        console.log('✅ Supabase Generated OAuth URL:')
        console.log('  - Full URL:', data.url)
        console.log('')
        
        // Parse the URL to extract redirect_uri
        try {
          const urlObj = new URL(data.url)
          console.log('📋 URL Breakdown:')
          console.log('  - Base URL:', urlObj.origin + urlObj.pathname)
          console.log('  - Query Params:')
          
          // Get all query parameters
          urlObj.searchParams.forEach((value, key) => {
            if (key === 'redirect_uri') {
              console.log(`    🔴 ${key}: ${decodeURIComponent(value)}`)
              console.log('')
              console.log('⚠️  VERIFICATION CHECK:')
              console.log('  - This redirect_uri must EXACTLY match one in Google Cloud Console')
              console.log('  - Check: https://console.cloud.google.com/apis/credentials')
              console.log('  - Look for: "Authorised redirect URIs" section')
              console.log('')
              console.log('✅ Expected in Google Console:', redirectTo)
              console.log('🔍 Actual in OAuth URL:', decodeURIComponent(value))
              console.log('')
              if (decodeURIComponent(value) === redirectTo) {
                console.log('✅ MATCH! Redirect URI matches expected value')
              } else {
                console.log('❌ MISMATCH! Redirect URI does not match')
                console.log('  - This could be the problem!')
              }
            } else {
              console.log(`    - ${key}: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`)
            }
          })
        } catch (parseError) {
          console.error('  - Could not parse URL:', parseError)
        }
        
        console.log('')
        console.log('💡 Next Steps:')
        console.log('  1. Check the redirect_uri above matches Google Cloud Console')
        console.log('  2. If it matches, wait 5-10 minutes for Google to propagate changes')
        console.log('  3. Try in an incognito window to avoid cache issues')
        console.log('  4. Check Network tab in DevTools to see the actual request')
        console.log('='.repeat(60))
      } else {
        console.warn('⚠️  No URL returned from Supabase')
        console.log('='.repeat(60))
      }
    } catch (err) {
      console.error('❌ Unexpected Error:', err)
      console.log('='.repeat(60))
      throw err
    }
  }

  const signInWithMicrosoft = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) {
      console.error('Error signing in with Microsoft:', error)
      throw error
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithMicrosoft,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
