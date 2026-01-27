import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema-sqlite';

const sqlite = new Database('db/custom.db');
export const dbSqlite = drizzle(sqlite, { schema });
