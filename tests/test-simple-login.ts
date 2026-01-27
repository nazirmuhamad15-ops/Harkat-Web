async function testSimpleLogin() {
  try {
    console.log('🔐 Testing simple login without CSRF...')
    
    // Test langsung dengan user credentials
    const response = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@harkatfurniture.com',
        password: 'admin123',
        // Skip CSRF for testing
      }),
    })
    
    console.log('Status:', response.status)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.status === 200 && response.headers.get('set-cookie')) {
      console.log('✅ Login appears successful!')
      
      // Extract session cookie
      const setCookieHeader = response.headers.get('set-cookie')
      console.log('Session cookie:', setCookieHeader)
      
      // Test session with cookie
      const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
        headers: {
          'Cookie': setCookieHeader || ''
        }
      })
      
      const session = await sessionResponse.json()
      console.log('Session result:', session)
      
      if (session && session.user) {
        console.log('✅ Session created successfully!')
        console.log('👤 User:', session.user.email, 'Role:', session.user.role)
      } else {
        console.log('❌ Session not created')
      }
    } else {
      console.log('❌ Login failed')
      const errorText = await response.text()
      console.log('Error response:', errorText.substring(0, 200))
    }
    
  } catch (error) {
    console.error('Simple login test error:', error)
  }
}

testSimpleLogin()