"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getUserConversations, getConversation, getMessages, sendMessage, deleteConversation, markConversationRead, searchConversations } from "@/actions/messaging";
import type { ConversationListItem, ConversationDetail, MessageItem } from "@/actions/messaging";
import ConversationList from "./ConversationList";
import ConversationThread from "./ConversationThread";
import BrowseGroupsModal from "./BrowseGroupsModal";
import CreateGroupModal from "./CreateGroupModal";

interface MessagesClientProps {
  conversations: ConversationListItem[];
  currentUserId: string;
  currentUserName: string | null;
  currentUserImage: string | null;
}

export default function MessagesClient({
  conversations: initialConversations,
  currentUserId,
  currentUserName,
  currentUserImage,
}: MessagesClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [conversations, setConversations] = useState<ConversationListItem[]>(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    searchParams.get("conversation")
  );
  const [conversationDetail, setConversationDetail] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ConversationListItem[] | null>(null);
  const [browseGroupsOpen, setBrowseGroupsOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  // Poll conversations list every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await getUserConversations();
      if (result.success) {
        setConversations(result.data);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Debounced server-side search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    
    const timer = setTimeout(async () => {
      const result = await searchConversations(searchQuery);
      if (result.success) {
        setSearchResults(result.data);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Poll messages every 3 seconds for active conversation
  useEffect(() => {
    if (!selectedConversationId) return;

    const interval = setInterval(async () => {
      const result = await getMessages(selectedConversationId);
      if (result.success) {
        setMessages(result.data.messages);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedConversationId]);

  // Handle conversation selection
  const handleSelectConversation = async (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setMessagesLoading(true);
    router.push(`/messages?conversation=${conversationId}`);

    // Fetch conversation details and messages
    const [detailResult, messagesResult] = await Promise.all([
      getConversation(conversationId),
      getMessages(conversationId),
    ]);

    if (detailResult.success) {
      setConversationDetail(detailResult.data);
    }

    if (messagesResult.success) {
      setMessages(messagesResult.data.messages);
    }

    setMessagesLoading(false);

    // Mark as read
    await markConversationRead(conversationId);
    
    // Update the unread count in the local conversations list
    setConversations(prev =>
      prev.map(c =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      )
    );
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) return;

    const result = await sendMessage(selectedConversationId, content);
    
    if (result.success) {
      // Immediately fetch updated messages
      const messagesResult = await getMessages(selectedConversationId);
      if (messagesResult.success) {
        setMessages(messagesResult.data.messages);
      }
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    const result = await deleteConversation(conversationId);
    if (!result.success) {
      window.alert(result.error);
      return;
    }

    const conversationsResult = await getUserConversations();

    if (conversationsResult.success) {
      setConversations(conversationsResult.data);
    }

    if (selectedConversationId === conversationId) {
      setSelectedConversationId(null);
      setConversationDetail(null);
      setMessages([]);
      router.push("/messages");
    }
  };

  const handleComposeClick = () => {
    setCreateGroupOpen(true);
  };

  const handleBrowseGroupsClick = () => {
    setBrowseGroupsOpen(true);
  };

  const handleJoinGroup = async (conversationId: string) => {
    setBrowseGroupsOpen(false);

    const conversationsResult = await getUserConversations();
    if (conversationsResult.success) {
      setConversations(conversationsResult.data);
    }

    await handleSelectConversation(conversationId);
  };

  const handleGroupCreated = async (conversationId: string) => {
    setCreateGroupOpen(false);

    const conversationsResult = await getUserConversations();
    if (conversationsResult.success) {
      setConversations(conversationsResult.data);
    }

    await handleSelectConversation(conversationId);
  };

  return (
    <div className="flex" style={{ height: "calc(100vh - 56px)" }}>
      <div style={{ width: "320px", borderRight: "1px solid #e0e0e0" }}>
        <ConversationList
          conversations={searchResults ?? conversations}
          currentUserId={currentUserId}
          selectedId={selectedConversationId}
          onSelect={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onComposeClick={handleComposeClick}
          onBrowseGroupsClick={handleBrowseGroupsClick}
          onSearchChange={setSearchQuery}
          searchQuery={searchQuery}
        />
      </div>
      <div className="flex" style={{ flex: 1 }}>
        <ConversationThread
          conversationId={selectedConversationId}
          conversationDetail={conversationDetail}
          messages={messages}
          currentUserId={currentUserId}
          onSendMessage={handleSendMessage}
          isLoading={messagesLoading}
        />
      </div>

      <BrowseGroupsModal
        isOpen={browseGroupsOpen}
        onClose={() => setBrowseGroupsOpen(false)}
        onJoinGroup={handleJoinGroup}
      />
      <CreateGroupModal
        isOpen={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onGroupCreated={handleGroupCreated}
        users={[]}
      />
    </div>
  );
}
