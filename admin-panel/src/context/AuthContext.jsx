import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { loginAdmin } from '../api/markets'

const AUTH_STORAGE_KEY = 'admin_panel_auth'

const AuthContext = createContext(null)

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const storedAuth = JSON.parse(raw)
    return typeof storedAuth.accessToken === 'string' && storedAuth.accessToken
      ? storedAuth
      : null
  } catch (error) {
    console.error('Unable to read saved admin session.', error)
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredAuth())
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (username, password) => {
    setIsLoading(true)

    try {
      const session = await loginAdmin(username.trim(), password)
      const nextUser = { ...session.user, accessToken: session.accessToken }
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser))
      setUser(nextUser)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Login failed. Please try again.',
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setUser(null)
  }, [])

  // Sessions saved before accountRole existed only carry the display role.
  const isSubadmin = user?.accountRole
    ? user.accountRole === 'subadmin'
    : user?.role === 'Subadministrator'

  const value = useMemo(
    () => ({
      user,
      isSubadmin,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
    }),
    [user, isSubadmin, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
