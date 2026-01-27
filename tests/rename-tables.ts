import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

dotenv.config();

const renameTables = async () => {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL!;
  
  console.log('🔄 Renaming tables for NextAuth compatibility...');
  
  const client = postgres(connectionString);
  const db = drizzle(client);
  
  try {
    // Rename users table to user
    console.log('Renaming users → user...');
    await db.execute(sql`ALTER TABLE IF EXISTS "users" RENAME TO "user";`);
    console.log('✅ Table renamed successfully');
    
    console.log('\n✅ All tables renamed successfully!');
  } catch (error: any) {
    if (error.code === '42P01') {
      console.log('⚠️  Table already renamed or does not exist');
    } else {
      console.error('❌ Error:', error);
      throw error;
    }
  } finally {
    await client.end();
  }
};

renameTables();
