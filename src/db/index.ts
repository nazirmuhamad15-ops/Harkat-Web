import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema-sqlite';

const sqlite = new Database('db/custom.db');
export const db = drizzle(sqlite, { schema });

// Helper to get products (CRUD Test)
export async function getProducts() {
  return await db.select().from(schema.products);
}
