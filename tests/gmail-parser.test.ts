import { parseFamPayEmail } from '@/lib/gmail/parser';

describe('FamPay parser', () => {
  test('parses simple success email with ₹ amount and transaction id', () => {
    const body = `Your payment of ₹2.0 is successful\nYou have successfully paid ₹2.0 to Google Play\nTransaction ID: FMPIB5795434991\n07:34 PM IST, 11 June 2026\nPurpose: MandateExecute`;
    const parsed = parseFamPayEmail(body, new Date('2026-06-11T19:34:00Z'));
    expect(parsed).not.toBeNull();
    expect(parsed?.amount).toBe(2);
    expect(parsed?.utr).toBe('FMPIB5795434991');
    expect(parsed?.sender?.toLowerCase()).toContain('google play');
    expect(parsed?.paymentSuccessful).toBe(true);
  });

  test('rejects failed or refunded emails', () => {
    const body = `Payment of ₹100 was refunded to you\nTransaction ID: FMPIB0000`;
    const parsed = parseFamPayEmail(body);
    expect(parsed).toBeNull();
  });
});
