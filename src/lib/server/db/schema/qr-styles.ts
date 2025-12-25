import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { createCustomId } from "../../../utils/custom-id"
import { qrCodesTable } from "./qr-codes"

export const patternEnum = pgEnum("pattern", ["square", "dot", "rounded"])
export const cornerStyleEnum = pgEnum("corner_style", ["square", "rounded", "extra-rounded"])

export const qrStylesTable = pgTable("qr_styles", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createCustomId()),
  qrCodeId: text("qr_code_id")
    .notNull()
    .references(() => qrCodesTable.id, { onDelete: "cascade" }),
  foregroundColor: text("foreground_color").notNull().default("#000000"),
  backgroundColor: text("background_color").notNull().default("#FFFFFF"),
  pattern: patternEnum().notNull().default("square"),
  cornerStyle: cornerStyleEnum("corner_style").notNull().default("square"),
  logoDataUrl: text("logo_data_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const insertQrStyleSchema = createInsertSchema(qrStylesTable, {
  foregroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  pattern: z.enum(["square", "dot", "rounded"]),
  cornerStyle: z.enum(["square", "rounded", "extra-rounded"]),
  logoDataUrl: z.string().optional(),
})

export const selectQrStyleSchema = createSelectSchema(qrStylesTable)

export type QrStyle = typeof qrStylesTable.$inferSelect
export type InsertQrStyle = typeof qrStylesTable.$inferInsert
