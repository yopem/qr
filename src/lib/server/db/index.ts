import { env } from "$env/dynamic/private"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "./schema"

if (!env.DATABASE_URL) {
  console.error("[Database] ✗ DATABASE_URL environment variable is not set")
  throw new Error("DATABASE_URL is not set")
}

console.log("[Database] DATABASE_URL is configured")

const client = postgres(env.DATABASE_URL)

export const db = drizzle(client, { schema })
