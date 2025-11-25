import { redirect } from "@sveltejs/kit"

import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async (event) => {
  if (!event.locals.session) {
    redirect(303, "/auth/login")
  }

  return {
    title: "My QR Codes",
    description: "View and manage your QR codes",
    keywords: "qr codes, dashboard",
    user: event.locals.session,
  }
}
