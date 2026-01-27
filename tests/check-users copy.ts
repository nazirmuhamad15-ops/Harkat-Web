import postgres from 'postgres';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const checkUsers = async () => {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL!;
  const sql = postgres(connectionString);
  
  console.log('🔍 Checking users...');
  
  const result = await sql`SELECT id, email, name, role, password, is_active FROM users LIMIT 5`;
  
  console.log('\n👤 Users:');
  for (const u of result) {
    console.log(`  - ${u.email} | role: ${u.role} | active: ${u.is_active}`);
    console.log(`    password hash: ${u.password ? u.password.substring(0, 20) + '...' : 'NULL'}`);
    
    if (u.password) {
      const testPass = await bcrypt.compare('admin123', u.password);
      console.log(`    admin123 match: ${testPass}`);
    }
  }
  
  await sql.end();
};

checkUsers();
