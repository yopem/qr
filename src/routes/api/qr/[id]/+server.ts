import { error, json } from "@sveltejs/kit"
import { db } from "$lib/server/db"
import { qrCodesTable } from "$lib/server/db/schema"
import { eq } from "drizzle-orm"

import type { RequestHandler } from "./$types"

export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!locals.session) {
    error(401, "Authentication required")
  }

  const { id } = params

  const qrCode = await db.query.qrCodesTable.findFirst({
    where: eq(qrCodesTable.id, id),
  })

  if (!qrCode) {
    error(404, "QR code not found")
  }

  if (qrCode.userId !== locals.session.id) {
    error(403, "Unauthorized")
  }

  await db.delete(qrCodesTable).where(eq(qrCodesTable.id, id))

  return json({ success: true })
}
