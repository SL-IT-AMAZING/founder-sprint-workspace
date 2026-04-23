"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getUnreadNotificationCount } from "@/actions/notification";

export function useNotificationUnreadCount(interval: number = 10000) {
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await getUnreadNotificationCount();
      if (result.success) {
        setUnreadCount(result.data.count);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      void refresh();
    }, 0);
    intervalRef.current = setInterval(refresh, interval);

    return () => {
      clearTimeout(initialTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [interval, refresh]);

  return { unreadCount, refresh };
}
