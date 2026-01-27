import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const createTables = async () => {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  
  console.log('🔧 Creating NextAuth tables...');
  
  // Create account table
  await sql`
    CREATE TABLE IF NOT EXISTS account (
      "userId" text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type text NOT NULL,
      provider text NOT NULL,
      "providerAccountId" text NOT NULL,
      refresh_token text,
      access_token text,
      expires_at integer,
      token_type text,
      scope text,
      id_token text,
      session_state text,
      PRIMARY KEY (provider, "providerAccountId")
    )
  `;
  console.log('✅ account table created');
  
  // Create session table
  await sql`
    CREATE TABLE IF NOT EXISTS session (
      "sessionToken" text PRIMARY KEY NOT NULL,
      "userId" text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires timestamp NOT NULL
    )
  `;
  console.log('✅ session table created');
  
  // Create verificationToken table
  await sql`
    CREATE TABLE IF NOT EXISTS "verificationToken" (
      identifier text NOT NULL,
      token text NOT NULL,
      expires timestamp NOT NULL,
      PRIMARY KEY (identifier, token)
    )
  `;
  console.log('✅ verificationToken table created');
  
  // Add image column to users if not exists
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS image text`;
    console.log('✅ image column added to users');
  } catch (e) {
    console.log('⚠️ image column might already exist');
  }
  
  // Add emailVerified as timestamp if needed for OAuth
  // (keep the boolean one, we'll handle in adapter)
  
  await sql.end();
  console.log('\n🎉 Done!');
};

createTables();
