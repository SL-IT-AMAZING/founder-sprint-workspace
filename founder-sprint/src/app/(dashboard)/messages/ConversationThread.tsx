"use client";

import { useEffect, useRef } from "react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import type { ConversationDetail, MessageItem } from "@/actions/messaging";
import MessageBubble from "./MessageBubble";
import MessageComposer from "./MessageComposer";

interface ConversationThreadProps {
  conversationId: string | null;
  conversationDetail: ConversationDetail | null;
  messages: MessageItem[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  isLoading: boolean;
}

export default function ConversationThread({
  conversationId,
  conversationDetail,
  messages,
  currentUserId,
  onSendMessage,
  isLoading,
}: ConversationThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on load and when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!conversationId) {
    return (
      <div
        className="flex"
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fefaf3",
          color: "#999999",
          fontSize: "16px",
        }}
      >
        Select a conversation to start messaging
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="flex"
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fefaf3",
        }}
      >
        <div
          style={{
            width: "24px",
            height: "24px",
            border: "3px solid #f1eadd",
            borderTop: "3px solid #1A1A1A",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const conversationName = conversationDetail?.isGroup
    ? conversationDetail.groupName
    : conversationDetail?.participants.find((participant) => participant.id !== currentUserId)?.name;

  const conversationAvatar = conversationDetail?.isGroup
    ? null
    : conversationDetail?.participants.find((participant) => participant.id !== currentUserId)?.profileImage;

  const conversationEmoji = conversationDetail?.isGroup
    ? conversationDetail.groupEmoji
    : null;

  const participantCount = conversationDetail?.isGroup
    ? conversationDetail.participants.length
    : null;

  const formatDateSeparator = (date: Date) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) return "Today";
    if (isYesterday(messageDate)) return "Yesterday";
    return format(messageDate, "MMMM d, yyyy");
  };

  // Group messages by date and determine when to show sender info
  const messagesWithMetadata = messages.map((message, index) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showDateSeparator =
      !prevMessage || !isSameDay(new Date(message.createdAt), new Date(prevMessage.createdAt));
    const showSender =
      !prevMessage ||
      prevMessage.sender?.id !== message.sender?.id ||
      showDateSeparator;
    const isOwn = message.sender?.id === currentUserId;

    return {
      ...message,
      showDateSeparator,
      showSender,
      showAvatar: showSender && !isOwn && Boolean(message.sender),
      isOwn,
    };
  });

  return (
    <div className="flex" style={{ flex: 1, flexDirection: "column", backgroundColor: "#fefaf3" }}>
      {/* Header */}
      <div
        className="flex"
        style={{
          height: "56px",
          alignItems: "center",
          gap: "12px",
          padding: "0 20px",
          borderBottom: "1px solid #e0e0e0",
          backgroundColor: "#FFFFFF",
        }}
      >
        {/* Avatar */}
        {conversationDetail?.isGroup ? (
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#f1eadd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              flexShrink: 0,
            }}
          >
            {conversationEmoji || "👥"}
          </div>
        ) : (
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#f1eadd",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {conversationAvatar && (
              <img
                src={conversationAvatar}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </div>
        )}

        {/* Name and participant count */}
        <div className="flex" style={{ flexDirection: "column", gap: "2px" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", color: "#2F2C26" }}>
            {conversationEmoji && <span style={{ marginRight: "6px" }}>{conversationEmoji}</span>}
            {conversationName}
          </div>
          {participantCount && (
            <div style={{ fontSize: "12px", color: "#999999" }}>
              {participantCount} {participantCount === 1 ? "member" : "members"}
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {messagesWithMetadata.map((message) => (
          <div key={message.id}>
            {message.showDateSeparator && (
              <div
                style={{
                  textAlign: "center",
                  margin: "20px 0 12px",
                  fontSize: "12px",
                  color: "#999999",
                  fontWeight: "500",
                }}
              >
                {formatDateSeparator(message.createdAt)}
              </div>
            )}
            <MessageBubble
              message={message}
              isOwn={message.isOwn}
              showSender={message.showSender}
              showAvatar={message.showAvatar}
            />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <MessageComposer onSend={onSendMessage} disabled={false} />
    </div>
  );
}
