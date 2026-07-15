import { prisma } from '@/lib/db/prisma';
import { handleSubscriptionPaymentWebhook } from '@/lib/billing/self-billing';
import { PLANS } from '@/lib/plans';

jest.mock('@/lib/billing/service', () => ({
  upgradePlan: jest.fn().mockResolvedValue({}),
}));

jest.mock('@/lib/services/notifications', () => ({
  createNotification: jest.fn().mockResolvedValue({}),
}));

describe('subscription payment webhook handler', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('activates subscription when matching pending subscription payment exists', async () => {
    (prisma.subscriptionPayment.findFirst as any) = jest.fn().mockResolvedValue({
      id: 'pay-1',
      userId: 'owner-1',
      userEmail: 'owner@example.com',
      planTier: 'PREMIUM_2',
      amount: (PLANS as any).PREMIUM_2.price,
      paymentRef: 'SUB_owner_123',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60)
    });

    (prisma.subscriptionPayment.update as any) = jest.fn().mockResolvedValue({ id: 'pay-1', status: 'VERIFIED' });
    (prisma.organization.findFirst as any) = jest.fn().mockResolvedValue(null);
    (prisma.teamMember.findFirst as any) = jest.fn().mockResolvedValue(null);
    (prisma.organization.create as any) = jest.fn().mockResolvedValue({ id: 'org-1' });
    (prisma.subscription.create as any) = jest.fn().mockResolvedValue({ id: 'sub-1' });
    (prisma.subscriptionAuditLog as any) = { create: jest.fn().mockResolvedValue({}) };

    const res = await handleSubscriptionPaymentWebhook({
      from: 'payer@example.com',
      to: 'aviralji@fam',
      amount: (PLANS as any).PREMIUM_2.price,
      transactionHash: 'tx-1',
      paymentRef: 'SUB_owner_123',
      timestamp: new Date().toISOString()
    } as any);

    expect(res.success).toBe(true);
    expect((prisma.subscription.create as any)).toHaveBeenCalled();
    expect((prisma.subscriptionPayment.update as any)).toHaveBeenCalled();
  });
});
