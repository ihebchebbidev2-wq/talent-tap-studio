import { describe, expect, it, vi } from 'vitest';
import { createReceipt, readReceipt, receiptKey, storeReceipt } from './receipt';
describe('confirmed casting receipts', () => {
  it('accepts a saved legacy response without enabling conversion reporting', () => {
    const receipt = createReceipt({ reference: 'ABCDEF123456' }, 'fr', true);
    expect(receipt.reference).toBe('ABCDEF123456');
    expect(receipt.advertising_allowed).toBe(false);
  });
  it('preserves backend event identity and Arabic language on confirmed completion', () => {
    const event_id = '1db09be4-0bd2-4a04-a7a8-726d7e277948';
    const receipt = createReceipt({ reference: 'ABCDEF123456', event_id }, 'ar', true);
    expect(receipt.event_id).toBe(event_id); expect(receipt.language).toBe('ar'); expect(receipt.advertising_allowed).toBe(true);
  });
  it('never marks a completion without advertising permission as reportable', () => {
    expect(createReceipt({ reference: 'ABCDEF123456', event_id: '1db09be4-0bd2-4a04-a7a8-726d7e277948' }, 'fr', false).advertising_allowed).toBe(false);
  });
  it('rejects receipts after their one-day lifetime', () => {
    const receipt = createReceipt({ reference: 'ABCDEF123456' }, 'fr', false);
    sessionStorage.setItem(receiptKey, JSON.stringify({ ...receipt, created_at: Date.now() - 86400001 }));
    expect(readReceipt()).toBeNull(); sessionStorage.removeItem(receiptKey);
  });
  it('retains a saved confirmation when browser session storage fails', () => {
    const receipt = createReceipt({ reference: 'ABCDEF123456' }, 'fr', false);
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage unavailable'); });
    storeReceipt(receipt);
    expect(readReceipt()?.reference).toBe('ABCDEF123456');
    write.mockRestore();
  });
});