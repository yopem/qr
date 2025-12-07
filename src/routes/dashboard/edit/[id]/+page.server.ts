import { error, redirect } from "@sveltejs/kit"
import { db } from "$lib/server/db"
import { qrCodesTable, qrStylesTable } from "$lib/server/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

import type { Actions, PageServerLoad } from "./$types"

const updateQrSchema = z.object({
  id: z.string(),
  destinationUrl: z.string().optional(),
  description: z.string().optional(),
  foregroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
})

export const load: PageServerLoad = async (event) => {
  if (!event.locals.session) {
    redirect(303, "/auth/login")
  }

  const { id } = event.params

  if (!id) {
    error(404, "QR code not found")
  }

  const qrCode = await db.query.qrCodesTable.findFirst({
    where: eq(qrCodesTable.id, id),
  })

  if (!qrCode) {
    error(404, "QR code not found")
  }

  if (qrCode.userId !== event.locals.session.id) {
    error(403, "Unauthorized")
  }

  const style = await db.query.qrStylesTable.findFirst({
    where: eq(qrStylesTable.qrCodeId, id),
  })

  return {
    title: "Edit QR Code",
    description: "Edit your QR code",
    keywords: "qr code, edit",
    user: event.locals.session,
    qrCode: { ...qrCode, style },
  }
}

export const actions: Actions = {
  updateQrCode: async ({ request, locals, params }) => {
    if (!locals.session) {
      error(401, "Authentication required")
    }

    const formData = await request.formData()
    const data = updateQrSchema.parse({
      id: params.id,
      destinationUrl: formData.get("destinationUrl") || undefined,
      description: formData.get("description") || undefined,
      foregroundColor: formData.get("foregroundColor") || undefined,
      backgroundColor: formData.get("backgroundColor") || undefined,
    })

    const qrCode = await db.query.qrCodesTable.findFirst({
      where: eq(qrCodesTable.id, data.id),
    })

    if (!qrCode) {
      error(404, "QR code not found")
    }

    if (qrCode.userId !== locals.session.id) {
      error(403, "Unauthorized")
    }

    if (data.destinationUrl && qrCode.type === "static") {
      error(400, "Cannot change URL of static QR code")
    }

    if (data.destinationUrl || data.description) {
      await db
        .update(qrCodesTable)
        .set({
          destinationUrl: data.destinationUrl,
          description: data.description,
          updatedAt: new Date(),
        })
        .where(eq(qrCodesTable.id, data.id))
    }

    if (data.foregroundColor || data.backgroundColor) {
      await db
        .update(qrStylesTable)
        .set({
          foregroundColor: data.foregroundColor,
          backgroundColor: data.backgroundColor,
          updatedAt: new Date(),
        })
        .where(eq(qrStylesTable.qrCodeId, data.id))
    }

    return { success: true }
  },
}
