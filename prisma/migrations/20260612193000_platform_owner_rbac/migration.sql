ALTER TABLE "TeamMember" ADD COLUMN "customRoleId" TEXT;

CREATE TABLE "Permission" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomRole" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CustomRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomRolePermission" (
  "id" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CustomRolePermission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlatformOwnership" (
  "id" TEXT NOT NULL,
  "ownerEmail" TEXT NOT NULL,
  "ownerUserId" TEXT,
  "transferRequestedForEmail" TEXT,
  "transferRequestedForUserId" TEXT,
  "transferTokenHash" TEXT,
  "transferExpiresAt" TIMESTAMP(3),
  "transferApprovedAt" TIMESTAMP(3),
  "signature" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PlatformOwnership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");
CREATE UNIQUE INDEX "CustomRole_organizationId_name_key" ON "CustomRole"("organizationId", "name");
CREATE UNIQUE INDEX "CustomRolePermission_roleId_permissionId_key" ON "CustomRolePermission"("roleId", "permissionId");
CREATE INDEX "CustomRole_organizationId_idx" ON "CustomRole"("organizationId");
CREATE INDEX "CustomRolePermission_permissionId_idx" ON "CustomRolePermission"("permissionId");
CREATE INDEX "PlatformOwnership_ownerEmail_idx" ON "PlatformOwnership"("ownerEmail");

ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES "CustomRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomRole" ADD CONSTRAINT "CustomRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomRolePermission" ADD CONSTRAINT "CustomRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "CustomRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomRolePermission" ADD CONSTRAINT "CustomRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
