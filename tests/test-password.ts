import bcrypt from 'bcryptjs'

async function testPassword() {
  const plainPassword = 'admin123'
  const newHash = '$2b$12$zTV7GmM7k3Uq8X8BMQB5OOSsMSD1P5JGjhOQ0uwutRG9CCMCbf2yO'
  
  console.log('Testing new hash...')
  const isValid = await bcrypt.compare(plainPassword, newHash)
  console.log('New hash validation:', isValid)
}

testPassword()