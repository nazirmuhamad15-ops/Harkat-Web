import postgres from 'postgres';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const resetPassword = async () => {
  // Use DATABASE_URL sama dengan yang dipake app
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  
  const newPassword = 'admin123';
  const hash = await bcrypt.hash(newPassword, 10);
  
  console.log('🔧 Resetting ALL user passwords to admin123...');
  console.log('Hash:', hash);
  
  await sql`UPDATE users SET password = ${hash}`;
  
  // Verify
  const users = await sql`SELECT email, role, password FROM users LIMIT 5`;
  console.log('\n✅ Updated users:');
  for (const u of users) {
    const valid = await bcrypt.compare('admin123', u.password);
    console.log(`  ${u.email} (${u.role}) - password valid: ${valid}`);
  }
  
  await sql.end();
  console.log('\n🎉 Done! Password: admin123');
};

resetPassword();
