import { type Handle } from "@sveltejs/kit"
import { createAuthClient, setTokens } from "$lib/auth/auth.server"
import { subjects } from "$lib/auth/subjects"
import { checkDatabaseConnection } from "$lib/server/db/health"

let dbHealthChecked = false

export const handle: Handle = async ({ event, resolve }) => {
  if (!dbHealthChecked) {
    console.log("[Server Startup] Checking database connection...")
    const health = await checkDatabaseConnection()
    if (health.connected) {
      console.log("[Server Startup] ✓ Database connected successfully")
    } else {
      console.error("[Server Startup] ✗ Database connection failed:", health.error)
    }
    dbHealthChecked = true
  }

  if (event.url.pathname === "/auth/callback") {
    return resolve(event)
  }

  const client = createAuthClient(event)

  try {
    const accessToken = event.cookies.get("access_token")
    if (accessToken) {
      const refreshToken = event.cookies.get("refresh_token")
      const verified = await client.verify(subjects, accessToken, {
        refresh: refreshToken,
      })
      if (!verified.err) {
        if (verified.tokens) setTokens(event, verified.tokens.access, verified.tokens.refresh)
        event.locals.session = verified.subject.properties
      }
    }
  } catch (e) {
    console.error("Error verifying token:", e)
  }

  return resolve(event)
}
