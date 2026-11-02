import { expect, it, vi } from 'vitest';
const api = vi.hoisted(() => vi.fn());
vi.mock('@/features/casting/api', () => ({ api }));
import { readChoice, saveChoice } from './consent';
it('does not let a delayed acceptance overwrite a later withdrawal', async () => {
  localStorage.clear();
  let resolveAcceptance: ((value: { id: string }) => void) | undefined;
  api.mockImplementationOnce(() => new Promise(resolve => { resolveAcceptance = resolve; })).mockResolvedValueOnce({ id: 'withdrawal-record' });
  const pending = saveChoice(true, 'FR');
  await saveChoice(false, 'FR');
  resolveAcceptance?.({ id: 'earlier-acceptance-record' });
  await pending;
  expect(readChoice()?.accepted).toBe(false);
  expect(readChoice()?.evidence_id).toBe('withdrawal-record');
});