import { useState, useEffect } from 'react'

interface CsrfTokenData {
  csrfToken: string | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * React hook to fetch and manage CSRF token
 * 
 * @example
 * ```tsx
 * const { csrfToken, loading } = useCsrfToken()
 * 
 * const handleSubmit = async () => {
 *   await fetch('/api/admin/products', {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       'x-csrf-token': csrfToken || ''
 *     },
 *     body: JSON.stringify(data)
 *   })
 * }
 * ```
 */
export function useCsrfToken(): CsrfTokenData {
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchToken = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/csrf-token')
      
      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token')
      }
      
      const data = await response.json()
      setCsrfToken(data.csrfToken)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('[useCsrfToken] Error:', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchToken()
    
    // Refresh token every 30 minutes (tokens expire after 1 hour)
    const interval = setInterval(fetchToken, 30 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  return {
    csrfToken,
    loading,
    error,
    refresh: fetchToken
  }
}

/**
 * Helper function to add CSRF token to fetch options
 * 
 * @example
 * ```tsx
 * const { csrfToken } = useCsrfToken()
 * 
 * fetch('/api/admin/products', withCsrfToken(csrfToken, {
 *   method: 'POST',
 *   body: JSON.stringify(data)
 * }))
 * ```
 */
export function withCsrfToken(
  csrfToken: string | null,
  options: RequestInit = {}
): RequestInit {
  if (!csrfToken) {
    console.warn('[withCsrfToken] CSRF token is null, request may fail')
  }

  return {
    ...options,
    headers: {
      ...options.headers,
      'x-csrf-token': csrfToken || ''
    }
  }
}
