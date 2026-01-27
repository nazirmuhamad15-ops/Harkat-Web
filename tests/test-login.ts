async function testLogin() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'admin@harkatfurniture.com',
        password: 'admin123',
        csrfToken: 'test', // This might be needed
      }),
    })
    
    console.log('Login response status:', response.status)
    console.log('Login response:', await response.text())
  } catch (error) {
    console.error('Login test error:', error)
  }
}

testLogin()