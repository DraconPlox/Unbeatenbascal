import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

const AREDL_API_BASE = 'https://api.aredl.net/v2'

export function AuthCallback() {
  const { setUser } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const error = params.get('error')

      if (error) {
        console.error('Auth error:', error)
        setStatus('error')
        setErrorMessage(`Error de autenticación: ${error}`)
        return
      }

      if (!code) {
        setStatus('error')
        setErrorMessage('No se recibió código de autorización')
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
          setStatus('success')
        } else {
          throw new Error('No user data received')
        }
      } catch (err) {
        console.error('Callback error:', err)
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : 'Error en el callback')
      }
    }

    handleCallback()
  }, [setUser])

  if (status === 'loading') {
    return (
      <div style={{ padding: '2rem', maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <h1>Completando inicio de sesión...</h1>
        <p style={{ color: '#666' }}>Por favor espera mientras te conectamos</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{ padding: '2rem', maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#ff6b6b' }}>✗</div>
        <h1>Error al iniciar sesión</h1>
        <p style={{ color: '#666' }}>{errorMessage}</p>
        <button 
          onClick={() => window.location.href = '/'}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#5865F2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#4ade80' }}>✓</div>
      <h1>¡Inicio de sesión exitoso!</h1>
      <p style={{ color: '#666' }}>Redirigiendo...</p>
    </div>
  )
}