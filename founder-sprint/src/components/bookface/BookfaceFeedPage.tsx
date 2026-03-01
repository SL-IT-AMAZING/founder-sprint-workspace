import React, { useState } from 'react';
import { BookfaceHeader } from './BookfaceHeader';
import { FeedTabs, defaultTabs } from './FeedTabs';
import { PostCard } from './PostCard';
import type { PostCardProps } from './PostCard';
import { PersonCard } from './PersonCard';


export interface BookfaceFeedPageProps {
  posts?: Omit<PostCardProps, 'onLike' | 'onComment' | 'onBookmark' | 'onShare' | 'onAuthorClick'>[];
  peopleToFollow?: {
    name: string;
    avatarUrl?: string;
    batch?: string;
    company?: string;
    role?: string;
  }[];
}

const defaultPosts: Omit<PostCardProps, 'onLike' | 'onComment' | 'onBookmark' | 'onShare' | 'onAuthorClick'>[] = [
  {
    id: '1',
    author: {
      name: 'Sarah Chen',
      avatarUrl: 'https://i.pravatar.cc/150?u=sarah',
      batch: 'W20',
      company: 'Stripe',
    },
    content: 'Just shipped a major feature that we\'ve been working on for months. The key insight was focusing on the 20% of functionality that serves 80% of use cases. Sometimes the hardest part of building a product is deciding what NOT to build.',
    postedAt: '2h ago',
    likes: 127,
    comments: 23,
    views: 1842,
    isLiked: false,
    tags: ['product', 'startups'],
  },
  {
    id: '2',
    author: {
      name: 'Michael Rodriguez',
      avatarUrl: 'https://i.pravatar.cc/150?u=michael',
      batch: 'S19',
      company: 'Notion',
    },
    content: 'We\'re hiring senior engineers! If you\'re passionate about building tools that help people organize their work and life, reach out. Competitive comp, great team, and real impact.',
    linkPreview: {
      url: 'https://notion.so/careers',
      title: 'Careers at Notion',
      description: 'Join our team and help millions of people organize their work and life.',
      imageUrl: 'https://www.notion.so/images/meta/default.png',
      domain: 'notion.so',
    },
    postedAt: '4h ago',
    likes: 89,
    comments: 12,
    views: 2341,
    isLiked: true,
  },
  {
    id: '3',
    author: {
      name: 'Emily Watson',
      avatarUrl: 'https://i.pravatar.cc/150?u=emily',
      batch: 'W21',
      company: 'Figma',
    },
    content: 'Hot take: Most B2B SaaS companies are over-engineering their onboarding flows. Users don\'t want a 10-step tutorial - they want to accomplish their first task in under 2 minutes.\n\nThe best onboarding is no onboarding. Make your product intuitive enough that people can figure it out.',
    postedAt: '6h ago',
    likes: 234,
    comments: 45,
    views: 5621,
    isLiked: false,
    tags: ['product', 'ux', 'b2b'],
  },
];

const defaultPeopleToFollow = [
  {
    name: 'Alex Kim',
    avatarUrl: 'https://i.pravatar.cc/150?u=alex',
    batch: 'W22',
    company: 'Linear',
    role: 'Co-founder',
  },
  {
    name: 'Jessica Liu',
    avatarUrl: 'https://i.pravatar.cc/150?u=jessica',
    batch: 'S21',
    company: 'Vercel',
    role: 'Engineering Lead',
  },
  {
    name: 'David Park',
    avatarUrl: 'https://i.pravatar.cc/150?u=david',
    batch: 'W19',
    company: 'Airbnb',
    role: 'Product Manager',
  },
  {
    name: 'Rachel Green',
    avatarUrl: 'https://i.pravatar.cc/150?u=rachel',
    batch: 'S20',
    company: 'Coinbase',
    role: 'Designer',
  },
];

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#fefaf3',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    display: 'grid',
    gridTemplateColumns: '200px 1fr 280px',
    gap: '24px',
  },
  leftSidebar: {
    position: 'sticky' as const,
    top: '68px',
    height: 'fit-content',
  },
  leftNav: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '12px 0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  leftNavItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    color: '#333',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  leftNavItemActive: {
    backgroundColor: 'rgba(26, 26, 26, 0.1)',
    color: '#1A1A1A',
    fontWeight: 600,
  },
  leftNavIcon: {
    marginRight: '12px',
    fontSize: '16px',
    width: '20px',
    textAlign: 'center' as const,
  },
  mainContent: {
    minWidth: 0,
  },
  feedHeader: {
    backgroundColor: 'white',
    borderRadius: '8px 8px 0 0',
    marginBottom: '0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  newPostBox: {
    backgroundColor: 'white',
    borderRadius: '0 0 8px 8px',
    padding: '16px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderTop: '1px solid #e0e0e0',
  },
  newPostAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#1A1A1A',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  newPostInput: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: '20px',
    border: '1px solid #e0e0e0',
    backgroundColor: '#f1eadd',
    fontSize: '14px',
    color: '#666',
    cursor: 'pointer',
  },
  rightSidebar: {
    position: 'sticky' as const,
    top: '68px',
    height: 'fit-content',
  },
  sidebarCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    marginBottom: '16px',
  },
  sidebarTitle: {
    padding: '16px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a1a1a',
    borderBottom: '1px solid #e0e0e0',
  },
  trendingItem: {
    padding: '12px 16px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
  },
  trendingTitle: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#1a1a1a',
    marginBottom: '4px',
  },
  trendingMeta: {
    fontSize: '11px',
    color: '#999',
  },
};

