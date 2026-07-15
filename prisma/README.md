Prisma notes — Plans and migrations
=================================

This file contains guidance for handling schema or default value changes that affect billing plans.

Key points
----------

- The canonical plan metadata (keys, prices, limits) lives in `lib/plans.ts`.
- Do not hardcode plan values in migration SQL or seed scripts — prefer reading from `lib/plans.ts` in seed scripts where possible.

Changing a plan key or default
------------------------------

1. Update `lib/plans.ts` with the new values.
2. If you must change a database-level default (for example `BillingRecord.currentPlan`), update `prisma/schema.prisma` and create a new migration:

```bash
npm run prisma:migrate -- --name update-billing-defaults
```

3. If existing rows need to be migrated to the new key, add a SQL migration that runs an `UPDATE` to map values safely.

4. Run `npx prisma generate` and `npx prisma db push` (or the migration command above) in your deployment pipeline.

Seeding
-------

If you use seed scripts to create example accounts or billing records, read plan values from `lib/plans.ts` to avoid divergence.
Prisma migrations and plan schema notes

- Plan metadata (prices, verification limits, project limits, support levels) is maintained in `lib/plans.ts`.
- Runtime code should import from `lib/plans.ts` rather than duplicating values in migrations or seed files.
- Historical migration files should not be modified unless performing an explicit schema migration; add new migrations for schema changes.

Guidance for contributors:
- To reference plan attributes in seed or migration scripts, import `lib/plans.ts` from your scripts at runtime.
- Avoid hardcoding numeric prices or plan keys in new migrations; rely on `lib/plans.ts` as the single source of truth.
