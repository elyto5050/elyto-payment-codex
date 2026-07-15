/**
 * Centralized plan definitions — single source of truth for all UI and server code
 */
export const PLANS = {
  FREE: {
    key: "FREE",
    name: "Free / Sandbox",
    price: 0,
    currency: "INR",
    maxVerifications: 10,
    maxProjects: 1,
    supportLevel: "community",
  },
  PREMIUM_1: {
    key: "PREMIUM_1",
    name: "Premium Tier 1",
    price: 89,
    currency: "INR",
    maxVerifications: 100,
    maxProjects: 3,
    supportLevel: "standard",
  },
  PREMIUM_2: {
    key: "PREMIUM_2",
    name: "Premium Tier 2",
    price: 229,
    currency: "INR",
    maxVerifications: 500,
    maxProjects: 6,
    supportLevel: "standard",
  },
  PREMIUM_3: {
    key: "PREMIUM_3",
    name: "Premium Tier 3",
    price: 429,
    currency: "INR",
    maxVerifications: 1000,
    maxProjects: 12,
    supportLevel: "standard",
  },
  ENTERPRISE: {
    key: "ENTERPRISE",
    name: "Unlimited Enterprise",
    price: 729,
    currency: "INR",
    maxVerifications: -1,
    maxProjects: -1,
    supportLevel: "dedicated",
  },
} as const;

export type PlanKey = keyof typeof PLANS;
export type PlanDef = (typeof PLANS)[PlanKey];

export function getPlan(key: PlanKey): PlanDef {
  return PLANS[key];
}

export default PLANS;
