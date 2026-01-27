import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

dotenv.config();

const checkDb = async () => {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL!;
  
  console.log('🔍 Checking database...');
  
  const client = postgres(connectionString);
  const db = drizzle(client);
  
  try {
    // Check all tables
    const tables = await db.execute(sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Tables in database:');
    tables.rows.forEach((t: any) => console.log(`  - ${t.table_name}`));
    
    // Check if user table exists
    const userTable = await db.execute(sql`
      SELECT * FROM "user" LIMIT 3;
    `);
    console.log('\n👤 Users in "user" table:', userTable.rows.length);
    userTable.rows.forEach((u: any) => console.log(`  - ${u.email} (${u.role})`));
    
  } catch (error: any) {
    if (error.code === '42P01') {
      console.log('\n❌ Table "user" does not exist!');
      
      // Check if users table exists instead
      try {
        const usersTable = await db.execute(sql`
          SELECT * FROM "users" LIMIT 3;
        `);
        console.log('\n👤 Users in "users" table:', usersTable.rows.length);
        usersTable.rows.forEach((u: any) => console.log(`  - ${u.email} (${u.role})`));
      } catch (e: any) {
        console.log('❌ Table "users" also does not exist!');
      }
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await client.end();
  }
};

checkDb();
