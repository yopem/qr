import { error, json } from "@sveltejs/kit"
import { db } from "$lib/server/db"
import { qrCodesTable } from "$lib/server/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

import type { RequestHandler } from "./$types"

const bulkDeleteSchema = z.object({
  ids: z.array(z.string()),
})

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.session) {
    error(401, "Authentication required")
  }

  const body = await request.json()
  const { ids } = bulkDeleteSchema.parse(body)

  const results = await Promise.allSettled(
    ids.map(async (id) => {
      const qrCode = await db.query.qrCodesTable.findFirst({
        where: eq(qrCodesTable.id, id),
      })

      if (!qrCode || qrCode.userId !== locals.session?.id) {
        throw new Error(`Cannot delete QR code: ${id}`)
      }

      await db.delete(qrCodesTable).where(eq(qrCodesTable.id, id))
      return id
    }),
  )

  const succeeded = results.filter((r) => r.status === "fulfilled").length
  const failed = results.filter((r) => r.status === "rejected").length

  return json({ succeeded, failed })
}
