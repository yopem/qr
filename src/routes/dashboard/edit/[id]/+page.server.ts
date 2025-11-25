import { error, redirect } from "@sveltejs/kit"

import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async (event) => {
  if (!event.locals.session) {
    redirect(303, "/auth/login")
  }

  const { id } = event.params

  if (!id) {
    error(404, "QR code not found")
  }

  return {
    title: "Edit QR Code",
    description: "Edit your QR code",
    keywords: "qr code, edit",
    user: event.locals.session,
    qrCodeId: id,
  }
}
