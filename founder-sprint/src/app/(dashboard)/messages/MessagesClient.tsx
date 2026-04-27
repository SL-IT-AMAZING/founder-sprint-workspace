"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getUserConversations, getConversation, getMessages, sendMessage, deleteConversation, markConversationRead, searchConversations, getAllUsersForMessaging, getOrCreateDMConversation } from "@/actions/messaging";
import type { ConversationListItem, ConversationDetail, MessageAttachmentInput, MessageItem } from "@/actions/messaging";
import ConversationList from "./ConversationList";
import ConversationThread from "./ConversationThread";
import BrowseGroupsModal from "./BrowseGroupsModal";
import CreateGroupModal from "./CreateGroupModal";
import EditGroupModal from "./EditGroupModal";
import NewDirectMessageModal from "./NewDirectMessageModal";

interface MessagesClientProps {
  conversations: ConversationListItem[];
  currentUserId: string;
  currentUserName: string | null;
  currentUserImage: string | null;
  allUsers: { id: string; name: string | null; profileImage: string | null }[];
}

export default function MessagesClient({
  conversations: initialConversations,
  currentUserId,
  allUsers,
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
  const [newDirectMessageOpen, setNewDirectMessageOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [fetchedUsers, setFetchedUsers] = useState(allUsers);

  // Fetch all users for group creation on mount
  useEffect(() => {
    async function fetchUsers() {
      const result = await getAllUsersForMessaging();
      if (result.success) {
        setFetchedUsers(result.data);
      }
    }
    fetchUsers();
  }, []);

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

  const handleSendMessage = async (
    content: string,
    attachments: MessageAttachmentInput[]
  ): Promise<boolean> => {
    if (!selectedConversationId) return false;

    const result = await sendMessage(selectedConversationId, content, attachments);

    if (!result.success) {
      window.alert(result.error);
      return false;
    }

    // Immediately fetch updated messages and conversation list
    const [messagesResult, conversationsResult] = await Promise.all([
      getMessages(selectedConversationId),
      getUserConversations(),
    ]);
    if (messagesResult.success) {
      setMessages(messagesResult.data.messages);
    }
    if (conversationsResult.success) {
      setConversations(conversationsResult.data);
    }

    return true;
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
    setNewDirectMessageOpen(true);
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

  const handleEditGroup = async (conversationId: string) => {
    const detailResult = await getConversation(conversationId);
    if (detailResult.success) {
      setConversationDetail(detailResult.data);
    }
    setEditGroupId(conversationId);
  };

  const handleGroupUpdated = async () => {
    setEditGroupId(null);

    const conversationsResult = await getUserConversations();
    if (conversationsResult.success) {
      setConversations(conversationsResult.data);
    }

    if (selectedConversationId) {
      const detailResult = await getConversation(selectedConversationId);
      if (detailResult.success) {
        setConversationDetail(detailResult.data);
      }
    }
  };

  const handleGroupCreated = async (conversationId: string) => {
    setCreateGroupOpen(false);

    const conversationsResult = await getUserConversations();
    if (conversationsResult.success) {
      setConversations(conversationsResult.data);
    }

    await handleSelectConversation(conversationId);
  };

  const handleStartDirectMessage = async (targetUserId: string) => {
    const result = await getOrCreateDMConversation(targetUserId);
    if (!result.success) {
      window.alert(result.error);
      return;
    }

    setNewDirectMessageOpen(false);

    const conversationsResult = await getUserConversations();
    if (conversationsResult.success) {
      setConversations(conversationsResult.data);
    }

    await handleSelectConversation(result.data.conversationId);
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
          onEditGroup={handleEditGroup}
          onComposeClick={handleComposeClick}
          onBrowseGroupsClick={handleBrowseGroupsClick}
          onSearchChange={(query) => {
            setSearchQuery(query);
            if (!query.trim()) {
              setSearchResults(null);
            }
          }}
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
      <NewDirectMessageModal
        isOpen={newDirectMessageOpen}
        onClose={() => setNewDirectMessageOpen(false)}
        users={fetchedUsers}
        onStartConversation={handleStartDirectMessage}
        onCreateGroupClick={() => {
          setNewDirectMessageOpen(false);
          setCreateGroupOpen(true);
        }}
      />
      <CreateGroupModal
        isOpen={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onGroupCreated={handleGroupCreated}
        users={fetchedUsers}
      />
      {editGroupId && conversationDetail && conversationDetail.isGroup && (
        <EditGroupModal
          isOpen={true}
          onClose={() => setEditGroupId(null)}
          onGroupUpdated={handleGroupUpdated}
          conversation={conversationDetail}
          allUsers={fetchedUsers}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
