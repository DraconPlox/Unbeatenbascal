import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { fetchClanProfile } from '../api/aredl'
import type { ListKey } from '../api/aredl'
import type { ClanProfile } from '../objects'

export interface ClanProfileState {
  data: ClanProfile | null
  loading: boolean
  error: string | null
}

interface ClanContextType {
  classic: ClanProfileState
  platformer: ClanProfileState
  reload: () => void
}

const initialState: ClanProfileState = {
  data: null,
  loading: true,
  error: null,
}

const ClanContext = createContext<ClanContextType | undefined>(undefined)

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Error desconocido'

export function ClanProvider({ children }: { children: ReactNode }) {
  const [classic, setClassic] = useState<ClanProfileState>(initialState)
  const [platformer, setPlatformer] = useState<ClanProfileState>(initialState)
  const attemptRef = useRef(0)
  const startedRef = useRef(false)

  const loadProfile = useCallback(
    (list: ListKey, setState: (state: ClanProfileState) => void, attempt: number) => {
      fetchClanProfile(list)
        .then(data => {
          if (attempt !== attemptRef.current) return
          setState({ data, loading: false, error: null })
        })
        .catch(error => {
          if (attempt !== attemptRef.current) return
          setState({ data: null, loading: false, error: errorMessage(error) })
        })
    },
    [],
  )

  const reload = useCallback(() => {
    const attempt = ++attemptRef.current
    // Los perfiles se piden en paralelo y cada lista gestiona su propio estado:
    // si una falla, la otra puede seguir mostrándose.
    setClassic({ data: null, loading: true, error: null })
    setPlatformer({ data: null, loading: true, error: null })
    loadProfile('aredl', setClassic, attempt)
    loadProfile('arepl', setPlatformer, attempt)
  }, [loadProfile])

  useEffect(() => {
    // En desarrollo StrictMode monta el efecto dos veces; evita pedir los
    // perfiles por duplicado sin impedir que reload() funcione.
    if (startedRef.current) return
    startedRef.current = true
    reload()
  }, [reload])

  return (
    <ClanContext.Provider value={{ classic, platformer, reload }}>
      {children}
    </ClanContext.Provider>
  )
}

// El hook comparte el contexto con el provider, igual que en AuthContext.
// eslint-disable-next-line react-refresh/only-export-components
export function useClan() {
  const context = useContext(ClanContext)
  if (!context) {
    throw new Error('useClan must be used within a ClanProvider')
  }
  return context
}
