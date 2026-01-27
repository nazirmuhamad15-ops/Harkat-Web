'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useCsrfToken } from '@/hooks/use-csrf-token'

interface CsrfContextValue {
  csrfToken: string | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const CsrfContext = createContext<CsrfContextValue | undefined>(undefined)

/**
 * Provider component that makes CSRF token available to all child components
 * Wrap your app or protected routes with this provider
 */
export function CsrfProvider({ children }: { children: ReactNode }) {
  const csrfData = useCsrfToken()
  
  return (
    <CsrfContext.Provider value={csrfData}>
      {children}
    </CsrfContext.Provider>
  )
}

/**
 * Hook to access CSRF token in any component
 * Must be used within CsrfProvider
 */
export function useCsrf() {
  const context = useContext(CsrfContext)
  
  if (context === undefined) {
    throw new Error('useCsrf must be used within CsrfProvider')
  }
  
  return context
}

/**
 * Helper function to add CSRF token to fetch options
 * Automatically handles token refresh on 403 errors
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {},
  csrfToken: string | null
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'x-csrf-token': csrfToken || ''
    }
  })
  
  // If CSRF token is invalid, suggest page refresh
  if (response.status === 403) {
    const data = await response.json().catch(() => ({}))
    if (data.error === 'Invalid CSRF token') {
      console.warn('[CSRF] Token invalid, please refresh page')
      // Optionally: window.location.reload()
    }
  }
  
  return response
}
