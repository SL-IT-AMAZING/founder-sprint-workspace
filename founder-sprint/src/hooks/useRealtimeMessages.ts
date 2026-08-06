"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MessageItem } from "@/actions/messaging";

interface UseRealtimeMessagesProps {
  conversationId: string | null;
  initialMessages: MessageItem[];
  currentUserId: string;
  userMap: Map<string, { name: string | null; profileImage: string | null }>;
}

interface UseRealtimeMessagesReturn {
  messages: MessageItem[];
  setMessages: React.Dispatch<React.SetStateAction<MessageItem[]>>;
  isConnected: boolean;
  lastEventTimestamp: string | null;
}

type RealtimeMessageRow = {
  id: string;
  content: string;
  sender_id: string | null;
  created_at: string;
};

const getLatestTimestamp = (items: MessageItem[]): string | null => {
  if (items.length === 0) {
    return null;
  }

  return new Date(items[items.length - 1].createdAt).toISOString();
};

export function useRealtimeMessages({
  conversationId,
  initialMessages,
  currentUserId,
  userMap,
}: UseRealtimeMessagesProps): UseRealtimeMessagesReturn {
  const supabaseRef = useRef(createClient());
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEventTimestamp, setLastEventTimestamp] = useState<string | null>(
    getLatestTimestamp(initialMessages)
  );

  const mapRowToMessageItem = useCallback(
    (row: RealtimeMessageRow, existingAttachments: MessageItem["attachments"] = []): MessageItem => {
      const senderId = row.sender_id ?? currentUserId;
      const senderProfile = userMap.get(senderId);

      return {
        id: row.id,
        content: row.content,
        createdAt: new Date(row.created_at),
        sender: {
          id: senderId,
          name: senderProfile?.name ?? null,
          profileImage: senderProfile?.profileImage ?? null,
        },
        attachments: existingAttachments,
      };
    },
    [currentUserId, userMap]
  );

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const supabase = supabaseRef.current;
    const channel = supabase
      .channel(`messages:conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => {
          const row = payload.new as RealtimeMessageRow;
          const nextMessage = mapRowToMessageItem(row);

          setMessages(prevMessages => {
            if (prevMessages.some(message => message.id === nextMessage.id)) {
              return prevMessages;
            }

            return [...prevMessages, nextMessage];
          });

          setLastEventTimestamp(nextMessage.createdAt.toISOString());
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => {
          const row = payload.new as RealtimeMessageRow;

          setMessages(prevMessages => {
            const index = prevMessages.findIndex(message => message.id === row.id);
            if (index === -1) {
              return prevMessages;
            }
            const updatedMessage = mapRowToMessageItem(row, prevMessages[index].attachments);
            const next = prevMessages.slice();
            next[index] = updatedMessage;
            return next;
          });

          setLastEventTimestamp(new Date(row.created_at).toISOString());
        }
      );

    channel.subscribe(status => {
      setIsConnected(status === "SUBSCRIBED");
    });

    return () => {
      setIsConnected(false);
      void supabase.removeChannel(channel);
    };
  }, [conversationId, mapRowToMessageItem]);

  return {
    messages,
    setMessages,
    isConnected,
    lastEventTimestamp,
  };
}
