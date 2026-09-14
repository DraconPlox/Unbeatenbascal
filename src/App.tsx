import { useState } from 'react'
import { Index } from './pages/Index'
import { Niveles } from './pages/Niveles'
import { AuthProvider } from './context/AuthContext'

type View = 'home' | 'niveles' | 'estadisticas'

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
  const [activeView, setActiveView] = useState<View>('home')

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
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="sidebar-title" style={{ color: 'black' }}>UnbeatenBascal</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className="nav-link"
              style={activeView === item.id ? { backgroundColor: 'var(--color-dark-primary)', color: 'white', fontWeight: 600, boxShadow: '0 2px 8px rgba(88, 101, 242, 0.4)' } : {}}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        {/* 
        <div className="sidebar-login">
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Login
          </button>
        </div>
        */}
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