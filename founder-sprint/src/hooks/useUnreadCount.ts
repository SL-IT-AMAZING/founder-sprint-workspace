"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getUnreadCount } from "@/actions/messaging";

/**
 * Polls global unread message count for the nav badge.
 * - Fetches every `interval` ms (default 10000 = 10s)
 * - Returns { unreadCount, refresh }
 * - Starts polling on mount, stops on unmount
 */
export function useUnreadCount(interval: number = 10000) {
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await getUnreadCount();
      if (result.success) {
        setUnreadCount(result.data.count);
      }
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    refresh();
    
    // Start polling
    intervalRef.current = setInterval(refresh, interval);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh, interval]);

  return { unreadCount, refresh };
}
