import React from 'react';

export interface ArticleContentProps {
  title: string;
  content: string;
  updatedAt?: string;
  isBookmarked?: boolean;
  onBookmark?: () => void;
  onLinkClick?: (url: string) => void;
}

export const ArticleContent: React.FC<ArticleContentProps> = ({
  title,
  content,
  updatedAt,
  isBookmarked = false,
  onBookmark,
  onLinkClick,
}) => {
  const styles = {
    container: {
      maxWidth: '800px',
      backgroundColor: '#ffffff',
      color: '#2F2C26',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '8px',
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#2F2C26',
      margin: 0,
      lineHeight: '1.2',
      flex: 1,
    },
    bookmarkBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '4px',
      color: isBookmarked ? '#555AB9' : '#9aa0a6',
      transition: 'color 0.2s ease',
      marginLeft: '16px',
    },
    meta: {
      fontSize: '14px',
      color: '#6e6e6e',
      marginBottom: '24px',
    },
    contentArea: {
      fontSize: '16px',
      lineHeight: '1.6',
      color: '#2F2C26',
    }
  };

  // Styles for the injected HTML content
  const contentStyles = `
    .article-body p {
      margin-bottom: 16px;
      line-height: 1.6;
    }
    .article-body h1, .article-body h2, .article-body h3, .article-body h4 {
      color: #2F2C26;
      margin-top: 24px;
      margin-bottom: 12px;
      font-weight: 700;
      line-height: 1.3;
    }
    .article-body h2 {
      font-size: 20px;
    }
    .article-body h3 {
      font-size: 18px;
    }
    .article-body ul, .article-body ol {
      margin-bottom: 16px;
      padding-left: 24px;
    }
    .article-body li {
      margin-bottom: 4px;
    }
    .article-body a {
      color: #555AB9;
      text-decoration: none;
    }
    .article-body a:hover {
      text-decoration: underline;
    }
    .article-body strong, .article-body b {
      font-weight: 700;
    }
  `;

  const handleLinkClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onLinkClick) return;
    const target = e.target as HTMLElement;
    // Check if clicked element is an anchor or inside one
    const anchor = target.closest('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href) {
        e.preventDefault();
        onLinkClick(href);
      }
    }
  };

  return (
    <div style={styles.container}>
      <style>{contentStyles}</style>
      
      <div style={styles.header}>
        <h1 style={styles.title}>{title}</h1>
        {onBookmark && (
          <button 
            onClick={onBookmark} 
            style={styles.bookmarkBtn}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this article"}
          >
            {isBookmarked ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#555AB9">
                <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            )}
          </button>
        )}
      </div>

      {updatedAt && (
        <div style={styles.meta}>
          {updatedAt}
        </div>
      )}

      <div 
        className="article-body"
        style={styles.contentArea}
        dangerouslySetInnerHTML={{ __html: content }}
        onClick={handleLinkClick}
      />
    </div>
  );
};
