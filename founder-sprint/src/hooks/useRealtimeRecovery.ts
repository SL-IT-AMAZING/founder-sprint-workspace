import { useCallback, useEffect, useRef, useState } from "react";

interface UseRealtimeRecoveryProps {
  /** Whether realtime is currently connected */
  isConnected: boolean;
  /** Timestamp of the last realtime event received (ISO string) */
  lastEventTimestamp: string | null;
  /** Callback to fetch missed data since lastEventTimestamp */
  onRecover: (since: string) => Promise<void>;
  /** Whether recovery is enabled (e.g., only when viewing messages page) */
  enabled?: boolean;
}

interface UseRealtimeRecoveryReturn {
  /** Whether recovery is in progress */
  isRecovering: boolean;
  /** Whether the tab is currently visible */
  isTabVisible: boolean;
}

export function useRealtimeRecovery({
  isConnected,
  lastEventTimestamp,
  onRecover,
  enabled = true,
}: UseRealtimeRecoveryProps): UseRealtimeRecoveryReturn {
  const [isRecovering, setIsRecovering] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(
    typeof document !== "undefined"
      ? document.visibilityState === "visible"
      : true
  );

  // Refs to track state without causing re-renders in callbacks
  const isRecoveringRef = useRef(false);
  const prevIsConnectedRef = useRef(isConnected);
  const lastEventTimestampRef = useRef(lastEventTimestamp);
  const onRecoverRef = useRef(onRecover);

  // Keep refs in sync
  lastEventTimestampRef.current = lastEventTimestamp;
  onRecoverRef.current = onRecover;

  const triggerRecovery = useCallback(async () => {
    // Guard against multiple simultaneous recovery calls
    if (isRecoveringRef.current || !enabled) return;

    const since = lastEventTimestampRef.current;
    // Only recover if we have a timestamp to recover from
    if (!since) return;

    isRecoveringRef.current = true;
    setIsRecovering(true);

    try {
      await onRecoverRef.current(since);
    } catch (error) {
      // Recovery failed silently — next reconnect or visibility change will retry
      console.error("[useRealtimeRecovery] Recovery failed:", error);
    } finally {
      isRecoveringRef.current = false;
      setIsRecovering(false);
    }
  }, [enabled]);

  // Listen for tab visibility changes
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      const visible = document.visibilityState === "visible";
      setIsTabVisible(visible);

      if (visible) {
        // Tab came back to foreground — recover missed events
        triggerRecovery();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [triggerRecovery]);

  // Detect isConnected false → true transition
  useEffect(() => {
    const wasConnected = prevIsConnectedRef.current;
    prevIsConnectedRef.current = isConnected;

    if (!wasConnected && isConnected) {
      // WebSocket just reconnected — recover missed events
      triggerRecovery();
    }
  }, [isConnected, triggerRecovery]);

  return { isRecovering, isTabVisible };
}
