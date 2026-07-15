PLANS (single source of truth)
=================================

Purpose
-------
This file documents the canonical plan definitions for Elyto. The runtime source of truth is `lib/plans.ts` — do NOT duplicate prices, limits, or support levels in other code or documentation. Import `PLANS` from `lib/plans.ts` wherever you need plan metadata.

Quick reference (mirrors `lib/plans.ts`)
----------------------------------------

- FREE
  - key: `FREE`
  - name: Free / Sandbox
  - price: ₹0
  - maxVerifications: 10
  - maxProjects: 1
  - supportLevel: community

- PREMIUM_1
  - key: `PREMIUM_1`
  - name: Premium Tier 1
  - price: ₹89
  - maxVerifications: 100
  - maxProjects: 3
  - supportLevel: standard

- PREMIUM_2
  - key: `PREMIUM_2`
  - name: Premium Tier 2
  - price: ₹229
  - maxVerifications: 500
  - maxProjects: 6
  - supportLevel: standard

- PREMIUM_3
  - key: `PREMIUM_3`
  - name: Premium Tier 3
  - price: ₹429
  - maxVerifications: 1000
  - maxProjects: 12
  - supportLevel: standard

- ENTERPRISE
  - key: `ENTERPRISE`
  - name: Unlimited Enterprise
  - price: ₹729
  - maxVerifications: unlimited (-1)
  - maxProjects: unlimited (-1)
  - supportLevel: dedicated

Usage
-----

Always import and use the centralized file:

```ts
import { PLANS, getPlan } from '@/lib/plans';

const plan = PLANS.PREMIUM_2;
// or
const plan2 = getPlan('PREMIUM_1');
```

Notes on changing plans
-----------------------

- Update `lib/plans.ts` first. Any change to price, limits or keys must be applied here.
- Update tests to derive expected values from `PLANS` instead of hardcoding numbers.
- Document the change in release notes and update migration scripts if you need to change DB defaults (see `prisma/README.md`).
