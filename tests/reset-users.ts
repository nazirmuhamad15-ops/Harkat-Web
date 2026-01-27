import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetUsers() {
  try {
    console.log('🗑️ Deleting existing users...')
    
    // Delete all existing users
    await prisma.user.deleteMany({})
    
    console.log('✅ Creating new users with correct passwords...')
    
    const correctHash = await bcrypt.hash('admin123', 12)
    console.log('🔐 Generated hash:', correctHash)
    
    // Create users with correct hash
    await prisma.user.createMany({
      data: [
        {
          email: 'admin@harkatfurniture.com',
          name: 'Super Admin',
          password: correctHash,
          role: 'SUPER_ADMIN',
          phone: '+6281234567890',
          isActive: true,
        },
        {
          email: 'staff@harkatfurniture.com',
          name: 'Staff Admin',
          password: correctHash,
          role: 'ADMIN',
          phone: '+6281234567891',
          isActive: true,
        },
        {
          email: 'driver@harkatfurniture.com',
          name: 'Driver Supir',
          password: correctHash,
          role: 'DRIVER',
          phone: '+6281234567892',
          isActive: true,
        }
      ]
    })
    
    console.log('✅ Users created successfully!')
    
    // Test password
    const testUser = await prisma.user.findUnique({
      where: { email: 'admin@harkatfurniture.com' }
    })
    
    if (testUser) {
      const isValid = await bcrypt.compare('admin123', testUser.password)
      console.log('🔐 Password test result:', isValid)
    }
    
  } catch (error) {
    console.error('Reset users error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetUsers()