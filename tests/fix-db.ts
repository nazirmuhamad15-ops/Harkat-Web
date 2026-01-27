import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const fixDb = async () => {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL!;
  const sql = postgres(connectionString);
  
  console.log('🔧 Fixing database...');
  
  try {
    // Rename user back to users
    await sql`ALTER TABLE IF EXISTS "user" RENAME TO "users"`;
    console.log('✅ Renamed user → users');
  } catch (e: any) {
    console.log('⚠️ Table rename:', e.message);
  }
  
  await sql.end();
  console.log('✅ Done!');
};

fixDb();
