import React, { useState } from 'react';
import { BookfaceHeader } from '../BookfaceHeader';
import { LeftSidebar } from '../LeftSidebar';
import { VideoCard } from '../VideoCard';

const mockVideos = [
  { id: '1', title: 'How to Find Product-Market Fit', thumbnailUrl: 'https://picsum.photos/400/225?random=30', duration: '45:32', views: 125000, publishedAt: '2 weeks ago', category: 'Product', type: 'video' },
  { id: '2', title: 'Fundraising 101: From Seed to Series A', thumbnailUrl: 'https://picsum.photos/400/225?random=31', duration: '1:02:15', views: 89000, publishedAt: '1 month ago', category: 'Fundraising', type: 'video' },
  { id: '3', title: 'Building Your First Engineering Team', thumbnailUrl: 'https://picsum.photos/400/225?random=32', duration: '38:47', views: 67000, publishedAt: '3 weeks ago', category: 'Hiring', type: 'video' },
  { id: '4', title: 'Founder Story: From 0 to $100M ARR', thumbnailUrl: 'https://picsum.photos/400/225?random=33', duration: '52:18', views: 234000, publishedAt: '2 months ago', category: 'Founder Stories', type: 'video' },
  { id: '5', title: 'Growth Strategies That Actually Work', thumbnailUrl: 'https://picsum.photos/400/225?random=34', duration: '41:05', views: 156000, publishedAt: '1 week ago', category: 'Growth', type: 'video' },
  { id: '6', title: 'The Art of the Cold Email', thumbnailUrl: 'https://picsum.photos/400/225?random=35', duration: '28:33', views: 98000, publishedAt: '3 weeks ago', category: 'Sales', type: 'video' },
  { id: '7', title: 'Startup School: Week 1 Recap', thumbnailUrl: 'https://picsum.photos/400/225?random=36', duration: '1:15:42', views: 312000, publishedAt: '4 months ago', category: 'Education', type: 'video' },
  { id: '8', title: 'Podcast: Building in AI with Sam Altman', thumbnailUrl: 'https://picsum.photos/400/225?random=37', duration: '58:22', views: 445000, publishedAt: '1 month ago', category: 'AI', type: 'podcast' },
  { id: '9', title: 'Office Hours: Pricing Strategies', thumbnailUrl: 'https://picsum.photos/400/225?random=38', duration: '35:18', views: 54000, publishedAt: '2 weeks ago', category: 'Product', type: 'office-hours' },
  { id: '10', title: 'Technical Deep Dive: Scaling Infrastructure', thumbnailUrl: 'https://picsum.photos/400/225?random=39', duration: '1:08:45', views: 78000, publishedAt: '1 month ago', category: 'Technical', type: 'video' },
  { id: '11', title: 'Podcast: The Future of Fintech', thumbnailUrl: 'https://picsum.photos/400/225?random=40', duration: '47:30', views: 167000, publishedAt: '3 weeks ago', category: 'Fintech', type: 'podcast' },
  { id: '12', title: 'Office Hours: Hiring Your First PM', thumbnailUrl: 'https://picsum.photos/400/225?random=41', duration: '42:15', views: 43000, publishedAt: '1 week ago', category: 'Hiring', type: 'office-hours' },
];

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'video', label: 'Videos' },
  { id: 'podcast', label: 'Podcasts' },
  { id: 'office-hours', label: 'Office Hours' },
];

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#fefaf3',
    fontFamily: '"BDO Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px',
    display: 'grid',
    gridTemplateColumns: '200px 1fr',
    gap: '24px',
  },
  main: {
    minWidth: 0,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#2F2C26',
    margin: 0,
  },
  tabsContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    backgroundColor: '#ffffff',
    padding: '8px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  tab: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {
    backgroundColor: '#555AB9',
    color: '#ffffff',
  },
  tabInactive: {
    backgroundColor: 'transparent',
    color: '#666666',
  },
  searchContainer: {
    marginBottom: '24px',
  },
  searchInput: {
    width: '100%',
    maxWidth: '400px',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box' as const,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
  },
  featuredSection: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #e0e0e0',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    alignItems: 'center',
  },
  featuredContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  featuredLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#555AB9',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  featuredTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#2F2C26',
    lineHeight: 1.3,
  },
  featuredMeta: {
    fontSize: '14px',
    color: '#666666',
  },
  featuredButton: {
    padding: '12px 24px',
    backgroundColor: '#555AB9',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    width: 'fit-content',
  },
  featuredImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover' as const,
    borderRadius: '8px',
  },
};

export const LibraryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVideos = mockVideos.filter(video => {
    const matchesTab = activeTab === 'all' || video.type === activeTab;
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const featuredVideo = mockVideos[3];

  return (
    <div style={styles.page}>
      <BookfaceHeader userName="John Doe" userAvatarUrl="https://i.pravatar.cc/150?u=johndoe" notificationCount={3} />
      
      <div style={styles.container}>
        <LeftSidebar activeItem="library" />
        
        <main style={styles.main}>
          <div style={styles.header}>
            <h1 style={styles.title}>Library</h1>
          </div>
          
          <div style={styles.featuredSection}>
            <div style={styles.featuredContent}>
              <span style={styles.featuredLabel}>Featured</span>
              <h2 style={styles.featuredTitle}>{featuredVideo.title}</h2>
              <p style={styles.featuredMeta}>{featuredVideo.duration} · {featuredVideo.views.toLocaleString()} views</p>
              <button style={styles.featuredButton}>Watch Now</button>
            </div>
            <img src={featuredVideo.thumbnailUrl} alt={featuredVideo.title} style={styles.featuredImage} />
          </div>
          
          <div style={styles.tabsContainer}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab.id ? styles.tabActive : styles.tabInactive),
                }}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search videos and podcasts..."
              style={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div style={styles.grid}>
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                {...video}
                showBadge={video.type === 'office-hours'}
                onClick={() => console.log('Play video', video.id)}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};
