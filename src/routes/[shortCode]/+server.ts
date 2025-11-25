import { error, redirect } from "@sveltejs/kit"
import { db } from "$lib/server/db"
import { qrCodesTable } from "$lib/server/db/schema"
import { eq } from "drizzle-orm"

import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ params }) => {
  const { shortCode } = params

  if (!shortCode) {
    error(404, "QR code not found")
  }

  const [qrCode] = await db
    .select()
    .from(qrCodesTable)
    .where(eq(qrCodesTable.shortCode, shortCode))
    .limit(1)

  if (!qrCode) {
    error(404, "QR code not found")
  }

  await db
    .update(qrCodesTable)
    .set({
      scanCount: qrCode.scanCount + 1,
      lastScannedAt: new Date(),
    })
    .where(eq(qrCodesTable.id, qrCode.id))

  redirect(307, qrCode.destinationUrl)
}
