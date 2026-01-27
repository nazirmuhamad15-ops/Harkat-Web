import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const applyMigration = async () => {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL!;
  
  console.log('🔄 Applying migration...');
  
  const client = postgres(connectionString);
  const db = drizzle(client);
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'drizzle', '0002_melodic_overlord.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    // Split by statement breakpoint and execute each statement
    const statements = migrationSQL
      .split('-->statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\nExecuting statement ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + '...');
      
      try {
        await db.execute(sql.raw(statement));
        console.log('✅ Success');
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.code === '42P07' || error.code === '42701') {
          console.log('⚠️  Already exists, skipping...');
        } else {
          console.error('❌ Error:', error.message);
          throw error;
        }
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

applyMigration();
