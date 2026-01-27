import 'dotenv/config';
import { db } from './src/lib/db-drizzle';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const test = async () => {
  console.log('Testing drizzle query...');
  
  const user = await db.query.users.findFirst({
    where: eq(users.email, 'admin@harkatfurniture.com')
  });
  
  console.log('User found:', !!user);
  console.log('Email:', user?.email);
  console.log('Role:', user?.role);
  console.log('Active:', user?.isActive);
  console.log('Has password:', !!user?.password);
  
  if (user?.password) {
    const valid = await bcrypt.compare('admin123', user.password);
    console.log('Password valid:', valid);
  }
  
  process.exit(0);
};

test();
