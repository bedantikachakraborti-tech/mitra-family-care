import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  markAllNotificationsRead,
  markNotificationRead,
  notificationsQuery,
  useCareRealtime,
} from "@/lib/care-social";
import { cn } from "@/lib/utils";

/** In-app notification bell with an unread badge and a simple panel. */
export function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: items = [] } = useQuery(notificationsQuery);
  useCareRealtime(null);

  const unread = items.filter((n) => !n.read_at).length;

  const readOne = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const readAll = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
        className="relative grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground"
      >
        <Bell className="h-4.5 w-4.5" aria-hidden />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-3xl border border-border bg-card p-3 shadow-soft">
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <p className="text-sm font-semibold">Notifications</p>
              {unread > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-full text-xs"
                  onClick={() => readAll.mutate()}
                >
                  <Check className="mr-1 h-3.5 w-3.5" aria-hidden /> Mark all read
                </Button>
              )}
            </div>

            {items.length === 0 ? (
              <p className="px-1 py-4 text-sm text-muted-foreground">
                Nothing new yet. Updates from your care circle will appear here.
              </p>
            ) : (
              <ul className="max-h-80 space-y-1 overflow-y-auto">
                {items.map((n) => {
                  const body = (
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      {n.body && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                      )}
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      <div
                        className={cn(
                          "flex items-start gap-2 rounded-2xl px-3 py-2.5",
                          n.read_at ? "" : "bg-secondary",
                        )}
                      >
                        {n.link ? (
                          <Link
                            to={n.link as "/shared"}
                            className="min-w-0 flex-1"
                            onClick={() => {
                              if (!n.read_at) readOne.mutate(n.id);
                              setOpen(false);
                            }}
                          >
                            {body}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            className="min-w-0 flex-1 text-left"
                            onClick={() => !n.read_at && readOne.mutate(n.id)}
                          >
                            {body}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
