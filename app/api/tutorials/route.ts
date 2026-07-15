import { NextRequest } from "next/server";
import { apiOk, apiError } from "@/lib/api/response";
import { listTutorials } from "@/lib/services/tutorials";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? "12")));
    const search = url.searchParams.get("search") || url.searchParams.get("q") || undefined;
    const category = url.searchParams.get("category") || undefined;

    const { data, total } = await listTutorials({ page, pageSize, search: search ?? undefined, category: category ?? undefined, admin: false });
    const meta = { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
    return apiOk({ data, meta });
  } catch (err) {
    return apiError("server_error", "Failed to list tutorials.", 500);
  }
}

