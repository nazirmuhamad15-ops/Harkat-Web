async function testLoginFlow() {
  try {
    console.log('🔐 Testing complete login flow...')
    
    // Step 1: Get CSRF token
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf')
    const csrfData = await csrfResponse.json()
    console.log('1️⃣ CSRF Token:', csrfData.csrfToken)
    
    // Step 2: Submit login form
    const formData = new FormData()
    formData.append('email', 'admin@harkatfurniture.com')
    formData.append('password', 'admin123')
    formData.append('csrfToken', csrfData.csrfToken)
    
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': `next-auth.callback-url=http%3A%2F%2Flocalhost%3A3000`
      },
      body: formData,
      redirect: 'manual'
    })
    
    console.log('2️⃣ Login response status:', loginResponse.status)
    console.log('2️⃣ Login response headers:', Object.fromEntries(loginResponse.headers.entries()))
    
    if (loginResponse.status === 302) {
      const location = loginResponse.headers.get('location')
      console.log('3️⃣ Redirect location:', location)
      
      if (location && location.includes('error=')) {
        console.log('❌ Login failed with error')
        return
      }
      
      // Extract session cookies from headers
      const setCookieHeader = loginResponse.headers.get('set-cookie')
      console.log('3️⃣ Set-Cookie header:', setCookieHeader)
      
      // Step 3: Follow redirect and check session
      const redirectResponse = await fetch(location, {
        headers: {
          'Cookie': setCookieHeader || ''
        },
        redirect: 'manual'
      })
      
      console.log('4️⃣ Redirect response status:', redirectResponse.status)
      
      // Step 4: Check session after redirect
      const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
        headers: {
          'Cookie': setCookieHeader || ''
        }
      })
      
      const session = await sessionResponse.json()
      console.log('5️⃣ Session after redirect:', session)
      
      if (session && session.user) {
        console.log('✅ Login successful!')
        console.log('👤 User:', session.user.email, 'Role:', session.user.role)
        console.log('🌐 Admin dashboard URL:', 'http://localhost:3000/admin/dashboard')
      } else {
        console.log('❌ Session not created')
      }
    } else {
      console.log('❌ Login failed with status:', loginResponse.status)
      const errorText = await loginResponse.text()
      console.log('Error response:', errorText.substring(0, 200))
    }
    
  } catch (error) {
    console.error('Login flow test error:', error)
  }
}

testLoginFlow()