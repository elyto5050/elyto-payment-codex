import { prisma } from '@/lib/db/prisma';
import { verifyOrderByUtr } from '@/lib/services/verification';
jest.mock('@/lib/services/billing', () => ({ incrementVerificationUsage: jest.fn() }));
import { OrderStatus, TransactionStatus } from '@prisma/client';

jest.mock('@/lib/services/audit', () => ({ writeAuditLog: jest.fn() }));
jest.mock('@/lib/services/notifications', () => ({ createNotification: jest.fn() }));
jest.mock('@/lib/email/send', () => ({ sendPaymentFailedEmail: jest.fn(), sendPaymentSuccessEmail: jest.fn() }));

describe('strict verification (amount + UTR only)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('verifies when amount and utr match exactly', async () => {
    const order = {
      id: 'order-1',
      publicId: 'PUB1',
      projectId: 'proj-1',
      submittedUtr: 'UTR123',
      amount: { toString: () => '100' },
      createdAt: new Date(),
      project: { organizationId: 'org-1', organization: { ownerId: null } }
    } as any;

    (prisma.order.findUnique as any) = jest.fn().mockResolvedValue(order);

    (prisma.verifiedTransaction.findUnique as any) = jest.fn().mockResolvedValue(null);
    (prisma.order.findFirst as any) = jest.fn().mockResolvedValue(null);

    (prisma.transaction.findUnique as any) = jest.fn().mockResolvedValue({
      id: 'tx-1',
      projectId: 'proj-1',
      utr: 'UTR123',
      amount: { toString: () => '100' },
      status: TransactionStatus.UNMATCHED,
      receivedAt: new Date(),
      emailMessageId: 'msg-1',
      sender: 'payer@example.com',
      referenceNumber: 'REF1'
    });

    (prisma.$transaction as any) = jest.fn().mockImplementation(async (cb: any) => {
      const tx = {
        transaction: { update: jest.fn().mockResolvedValue({}) },
        verifiedTransaction: { upsert: jest.fn().mockResolvedValue({}) },
        order: { update: jest.fn().mockResolvedValue({}) },
        webhookEvent: { create: jest.fn().mockResolvedValue({ id: 'evt-1' }) }
      };
      return cb(tx);
    });

    const res = await verifyOrderByUtr('PUB1');
    expect(res.verified).toBe(true);
  });

  test('rejects when amount mismatches', async () => {
    const order = {
      id: 'order-2',
      publicId: 'PUB2',
      projectId: 'proj-1',
      submittedUtr: 'UTR456',
      amount: { toString: () => '200' },
      createdAt: new Date(),
      project: { organizationId: 'org-1', organization: { ownerId: null } }
    } as any;

    (prisma.order.findUnique as any) = jest.fn().mockResolvedValue(order);
    (prisma.verifiedTransaction.findUnique as any) = jest.fn().mockResolvedValue(null);
    (prisma.order.findFirst as any) = jest.fn().mockResolvedValue(null);

    (prisma.transaction.findUnique as any) = jest.fn().mockResolvedValue({
      id: 'tx-2',
      projectId: 'proj-1',
      utr: 'UTR456',
      amount: { toString: () => '150' },
      status: TransactionStatus.UNMATCHED,
      receivedAt: new Date()
    });

    (prisma.$transaction as any) = jest.fn().mockImplementation(async (cb: any) => {
      const tx = {
        transaction: { update: jest.fn().mockResolvedValue({}) },
        verifiedTransaction: { upsert: jest.fn().mockResolvedValue({}) },
        order: { update: jest.fn().mockResolvedValue({}) },
        webhookEvent: { create: jest.fn().mockResolvedValue({ id: 'evt-2' }) }
      };
      return cb(tx);
    });

    // ensure direct prisma.order.update used in failOrder is mocked
    (prisma.order.update as any) = jest.fn().mockResolvedValue({});
    (prisma.webhookEvent.create as any) = jest.fn().mockResolvedValue({ id: 'evt-2' });

    const res = await verifyOrderByUtr('PUB2');
    expect(res.verified).toBe(false);
    expect(res.reason).toBe('AMOUNT_MISMATCH');
  });

  test('rejects when utr not found', async () => {
    (prisma.order.findUnique as any) = jest.fn().mockResolvedValue({ id: 'o3', publicId: 'PUB3', projectId: 'proj-1', submittedUtr: 'MISSING', amount: { toString: () => '50' }, createdAt: new Date(), project: { organizationId: 'org-1', organization: { ownerId: null } } } as any);
    (prisma.verifiedTransaction.findUnique as any) = jest.fn().mockResolvedValue(null);
    (prisma.order.findFirst as any) = jest.fn().mockResolvedValue(null);

    (prisma.transaction.findUnique as any) = jest.fn().mockResolvedValue(null);

    const res = await verifyOrderByUtr('PUB3');
    expect(res.verified).toBe(false);
    expect(res.reason).toBe('EMAIL_NOT_FOUND');
  });
});
