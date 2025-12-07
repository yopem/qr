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

    try {
      const formData = await request.formData()
      const data = qrGenerateSchema.parse({
        destinationUrl: formData.get("destinationUrl"),
        description: formData.get("description") || undefined,
        type: formData.get("type"),
        foregroundColor: formData.get("foregroundColor") || undefined,
        backgroundColor: formData.get("backgroundColor") || undefined,
      })

      if (data.type === "dynamic" && !session) {
        error(401, "Authentication required for dynamic QR codes")
      }

      let validation
      try {
        validation = validateQrOptions({ url: data.destinationUrl })
        if (!validation.valid) {
          error(400, validation.error || "Invalid QR code options")
        }
      } catch (err) {
        error(500, `Failed to validate QR code options ${err}`)
      }

      const shortCode = data.type === "dynamic" ? nanoid(8) : null
      const urlToEncode = shortCode ? `${url.origin}/${shortCode}` : data.destinationUrl

      let svg: string
      try {
        svg = await generateQrCodeSvg({
          url: urlToEncode,
          styles: {
            foregroundColor: data.foregroundColor,
            backgroundColor: data.backgroundColor,
          },
        })
      } catch (err) {
        error(500, `Failed to generate QR code. Please try again. ${err}`)
      }

      try {
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

        return { success: true, id: qrCode.id, svg, shortCode }
      } catch (err) {
        error(500, `Failed to save QR code. Please try again. ${err}`)
      }
    } catch (err) {
      error(500, `Failed to generate QR code. Please try again. ${err}`)
    }
  },
}
