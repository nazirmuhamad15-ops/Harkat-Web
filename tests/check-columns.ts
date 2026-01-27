import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const check = async () => {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  
  // Check public.users specifically
  const cols = await sql`
    SELECT column_name
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' 
    ORDER BY ordinal_position
  `;
  
  console.log('public.users columns:');
  for (const c of cols) {
    console.log('  -', c.column_name);
  }
  
  await sql.end();
};

check();
