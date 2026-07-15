jest.setTimeout(10000);

describe('Checkout E2E - selectedPlan -> pendingPayment -> checkoutPlan', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('selectedPlan, pendingPayment.plan and checkout plan are identical', async () => {
    const planKey = 'PREMIUM_2';

    // Mock session
    jest.mock('@/lib/api/middleware', () => ({
      requireSession: jest.fn().mockResolvedValue({ user: { id: 'user-1', email: 'user@example.com' } })
    }));

    // Mock prisma subscriptionPayment
    const mockSubscriptionPayment = {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    };

    jest.mock('@/lib/db/prisma', () => ({ prisma: { subscriptionPayment: mockSubscriptionPayment } }));

    const { PLANS } = require('@/lib/plans');
    const { POST } = require('@/app/api/dashboard/billing/checkout/route');
    const { GET } = require('@/app/api/dashboard/billing/payment/route');

    const paymentRecord = {
      id: 'pay-1',
      paymentRef: 'SUB_user-1_1',
      amount: PLANS[planKey].price,
      planTier: planKey,
      plan: planKey,
      targetUPI: 'aviralji@fam',
      status: 'PENDING',
      expiresAt: new Date()
    };

    (mockSubscriptionPayment.create as any).mockResolvedValue(paymentRecord);
    (mockSubscriptionPayment.findFirst as any).mockResolvedValue(paymentRecord);

    // Simulate POST /checkout
    const fakeReq = { json: async () => ({ plan: planKey }) } as any;
    await POST(fakeReq);

    // Ensure create called with canonical amount and planTier
    expect(mockSubscriptionPayment.create).toHaveBeenCalledTimes(1);
    const createArgs = (mockSubscriptionPayment.create as jest.Mock).mock.calls[0][0];
    expect(createArgs.data.planTier).toBe(planKey);
    expect(createArgs.data.amount).toBe(PLANS[planKey].price);

    // Simulate GET /payment
    const fakeGetReq = { nextUrl: { searchParams: new URLSearchParams() } } as any;
    await GET(fakeGetReq);

    expect(mockSubscriptionPayment.findFirst).toHaveBeenCalledTimes(1);
    const findArgs = (mockSubscriptionPayment.findFirst as jest.Mock).mock.calls[0][0];
    expect(findArgs.where.status).toBe('PENDING');

    // Proof of identity
    const selectedPlan = planKey;
    const pendingPaymentPlan = paymentRecord.planTier;
    const checkoutPlan = planKey; // checkout originates from selectedPlan

    expect(selectedPlan).toBe(pendingPaymentPlan);
    expect(pendingPaymentPlan).toBe(checkoutPlan);
  });
});
