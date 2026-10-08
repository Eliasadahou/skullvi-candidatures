import { useCallback, useMemo, useState } from 'react'
import { api, clearToken, getToken, getUser, setToken, setUser } from '../api/client'
import { AuthContext } from './auth'

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken())
  const [user, setUserState] = useState(getUser())

  const login = useCallback(async (username, password) => {
    const { data } = await api.post('/auth/login/', { username, password })
    const profile = { username: data.username, is_superuser: Boolean(data.is_superuser) }
    setToken(data.token)
    setUser(profile)
    setTokenState(data.token)
    setUserState(profile)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout/')
    } catch {
      /* on déconnecte côté navigateur quoi qu'il arrive */
    }
    clearToken()
    setTokenState(null)
    setUserState(null)
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token),
      user,
      isSuperuser: Boolean(user?.is_superuser),
      login,
      logout,
    }),
    [token, user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}