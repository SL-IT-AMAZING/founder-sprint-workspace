import React, { useState } from 'react';

export interface Message {
  id: string;
  participant: {
    id: string;
    name: string;
    avatarUrl?: string;
    isVerified?: boolean;
  };
  lastMessage: string;
  lastMessageAt: string;
  isUnread?: boolean;
  isGroup?: boolean;
  groupName?: string;
}

export interface MessageListProps {
  messages: Message[];
  selectedId?: string;
  onMessageClick?: (messageId: string) => void;
  onSearch?: (query: string) => void;
  onNewMessage?: () => void;
  onNewGroup?: () => void;
  onBrowseGroups?: () => void;
}

const styles = {
  container: {
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e0e0e0',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    fontFamily: '"BDO Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    padding: '16px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#2F2C26',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  iconButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    color: '#666666',
    fontSize: '18px',
  },
  searchContainer: {
    padding: '12px 16px',
    borderBottom: '1px solid #e0e0e0',
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #e0e0e0',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#f9f9f9',
    boxSizing: 'border-box' as const,
  },
  list: {
    flex: 1,
    overflowY: 'auto' as const,
  },
  messageItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    gap: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    borderBottom: '1px solid #f0f0f0',
  },
  messageItemSelected: {
    backgroundColor: 'rgba(85, 90, 185, 0.08)',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#e0e0e0',
    flexShrink: 0,
    objectFit: 'cover' as const,
    position: 'relative' as const,
  },
  avatarPlaceholder: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#555AB9',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 600,
    flexShrink: 0,
  },
  groupIndicator: {
    position: 'absolute' as const,
    bottom: '-2px',
    right: '-2px',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: '#555AB9',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    border: '2px solid white',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2px',
  },
  name: {
    fontSize: '14px',
    fontWeight: 400,
    color: '#2F2C26',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  nameUnread: {
    fontWeight: 700,
  },
  timestamp: {
    fontSize: '12px',
    color: '#999999',
    flexShrink: 0,
  },
  preview: {
    fontSize: '13px',
    color: '#666666',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#555AB9',
    flexShrink: 0,
    marginLeft: '8px',
  },
};

export const MessageItem: React.FC<{
  message: Message;
  isSelected?: boolean;
  onClick?: () => void;
}> = ({ message, isSelected, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const displayName = message.isGroup ? message.groupName : message.participant.name;

  return (
    <div
      style={{
        ...styles.messageItem,
        ...(isSelected ? styles.messageItemSelected : {}),
        backgroundColor: isHovered && !isSelected ? '#f9f9f9' : (isSelected ? 'rgba(85, 90, 185, 0.08)' : 'transparent'),
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ position: 'relative' }}>
        {message.participant.avatarUrl ? (
          <img src={message.participant.avatarUrl} alt={displayName} style={styles.avatar} />
        ) : (
          <div style={styles.avatarPlaceholder}>
            {(displayName || '?').charAt(0).toUpperCase()}
          </div>
        )}
        {message.isGroup && <div style={styles.groupIndicator}>👥</div>}
      </div>
      
      <div style={styles.content}>
        <div style={styles.nameRow}>
          <span style={{ ...styles.name, ...(message.isUnread ? styles.nameUnread : {}) }}>
            {displayName}
          </span>
          <span style={styles.timestamp}>{message.lastMessageAt}</span>
        </div>
        <div style={styles.preview}>{message.lastMessage}</div>
      </div>
      
      {message.isUnread && <div style={styles.unreadDot} />}
    </div>
  );
};

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  selectedId,
  onMessageClick,
  onSearch,
  onNewMessage,
  onNewGroup,
  onBrowseGroups,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Messages</h2>
        <div style={styles.headerActions}>
          <button style={styles.iconButton} onClick={onNewMessage} title="New Message">✏️</button>
          <button style={styles.iconButton} onClick={onNewGroup} title="New Group">👥</button>
          <button style={styles.iconButton} onClick={onBrowseGroups} title="Browse Groups">🔍</button>
        </div>
      </div>
      
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search Messages"
          style={styles.searchInput}
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>
      
      <div style={styles.list}>
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isSelected={selectedId === message.id}
            onClick={() => onMessageClick?.(message.id)}
          />
        ))}
      </div>
    </div>
  );
};
