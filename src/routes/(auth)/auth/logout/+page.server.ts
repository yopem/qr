import { redirect, type Actions } from "@sveltejs/kit"

export const actions = {
  default: async ({ cookies }) => {
    cookies.delete("access_token", { path: "/" })
    cookies.delete("refresh_token", { path: "/" })

    throw redirect(303, "/auth/login")
  },
} satisfies Actions
