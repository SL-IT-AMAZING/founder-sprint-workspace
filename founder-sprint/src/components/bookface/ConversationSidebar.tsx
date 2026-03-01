import React, { useState } from 'react';

export interface Participant {
  id: string;
  name: string;
  avatarUrl?: string;
  company?: string;
  batch?: string;
  isFollowing?: boolean;
}

export interface ConversationSidebarProps {
  participants: Participant[];
  onFollowClick?: (participantId: string) => void;
  onProfileClick?: (participantId: string) => void;
}

const styles = {
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    overflow: 'hidden',
  },
  header: {
    padding: '16px',
    borderBottom: '1px solid #e0e0e0',
    fontSize: '14px',
    fontWeight: 600,
    color: '#2F2C26',
  },
  list: {
    maxHeight: '400px',
    overflowY: 'auto' as const,
  },
  participantRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    gap: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#e0e0e0',
    flexShrink: 0,
    objectFit: 'cover' as const,
  },
  avatarPlaceholder: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#1A1A1A',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 600,
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2F2C26',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  meta: {
    fontSize: '12px',
    color: '#666666',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  followButton: {
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    flexShrink: 0,
  },
  followButtonDefault: {
    backgroundColor: '#1A1A1A',
    color: 'white',
    border: '1px solid #1A1A1A',
  },
  followButtonFollowing: {
    backgroundColor: 'transparent',
    color: '#1A1A1A',
    border: '1px solid #1A1A1A',
  },
};

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  participants,
  onFollowClick,
  onProfileClick,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div style={styles.container}>
      <div style={styles.header}>In This Conversation</div>
      
      <div style={styles.list}>
        {participants.map((participant) => (
          <div
            key={participant.id}
            style={{
              ...styles.participantRow,
              backgroundColor: hoveredId === participant.id ? '#f9f9f9' : 'transparent',
            }}
            onMouseEnter={() => setHoveredId(participant.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onProfileClick?.(participant.id)}
          >
            {participant.avatarUrl ? (
              <img src={participant.avatarUrl} alt={participant.name} style={styles.avatar} />
            ) : (
              <div style={styles.avatarPlaceholder}>
                {participant.name.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div style={styles.info}>
              <div style={styles.name}>{participant.name}</div>
              <div style={styles.meta}>
                {participant.company}
                {participant.company && participant.batch && ' · '}
                {participant.batch && `(${participant.batch})`}
              </div>
            </div>
            
            <button
              style={{
                ...styles.followButton,
                ...(participant.isFollowing ? styles.followButtonFollowing : styles.followButtonDefault),
              }}
              onClick={(e) => {
                e.stopPropagation();
                onFollowClick?.(participant.id);
              }}
            >
              {participant.isFollowing ? 'Following' : '+ Follow'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
