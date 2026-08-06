"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getUserConversations } from "@/actions/messaging";
import type { ConversationListItem } from "@/actions/messaging";
import { createClient } from "@/lib/supabase/client";

interface UseRealtimeConversationsProps {
  userId: string;
  initialConversations: ConversationListItem[];
  selectedConversationId?: string | null;
}

interface UseRealtimeConversationsReturn {
  conversations: ConversationListItem[];
  setConversations: React.Dispatch<React.SetStateAction<ConversationListItem[]>>;
  isConnected: boolean;
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function sortByLastMessageAt(items: ConversationListItem[]): ConversationListItem[] {
  return [...items].sort((a, b) => {
    if (!a.lastMessageAt && !b.lastMessageAt) return 0;
    if (!a.lastMessageAt) return 1;
    if (!b.lastMessageAt) return -1;
    return b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
  });
}

export function useRealtimeConversations({
  userId,
  initialConversations,
  selectedConversationId,
}: UseRealtimeConversationsProps): UseRealtimeConversationsReturn {
  const supabase = useMemo(() => createClient(), []);
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    sortByLastMessageAt(initialConversations)
  );
  const [isConnected, setIsConnected] = useState(false);
  const selectedConvRef = useRef(selectedConversationId);

  useEffect(() => {
    selectedConvRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    setConversations(sortByLastMessageAt(initialConversations));
  }, [initialConversations]);

  useEffect(() => {
    let mounted = true;
    let conversationsSubscribed = false;
    let participantsSubscribed = false;

    const syncConnectionState = () => {
      if (!mounted) return;
      setIsConnected(conversationsSubscribed && participantsSubscribed);
    };

    const conversationsChannel = supabase
      .channel(`conversations-updates-${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        (payload) => {
          const conversationId = String(payload.new.id ?? "");
          if (!conversationId) return;

          const lastMessage =
            typeof payload.new.last_message === "string" ? payload.new.last_message : null;
          const lastMessageAt = toDate(payload.new.last_message_at as string | null | undefined);

          setConversations((prev) => {
            const updated = prev.map((item) => {
              if (item.id !== conversationId) return item;
              const isSelected = conversationId === selectedConvRef.current;
              return {
                ...item,
                lastMessage,
                lastMessageAt,
                unreadCount: isSelected ? item.unreadCount : item.unreadCount + 1,
              };
            });
            return sortByLastMessageAt(updated);
          });
        }
      )
      .subscribe((status) => {
        conversationsSubscribed = status === "SUBSCRIBED";
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          conversationsSubscribed = false;
        }
        syncConnectionState();
      });

    const participantsChannel = supabase
      .channel(`conversation-participants-inserts-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversation_participants" },
        async (payload) => {
          const participantUserId = String(payload.new.user_id ?? "");
          if (participantUserId !== userId) return;

          const result = await getUserConversations();
          if (!mounted || !result.success) return;
          setConversations(sortByLastMessageAt(result.data));
        }
      )
      .subscribe((status) => {
        participantsSubscribed = status === "SUBSCRIBED";
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          participantsSubscribed = false;
        }
        syncConnectionState();
      });

    return () => {
      mounted = false;
      setIsConnected(false);
      void supabase.removeChannel(conversationsChannel);
      void supabase.removeChannel(participantsChannel);
    };
  }, [supabase, userId]);

  return { conversations, setConversations, isConnected };
}
