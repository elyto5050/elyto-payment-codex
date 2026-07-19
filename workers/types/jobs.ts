export type PaymentVerificationJob = {
  orderPublicId?: string;
  paymentId?: string;
  paymentRef?: string;
  submittedUtr?: string;
  projectId?: string;
  userId?: string;
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
