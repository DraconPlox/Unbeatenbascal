import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AREDL_API_BASE = 'https://api.aredl.net/v2'

export function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setUser } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const error = searchParams.get('error')

      if (error) {
        console.error('Auth error:', error)
        navigate('/login?error=auth_failed')
        return
      }

      if (!code) {
        navigate('/login?error=no_code')
        return
      }

      try {
        const response = await fetch(`${AREDL_API_BASE}/api/auth/discord/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to exchange code for token')
        }

        const data = await response.json()
        
        if (data.user) {
          setUser(data.user)
          navigate('/niveles')
        } else {
          throw new Error('No user data received')
        }
      } catch (err) {
        console.error('Callback error:', err)
        navigate('/login?error=callback_failed')
      }
    }

    handleCallback()
  }, [searchParams, navigate, setUser])

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
      <h1>Completando inicio de sesión...</h1>
      <p style={{ color: '#666' }}>Por favor espera mientras te conectamos</p>
    </div>
  )
}