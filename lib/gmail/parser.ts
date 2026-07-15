export type ParsedTransaction = {
  utr: string;
  amount: number;
  sender?: string;
  referenceNumber?: string; // transaction id or reference
  transactionId?: string; // explicit transaction id (FMPI...)
  receivedAt: Date;
  source: string;
  paymentSuccessful: boolean;
};

const utrPatterns = [
  /\bUTR[:\s-]*([0-9A-Z]{6,32})\b/i,
  /\bUPI Ref(?:erence)?(?: No)?[:\s-]*([0-9A-Z]{6,32})\b/i,
  /\bRef(?:erence)?(?: No)?[:\s-]*([0-9A-Z]{6,32})\b/i,
  /\bTransaction\s*(?:ID|No|#)?[:\s-]*([0-9A-Z]{6,32})\b/i,
  /\bTxn(?: Ref(?:erence)?)?[:\s-]*([0-9A-Z]{6,32})\b/i
];

const amountPattern = /(?:INR|Rs\.?|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i;

// Accept a wider variety of success phrases (including "is successful")
const successPattern = /\b(?:sent successfully|payment successful|successfully (?:sent|paid|completed)|is successful|successful)\b/i;
const failurePattern = /\b(?:failed|declined|rejected|unsuccessful|reversed|refunded)\b/i;

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseFamPayEmail(text: string, receivedAt = new Date(), subject?: string): ParsedTransaction | null {
  const body = text.trim().startsWith("<") ? stripHtml(text) : text;
  if (failurePattern.test(body)) {
    return null;
  }

  // Strict extraction rules: must have amount and UTR and explicit success phrasing
  // Try to find UTR using multiple patterns
  const utr = utrPatterns.map((pattern) => body.match(pattern)?.[1]).find(Boolean) ??
    (subject ? utrPatterns.map((p) => subject.match(p)?.[1]).find(Boolean) : undefined);

  // Try to find explicit transaction id (FMPI... or labeled Transaction ID)
  let transactionId: string | undefined;
  const fmpiMatch = body.match(/\b(FMPI[0-9A-Z]{6,32})\b/i) ?? (subject ? subject.match(/\b(FMPI[0-9A-Z]{6,32})\b/i) : null);
  if (fmpiMatch && fmpiMatch[1]) transactionId = fmpiMatch[1];
  if (!transactionId) {
    const txMatch = body.match(/\bTransaction\s*(?:ID|No|#)?[:\s-]*([0-9A-Z]{6,32})\b/i) ?? (subject ? subject.match(/\bTransaction\s*(?:ID|No|#)?[:\s-]*([0-9A-Z]{6,32})\b/i) : null);
    if (txMatch && txMatch[1]) transactionId = txMatch[1];
  }

  // Amount extraction (strip thousands separators)
  const amountMatch = body.match(amountPattern)?.[1] ?? (subject ? subject.match(amountPattern)?.[1] : undefined);
  const amount = amountMatch ? Number(amountMatch.replaceAll(",", "")) : null;

  // Quick fail if amount or UTR missing
  if (!amount || !utr) return null;

  // Determine explicit success status
  const paymentSuccessful = successPattern.test(body) || (subject ? successPattern.test(subject) : false);
  if (!paymentSuccessful) return null;

  // Try to extract merchant / sender name using conservative heuristics
  let sender: string | undefined;
  const toMatch = body.match(/\bfrom\s+([A-Za-z0-9 &\-\.,]{2,80})/i) ?? body.match(/\bto\s+([A-Za-z0-9 &\-\.,]{2,80})/i);
  if (toMatch && toMatch[1]) {
    sender = toMatch[1].trim().replace(/[\.\,]$/g, "");
  }

  // Use transactionId as referenceNumber when present
  const referenceNumber = transactionId ?? utr;

  return {
    utr,
    amount,
    sender,
    referenceNumber,
    transactionId,
    receivedAt,
    source: "gmail_fampay",
    paymentSuccessful
  };
}

/** @deprecated Use parseFamPayEmail */
export const parsePaymentEmail = parseFamPayEmail;
