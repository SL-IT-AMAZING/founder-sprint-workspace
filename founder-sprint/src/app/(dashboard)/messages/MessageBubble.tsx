"use client";

import { format } from "date-fns";
import type { MessageItem } from "@/actions/messaging";

interface MessageBubbleProps {
  message: MessageItem;
  isOwn: boolean;
  showSender: boolean;
  showAvatar: boolean;
}

export default function MessageBubble({
  message,
  isOwn,
  showSender,
  showAvatar,
}: MessageBubbleProps) {
  const formatTime = (date: Date) => {
    return format(new Date(date), "h:mm a");
  };

  // System message (no sender)
  if (!message.sender) {
    return (
      <div
        style={{
          textAlign: "center",
          fontSize: "13px",
          fontStyle: "italic",
          color: "#999999",
          padding: "8px 0",
        }}
      >
        {message.content}
      </div>
    );
  }

  return (
    <div
      className="flex"
      style={{
        flexDirection: isOwn ? "row-reverse" : "row",
        gap: "8px",
        marginBottom: showSender ? "12px" : "4px",
        alignItems: "flex-end",
      }}
    >
      {/* Avatar (only for other's messages and when showAvatar is true) */}
      {showAvatar ? (
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            backgroundColor: "#f1eadd",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {message.sender?.profileImage && (
            <img
              src={message.sender.profileImage}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </div>
      ) : (
        !isOwn && <div style={{ width: "32px", flexShrink: 0 }} />
      )}

      {/* Message Content */}
      <div
        className="flex"
        style={{
          flexDirection: "column",
          alignItems: isOwn ? "flex-end" : "flex-start",
          maxWidth: "65%",
          gap: "4px",
        }}
      >
        {/* Sender Name (only for first message in a group from same sender) */}
        {showSender && !isOwn && (
          <div
            style={{
              fontSize: "12px",
              color: "#999999",
              paddingLeft: "14px",
            }}
          >
            {message.sender?.name}
          </div>
        )}

        {/* Message Bubble */}
        <div
          style={{
            backgroundColor: isOwn ? "#1A1A1A" : "#f1eadd",
            color: isOwn ? "#FFFFFF" : "#2F2C26",
            borderRadius: isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            padding: "10px 14px",
            fontSize: "14px",
            lineHeight: "1.5",
            wordBreak: "break-word",
          }}
        >
          {message.content}
        </div>

        {/* Timestamp */}
        <div
          style={{
            fontSize: "11px",
            color: "#999999",
            paddingLeft: isOwn ? "0" : "14px",
            paddingRight: isOwn ? "14px" : "0",
          }}
        >
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
}
