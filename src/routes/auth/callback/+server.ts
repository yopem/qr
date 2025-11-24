import { error, redirect, type RequestEvent } from "@sveltejs/kit"
import { createAuthClient, setTokens } from "$lib/auth/auth.server"

export async function GET(event: RequestEvent) {
  const code = event.url.searchParams.get("code")

  if (!code) {
    throw error(400, "Authorization code is missing")
  }

  const authClient = createAuthClient(event)
  const tokens = await authClient.exchange(code, event.url.origin + "/auth/callback")

  if (!tokens.err) {
    setTokens(event, tokens.tokens.access, tokens.tokens.refresh)
  } else {
    console.error("Token exchange error:", tokens.err)
    throw error(401, "Failed to authenticate")
  }

  return redirect(302, `/`)
}
