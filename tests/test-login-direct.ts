async function testLoginDirect() {
  try {
    // Test dengan fetch ke NextAuth API endpoint
    const response = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@harkatfurniture.com',
        password: 'admin123',
        csrfToken: 'test'
      }),
    })
    
    console.log('Status:', response.status)
    const text = await response.text()
    console.log('Response length:', text.length)
    console.log('Response preview:', text.substring(0, 200))
    
    // Test dengan form data
    const formData = new FormData()
    formData.append('email', 'admin@harkatfurniture.com')
    formData.append('password', 'admin123')
    formData.append('csrfToken', 'test')
    
    const response2 = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      body: formData,
    })
    
    console.log('Form data status:', response2.status)
    
  } catch (error) {
    console.error('Login test error:', error)
  }
}

testLoginDirect()