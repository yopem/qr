import { redirect } from "@sveltejs/kit"
import { db } from "$lib/server/db"
import { qrCodesTable } from "$lib/server/db/schema"
import { eq } from "drizzle-orm"

import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async (event) => {
  if (!event.locals.session) {
    redirect(303, "/auth/login")
  }

  const qrCodes = await db.query.qrCodesTable.findMany({
    where: eq(qrCodesTable.userId, event.locals.session.id),
    orderBy: (qrCodes, { desc }) => [desc(qrCodes.createdAt)],
  })

  return {
    title: "My QR Codes",
    description: "View and manage your QR codes",
    keywords: "qr codes, dashboard",
    user: event.locals.session,
    qrCodes,
  }
}
