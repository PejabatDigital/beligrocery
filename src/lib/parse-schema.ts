import { z } from 'zod'
import { CATEGORIES } from './categories'

// Contract for /api/parse-order. Shared by the Pages Function and the client.

export const catalogueEntrySchema = z.object({
  id: z.string(),
  canonical_name: z.string(),
  aliases: z.array(z.string()),
  category: z.enum(CATEGORIES),
})

export const parseRequestSchema = z.object({
  raw_text: z.string().trim().min(1).max(8000),
  catalogue: z.array(catalogueEntrySchema).max(2000),
})

export const parsedItemSchema = z.object({
  raw_line: z.string(),
  name: z.string().min(1),
  quantity: z.number().positive().nullable(),
  unit: z.string().nullable(),
  amount_rm: z.number().nonnegative().nullable(),
  category: z.enum(CATEGORIES).nullable(),
  matched_item_id: z.string().nullable(),
  confidence: z.enum(['high', 'low']),
})

export const parsedOrderSchema = z.object({
  /** YYYY-MM-DD, or null if the text has no date. */
  order_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  total_rm: z.number().nonnegative().nullable(),
  items: z.array(parsedItemSchema),
})

export const parseResultSchema = z.object({
  orders: z.array(parsedOrderSchema),
  warnings: z.array(z.string()),
})

export type ParseRequest = z.infer<typeof parseRequestSchema>
export type ParsedItem = z.infer<typeof parsedItemSchema>
export type ParsedOrder = z.infer<typeof parsedOrderSchema>
export type ParseResult = z.infer<typeof parseResultSchema>
