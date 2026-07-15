import { handleDeprecatedTeamEndpoint, logDeprecatedEndpointUsage } from "@/lib/api/deprecation";
import { NextRequest } from "next/server";

function extractIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
}

export async function GET(request: NextRequest) {
  const ip = extractIp(request);
  logDeprecatedEndpointUsage("/api/v1/team", request.headers.get("user-agent") || "", ip);
  return handleDeprecatedTeamEndpoint(request);
}

export async function POST(request: NextRequest) {
  const ip = extractIp(request);
  logDeprecatedEndpointUsage("/api/v1/team", request.headers.get("user-agent") || "", ip);
  return handleDeprecatedTeamEndpoint(request);
}

export async function PUT(request: NextRequest) {
  const ip = extractIp(request);
  logDeprecatedEndpointUsage("/api/v1/team", request.headers.get("user-agent") || "", ip);
  return handleDeprecatedTeamEndpoint(request);
}

export async function DELETE(request: NextRequest) {
  const ip = extractIp(request);
  logDeprecatedEndpointUsage("/api/v1/team", request.headers.get("user-agent") || "", ip);
  return handleDeprecatedTeamEndpoint(request);
}
