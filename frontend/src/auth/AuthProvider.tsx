import {
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { AuthUser } from '../api/auth'
import { useSessionQuery } from '../queries/authQueries'
import { authKeys } from '../queries/queryKeys'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const session = useSessionQuery()

  const user = session.isError ? null : (session.data ?? null)
  const loading = session.isPending

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: authKeys.session() })
  }, [queryClient])

  const setUser = useCallback(
    (next: AuthUser | null) => {
      queryClient.setQueryData(authKeys.session(), next)
    },
    [queryClient],
  )

  const value = useMemo(
    () => ({ user, loading, refresh, setUser }),
    [user, loading, refresh, setUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
