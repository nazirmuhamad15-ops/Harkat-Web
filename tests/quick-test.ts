import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const test = async () => {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  
  const u = await sql`SELECT email, password, is_active FROM users WHERE email='admin@harkatfurniture.com'`;
  
  console.log('User:', u[0]?.email);
  console.log('Active:', u[0]?.is_active);
  console.log('Has password:', !!u[0]?.password);
  
  if (u[0]?.password) {
    const v = await bcrypt.compare('admin123', u[0].password);
    console.log('Password admin123 valid:', v);
  }
  
  await sql.end();
};

test();
