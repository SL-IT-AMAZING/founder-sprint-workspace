"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { format, isThisYear } from "date-fns";
import type { ConversationListItem } from "@/actions/messaging";

interface ConversationListProps {
  conversations: ConversationListItem[];
  currentUserId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onComposeClick: () => void;
  onBrowseGroupsClick: () => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
}

export default function ConversationList({
  conversations,
  currentUserId,
  selectedId,
  onSelect,
  onDeleteConversation,
  onComposeClick,
  onBrowseGroupsClick,
  onSearchChange,
  searchQuery,
}: ConversationListProps) {
  const [contextMenu, setContextMenu] = useState<{ conversationId: string; x: number; y: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [contextMenu]);

  const getDirectMessageParticipant = (conversation: ConversationListItem) =>
    conversation.participants.find((participant) => participant.id !== currentUserId);

  const openContextMenu = (
    event: ReactMouseEvent<HTMLDivElement>,
    conversationId: string
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const menuWidth = 180;
    const menuHeight = 42;
    const maxX = window.innerWidth - menuWidth - 8;
    const maxY = window.innerHeight - menuHeight - 8;

    setContextMenu({
      conversationId,
      x: Math.min(event.clientX, Math.max(8, maxX)),
      y: Math.min(event.clientY, Math.max(8, maxY)),
    });
  };

  const openMenuFromButton = (
    event: ReactMouseEvent<HTMLButtonElement>,
    conversationId: string
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const menuWidth = 180;
    const menuHeight = 42;
    const rect = event.currentTarget.getBoundingClientRect();
    const maxX = window.innerWidth - menuWidth - 8;
    const maxY = window.innerHeight - menuHeight - 8;

    setContextMenu({
      conversationId,
      x: Math.min(Math.max(8, rect.right - menuWidth), maxX),
      y: Math.min(Math.max(8, rect.bottom + 4), maxY),
    });
  };

  // Filter conversations by search query
  const filteredConversations = searchQuery
    ? conversations.filter((conversation) => {
        const dmParticipant = getDirectMessageParticipant(conversation);
        const name = conversation.isGroup ? conversation.groupName : dmParticipant?.name;
        return name?.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : conversations;

  const formatTimestamp = (date: Date) => {
    const messageDate = new Date(date);
    if (isThisYear(messageDate)) {
      return format(messageDate, "MMM d");
    }
    return format(messageDate, "MMM d, yyyy");
  };

  return (
    <div className="flex" style={{ flexDirection: "column", height: "100%", backgroundColor: "#FFFFFF" }}>
      {/* Header */}
      <div style={{ padding: "16px", borderBottom: "1px solid #e0e0e0" }}>
        <div className="flex" style={{ alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26", margin: 0 }}>
            Messages
          </h1>
          <div className="flex" style={{ gap: "8px" }}>
            <button
              onClick={onComposeClick}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                border: "1px solid #e0e0e0",
                backgroundColor: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              aria-label="Compose new message"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12.5 2.5L13.5 3.5L5.5 11.5L4 12L4.5 10.5L12.5 2.5Z" stroke="#2F2C26" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11 4L12 5" stroke="#2F2C26" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <button
              onClick={onBrowseGroupsClick}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                border: "1px solid #e0e0e0",
                backgroundColor: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              aria-label="Browse groups"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="5" cy="5" r="2" stroke="#2F2C26" strokeWidth="1.5"/>
                <circle cx="11" cy="5" r="2" stroke="#2F2C26" strokeWidth="1.5"/>
                <circle cx="8" cy="11" r="2" stroke="#2F2C26" strokeWidth="1.5"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search Messages"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: "100%",
            height: "36px",
            backgroundColor: "#f3f4f6",
            border: "none",
            borderRadius: "8px",
            padding: "0 12px",
            fontSize: "14px",
            color: "#2F2C26",
            outline: "none",
          }}
        />
      </div>

      {/* Conversation List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filteredConversations.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "200px",
              color: "#999999",
              fontSize: "14px",
            }}
          >
            {searchQuery ? "No conversations found" : "No conversations yet"}
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const isSelected = conversation.id === selectedId;
            const dmParticipant = getDirectMessageParticipant(conversation);
            const displayName = conversation.isGroup
              ? conversation.groupName
              : dmParticipant?.name;
            const avatar = conversation.isGroup ? null : dmParticipant?.profileImage;

            return (
              <div
                key={conversation.id}
                onClick={() => {
                  setContextMenu(null);
                  onSelect(conversation.id);
                }}
                onContextMenu={(event) => openContextMenu(event, conversation.id)}
                className="relative"
                style={{
                  height: "72px",
                  padding: "12px 16px",
                  backgroundColor: isSelected ? "#f1eadd" : "#FFFFFF",
                  cursor: "pointer",
                  borderBottom: "1px solid #f1eadd",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "#fefaf3";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                  }
                }}
              >
                {/* Unread indicator */}
                {conversation.unreadCount > 0 && (
                  <div
                    className="absolute"
                    style={{
                      left: "6px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#1A1A1A",
                    }}
                  />
                )}

                {/* Avatar */}
                <div style={{ flexShrink: 0 }}>
                  {conversation.isGroup ? (
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: "#f1eadd",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                      }}
                    >
                      {conversation.groupEmoji || "👥"}
                    </div>
                  ) : (
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: "#f1eadd",
                        overflow: "hidden",
                      }}
                    >
                      {avatar && (
                        <img
                          src={avatar}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex" style={{ flex: 1, flexDirection: "column", gap: "2px", minWidth: 0 }}>
                  <div className="flex" style={{ alignItems: "center", justifyContent: "space-between" }}>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: "600",
                        color: "#2F2C26",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {conversation.isGroup && conversation.groupEmoji && (
                        <span style={{ marginRight: "6px" }}>{conversation.groupEmoji}</span>
                      )}
                      {displayName}
                    </div>
                    <div className="flex" style={{ alignItems: "center", gap: "6px", marginLeft: "8px", flexShrink: 0 }}>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#999999",
                        }}
                      >
                        {conversation.lastMessageAt && formatTimestamp(conversation.lastMessageAt)}
                      </div>
                      <button
                        type="button"
                        aria-label="Conversation actions"
                        onClick={(event) => openMenuFromButton(event, conversation.id)}
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "6px",
                          border: "none",
                          background: "transparent",
                          color: "#666666",
                          lineHeight: 1,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0,
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <circle cx="7" cy="3" r="1.2" fill="currentColor" />
                          <circle cx="7" cy="7" r="1.2" fill="currentColor" />
                          <circle cx="7" cy="11" r="1.2" fill="currentColor" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#666666",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {conversation.lastMessage}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {contextMenu && (
          <motion.div
            ref={contextMenuRef}
            role="menu"
            aria-label="Conversation actions"
            initial={reduceMotion ? false : { opacity: 0, y: -4, scale: 0.98 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -2, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.16, ease: [0.2, 0, 0, 1] }}
            style={{
              position: "fixed",
              left: contextMenu.x,
              top: contextMenu.y,
              zIndex: 1000,
              backgroundColor: "#FFFFFF",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              boxShadow: "0 6px 24px rgba(0, 0, 0, 0.12)",
              padding: "4px",
              minWidth: "180px",
              transformOrigin: "top right",
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Delete this conversation?")) {
                  onDeleteConversation(contextMenu.conversationId);
                }
                setContextMenu(null);
              }}
              style={{
                width: "100%",
                border: "none",
                background: "none",
                textAlign: "left",
                fontSize: "13px",
                color: "#C62828",
                padding: "8px 10px",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "background-color 0.16s",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = "rgba(198, 40, 40, 0.08)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Delete conversation
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
