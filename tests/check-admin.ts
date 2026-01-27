import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const check = async () => {
  const sql = postgres(process.env.DIRECT_URL!);
  const r = await sql`SELECT email, password, is_active, role FROM users WHERE email = 'admin@harkatfurniture.com'`;
  console.log(JSON.stringify(r, null, 2));
  await sql.end();
};

check();
