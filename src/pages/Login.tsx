import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Login() {
  const { login, user, isLoading } = useAuth()
  const navigate = useNavigate()

  if (user && !isLoading) {
    navigate('/niveles')
    return null
  }

  const handleLogin = () => {
    login()
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
      <h1>Iniciar Sesión</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Conecta con tu cuenta de Discord para acceder a tus niveles de Aredl
      </p>
      <button
        onClick={handleLogin}
        disabled={isLoading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 2rem',
          fontSize: '1.1rem',
          backgroundColor: '#5865F2',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        Continuar con Discord
      </button>
      <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#888' }}>
        Serás redirigido a Discord para autorizar la aplicación
      </p>
      <Link to="/" style={{ display: 'inline-block', marginTop: '1rem', color: '#5865F2' }}>
        ← Volver al inicio
      </Link>
    </div>
  )
}