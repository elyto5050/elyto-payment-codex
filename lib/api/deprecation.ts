/**
 * API Deprecation Handlers
 * Return 410 Gone for deprecated endpoints as per v2.0 specification
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Deprecation message template
 */
const DEPRECATION_MESSAGE = (endpoint: string, replacementInfo: string) => ({
  error: "DEPRECATED_ENDPOINT",
  message: `This endpoint has been deprecated and is no longer available.`,
  deprecated_endpoint: endpoint,
  deprecation_date: "2026-06-14",
  replacement_info: replacementInfo,
  status_code: 410,
});

/**
 * Handle deprecated Team endpoints
 * Previously at: /api/team/*
 */
export async function handleDeprecatedTeamEndpoint(request: NextRequest) {
  return NextResponse.json(
    DEPRECATION_MESSAGE(
      "Team Module (deprecated)",
      "The Team management feature has been completely removed in v2.0. " +
        "All team-related functionality has been migrated to the admin control panel at admin.elyto.in. " +
        "For user collaboration, use direct project sharing instead."
    ),
    { status: 410 }
  );
}

/**
 * Handle deprecated Activity endpoints
 * Previously at: /api/activity/*
 */
export async function handleDeprecatedActivityEndpoint(request: NextRequest) {
  return NextResponse.json(
    DEPRECATION_MESSAGE(
      "Activity Module (deprecated)",
      "The Activity log view has been removed in v2.0. " +
        "Access detailed action logs through the admin audit trail at admin.elyto.in/audit-logs. " +
        "For user activity, check the verification history in the analytics section."
    ),
    { status: 410 }
  );
}

/**
 * Handle deprecated Team page
 * Previously at: /dashboard/team
 */
export function getDeprecatedTeamPageRedirect() {
  return {
    destination: "/dashboard/projects",
    permanent: true,
    statusCode: 410,
  };
}

/**
 * Handle deprecated Activity page
 * Previously at: /dashboard/activity
 */
export function getDeprecatedActivityPageRedirect() {
  return {
    destination: "/dashboard/analytics",
    permanent: true,
    statusCode: 410,
  };
}

/**
 * Log deprecation warning (for monitoring)
 */
export async function logDeprecatedEndpointUsage(
  endpoint: string,
  userAgent: string,
  ipAddress: string,
  timestamp: Date = new Date()
) {
  try {
    // Log to monitoring service or database
    console.warn(`[DEPRECATION] Endpoint accessed: ${endpoint}`, {
      userAgent,
      ipAddress,
      timestamp,
    });

    // Could store in database for analytics
    // await db.deprecationLog.create({...})
  } catch (error) {
    console.error("Failed to log deprecation:", error);
  }
}

/**
 * Middleware to detect and handle deprecated endpoints
 */
export function deprecatedEndpointMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  function extractIp(req: NextRequest) {
    return req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
  }

  // Team endpoints
  if (pathname.startsWith("/api/v1/team")) {
    logDeprecatedEndpointUsage(pathname, request.headers.get("user-agent") || "", extractIp(request));
    return handleDeprecatedTeamEndpoint(request);
  }

  // Activity endpoints
  if (pathname.startsWith("/api/v1/activity")) {
    logDeprecatedEndpointUsage(pathname, request.headers.get("user-agent") || "", extractIp(request));
    return handleDeprecatedActivityEndpoint(request);
  }

  return null;
}

/**
 * Deprecation header to include in responses
 */
export function getDeprecationHeaders() {
  return {
    "Deprecation": "true",
    "Sunset": new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString(), // 90 days
    "Link": '<https://docs.elyto.in/migration-guide>; rel="deprecation"',
  };
}

/**
 * Migration guide data
 */
export const DEPRECATION_MIGRATION_GUIDE = {
  team_module: {
    old_endpoint: "GET /api/v1/team",
    status: "REMOVED",
    reason: "Team collaboration moved to admin panel",
    alternatives: [
      "Use project-based sharing instead",
      "Admin roles and permissions at admin.elyto.in",
      "API: No direct replacement; use project endpoints",
    ],
    migration_steps: [
      "1. Archive team projects to main user account",
      "2. Use project-based access controls",
      "3. For admin access, request role assignment",
    ],
  },

  activity_log: {
    old_endpoint: "GET /api/v1/activity",
    status: "REMOVED",
    reason: "Activity view consolidated into analytics",
    alternatives: [
      "User verification history: /dashboard/analytics",
      "Admin action logs: admin.elyto.in/audit-logs",
      "Webhook event history: /dashboard/webhooks",
    ],
    migration_steps: [
      "1. View verification activity in analytics dashboard",
      "2. For system-wide activity, use admin audit logs",
      "3. For webhook events, check the webhooks section",
    ],
  },

  settings_sidebar_link: {
    old_location: "Sidebar navigation link",
    status: "MOVED",
    new_location: "Gear icon in profile card (bottom left)",
    reason: "UI consolidation - settings moved to modal overlay",
    migration_steps: [
      "1. Click the gear icon in the bottom-left profile card",
      "2. Access Account, Security, and Notifications tabs",
      "3. All settings functionality preserved, just reorganized",
    ],
  },

  api_responses: {
    deprecation_code: 410,
    deprecation_message: "Gone",
    response_format: {
      error: "DEPRECATED_ENDPOINT",
      message: "This endpoint has been deprecated and is no longer available.",
      deprecated_endpoint: "endpoint_name",
      deprecation_date: "2026-06-14",
      replacement_info: "Details about migration path",
    },
  },
};
