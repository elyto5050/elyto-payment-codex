const mockSubscriptionPayment = {
  create: jest.fn(),
  findFirst: jest.fn(),
  findUnique: jest.fn(),
};

describe('Billing checkout API (server authoritative)', () => {
  beforeEach(() => {
    jest.resetModules();
    mockSubscriptionPayment.create.mockReset();
    mockSubscriptionPayment.findFirst.mockReset();
    mockSubscriptionPayment.findUnique.mockReset();
  });

  test('POST /api/dashboard/billing/checkout creates subscriptionPayment with canonical amount', async () => {
    // Arrange: mock middleware and prisma for isolated module load
    jest.mock('@/lib/api/middleware', () => ({
      requireSession: jest.fn().mockResolvedValue({ user: { id: 'user-1', email: 'user@example.com' } })
    }));
    jest.mock('@/lib/db/prisma', () => ({ prisma: { subscriptionPayment: mockSubscriptionPayment } }));

    // Import the handler under isolated module registry
    const { POST } = require('@/app/api/dashboard/billing/checkout/route');
    const { prisma } = require('@/lib/db/prisma');
    const { PLANS } = require('@/lib/plans');

    (prisma.subscriptionPayment.create as any).mockResolvedValue({ id: 'pay-1', paymentRef: 'SUB_user-1_1', amount: PLANS.PREMIUM_2.price });

    const fakeReq = { json: async () => ({ plan: 'PREMIUM_2' }) } as any;
    // Act
    await POST(fakeReq);

    // Assert
    expect(prisma.subscriptionPayment.create).toHaveBeenCalledTimes(1);
    const createArgs = (prisma.subscriptionPayment.create as jest.Mock).mock.calls[0][0];
    expect(createArgs.data.planTier).toBe('PREMIUM_2');
    expect(createArgs.data.amount).toBe(PLANS.PREMIUM_2.price);
  });

  test('GET /api/dashboard/billing/payment returns latest pending payment from DB', async () => {
    jest.mock('@/lib/api/middleware', () => ({
      requireSession: jest.fn().mockResolvedValue({ user: { id: 'user-1', email: 'user@example.com' } })
    }));
    jest.mock('@/lib/db/prisma', () => ({ prisma: { subscriptionPayment: mockSubscriptionPayment } }));

    const { GET } = require('@/app/api/dashboard/billing/payment/route');
    const { prisma } = require('@/lib/db/prisma');
    const { PLANS } = require('@/lib/plans');

    const fakePayment = {
      id: 'pay-1',
      paymentRef: 'SUB_user-1_1',
      amount: PLANS.PREMIUM_2.price,
      planTier: 'PREMIUM_2',
      targetUPI: 'aviralji@fam',
      status: 'PENDING',
      submittedUtr: null,
      expiresAt: new Date()
    };

    (prisma.subscriptionPayment.findFirst as any).mockResolvedValue(fakePayment);

    const fakeReq = { nextUrl: { searchParams: new URLSearchParams() } } as any;
    await GET(fakeReq);

    expect(prisma.subscriptionPayment.findFirst).toHaveBeenCalledTimes(1);
    const findArgs = (prisma.subscriptionPayment.findFirst as jest.Mock).mock.calls[0][0];
    expect(findArgs.where.userId).toBe('user-1');
    expect(findArgs.where.status).toBe('PENDING');
  });
});
