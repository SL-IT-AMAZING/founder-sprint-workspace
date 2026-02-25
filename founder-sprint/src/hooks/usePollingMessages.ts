"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getMessages } from "@/actions/messaging";
import type { MessageItem } from "@/actions/messaging";

/**
 * Polls for new messages in the active conversation.
 * - Fetches latest messages every `interval` ms (default 3000)
 * - Only appends genuinely new messages (dedup by id)
 * - Returns current messages array + refresh function
 * - Stops polling when conversationId is null
 */
export function usePollingMessages(
  conversationId: string | null,
  initialMessages: MessageItem[] = [],
  interval: number = 3000
) {
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const knownIds = useRef<Set<string>>(new Set(initialMessages.map(m => m.id)));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset when conversation changes
  useEffect(() => {
    setMessages(initialMessages);
    knownIds.current = new Set(initialMessages.map(m => m.id));
  }, [conversationId]); // intentionally NOT including initialMessages to avoid loops

  const fetchNewMessages = useCallback(async () => {
    if (!conversationId) return;
    
    setIsLoading(true);
    try {
      const result = await getMessages(conversationId, 50);
      if (result.success) {
        const newMsgs = result.data.messages.filter(m => !knownIds.current.has(m.id));
        if (newMsgs.length > 0) {
          newMsgs.forEach(m => knownIds.current.add(m.id));
          setMessages(prev => {
            // Merge: keep existing + add new, sort by createdAt
            const all = [...prev, ...newMsgs];
            const unique = Array.from(new Map(all.map(m => [m.id, m])).values());
            return unique.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          });
        }
      }
    } catch {
      // Silent fail — will retry on next poll
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Start/stop polling
  useEffect(() => {
    if (!conversationId) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(fetchNewMessages, interval);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [conversationId, fetchNewMessages, interval]);

  // Add a message optimistically (for sent messages)
  const addOptimisticMessage = useCallback((message: MessageItem) => {
    knownIds.current.add(message.id);
    setMessages(prev => [...prev, message]);
  }, []);

  return { messages, isLoading, refresh: fetchNewMessages, addOptimisticMessage };
}
