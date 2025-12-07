import { error } from "@sveltejs/kit"
import { db } from "$lib/server/db"
import { qrCodesTable, qrStylesTable } from "$lib/server/db/schema"
import { generateQrCodeSvg, validateQrOptions } from "$lib/utils/qr-generator"
import { nanoid } from "nanoid"
import { z } from "zod"

import type { Actions, PageServerLoad } from "./$types"

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

export const load: PageServerLoad = async (event) => {
  return {
    user: event.locals.session,
  }
}

export const actions: Actions = {
  generateQrCode: async ({ request, locals, url }) => {
    const session = locals.session
    const startTime = Date.now()

    try {
      const formData = await request.formData()
      const data = qrGenerateSchema.parse({
        destinationUrl: formData.get("destinationUrl"),
        description: formData.get("description") || undefined,
        type: formData.get("type"),
        foregroundColor: formData.get("foregroundColor") || undefined,
        backgroundColor: formData.get("backgroundColor") || undefined,
      })

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
      const urlToEncode = shortCode ? `${url.origin}/${shortCode}` : data.destinationUrl

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

      try {
        console.log("[QR Generation] Saving to database:", {
          userId: session?.id || "guest",
          type: data.type,
          hasShortCode: !!shortCode,
        })

        const [qrCode] = await db
          .insert(qrCodesTable)
          .values({
            userId: session?.id || null,
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
          isGuest: !session,
          duration: Date.now() - startTime,
        })

        return { success: true, id: qrCode.id, svg, shortCode }
      } catch (err) {
        console.error("[QR Generation] Database error:", {
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          userId: session?.id || "guest",
        })
        error(500, "Failed to save QR code. Please try again.")
      }
    } catch (err) {
      const duration = Date.now() - startTime
      console.error("[QR Generation] Unexpected error:", {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        duration,
      })
      throw err
    }
  },
}
