import { NextResponse } from "next/server";

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function apiError(code: string, message: string, status = 400, requestId = crypto.randomUUID()) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        requestId
      }
    },
    { status }
  );
}
