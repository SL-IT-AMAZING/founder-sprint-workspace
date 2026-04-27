"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { markAllNotificationsRead, markNotificationRead } from "@/actions/notification";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

interface NotificationItem {
  id: string;
  type: string;
  entityId: string | null;
  title: string;
  message: string | null;
  read: boolean;
  createdAt: Date;
  targetPath: string | null;
}

export function NotificationsListClient({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState(notifications);
  const unreadCount = useMemo(
    () => items.filter((notification) => !notification.read).length,
    [items]
  );

  useEffect(() => {
    setItems(notifications);
  }, [notifications]);

  const markLocalNotificationRead = (notificationId: string) => {
    setItems((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const result = await markAllNotificationsRead();
      if (result.success) {
        setItems((current) =>
          current.map((notification) => ({ ...notification, read: true }))
        );
        router.refresh();
      }
    });
  };

  const handleOpenNotification = (notification: NotificationItem) => {
    startTransition(async () => {
      await markNotificationRead(notification.id);
      markLocalNotificationRead(notification.id);
      if (notification.targetPath) {
        router.push(notification.targetPath);
      }
    });
  };

  if (notifications.length === 0) {
    return (
      <EmptyState
        title="No notifications yet"
        description="When someone mentions you or the system sends an update, it will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <div className="flex items-center justify-end">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleMarkAllRead}
            loading={isPending}
          >
            Mark all as read
          </Button>
        </div>
      )}

      {items.map((notification) => (
        <div
          key={notification.id}
          className="card"
          style={{
            backgroundColor: notification.read ? "#FFFFFF" : "#FCFBF8",
            borderColor: notification.read ? "var(--color-card-border)" : "#E8E1D4",
          }}
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium">{notification.title}</h3>
                  {!notification.read && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        backgroundColor: "#1A1A1A",
                        color: "#FFFFFF",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      New
                    </span>
                  )}
                </div>
                {notification.message && (
                  <p className="text-sm" style={{ color: "var(--color-foreground-secondary)", whiteSpace: "pre-wrap" }}>
                    {notification.message}
                  </p>
                )}
                <p className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              {notification.targetPath ? (
                <Button
                  size="sm"
                  onClick={() => handleOpenNotification(notification)}
                  loading={isPending}
                >
                  Open
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    startTransition(async () => {
                      await markNotificationRead(notification.id);
                      markLocalNotificationRead(notification.id);
                      router.refresh();
                    });
                  }}
                  loading={isPending}
                >
                  Mark Read
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
