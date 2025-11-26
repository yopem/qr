import { error } from "@sveltejs/kit"
import { command, form, getRequestEvent, query } from "$app/server"
import { db } from "$lib/server/db"
import { qrCodesTable, qrStylesTable } from "$lib/server/db/schema"
import { generateQrCodeSvg, validateQrOptions } from "$lib/utils/qr-generator"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { z } from "zod"

const qrGenerateSchema = z.object({
  destinationUrl: z.string().min(1),
  description: z.string().max(500).optional(),
  type: z.enum(["static", "dynamic"]),
  foregroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
})

export const generateQrCode = form(qrGenerateSchema, async (data) => {
  const event = getRequestEvent()
  const session = event.locals.session

  if (data.type === "dynamic" && !session) {
    error(401, "Authentication required for dynamic QR codes")
  }

  const validation = validateQrOptions({ url: data.destinationUrl })
  if (!validation.valid) {
    error(400, validation.error || "Invalid QR code options")
  }

  const shortCode = data.type === "dynamic" ? nanoid(8) : null
  const urlToEncode = shortCode ? `${event.url.origin}/${shortCode}` : data.destinationUrl

  const svg = await generateQrCodeSvg({
    url: urlToEncode,
    styles: {
      foregroundColor: data.foregroundColor,
      backgroundColor: data.backgroundColor,
    },
  })

  if (session) {
    const [qrCode] = await db
      .insert(qrCodesTable)
      .values({
        userId: session.id,
        shortCode,
        destinationUrl: data.destinationUrl,
        description: data.description,
        type: data.type,
      })
      .returning()

    await db.insert(qrStylesTable).values({
      qrCodeId: qrCode.id,
      foregroundColor: data.foregroundColor || "#000000",
      backgroundColor: data.backgroundColor || "#FFFFFF",
      pattern: "square",
      cornerStyle: "square",
      logoDataUrl: null,
    })

    return { success: true, id: qrCode.id, svg, shortCode }
  }

  return { success: true, svg }
})

export const getUserQrCodes = query(async () => {
  const event = getRequestEvent()
  const session = event.locals.session

  if (!session) {
    error(401, "Authentication required")
  }

  const qrCodes = await db.query.qrCodesTable.findMany({
    where: eq(qrCodesTable.userId, session.id),
    orderBy: (qrCodes, { desc }) => [desc(qrCodes.createdAt)],
  })

  return qrCodes
})

export const getQrCode = query(z.string(), async (id) => {
  const event = getRequestEvent()
  const session = event.locals.session

  if (!session) {
    error(401, "Authentication required")
  }

  const qrCode = await db.query.qrCodesTable.findFirst({
    where: eq(qrCodesTable.id, id),
  })

  if (!qrCode) {
    error(404, "QR code not found")
  }

  if (qrCode.userId !== session.id) {
    error(403, "Unauthorized")
  }

  const style = await db.query.qrStylesTable.findFirst({
    where: eq(qrStylesTable.qrCodeId, id),
  })

  return { ...qrCode, style }
})

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

export const updateQrCode = form(updateQrSchema, async (data) => {
  const event = getRequestEvent()
  const session = event.locals.session

  if (!session) {
    error(401, "Authentication required")
  }

  const qrCode = await db.query.qrCodesTable.findFirst({
    where: eq(qrCodesTable.id, data.id),
  })

  if (!qrCode) {
    error(404, "QR code not found")
  }

  if (qrCode.userId !== session.id) {
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

  await getQrCode(data.id).refresh()

  return { success: true }
})

export const deleteQrCode = command(z.string(), async (id) => {
  const event = getRequestEvent()
  const session = event.locals.session

  if (!session) {
    error(401, "Authentication required")
  }

  const qrCode = await db.query.qrCodesTable.findFirst({
    where: eq(qrCodesTable.id, id),
  })

  if (!qrCode) {
    error(404, "QR code not found")
  }

  if (qrCode.userId !== session.id) {
    error(403, "Unauthorized")
  }

  await db.delete(qrCodesTable).where(eq(qrCodesTable.id, id))

  await getUserQrCodes().refresh()

  return { success: true }
})

export const bulkDeleteQrCodes = command(z.array(z.string()), async (ids) => {
  const event = getRequestEvent()
  const session = event.locals.session

  if (!session) {
    error(401, "Authentication required")
  }

  const results = await Promise.allSettled(
    ids.map(async (id) => {
      const qrCode = await db.query.qrCodesTable.findFirst({
        where: eq(qrCodesTable.id, id),
      })

      if (!qrCode || qrCode.userId !== session.id) {
        throw new Error(`Cannot delete QR code: ${id}`)
      }

      await db.delete(qrCodesTable).where(eq(qrCodesTable.id, id))
      return id
    }),
  )

  const succeeded = results.filter((r) => r.status === "fulfilled").length
  const failed = results.filter((r) => r.status === "rejected").length

  await getUserQrCodes().refresh()

  return { succeeded, failed }
})
