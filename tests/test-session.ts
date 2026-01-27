async function testSession() {
  try {
    // Test session endpoint
    const response = await fetch('http://localhost:3000/api/auth/session')
    const session = await response.json()
    console.log('Session:', session)
    
    if (session && session.user) {
      console.log('✅ Login successful! User:', session.user.email, 'Role:', session.user.role)
    } else {
      console.log('❌ No active session')
    }
    
  } catch (error) {
    console.error('Session test error:', error)
  }
}

testSession()