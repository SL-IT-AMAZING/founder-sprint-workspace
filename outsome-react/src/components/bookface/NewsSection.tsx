import React from 'react';

export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  source: string;
  publishedAt: string;
}

export interface NewsSectionProps {
  articles: NewsArticle[];
  canAddArticles?: boolean;
  onAddArticle?: () => void;
  onArticleClick?: (article: NewsArticle) => void;
}

// Simple time ago helper
const timeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (isNaN(seconds)) return dateString; // Fallback if invalid date

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  
  return Math.floor(seconds) + " seconds ago";
};

export const NewsSection: React.FC<NewsSectionProps> = ({
  articles,
  canAddArticles = false,
  onAddArticle,
  onArticleClick
}) => {
  const styles = {
    container: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: '#2F2C26',
      marginBottom: '32px',
    } as React.CSSProperties,
    
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: '16px',
      paddingBottom: '8px',
      borderBottom: '1px solid #e0e0e0',
    } as React.CSSProperties,
    
    title: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#2F2C26',
      margin: 0,
    } as React.CSSProperties,
    
    addLink: {
      fontSize: '14px',
      color: '#555AB9',
      textDecoration: 'none',
      cursor: 'pointer',
      fontWeight: '500',
    } as React.CSSProperties,
    
    grid: {
      display: 'grid',
      // Auto-fill with minmax ensures responsiveness (3 cols on large, 2 on med, 1 on small depending on container width)
      // Assuming a standard desktop container width ~900px, 280px is a good min-width for 3 cols
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: '16px',
    } as React.CSSProperties,
    
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'box-shadow 0.2s ease',
      cursor: 'pointer',
      textDecoration: 'none', // For the anchor tag wrapper
    } as React.CSSProperties,
    
    thumbnailContainer: {
      width: '100%',
      height: '120px',
      backgroundColor: '#f5f5f5',
      position: 'relative',
      overflow: 'hidden',
    } as React.CSSProperties,
    
    thumbnail: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    } as React.CSSProperties,
    
    thumbnailPlaceholder: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#999999',
      fontSize: '24px',
    } as React.CSSProperties,
    
    content: {
      padding: '12px',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
    } as React.CSSProperties,
    
    articleTitle: {
      fontSize: '14px',
      fontWeight: '700',
      color: '#2F2C26',
      marginBottom: '4px',
      lineHeight: '1.4',
      // Line clamp logic for 2 lines
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    } as React.CSSProperties,
    
    metaRow: {
      marginTop: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '12px',
      paddingTop: '8px',
    } as React.CSSProperties,
    
    source: {
      color: '#555AB9', // "blue link" style per prompt, using primary brand color
      fontWeight: '500',
      textDecoration: 'none',
      maxWidth: '60%',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    } as React.CSSProperties,
    
    time: {
      color: '#999999',
      marginLeft: '8px',
    } as React.CSSProperties,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
    e.currentTarget.style.borderColor = '#d0d0d0';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.borderColor = '#e0e0e0';
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>News</h2>
        {canAddArticles && (
          <a 
            href="#" 
            style={styles.addLink}
            onClick={(e) => {
              e.preventDefault();
              onAddArticle?.();
            }}
          >
            Add new articles
          </a>
        )}
      </div>

      <div style={styles.grid}>
        {articles.map((article) => (
          <a
            key={article.id}
            href={article.url}
            style={styles.card}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (onArticleClick) {
                onArticleClick(article);
              }
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div style={styles.thumbnailContainer}>
              {article.thumbnailUrl ? (
                <img 
                  src={article.thumbnailUrl} 
                  alt={article.title} 
                  style={styles.thumbnail}
                  onError={(e) => {
                    // Fallback to placeholder on error
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.classList.add('has-error');
                    // In a real app we'd swap this with a state variable, 
                    // but for inline ease we just hide it. 
                    // A sibling element for placeholder would be better if we weren't doing strictly inline map.
                  }}
                />
              ) : (
                <div style={styles.thumbnailPlaceholder}>
                  {/* Simple icon placeholder using unicode or SVG could go here */}
                  📰
                </div>
              )}
            </div>
            
            <div style={styles.content}>
              <h3 style={styles.articleTitle} title={article.title}>
                {article.title}
              </h3>
              
              <div style={styles.metaRow}>
                <span style={styles.source}>{article.source}</span>
                <span style={styles.time}>{timeAgo(article.publishedAt)}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