const leftNavItems = [
  { icon: '🏠', label: 'Home', active: true },
  { icon: '👥', label: 'People', active: false },
  { icon: '🏢', label: 'Companies', active: false },
  { icon: '📚', label: 'Knowledge', active: false },
  { icon: '💼', label: 'Jobs', active: false },
  { icon: '📅', label: 'Events', active: false },
];

const trendingTopics = [
  { title: 'AI/ML in 2024', posts: 234 },
  { title: 'Hiring strategies', posts: 156 },
  { title: 'Remote work tips', posts: 98 },
  { title: 'Fundraising advice', posts: 87 },
];

export const BookfaceFeedPage: React.FC<BookfaceFeedPageProps> = ({
  posts = defaultPosts,
  peopleToFollow = defaultPeopleToFollow,
}) => {
  const [activeTab, setActiveTab] = useState('top');
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set(['2']));
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());

  const handleFollow = (name: string) => {
    setFollowing(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleLike = (postId: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const handleBookmark = (postId: string) => {
    setBookmarkedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  return (
    <div style={styles.page}>
      <BookfaceHeader
        userName="John Doe"
        userAvatarUrl="https://i.pravatar.cc/150?u=johndoe"
        notificationCount={3}
      />

      <div style={styles.container}>
        <aside style={styles.leftSidebar}>
          <nav style={styles.leftNav}>
            {leftNavItems.map((item) => (
              <div
                key={item.label}
                style={{
                  ...styles.leftNavItem,
                  ...(item.active ? styles.leftNavItemActive : {}),
                }}
              >
                <span style={styles.leftNavIcon}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </nav>
        </aside>

        <main style={styles.mainContent}>
          <div style={styles.feedHeader}>
            <FeedTabs
              tabs={defaultTabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          <div style={styles.newPostBox}>
            <div style={styles.newPostAvatar}>J</div>
            <div style={styles.newPostInput}>
              What's on your mind?
            </div>
          </div>

          {posts.map((post) => (
            <PostCard
              key={post.id}
              {...post}
              isLiked={likedPosts.has(post.id)}
              isBookmarked={bookmarkedPosts.has(post.id)}
              onLike={() => handleLike(post.id)}
              onBookmark={() => handleBookmark(post.id)}
              onComment={() => console.log('Comment on post', post.id)}
              onShare={() => console.log('Share post', post.id)}
              onAuthorClick={() => console.log('View author', post.author.name)}
            />
          ))}
        </main>

        <aside style={styles.rightSidebar}>
          <div style={styles.sidebarCard}>
            <div style={styles.sidebarTitle}>People to Follow</div>
            {peopleToFollow.map((person) => (
              <PersonCard
                key={person.name}
                {...person}
                isFollowing={following.has(person.name)}
                onFollowClick={() => handleFollow(person.name)}
                onProfileClick={() => console.log('View profile', person.name)}
              />
            ))}
          </div>

          <div style={styles.sidebarCard}>
            <div style={styles.sidebarTitle}>Trending Topics</div>
            {trendingTopics.map((topic) => (
              <div key={topic.title} style={styles.trendingItem}>
                <div style={styles.trendingTitle}>{topic.title}</div>
                <div style={styles.trendingMeta}>{topic.posts} posts this week</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};
