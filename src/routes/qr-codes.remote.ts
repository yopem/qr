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
  const startTime = Date.now()

  try {
    console.log("[QR Generation] Request received:", {
      type: data.type,
      userId: session?.id,
      hasUrl: !!data.destinationUrl,
      timestamp: new Date().toISOString(),
    })

    if (data.type === "dynamic" && !session) {
      console.log("[QR Generation] Auth required for dynamic QR")
      error(401, "Authentication required for dynamic QR codes")
    }

    let validation
    try {
      validation = validateQrOptions({ url: data.destinationUrl })
      if (!validation.valid) {
        console.log("[QR Generation] Validation failed:", {
          url: data.destinationUrl,
          error: validation.error,
        })
        error(400, validation.error || "Invalid QR code options")
      }
      console.log("[QR Generation] Validation completed")
    } catch (err) {
      console.error("[QR Generation] Validation error:", {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      })
      error(500, "Failed to validate QR code options")
    }

    const shortCode = data.type === "dynamic" ? nanoid(8) : null
    const urlToEncode = shortCode ? `${event.url.origin}/${shortCode}` : data.destinationUrl

    let svg: string
    try {
      console.log("[QR Generation] Starting QR generation:", {
        urlLength: urlToEncode.length,
        hasColors: !!(data.foregroundColor || data.backgroundColor),
      })

      svg = await generateQrCodeSvg({
        url: urlToEncode,
        styles: {
          foregroundColor: data.foregroundColor,
          backgroundColor: data.backgroundColor,
        },
      })

      console.log("[QR Generation] QR generation completed:", {
        svgLength: svg.length,
        duration: Date.now() - startTime,
      })
    } catch (err) {
      console.error("[QR Generation] QR generation failed:", {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        url: urlToEncode,
        colors: { fg: data.foregroundColor, bg: data.backgroundColor },
      })
      error(500, "Failed to generate QR code. Please try again.")
    }

    if (session) {
      try {
        console.log("[QR Generation] Saving to database:", {
          userId: session.id,
          type: data.type,
          hasShortCode: !!shortCode,
        })

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

        console.log("[QR Generation] Database save completed:", {
          qrCodeId: qrCode.id,
          duration: Date.now() - startTime,
        })

        return { success: true, id: qrCode.id, svg, shortCode }
      } catch (err) {
        console.error("[QR Generation] Database error:", {
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          userId: session.id,
        })
        error(500, "Failed to save QR code. Please try again.")
      }
    }

    console.log("[QR Generation] Success (no save):", {
      duration: Date.now() - startTime,
    })

    return { success: true, svg }
  } catch (err) {
    const duration = Date.now() - startTime
    console.error("[QR Generation] Unexpected error:", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      type: data.type,
      userId: session?.id,
      duration,
    })
    throw err
  }
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
