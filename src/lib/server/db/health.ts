import { sql } from "drizzle-orm"

import { db } from "./index"

export interface DatabaseHealthCheck {
  connected: boolean
  error?: string
  timestamp: string
}

/**
 * Checks if the database connection is active
 * @returns Database health status
 */
export async function checkDatabaseConnection(): Promise<DatabaseHealthCheck> {
  const timestamp = new Date().toISOString()

  try {
    await db.execute(sql`SELECT 1`)
    return { connected: true, timestamp }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp,
    }
  }
}
