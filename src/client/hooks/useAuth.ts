import { useState, useCallback } from 'react'
import { setApiPin } from '../lib/api'

const STORAGE_KEY = 'windssea_auth'
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

interface AuthState {
  pin: string
  expiresAt: number
}

function loadStoredAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const state = JSON.parse(raw) as AuthState
    if (Date.now() > state.expiresAt) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return state
  } catch {
    return null
  }
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState | null>(() => {
    const stored = loadStoredAuth()
    if (stored) setApiPin(stored.pin)
    return stored
  })

  const isAuthenticated = auth !== null

  const saveAuth = useCallback((pin: string) => {
    const state: AuthState = { pin, expiresAt: Date.now() + EXPIRY_MS }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    setApiPin(pin)
    setAuth(state)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setApiPin('')
    setAuth(null)
  }, [])

  return { isAuthenticated, saveAuth, logout }
}
