/**
 * Notifications page — /dashboard/notifications
 *
 * Shared between nurse and admin — both sidebars link here.
 * Role-scoped:
 *   Nurse  → getNotificationsForNurse(nurseId): only assigned patients
 *   Admin  → getNotifications(): full hospital list
 *
 * Must be a client component to read the logged-in user's role/nurseId.
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  getNotifications,
  getNotificationsForNurse,
  markNotificationRead,
} from "@/lib/api";
import { NotificationList } from "@/components/notifications/notification-list";
import type { Notification } from "@/types";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch =
      user.role === "nurse" && user.nurseId
        ? getNotificationsForNurse(user.nurseId)
        : getNotifications();

    fetch.then((data) => {
      setNotifications(data);
      setLoading(false);
    });
  }, [user]);

  const unread = notifications.filter((n) => !n.read).length;
  const scopeLabel =
    user?.role === "nurse" ? "Your assigned patients" : "All patients";

  if (loading) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "#8A8394", fontSize: 13 }}>
        Loading…
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
          Notifications
        </h1>
        <p style={{ fontSize: 12, fontWeight: 500, color: "#8A8394", marginTop: 4, marginBottom: 0 }}>
          {unread > 0 ? `${unread} unread` : "All caught up"}
          {" · "}
          {notifications.length} total · {scopeLabel}
        </p>
      </div>
      <NotificationList
        notifications={notifications}
        onOpen={(notification) => {
          if (!notification.read) {
            markNotificationRead(notification.id).then(() => {
              setNotifications((prev) =>
                prev.map((item) =>
                  item.id === notification.id ? { ...item, read: true } : item,
                ),
              );
            });
          }
        }}
      />
    </div>
  );
}
