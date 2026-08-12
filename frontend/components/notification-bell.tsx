"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

type Notification = {
  id: number;
  booking_id: number;
  message: string;
  read: boolean;
  created_at: string;
};

export function NotificationBell({ className }: { className?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = () => {
    fetch("/api/notifications", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then(setNotifications)
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: number) => {
    await fetch(`/api/notifications/${id}/read`, {
      method: "PATCH",
      credentials: "include",
    });
    fetchNotifications();
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Notifikasi"
        onClick={() => setOpen((o) => !o)}
        className={className}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
            <div className="border-b border-border p-3 text-sm font-semibold text-card-foreground">
              Notifikasi
            </div>
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Belum ada notifikasi.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleMarkRead(n.id)}
                  className={`block w-full border-b border-border p-3 text-left text-sm last:border-0 hover:bg-muted ${
                    n.read ? "text-muted-foreground" : "font-medium text-card-foreground"
                  }`}
                >
                  {n.message}
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString("id-ID")}
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
