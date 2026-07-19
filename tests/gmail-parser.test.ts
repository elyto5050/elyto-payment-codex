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

  test('parses incoming FamX payment emails with received wording', () => {
    const subject = 'You received ₹89.0 in your FamX account';
    const body = `Hey Aviral,
You have successfully received ₹89.0 from AVIRAL at 12:57 PM IST...
transaction id FMPIB6210645278
UTR: 003487543533`;

    const parsed = parseFamPayEmail(body, new Date('2026-06-11T12:57:00Z'), subject);

    expect(parsed).not.toBeNull();
    expect(parsed?.amount).toBe(89);
    expect(parsed?.utr).toBe('003487543533');
    expect(parsed?.transactionId).toBe('FMPIB6210645278');
    expect(parsed?.sender).toBe('AVIRAL');
    expect(parsed?.paymentSuccessful).toBe(true);
  });

  test('rejects failed or refunded emails', () => {
    const body = `Payment of ₹100 was refunded to you\nTransaction ID: FMPIB0000`;
    const parsed = parseFamPayEmail(body);
    expect(parsed).toBeNull();
  });
});
