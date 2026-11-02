import { z } from 'zod';
import type { Language } from './localization';
export const receiptSchema = z.object({ reference: z.string().regex(/^[A-F0-9]{12}$/), event_id: z.string().uuid(), language: z.enum(['fr', 'ar']), created_at: z.number(), advertising_allowed: z.boolean() });
export const receiptKey = 'mega-casting-receipt';
let volatileReceipt: z.infer<typeof receiptSchema> | null = null;
export function storeReceipt(receipt: z.infer<typeof receiptSchema>) {
  volatileReceipt = receipt;
  try { sessionStorage.setItem(receiptKey, JSON.stringify(receipt)); } catch { /* Confirmation remains available during this visit. */ }
}
export function createReceipt(result: unknown, language: Language, advertisingAllowed: boolean) {
  const response = z.object({ reference: z.string().regex(/^[A-F0-9]{12}$/), event_id: z.string().uuid().optional() }).parse(result);
  return receiptSchema.parse({ ...response, event_id: response.event_id ?? crypto.randomUUID(), language, created_at: Date.now(), advertising_allowed: !!response.event_id && advertisingAllowed });
}
export function readReceipt() {
  let stored: unknown = volatileReceipt;
  try { stored = JSON.parse(sessionStorage.getItem(receiptKey) ?? 'null') ?? volatileReceipt; } catch { /* Fall back to the confirmed in-memory receipt. */ }
  const parsed = receiptSchema.safeParse(stored);
  return parsed.success && Date.now() >= parsed.data.created_at && Date.now() - parsed.data.created_at < 24 * 60 * 60 * 1000 ? parsed.data : null;
}