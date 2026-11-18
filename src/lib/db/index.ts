import { config as loadEnv } from "dotenv";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "@/lib/db/schema";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  ssSql?: Sql;
  ssDb?: Database;
};

export function getSql() {
  if (!globalForDb.ssSql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set. Copy .env.example to .env.");
    }
    globalForDb.ssSql = postgres(url, {
      max: 10,
      // Required for Neon and Supabase poolers. Row locks still need a session connection, not port 6543.
      prepare: false,
    });
  }
  return globalForDb.ssSql;
}

export function getDb() {
  if (!globalForDb.ssDb) {
    globalForDb.ssDb = drizzle(getSql(), { schema });
  }
  return globalForDb.ssDb;
}
