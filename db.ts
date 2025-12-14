import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

let databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Remove channel_binding parameter if present (can cause issues with neon driver)
if (databaseUrl.includes('channel_binding=')) {
  databaseUrl = databaseUrl.replace(/[&?]channel_binding=[^&]*/g, '');
  // Clean up any leftover ? at the end or && in the middle
  databaseUrl = databaseUrl.replace(/\?$/, '').replace(/&&/g, '&').replace(/\?&/g, '?');
}

const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });
