"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getNotifications,
  readNotification,
  readAllNotifications,
} from "@/services/notifications";
import type { Notification } from "@/types";
import {
  Bell,
  CheckCheck,
  Info,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertCircle,
  success: CheckCircle,
  error: X,
};

export default function ClientNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await getNotifications();
        if (cancelled) return;
        if (res.success) {
          setNotifications(res.data.notifications ?? []);
        } else {
          setError(res.message || "Failed to load notifications");
        }
      } catch {
        if (!cancelled) setError("Failed to load notifications");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const markAsRead = async (id: string) => {
    await readNotification(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
    );
  };

  const markAllAsRead = async () => {
    await readAllNotifications();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex flex-col gap-md">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h3 font-bold text-foreground">Notifications</h1>
          <p className="mt-4xs text-body-small text-foreground/50">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "No unread notifications"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn btn-ghost btn-sm">
            <CheckCheck className="w-sm h-sm" /> Mark all as read
          </button>
        )}
      </div>

      {error && <div className="form-alert form-alert-error">{error}</div>}

      {loading ? (
        <div className="flex flex-col gap-xs">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-dashboard">
              <div className="skeleton h-4 w-3/4 mb-xs" />
              <div className="skeleton h-3 w-1/4" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <Bell className="empty-state-icon" />
          <p className="empty-state-title">No notifications</p>
          <p className="empty-state-desc">
            You&apos;re all caught up! Notifications will appear here when there
            is activity.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-xs">
          {notifications.map((notification) => {
            const Icon = iconMap[notification.type] || Bell;
            const body = notification.link ? (
              <Link
                href={notification.link}
                className="text-body-small text-foreground"
              >
                {notification.message}
              </Link>
            ) : (
              <p className="text-body-small text-foreground">
                {notification.message}
              </p>
            );
            return (
              <div
                key={notification._id}
                className={`card-dashboard flex items-start gap-sm transition-colors ${
                  !notification.isRead ? "border-primary/20 bg-primary/5" : ""
                }`}
              >
                <div
                  className={`flex w-md h-md shrink-0 items-center justify-center rounded-full ${
                    !notification.isRead
                      ? "bg-primary/10 text-primary"
                      : "bg-surface text-foreground/40"
                  }`}
                >
                  <Icon className="w-sm h-sm" />
                </div>
                <div className="min-w-0 flex-1">
                  {body}
                  <p className="mt-4xs text-caption text-foreground/50">
                    {new Date(notification.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </p>
                </div>
                {!notification.isRead && (
                  <button
                    onClick={() => markAsRead(notification._id)}
                    className="shrink-0 rounded-full p-2xs text-foreground/50 transition-colors hover:text-primary"
                    aria-label="Mark as read"
                  >
                    <CheckCheck className="w-sm h-sm" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
