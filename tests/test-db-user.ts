import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testDatabaseUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@harkatfurniture.com' }
    })
    
    if (!user) {
      console.log('❌ User not found in database')
      return
    }
    
    console.log('✅ User found:', user.email, 'Role:', user.role, 'Active:', user.isActive)
    console.log('🔑 Stored hash:', user.password)
    
    // Test password comparison
    const plainPassword = 'admin123'
    const isValid = await bcrypt.compare(plainPassword, user.password)
    console.log('🔐 Password comparison result:', isValid)
    
    // Test with wrong password
    const isWrong = await bcrypt.compare('wrongpassword', user.password)
    console.log('❌ Wrong password result:', isWrong)
    
    // Generate new hash for comparison
    const newHash = await bcrypt.hash(plainPassword, 12)
    console.log('🆕 New hash:', newHash)
    const isNewValid = await bcrypt.compare(plainPassword, newHash)
    console.log('✅ New hash validation:', isNewValid)
    
  } catch (error) {
    console.error('Database test error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabaseUser()