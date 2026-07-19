import { prisma } from '@/lib/db/prisma';
import { processSubscriptionRenewal } from '@/lib/billing/self-billing';
import { PLANS } from '@/lib/plans';

describe('processSubscriptionRenewal', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('creates renewal payment for subscription owner', async () => {
    // Mock DB lookups used by the renewal flow
    (prisma.subscription.findUnique as any) = jest.fn().mockResolvedValue({ organizationId: 'org-1', plan: 'STARTER' });
    (prisma.organization.findUnique as any) = jest.fn().mockResolvedValue({ ownerId: 'owner-1' });
    (prisma.user.findUnique as any) = jest.fn().mockResolvedValue({ id: 'owner-1', email: 'owner@example.com' });

    // Capture subscription payment creation and return a fake payment record
    const mockPaymentCreate = jest.fn().mockResolvedValue({ id: 'pay-1', expiresAt: new Date() });
    (prisma.subscriptionPayment as any) = { create: mockPaymentCreate };

    // Capture audit log writes
    const mockAuditCreate = jest.fn().mockResolvedValue({});
    (prisma.subscriptionAuditLog as any) = { create: mockAuditCreate };

    const res = await processSubscriptionRenewal('sub-1');

    expect(res.success).toBe(true);
    expect(mockPaymentCreate).toHaveBeenCalledTimes(1);

    const createArgs = mockPaymentCreate.mock.calls[0][0];
    // Ensure the payment was created for the organization owner and mapped plan
    expect(createArgs.data.userId).toBe('owner-1');
    // STARTER maps to FREE in the billing mapping
    expect(createArgs.data.planTier).toBe('FREE');
    // price should match canonical plan price (FREE => 0)
    expect(createArgs.data.amount).toBe((PLANS as any).FREE.price);
    expect(res.success).toBe(true);
    expect(res.payment).toBeDefined();
    if (!res.payment) {
      throw new Error('Expected renewal payment to be created');
    }
    expect(res.payment.paymentRef).toBeDefined();
  });
});
