import bcrypt from 'bcryptjs'

async function generateHash() {
  const plainPassword = 'admin123'
  const hash = await bcrypt.hash(plainPassword, 12)
  console.log('New hash for admin123:', hash)
  
  // Test the hash
  const isValid = await bcrypt.compare(plainPassword, hash)
  console.log('New hash validation:', isValid)
}

generateHash()