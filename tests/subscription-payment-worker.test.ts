/// <reference types="jest" />

jest.mock('@/lib/billing/self-billing', () => ({
  verifySubscriptionPaymentByUtr: jest.fn()
}));

jest.mock('@/lib/services/verification', () => ({
  verifyOrderByUtr: jest.fn()
}));

const { processPaymentVerificationJob } = require('@/workers/processors/payment/payment-worker');
const { verifySubscriptionPaymentByUtr } = require('@/lib/billing/self-billing');

describe('payment worker subscription verification job', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('retries when Gmail transaction is not yet available', async () => {
    (verifySubscriptionPaymentByUtr as jest.Mock).mockResolvedValue({ verified: false, reason: 'EMAIL_NOT_FOUND', retry: true });

    await expect(
      processPaymentVerificationJob({ name: 'verify-subscription-payment', data: { paymentId: 'pay-1', submittedUtr: 'UTR123' } } as any)
    ).rejects.toThrow('EMAIL_NOT_FOUND');

    expect(verifySubscriptionPaymentByUtr).toHaveBeenCalledWith({ paymentId: 'pay-1', paymentRef: undefined, submittedUtr: 'UTR123' });
  });

  test('completes successfully when subscription payment verification succeeds', async () => {
    (verifySubscriptionPaymentByUtr as jest.Mock).mockResolvedValue({ verified: true, reason: 'verified' });

    await expect(
      processPaymentVerificationJob({ name: 'verify-subscription-payment', data: { paymentId: 'pay-1', submittedUtr: 'UTR123' } } as any)
    ).resolves.toEqual({ verified: true, reason: 'verified' });

    expect(verifySubscriptionPaymentByUtr).toHaveBeenCalledWith({ paymentId: 'pay-1', paymentRef: undefined, submittedUtr: 'UTR123' });
  });
});
