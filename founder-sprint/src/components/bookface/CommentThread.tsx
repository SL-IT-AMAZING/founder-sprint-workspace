import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOrCreateDMConversation } from '@/actions/messaging';

export interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
    batch?: string;
  };
  content: string;
  quotedText?: string;
  postedAt: string;
  upvotes: number;
  isUpvoted?: boolean;
  replies?: Comment[];
}

export interface CommentThreadProps {
  comments: Comment[];
  currentUserAvatar?: string;
  currentUserId?: string;
  onUpvote?: (commentId: string) => void;
  onReply?: (commentId: string, content: string) => void;
  onReplyPrivately?: (commentId: string, authorId: string) => void;
  onSubmitComment?: (content: string) => void;
}

const styles = {
  container: {
  },
  commentItem: {
    display: 'flex',
    gap: '12px',
    padding: '16px 0',
    borderBottom: '1px solid #f0f0f0',
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
    fontSize: '14px',
    fontWeight: 600,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
    flexWrap: 'wrap' as const,
  },
  authorName: {
    fontWeight: 600,
    fontSize: '14px',
    color: '#2F2C26',
  },
  batchBadge: {
    backgroundColor: '#f1eadd',
    color: '#2F2C26',
    fontSize: '11px',
    fontWeight: 500,
    padding: '2px 6px',
    borderRadius: '4px',
  },
  timestamp: {
    fontSize: '12px',
    color: '#999999',
  },
  quotedBlock: {
    backgroundColor: '#f5f5f5',
    borderLeft: '3px solid #e0e0e0',
    padding: '8px 12px',
    marginBottom: '8px',
    fontSize: '13px',
    color: '#666666',
    fontStyle: 'italic' as const,
  },
  commentText: {
    fontSize: '14px',
    color: '#2F2C26',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap' as const,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginTop: '8px',
  },
  actionButton: {
    background: 'none',
    border: 'none',
    fontSize: '13px',
    color: '#666666',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  actionButtonActive: {
    color: '#1A1A1A',
  },
  replies: {
    marginLeft: '44px',
    borderLeft: '2px solid #f0f0f0',
    paddingLeft: '16px',
  },
  inputContainer: {
    display: 'flex',
    gap: '12px',
    padding: '16px 0',
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: '20px',
    border: '1px solid #e0e0e0',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#f9f9f9',
  },
};

const CommentItem: React.FC<{
  comment: Comment;
  depth?: number;
  currentUserId?: string;
  onUpvote?: (id: string) => void;
  onReply?: (id: string, content: string) => void;
  onReplyPrivately?: (id: string, authorId: string) => void;
}> = ({ comment, depth = 0, currentUserId, onUpvote, onReply, onReplyPrivately }) => {
  if (depth > 2) return null;

  return (
    <>
      <div style={styles.commentItem}>
        {comment.author.avatarUrl ? (
          <img src={comment.author.avatarUrl} alt={comment.author.name} style={styles.avatar} />
        ) : (
          <div style={styles.avatarPlaceholder}>
            {comment.author.name.charAt(0).toUpperCase()}
          </div>
        )}
        
        <div style={styles.content}>
          <div style={styles.header}>
            <span style={styles.authorName}>{comment.author.name}</span>
            {comment.author.batch && (
              <span style={styles.batchBadge}>{comment.author.batch}</span>
            )}
            <span style={styles.timestamp}>{comment.postedAt}</span>
          </div>
          
          {comment.quotedText && (
            <div style={styles.quotedBlock}>"{comment.quotedText}"</div>
          )}
          
          <div style={styles.commentText}>{comment.content}</div>
          
          <div style={styles.actions}>
            <button
              style={{
                ...styles.actionButton,
                ...(comment.isUpvoted ? styles.actionButtonActive : {}),
              }}
              onClick={() => onUpvote?.(comment.id)}
            >
              <span>{comment.isUpvoted ? '▲' : '△'}</span>
              Upvote {comment.upvotes > 0 && `(${comment.upvotes})`}
            </button>
            <button style={styles.actionButton} onClick={() => onReply?.(comment.id, '')}>
              Reply
            </button>
            {currentUserId !== comment.author.id && (
              <button style={styles.actionButton} onClick={() => onReplyPrivately?.(comment.id, comment.author.id)}>
                Reply Privately
              </button>
            )}
          </div>
        </div>
      </div>
      
      {comment.replies && comment.replies.length > 0 && (
        <div style={styles.replies}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onUpvote={onUpvote}
              onReply={onReply}
              onReplyPrivately={onReplyPrivately}
            />
          ))}
        </div>
      )}
    </>
  );
};

export const CommentThread: React.FC<CommentThreadProps> = ({
  comments,
  currentUserAvatar,
  currentUserId,
  onUpvote,
  onReply,
  onReplyPrivately,
  onSubmitComment,
}) => {
  const router = useRouter();
  const [newComment, setNewComment] = useState('');
  
  // Handle Reply Privately with automatic messaging
  const handleReplyPrivatelyClick = async (commentId: string, authorId: string) => {
    try {
      const result = await getOrCreateDMConversation(authorId);
      if (result.success) {
        router.push(`/messages?conversation=${result.data.conversationId}`);
      }
    } catch (error) {
      console.error("Failed to open message conversation:", error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && onSubmitComment) {
      onSubmitComment(newComment);
      setNewComment('');
    }
  };

  return (
    <div style={styles.container}>
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onUpvote={onUpvote}
          onReply={onReply}
          onReplyPrivately={onReplyPrivately || handleReplyPrivatelyClick}
        />
      ))}
      
      <form onSubmit={handleSubmit} style={styles.inputContainer}>
        {currentUserAvatar ? (
          <img src={currentUserAvatar} alt="You" style={styles.avatar} />
        ) : (
          <div style={styles.avatarPlaceholder}>Y</div>
        )}
        <input
          type="text"
          placeholder="Write a comment..."
          style={styles.input}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
      </form>
    </div>
  );
};
