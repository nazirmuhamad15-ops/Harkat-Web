import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('🔗 Testing database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Test user query
    const userCount = await prisma.user.count()
    console.log(`👤 Total users: ${userCount}`)
    
    // Test specific user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@harkatfurniture.com' }
    })
    
    if (user) {
      console.log('✅ User found:', user.email, 'Role:', user.role)
      console.log('🔑 Hash length:', user.password.length)
      
      // Test password comparison
      const bcrypt = await import('bcryptjs')
      const isValid = await bcrypt.compare('admin123', user.password)
      console.log('🔐 Password test result:', isValid)
    } else {
      console.log('❌ User not found')
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()