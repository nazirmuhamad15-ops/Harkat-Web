import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const check = async () => {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  
  // Check if account table exists
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  
  console.log('Tables in public schema:');
  for (const t of tables) {
    console.log('  -', t.table_name);
  }
  
  await sql.end();
};

check();
