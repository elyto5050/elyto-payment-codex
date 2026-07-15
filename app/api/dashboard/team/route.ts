import { NextRequest, NextResponse } from "next/server";

/**
 * DEPRECATED: Team module has been removed as of v2.0
 * 
 * All team functionality has been consolidated into:
 * - Admin panel at admin.elyto.in with role-based access control
 * - Staff management via /api/admin/rbac/*
 * 
 * For support, contact: support@elyto.in
 */

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      error: "DEPRECATED_ENDPOINT",
      message: "The Team module has been deprecated as of v2.0. Team management is now handled via the admin panel at admin.elyto.in with granular role-based access control.",
      migrationGuide: "https://docs.elyto.in/migration/v2.0#team-deprecation",
      contact: "support@elyto.in"
    },
    { status: 410 }
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: "DEPRECATED_ENDPOINT",
      message: "The Team module has been deprecated as of v2.0. Team management is now handled via the admin panel at admin.elyto.in with granular role-based access control.",
      migrationGuide: "https://docs.elyto.in/migration/v2.0#team-deprecation",
      contact: "support@elyto.in"
    },
    { status: 410 }
  );
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    {
      error: "DEPRECATED_ENDPOINT",
      message: "The Team module has been deprecated as of v2.0. Team management is now handled via the admin panel at admin.elyto.in with granular role-based access control.",
      migrationGuide: "https://docs.elyto.in/migration/v2.0#team-deprecation",
      contact: "support@elyto.in"
    },
    { status: 410 }
  );
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    {
      error: "DEPRECATED_ENDPOINT",
      message: "The Team module has been deprecated as of v2.0. Team management is now handled via the admin panel at admin.elyto.in with granular role-based access control.",
      migrationGuide: "https://docs.elyto.in/migration/v2.0#team-deprecation",
      contact: "support@elyto.in"
    },
    { status: 410 }
  );
}

