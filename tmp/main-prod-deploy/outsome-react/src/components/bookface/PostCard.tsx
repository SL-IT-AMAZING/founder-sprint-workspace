import React, { useState } from 'react';

export interface LinkPreview {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  domain: string;
}

export interface PostCardProps {
  id: string;
  author: {
    name: string;
    avatarUrl?: string;
    batch?: string;
    company?: string;
  };
  content: string;
  linkPreview?: LinkPreview;
  tags?: string[];
  postedAt: string;
  likes: number;
  comments: number;
  views?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
  onAuthorClick?: () => void;
}

const styles = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #e0e0e0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    maxWidth: '600px',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    marginRight: '12px',
    backgroundColor: '#f6f6ef',
    objectFit: 'cover' as const,
    cursor: 'pointer',
  },
  avatarPlaceholder: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    marginRight: '12px',
    backgroundColor: '#555AB9',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
  },
  headerInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
  },
  headerTopRow: {
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap' as const,
  },
  authorName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a1a1a',
    marginRight: '6px',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  batchBadge: {
    display: 'inline-block',
    backgroundColor: '#555AB9',
    color: 'white',
    fontSize: '10px',
    fontWeight: 700,
    padding: '1px 4px',
    borderRadius: '3px',
    marginRight: '6px',
    verticalAlign: 'middle',
  },
  companyName: {
    fontSize: '13px',
    color: '#666666',
  },
  metaRow: {
    marginTop: '2px',
    display: 'flex',
    alignItems: 'center',
  },
  postedAt: {
    fontSize: '12px',
    color: '#999999',
  },
  menuButton: {
    background: 'none',
    border: 'none',
    color: '#999',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
  },
  content: {
    fontSize: '14px',
    color: '#1a1a1a',
    lineHeight: 1.5,
    marginBottom: '16px',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  },
  showMoreBtn: {
    background: 'none',
    border: 'none',
    color: '#555AB9',
    cursor: 'pointer',
    fontSize: '14px',
    padding: 0,
    marginLeft: '4px',
    fontWeight: 500,
  },
  linkPreview: {
    display: 'flex',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    overflow: 'hidden',
    marginBottom: '16px',
    textDecoration: 'none',
    backgroundColor: '#fbfbfb',
    cursor: 'pointer',
  },
  linkImage: {
    width: '120px',
    height: 'auto',
    minHeight: '100%',
    objectFit: 'cover' as const,
    display: 'block',
  },
  linkContent: {
    padding: '10px 12px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
  },
  linkTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: '4px',
    lineHeight: 1.3,
  },
  linkDesc: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '6px',
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  linkDomain: {
    fontSize: '11px',
    color: '#999',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  tagsRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginBottom: '16px',
  },
  tag: {
    backgroundColor: '#f0f2f5',
    color: '#555',
    fontSize: '11px',
    fontWeight: 500,
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #e1e4e8',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    borderTop: '1px solid #f0f0f0',
    paddingTop: '12px',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: '4px',
    color: '#666',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'background-color 0.2s',
  },
  actionBtnActive: {
    color: '#555AB9',
    backgroundColor: 'rgba(85, 90, 185, 0.1)',
  },
  actionIcon: {
    marginRight: '6px',
    fontSize: '14px',
  },
  viewCount: {
    marginLeft: 'auto',
    fontSize: '12px',
    color: '#999',
    display: 'flex',
    alignItems: 'center',
  },
};

export const PostCard: React.FC<PostCardProps> = ({
  author,
  content,
  linkPreview,
  tags,
  postedAt,
  likes,
  comments,
  views,
  isLiked = false,
  isBookmarked = false,
  onLike,
  onComment,
  onBookmark,
  onShare,
  onAuthorClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const TRUNCATE_LENGTH = 280;

  const shouldTruncate = content.length > TRUNCATE_LENGTH;
  const displayContent = !isExpanded && shouldTruncate 
    ? content.slice(0, TRUNCATE_LENGTH) + '...' 
    : content;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        {author.avatarUrl ? (
          <img 
            src={author.avatarUrl} 
            alt={author.name} 
            style={styles.avatar} 
            onClick={onAuthorClick}
          />
        ) : (
          <div style={styles.avatarPlaceholder} onClick={onAuthorClick}>
            {author.name.charAt(0).toUpperCase()}
          </div>
        )}
        
        <div style={styles.headerInfo}>
          <div style={styles.headerTopRow}>
            <span style={styles.authorName} onClick={onAuthorClick}>
              {author.name}
            </span>
            {author.batch && (
              <span style={styles.batchBadge}>{author.batch}</span>
            )}
            {author.company && (
              <span style={styles.companyName}>
                 • {author.company}
              </span>
            )}
          </div>
          <div style={styles.metaRow}>
            <span style={styles.postedAt}>{postedAt}</span>
          </div>
        </div>
        
        <button style={styles.menuButton}>⋯</button>
      </div>

      <div style={styles.content}>
        {displayContent}
        {shouldTruncate && !isExpanded && (
          <button 
            style={styles.showMoreBtn} 
            onClick={() => setIsExpanded(true)}
          >
            Show more
          </button>
        )}
      </div>

      {linkPreview && (
        <a href={linkPreview.url} target="_blank" rel="noopener noreferrer" style={styles.linkPreview}>
          {linkPreview.imageUrl && (
            <img 
              src={linkPreview.imageUrl} 
              alt={linkPreview.title} 
              style={styles.linkImage} 
            />
          )}
          <div style={styles.linkContent}>
            <div style={styles.linkTitle}>{linkPreview.title}</div>
            {linkPreview.description && (
              <div style={styles.linkDesc}>{linkPreview.description}</div>
            )}
            <div style={styles.linkDomain}>
              🔗 {linkPreview.domain}
            </div>
          </div>
        </a>
      )}

      {tags && tags.length > 0 && (
        <div style={styles.tagsRow}>
          {tags.map((tag, index) => (
            <span key={index} style={styles.tag}>#{tag}</span>
          ))}
        </div>
      )}

      <div style={styles.actions}>
        <button 
          style={{...styles.actionBtn, ...(isLiked ? styles.actionBtnActive : {})}} 
          onClick={onLike}
        >
          <span style={styles.actionIcon}>{isLiked ? '▲' : '△'}</span>
          {likes > 0 && likes}
        </button>

        <button style={styles.actionBtn} onClick={onComment}>
          <span style={styles.actionIcon}>💬</span>
          {comments > 0 && comments}
        </button>

        <button style={styles.actionBtn} onClick={onShare}>
          <span style={styles.actionIcon}>↗</span>
          Share
        </button>
        
        <button 
          style={{...styles.actionBtn, ...(isBookmarked ? styles.actionBtnActive : {})}} 
          onClick={onBookmark}
        >
          <span style={styles.actionIcon}>{isBookmarked ? '🔖' : '🏷'}</span>
        </button>

        {views !== undefined && (
          <div style={styles.viewCount}>
            <span style={{marginRight: '4px'}}>👁</span>
            {views >= 1000 ? (views / 1000).toFixed(1) + 'k' : views}
          </div>
        )}
      </div>
    </div>
  );
};
