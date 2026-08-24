"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getNotifications,
  readNotification,
  readAllNotifications,
} from "@/services/notifications";
import { getErrorMessage } from "@/lib/utils";
import {
  Bell,
  CheckCheck,
  Info,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import type { Notification } from "@/types";

const iconMap: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertCircle,
  success: CheckCircle,
  error: X,
};

export default function NotificationsPage() {
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
          setError(getErrorMessage(res, "Failed to load notifications"));
        }
      } catch (err) {
        if (!cancelled)
          setError(getErrorMessage(err, "Failed to load notifications"));
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
    try {
      await readNotification(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await readAllNotifications();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-card flex items-start gap-3">
              <div className="skeleton h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "No unread notifications"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="btn btn-ghost btn-sm gap-2"
          >
            <CheckCheck size={14} />
            Mark all as read
          </button>
        )}
      </div>

      {error && <div className="form-alert form-alert-error">{error}</div>}

      {notifications.length === 0 ? (
        <div className="card-dashboard">
          <div className="empty-state">
            <Bell className="empty-state-icon" />
            <p className="empty-state-title">No notifications</p>
            <p className="empty-state-desc">
              You&#39;re all caught up! Notifications will appear here when
              there is activity.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = iconMap[notification.type] || Bell;
            const body = notification.link ? (
              <Link
                href={notification.link}
                className="text-sm text-foreground"
              >
                {notification.message}
              </Link>
            ) : (
              <p className="text-sm text-foreground">{notification.message}</p>
            );
            return (
              <div
                key={notification._id}
                className={`card-dashboard flex items-start gap-3 transition-colors ${
                  !notification.isRead ? "border-primary/20 bg-primary/5" : ""
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    !notification.isRead
                      ? "bg-primary/10 text-primary"
                      : "bg-neutral-800 text-neutral-500"
                  }`}
                >
                  <Icon size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  {body}
                  <p className="mt-0.5 text-xs text-neutral-500">
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
                    className="shrink-0 rounded-full p-1 text-neutral-500 transition-colors hover:text-primary"
                    aria-label="Mark as read"
                  >
                    <CheckCheck size={14} />
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
