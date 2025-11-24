import { redirect, type Actions } from "@sveltejs/kit"
import { createAuthClient } from "$lib/auth/auth.server"

export const actions: Actions = {
  default: async (event) => {
    const authClient = createAuthClient(event)
    const result = await authClient.authorize(event.url.origin + "/auth/callback", "code")
    throw redirect(303, result.url)
  },
}
