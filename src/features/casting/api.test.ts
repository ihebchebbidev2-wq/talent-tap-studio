import { describe, expect, it } from 'vitest';
import { backendUrl } from './api';

describe('casting API config', () => {
  it('uses the public production backend URL', () => {
    expect(backendUrl).toBe('https://api.megacreative.art');
  });
});
