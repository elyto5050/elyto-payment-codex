/// <reference types="jest" />

import { apiOk, apiError } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';
import { queues } from '@/lib/queues';

jest.mock('@/lib/api/middleware', () => ({
  requireSession: jest.fn().mockResolvedValue({ user: { id: 'user-1', email: 'user@example.com' } })
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    subscriptionPayment: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    transaction: {
      findFirst: jest.fn()
    }
  }
}));

jest.mock('@/lib/queues', () => ({
  queues: {
    paymentVerification: {
      add: jest.fn()
    }
  }
}));

const mockPrisma = prisma as any;
const mockQueues = queues as any;

describe('POST /api/dashboard/billing/submit-utr', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.REDIS_URL = 'redis://localhost:6379';
  });

  afterEach(() => {
    delete process.env.REDIS_URL;
  });

  test('enqueues subscription verification when Gmail transaction is not found', async () => {
    mockPrisma.subscriptionPayment.findUnique.mockResolvedValue({
      id: 'pay-123',
      userId: 'user-1',
      paymentRef: 'SUB_user-1_123',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 1000 * 60 * 10),
      amount: 500
    });
    mockPrisma.transaction.findFirst.mockResolvedValue(null);
    (mockQueues.paymentVerification.add as jest.Mock).mockResolvedValue({});

    const { POST } = require('@/app/api/dashboard/billing/submit-utr/route');
    const fakeReq = { json: async () => ({ paymentRef: 'SUB_user-1_123', utr: 'UTR123' }) } as any;

    const response = await POST(fakeReq);
    const body = await response.json();

    expect(mockQueues.paymentVerification.add).toHaveBeenCalledWith('verify-subscription-payment', {
      paymentId: 'pay-123',
      paymentRef: 'SUB_user-1_123',
      submittedUtr: 'UTR123'
    });
    expect(body.data.matched).toBe(false);
    expect(body.data.message).toContain('awaiting Gmail confirmation');
  });
});
