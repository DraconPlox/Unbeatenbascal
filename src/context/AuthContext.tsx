import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../objects'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: () => void
  logout: () => void
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AREDL_API_BASE = 'https://api.aredl.net/v2'
const CLIENT_URL = import.meta.env.VITE_CLIENT_URL || window.location.origin

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('aredl_user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('aredl_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = () => {
    window.location.href = `${AREDL_API_BASE}/api/auth/discord?redirect_uri=${encodeURIComponent(`${CLIENT_URL}/auth/callback`)}`
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('aredl_user')
  }

  const setUserData = (userData: User | null) => {
    setUser(userData)
    if (userData) {
      localStorage.setItem('aredl_user', JSON.stringify(userData))
    } else {
      localStorage.removeItem('aredl_user')
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, setUser: setUserData }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}