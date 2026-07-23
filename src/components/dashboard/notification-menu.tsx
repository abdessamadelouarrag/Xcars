"use client";

import {
  Bell,
  BellRing,
  CalendarDays,
  CheckCheck,
  Mail,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DashboardNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

type NotificationMenuProps = {
  initialNotifications: DashboardNotification[];
  initialUnreadCount: number;
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Casablanca",
});

export function NotificationMenu({
  initialNotifications,
  initialUnreadCount,
}: NotificationMenuProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function updateReadState(payload: { id?: string; all?: boolean }) {
    const response = await fetch("/api/notifications/read", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error("Impossible de mettre à jour les notifications.");
    }
  }

  async function markAsRead(notification: DashboardNotification) {
    if (notification.readAt) return true;

    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;
    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, readAt } : item,
      ),
    );
    setUnreadCount((current) => Math.max(0, current - 1));

    try {
      await updateReadState({ id: notification.id });
      return true;
    } catch {
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      toast.error("La notification n’a pas pu être marquée comme lue.");
      return false;
    }
  }

  async function openNotification(notification: DashboardNotification) {
    await markAsRead(notification);
    setOpen(false);

    if (!notification.href) return;
    if (notification.href.startsWith("/")) {
      router.push(notification.href);
      return;
    }
    window.location.assign(notification.href);
  }

  async function markAllAsRead() {
    if (unreadCount === 0 || markingAll) return;

    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;
    const readAt = new Date().toISOString();
    setMarkingAll(true);
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, readAt })),
    );
    setUnreadCount(0);

    try {
      await updateReadState({ all: true });
    } catch {
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      toast.error("Les notifications n’ont pas pu être mises à jour.");
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label={`${unreadCount} notifications non lues`}
        aria-expanded={open}
        aria-controls="dashboard-notifications"
        onClick={() => setOpen((current) => !current)}
      >
        <Bell />
        {unreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-destructive ring-2 ring-background" />
        ) : null}
      </Button>

      {open ? (
        <section
          id="dashboard-notifications"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
            <div>
              <h2 className="text-sm font-bold">Notifications</h2>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
                  : "Vous êtes à jour"}
              </p>
            </div>
            {unreadCount > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={markingAll}
                onClick={markAllAsRead}
              >
                <CheckCheck className="size-3.5" />
                Tout lire
              </Button>
            ) : null}
          </div>

          {notifications.length > 0 ? (
            <div className="max-h-[min(28rem,70vh)] overflow-y-auto p-2">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={cn(
                    "group flex w-full gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted",
                    !notification.readAt && "bg-primary/5",
                  )}
                  onClick={() => openNotification(notification)}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl",
                      !notification.readAt
                        ? "bg-primary/12 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <NotificationIcon type={notification.type} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                        {notification.title}
                      </span>
                      {!notification.readAt ? (
                        <span
                          className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                          aria-label="Non lue"
                        />
                      ) : null}
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {notification.body}
                    </span>
                    <time
                      dateTime={notification.createdAt}
                      className="mt-1 block text-[11px] text-muted-foreground/80"
                    >
                      {dateFormatter.format(new Date(notification.createdAt))}
                    </time>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <BellRing className="size-5" />
              </span>
              <p className="mt-3 text-sm font-semibold">Aucune notification</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Les nouvelles demandes et les messages apparaîtront ici.
              </p>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

function NotificationIcon({ type }: { type: string }) {
  if (type.startsWith("reservation")) {
    return <CalendarDays className="size-4" aria-hidden="true" />;
  }
  if (type.startsWith("contact")) {
    return <Mail className="size-4" aria-hidden="true" />;
  }
  return <BellRing className="size-4" aria-hidden="true" />;
}
