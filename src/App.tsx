import './App.css'
import { createBrowserRouter, createHashRouter, RouterProvider, Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Index } from './pages/Index'
import { Niveles, loader as levelsLoader } from './pages/Niveles'
import { AuthProvider } from './context/AuthContext'
import { Login } from './pages/Login'
import { AuthCallback } from './pages/AuthCallback'

const isProd = import.meta.env.PROD
const basename = isProd ? '/Unbeatenbascal' : '/'

function Layout() {
  const { user, logout } = useAuth()

  return (
    <main className="app">
      <header style={{ 
        padding: '1rem', 
        borderBottom: '1px solid #ccc', 
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>Home</Link>
          <Link to="/niveles" style={{ textDecoration: 'none', color: 'inherit' }}>Niveles</Link>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user ? (
            <>
              <span style={{ fontSize: '0.875rem', color: '#666' }}>
                Hola, {user.username}
              </span>
              <button
                onClick={logout}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  background: 'transparent',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  color: '#666',
                  cursor: 'pointer',
                }}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link 
              to="/login" 
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                backgroundColor: '#5865F2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              Login
            </Link>
          )}
        </div>
      </header>
      <Outlet />
    </main>
  )
}

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  if (window.location.pathname === '/auth/callback') {
    return null
  }

  return <Login />
}

function AppRouter() {
  const router = isProd
    ? createHashRouter([
        { path: '/', element: <Layout />, children: [
          { index: true, element: <Index /> },
          { path: 'niveles', element: <Niveles />, loader: levelsLoader },
        ]},
        { path: '/login', element: <LoginPage /> },
        { path: '/auth/callback', element: <AuthCallback /> },
      ])
    : createBrowserRouter([
        { path: '/', element: <Layout />, children: [
          { index: true, element: <Index /> },
          { path: 'niveles', element: <Niveles />, loader: levelsLoader },
        ]},
        { path: '/login', element: <LoginPage /> },
        { path: '/auth/callback', element: <AuthCallback /> },
      ], { basename })

  return <RouterProvider router={router} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}