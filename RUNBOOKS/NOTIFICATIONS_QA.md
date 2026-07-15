Notifications QA Runbook

Prerequisites
- App running locally (e.g. `npm run dev` on http://localhost:3000).
- A logged-in user in the browser (open the dashboard page to ensure session cookie).

Steps

1) Open SSE stream in browser console
- In an authenticated browser tab (logged in), open DevTools Console and run:

```js
const es = new EventSource('/api/notifications/stream');
es.addEventListener('connected', (e) => console.log('SSE connected', e.data));
es.addEventListener('notification', (e) => console.log('notification', e.data));
es.addEventListener('notificationUpdate', (e) => console.log('notificationUpdate', e.data));
es.onerror = (err) => console.error('SSE error', err);
```

2) Create a notification (user-specific)
- From the same browser (or using fetch with cookies), POST to `/api/notifications`:

```js
fetch('/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'QA Notification', body: 'Hello from QA', broadcast: false })
}).then(r => r.json()).then(console.log).catch(console.error);
```

- Expected: the EventSource client should receive an `event: notification` with the payload. The notifications modal/unread badge should increment.

3) Create a broadcast notification (admin only)
- As an admin session, POST with `broadcast: true` to `/api/notifications`.
- Expected: all connected SSE clients receive the notification.

4) Mark notification as read
- PATCH `/api/notifications/:id` with `{ read: true }` (use fetch in browser console). Example:

```js
fetch('/api/notifications/<ID>', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ read: true }) })
  .then(r => r.json()).then(console.log);
```

- Expected: SSE `notificationUpdate` event with read state and UI updates (unread count decrements).

5) Delete notification
- DELETE `/api/notifications/:id` using fetch.
- Expected: SSE `notification` event with `event: deleted` (or `notification` with deleted event) and UI removes the item.

6) Mark all read
- POST `/api/notifications/mark-all-read` (if present) to mark all user notifications read.
- Expected: UI unread count resets to 0 and SSE `notificationUpdate`/`markAllRead` events received.

Troubleshooting
- If you do not receive SSE events, confirm the stream endpoint returns `200` and `Content-Type: text/event-stream`.
- Confirm you are authenticated (session cookie). SSE uses the same session auth middleware.
- For server-side checks, inspect `lib/notifications.ts` in dev — it uses an in-memory subscriber map (dev-only). For production, use Redis/pubsub.

Automated test (optional)
- There is a helper script at `scripts/notifications-qa.ts` (not included) that can be created to run an authenticated SSE client and POST test notifications.

Notes
- The SSE implementation is development-friendly but will not scale horizontally without a shared pub/sub.
- Broadcasts are restricted to platform admins only.
