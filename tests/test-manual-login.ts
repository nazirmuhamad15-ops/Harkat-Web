async function testManualLogin() {
  try {
    // Simulate browser login form submission
    const formData = new FormData()
    formData.append('email', 'admin@harkatfurniture.com')
    formData.append('password', 'admin123')
    
    // Get CSRF token first
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf')
    const csrfData = await csrfResponse.json()
    console.log('CSRF:', csrfData)
    
    if (csrfData.csrfToken) {
      formData.append('csrfToken', csrfData.csrfToken)
    }
    
    // Submit login
    const response = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
      redirect: 'manual' // Don't follow redirects
    })
    
    console.log('Login response status:', response.status)
    console.log('Login response headers:', Object.fromEntries(response.headers.entries()))
    
    // Check session after login
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session')
    const session = await sessionResponse.json()
    console.log('Session after login:', session)
    
  } catch (error) {
    console.error('Manual login test error:', error)
  }
}

testManualLogin()