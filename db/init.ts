import * as SQLite from 'expo-sqlite';
import { INIT_SQL } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('flowerfarm.db');
  await db.execAsync(INIT_SQL);
  return db;
}
