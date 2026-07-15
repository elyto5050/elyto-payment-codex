import { prisma } from "@/lib/db/prisma";
import { NotificationType } from "@prisma/client";

type Subscriber = {
  id: string;
  controller: ReadableStreamDefaultController<string>;
  keepAlive?: ReturnType<typeof setInterval> | number;
};

const subscribers = new Map<string, Set<Subscriber>>();

export function getEventStreamForUser(userId: string) {
  let subscriberRef: Subscriber | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const id = Math.random().toString(36).slice(2, 9);
      const keepAlive = setInterval(() => {
        try {
          // comment line ping to keep connection alive
          controller.enqueue(":\n\n");
        } catch (e) {
          // ignore
        }
      }, 20_000);

      subscriberRef = { id, controller, keepAlive };

      let set = subscribers.get(userId);
      if (!set) {
        set = new Set();
        subscribers.set(userId, set);
      }

      set.add(subscriberRef);

      // initial connected event
      controller.enqueue(`event: connected\ndata: ${JSON.stringify({ message: "connected" })}\n\n`);
    },
    cancel() {
      if (subscriberRef) {
        const set = subscribers.get(userId);
        if (set) {
          set.delete(subscriberRef);
          if (set.size === 0) subscribers.delete(userId);
        }
        if (subscriberRef.keepAlive) {
          try {
            clearInterval(subscriberRef.keepAlive as ReturnType<typeof setInterval>);
          } catch (e) {
            // ignore
          }
        }
      }
    }
  });

  return stream;
}

export function notifyUser(userId: string, payload: unknown) {
  const set = subscribers.get(userId);
  if (!set) return;
  for (const s of Array.from(set)) {
    try {
      s.controller.enqueue(`event: notification\ndata: ${JSON.stringify(payload)}\n\n`);
    } catch (err) {
      set.delete(s);
      if (s.keepAlive) {
        try {
          clearInterval(s.keepAlive as ReturnType<typeof setInterval>);
        } catch (e) {}
      }
    }
  }
}

export function notifyAll(payload: unknown) {
  for (const [, set] of subscribers) {
    for (const s of Array.from(set)) {
      try {
        s.controller.enqueue(`event: notification\ndata: ${JSON.stringify(payload)}\n\n`);
      } catch (err) {
        set.delete(s);
        if (s.keepAlive) {
          try {
            clearInterval(s.keepAlive as ReturnType<typeof setInterval>);
          } catch (e) {}
        }
      }
    }
  }
}

export function notifyNotificationUpdate(userId: string, update: unknown) {
  const set = subscribers.get(userId);
  if (!set) return;
  for (const s of Array.from(set)) {
    try {
      s.controller.enqueue(`event: notificationUpdate\ndata: ${JSON.stringify(update)}\n\n`);
    } catch (err) {
      set.delete(s);
      if (s.keepAlive) {
        try {
          clearInterval(s.keepAlive as ReturnType<typeof setInterval>);
        } catch (e) {}
      }
    }
  }
}

export async function createNotification(params: {
  organizationId: string;
  userId?: string | null;
  title: string;
  body: string;
  type?: NotificationType;
}) {
  const { organizationId, userId = null, title, body, type = NotificationType.INFO } = params;
  // If this is a broadcast (userId === null), create an independent notification row per user
  if (userId === null) {
    const members = await prisma.teamMember.findMany({ where: { organizationId }, select: { userId: true } });
    const createdRecords = await Promise.all(
      members.map(async (m) => {
        const rec = await prisma.notification.create({ data: { organizationId, userId: m.userId, title, body, type } });
        notifyUser(m.userId, { notification: rec });
        return rec;
      })
    );
    return createdRecords[0] ?? null;
  }

  const created = await prisma.notification.create({ data: { organizationId, userId, title, body, type } });
  if (created.userId) notifyUser(created.userId, { notification: created });
  return created;
}
