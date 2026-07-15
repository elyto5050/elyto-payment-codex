import type { DefaultSession } from "next-auth";

import type { PlatformRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId?: string;
      platformRole?: PlatformRole;
    } & DefaultSession["user"];
  }
}
