import { createBrowserRouter, createHashRouter, RouterProvider, Link, Outlet, useLocation } from 'react-router-dom'
import { Index } from './pages/Index'
import { Niveles, loader as levelsLoader } from './pages/Niveles'
import { AuthProvider } from './context/AuthContext'
import { Login } from './pages/Login'
import { AuthCallback } from './pages/AuthCallback'

const isProd = import.meta.env.PROD
const basename = isProd ? '/Unbeatenbascal' : '/'

function Layout() {
  //const { user, logout } = useAuth()
  const location = useLocation()

  /*
  <header className="app-header">
        <div className="header-actions">
          {user ? (
            <div className="user-info">
              <span>Hola, {user.username}</span>
              <button className="btn btn-secondary" onClick={logout}>
                Cerrar sesión
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
          )}
        </div>
      </header>
  */

  return (
    <div className="app-layout">

      <aside className="app-sidebar">
        <div className="sidebar-title">UnbeatenBascal</div>
        <nav className="sidebar-nav">
          <Link to="/" className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Home
          </Link>
          <Link to="/niveles" className={location.pathname === '/niveles' ? 'nav-link active' : 'nav-link'}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            Demonlist
          </Link>
          <Link to="/estadisticas" className={location.pathname === '/estadisticas' ? 'nav-link active' : 'nav-link'}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            Estadisticas
          </Link>
        </nav>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

function LoginPage() {
  //const { login } = useAuth()

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
          { path: 'estadisticas', element: <Index /> },
        ]},
        { path: '/login', element: <LoginPage /> },
        { path: '/auth/callback', element: <AuthCallback /> },
      ])
    : createBrowserRouter([
        { path: '/', element: <Layout />, children: [
          { index: true, element: <Index /> },
          { path: 'niveles', element: <Niveles />, loader: levelsLoader },
          { path: 'estadisticas', element: <Index /> },
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