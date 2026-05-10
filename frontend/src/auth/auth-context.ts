import { createContext } from 'react'
import type { AuthUser } from '../api/auth'

export type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  refresh: () => Promise<void>
  setUser: (user: AuthUser | null) => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
