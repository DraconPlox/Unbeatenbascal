import { useEffect, useState } from 'react'
import { Index } from './pages/Index'
import { Niveles } from './pages/Niveles'
import { AuthProvider, useAuth } from './context/AuthContext'

type View = 'home' | 'niveles' | 'estadisticas'

// Acceso desde el navbar: listo pero oculto de momento (el login vive en el
// sidebar). Ponlo a true cuando quieras mostrarlo.
const SHOW_NAVBAR_ACCESS = false

const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Home', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  )},
  { id: 'niveles', label: 'Demonlist', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  )},
  { id: 'estadisticas', label: 'Estadisticas', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  )},
]

function Layout() {
  const { user, login, logout } = useAuth()
  const [activeView, setActiveView] = useState<View>('home')
  // En ventanas pequeñas el menú arranca comprimido para dejar sitio al contenido.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 1024,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1024px)')
    // Al encoger la ventana se comprime solo; al agrandarla no se fuerza,
    // así el usuario decide cuándo expandirlo.
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) setSidebarCollapsed(true)
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const renderView = () => {
    switch (activeView) {
      case 'niveles':
        return <Niveles />
      case 'estadisticas':
        return <div className="stats-placeholder">Estadísticas - Próximamente</div>
      default:
        return <Index />
    }
  }

  return (
    <div className={`app-layout${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className="app-sidebar">
        <div className="sidebar-head">
          <div className="sidebar-title" style={{ color: 'black' }}>UnbeatenBascal</div>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(value => !value)}
            aria-label={sidebarCollapsed ? 'Expandir menú' : 'Comprimir menú'}
            title={sidebarCollapsed ? 'Expandir menú' : 'Comprimir menú'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className="nav-link"
              title={item.label}
              style={activeView === item.id ? { backgroundColor: 'var(--color-dark-primary)', color: 'white', fontWeight: 600, boxShadow: '0 2px 8px rgba(88, 101, 242, 0.4)' } : {}}
            >
              {item.icon}
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Acceso desde el navbar. Oculto de momento: activa SHOW_NAVBAR_ACCESS. */}
        {SHOW_NAVBAR_ACCESS && (
          <div className="sidebar-login">
            {user ? (
              <button type="button" className="btn btn-secondary" onClick={logout}>
                Cerrar sesión
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={login}>
                Iniciar sesión
              </button>
            )}
          </div>
        )}
      </aside>

      <main className="app-main">
        {renderView()}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  )
}