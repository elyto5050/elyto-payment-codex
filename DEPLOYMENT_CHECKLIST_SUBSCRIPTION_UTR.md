Deployment checklist: Automated subscription verification (submitted UTR)

1) Apply Prisma migration

   - In development (interactive):
     ```bash
     npm run prisma:migrate
     # or
     npx prisma migrate dev --name add-submittedUtr
     ```

   - In staging/production (non-interactive):
     ```bash
     npm run prisma:deploy
     ```

2) Restart application and background workers

   - Restart Next.js app and the worker/scheduler processes so they pick up the new code and migrations.
     ```bash
     # example systemd / PM2 / container commands
     pm2 restart elyto-web
     pm2 restart elyto-worker
     ```

3) Verify environment variables

   - Ensure the following are present for Gmail sync and queues:
     - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
     - `REDIS_URL`
     - Database connection string used by Prisma

4) Confirm owner Gmail is connected

   - The automated subscription verification relies on the owner's Gmail (UPI receiver) being connected and synced.
   - Confirm the Gmail connection for `avairalpandey@gmail.com` exists and is `ACTIVE` in the `gmailConnection` table.

5) Smoke test the flow

   - Start a new subscription checkout from the onboarding or billing page.
   - Pay the invoice externally to the configured UPI (`aviralji@fam`).
   - Submit the UTR via the in-app prompt or `/api/dashboard/billing/submit-utr`.
   - Verify the subscription record becomes `ACTIVE` and `SubscriptionPayment.status` becomes `VERIFIED`.

6) If verification does not occur

   - Check worker logs for Gmail sync errors and the `gmailSyncLog` table for errors.
   - Ensure transactions were parsed into the `Transaction` table containing matching UTR and amount.
   - Manually call `handleSubscriptionPaymentWebhook` via the debug API (`/api/debug/create-test-transaction`) in staging to simulate matching behavior.
