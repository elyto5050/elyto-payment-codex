import { NextRequest } from "next/server";
import { apiOk, apiError } from "@/lib/api/response";
import { getSocialLinks } from "@/lib/services/social-links";

export async function GET(request: NextRequest) {
  try {
    const links = await getSocialLinks();
    return apiOk(links ?? {});
  } catch (err: any) {
    return apiError("server_error", err?.message ?? "Failed to read social links.", 500);
  }
}
