import { formatCurrency, slugify } from '@/lib/utils';

describe('utils', () => {
  test('formatCurrency formats numbers as INR currency', () => {
    const v = formatCurrency(12345);
    expect(typeof v).toBe('string');
    expect(v).toContain('₹');
  });

  test('slugify produces url-friendly strings', () => {
    expect(slugify('Hello World!')).toBe('hello-world');
    expect(slugify('A'.repeat(100))).toHaveLength(48);
  });
});
