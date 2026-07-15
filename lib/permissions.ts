import type { TeamRole } from "@prisma/client";

const roleRank: Record<TeamRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MANAGER: 2,
  VIEWER: 1
};

export function can(role: TeamRole, required: TeamRole) {
  return roleRank[role] >= roleRank[required];
}

export function assertPermission(role: TeamRole | undefined, required: TeamRole) {
  if (!role || !can(role, required)) {
    throw new Error("You do not have permission to perform this action.");
  }
}
