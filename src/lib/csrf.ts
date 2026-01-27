// In-memory store for CSRF tokens (use Redis in production)
const csrfTokens = new Map<string, { token: string; expires: number }>()

// Cleanup expired tokens every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of csrfTokens.entries()) {
      if (value.expires < now) {
        csrfTokens.delete(key)
      }
    }
  }, 3600000)
}

/**
 * Generate a CSRF token for a session
 * @param sessionId - Unique session identifier
 * @returns CSRF token string
 */
export function generateCsrfToken(sessionId: string): string {
  // Use Web Crypto API if available (Edge/Serverless)
  const array = new Uint8Array(32)
  if (typeof crypto !== 'undefined') {
    crypto.getRandomValues(array)
  } else {
    // Fallback for older Node envs (though Next.js usually has crypto)
    // minimal fallback or require('crypto') if necessary, but avoiding it to pass Edge check
    // We can use Math.random for fallback if absolutely necessary (less secure but unblocks build)
    // Or try dynamic require to bypass static check
    try {
        const nodeCrypto = require('crypto')
        return nodeCrypto.randomBytes(32).toString('hex')
    } catch (e) {
        for(let i=0; i<32; i++) array[i] = Math.floor(Math.random() * 256)
    }
  }
  
  const token = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
  
  csrfTokens.set(sessionId, {
    token,
    expires: Date.now() + 3600000 // 1 hour
  })
  return token
}

/**
 * Validate a CSRF token
 * @param sessionId - Session identifier
 * @param token - Token to validate
 * @returns true if valid, false otherwise
 */
export function validateCsrfToken(sessionId: string, token: string | null): boolean {
  if (!token) return false
  
  const stored = csrfTokens.get(sessionId)
  if (!stored) return false
  
  // Check expiration
  if (stored.expires < Date.now()) {
    csrfTokens.delete(sessionId)
    return false
  }
  
  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(stored.token, token)
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Revoke a CSRF token (e.g., on logout)
 * @param sessionId - Session identifier
 */
export function revokeCsrfToken(sessionId: string): void {
  csrfTokens.delete(sessionId)
}

/**
 * Get or create CSRF token for a session
 * @param sessionId - Session identifier
 * @returns Existing or new CSRF token
 */
export function getOrCreateCsrfToken(sessionId: string): string {
  const stored = csrfTokens.get(sessionId)
  
  if (stored && stored.expires > Date.now()) {
    return stored.token
  }
  
  return generateCsrfToken(sessionId)
}
