import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { createCustomId } from "../../../utils/custom-id"

export const qrTypeEnum = pgEnum("qr_type", ["static", "dynamic"])

export const qrCodesTable = pgTable("qr_codes", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createCustomId()),
  userId: text("user_id"),
  shortCode: text("short_code").unique(),
  destinationUrl: text("destination_url").notNull(),
  title: text(),
  description: text(),
  type: qrTypeEnum().notNull().default("static"),
  scanCount: integer("scan_count").notNull().default(0),
  lastScannedAt: timestamp("last_scanned_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const insertQrCodeSchema = createInsertSchema(qrCodesTable, {
  destinationUrl: z
    .string()
    .min(1, "URL is required")
    .refine(
      (val) => {
        try {
          new URL(val)
          return true
        } catch {
          return false
        }
      },
      { message: "Please enter a valid URL" },
    ),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  type: z.enum(["static", "dynamic"]),
})

export const selectQrCodeSchema = createSelectSchema(qrCodesTable)

export type QrCode = typeof qrCodesTable.$inferSelect
export type InsertQrCode = typeof qrCodesTable.$inferInsert
