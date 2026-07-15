export type PaymentVerificationJob = {
  orderPublicId: string;
  projectId?: string;
  userId?: string;
  paymentRef?: string;
  utr?: string;
};

export type GmailSyncJob = {
  gmailConnectionId?: string;
  projectId?: string;
  userId?: string;
  gmailAccount?: string;
};

export type WebhookDeliveryJob = {
  eventId: string;
  projectId?: string;
  userId?: string;
};

export type AccountDeletionJob = {
  userId: string;
};
