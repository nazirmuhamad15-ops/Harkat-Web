import postgres from 'postgres';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const testLogin = async () => {
  const sql = postgres(process.env.DATABASE_URL!);
  
  console.log('🔍 Testing login flow...');
  
  // Get user
  const users = await sql`SELECT * FROM users WHERE email = 'admin@harkatfurniture.com'`;
  
  if (users.length === 0) {
    console.log('❌ User not found');
    await sql.end();
    return;
  }
  
  const user = users[0];
  console.log('✅ User found:', user.email);
  console.log('   Role:', user.role);
  console.log('   Active:', user.is_active);
  console.log('   Password exists:', !!user.password);
  
  if (user.password) {
    const valid = await bcrypt.compare('admin123', user.password);
    console.log('   Password admin123 valid:', valid);
  }
  
  await sql.end();
};

testLogin();
