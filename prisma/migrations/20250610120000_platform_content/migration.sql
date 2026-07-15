-- CreateTable
CREATE TABLE IF NOT EXISTS "PlatformContent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PlatformContent_slug_key" ON "PlatformContent"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlatformContent_slug_idx" ON "PlatformContent"("slug");
