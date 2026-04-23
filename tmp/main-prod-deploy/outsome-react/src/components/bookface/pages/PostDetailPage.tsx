import React, { useState } from 'react';
import { BookfaceHeader } from '../BookfaceHeader';
import { PostCard } from '../PostCard';
import { CommentThread } from '../CommentThread';
import type { Comment } from '../CommentThread';
import { ConversationSidebar } from '../ConversationSidebar';

const mockPost = {
  id: '1',
  author: {
    name: 'Sarah Chen',
    avatarUrl: 'https://i.pravatar.cc/150?u=sarah',
    batch: 'W20',
    company: 'Stripe',
  },
  content: `Just shipped a major feature that we've been working on for months. The key insight was focusing on the 20% of functionality that serves 80% of use cases. Sometimes the hardest part of building a product is deciding what NOT to build.

A few lessons learned:
1. Talk to users early and often - we changed direction twice based on feedback
2. Ship fast, iterate faster - our first version was embarrassingly simple
3. Technical debt is real - budget time for cleanup sprints
4. Team morale matters - celebrate small wins along the way

What are your biggest lessons from recent launches? Would love to hear from other founders who've been through this.`,
  postedAt: '2 hours ago',
  likes: 127,
  comments: 23,
  views: 1842,
  tags: ['product', 'startups', 'advice'],
};

const mockComments: Comment[] = [
  {
    id: '1',
    author: { name: 'Michael Rodriguez', avatarUrl: 'https://i.pravatar.cc/150?u=michael', batch: 'S19' },
    content: 'Totally agree about the 80/20 rule. We spent way too long building features nobody used in our first version. Now we ship an MVP first and only add features when users specifically ask for them.',
    postedAt: '1h ago',
    upvotes: 24,
    isUpvoted: false,
    replies: [
      {
        id: '1-1',
        author: { name: 'Sarah Chen', avatarUrl: 'https://i.pravatar.cc/150?u=sarah', batch: 'W20' },
        content: 'Exactly! The temptation to build "just one more feature" before launch is real. Better to ship and learn.',
        postedAt: '45m ago',
        upvotes: 8,
        isUpvoted: true,
      },
      {
        id: '1-2',
        author: { name: 'Alex Kim', avatarUrl: 'https://i.pravatar.cc/150?u=alex', batch: 'W22' },
        content: 'How do you balance MVP speed with technical quality? We\'ve shipped fast before and paid for it later.',
        postedAt: '30m ago',
        upvotes: 5,
        isUpvoted: false,
      },
    ],
  },
  {
    id: '2',
    author: { name: 'Emily Watson', avatarUrl: 'https://i.pravatar.cc/150?u=emily', batch: 'W21' },
    content: 'The point about team morale is underrated. We were so focused on shipping that we forgot to celebrate when we actually hit milestones. Now we do a small team lunch for every major release.',
    postedAt: '55m ago',
    upvotes: 18,
    isUpvoted: false,
    replies: [
      {
        id: '2-1',
        author: { name: 'David Park', avatarUrl: 'https://i.pravatar.cc/150?u=david', batch: 'W19' },
        content: 'We started doing demo days every Friday where people show what they shipped that week. Great for visibility and morale.',
        postedAt: '40m ago',
        upvotes: 12,
        isUpvoted: false,
      },
    ],
  },
  {
    id: '3',
    author: { name: 'Jessica Liu', avatarUrl: 'https://i.pravatar.cc/150?u=jessica', batch: 'S21' },
    quotedText: 'Technical debt is real - budget time for cleanup sprints',
    content: 'This is so important. We dedicate every 4th sprint to tech debt and it\'s made a huge difference in our velocity. Engineers are happier too because they\'re not constantly fighting with legacy code.',
    postedAt: '45m ago',
    upvotes: 31,
    isUpvoted: true,
  },
  {
    id: '4',
    author: { name: 'Chris Taylor', avatarUrl: 'https://i.pravatar.cc/150?u=chris', batch: 'W21' },
    content: 'Congrats on the launch! What tools/processes did you find most helpful for user feedback? We\'re struggling to get meaningful insights from our early users.',
    postedAt: '30m ago',
    upvotes: 7,
    isUpvoted: false,
  },
  {
    id: '5',
    author: { name: 'Rachel Green', avatarUrl: 'https://i.pravatar.cc/150?u=rachel', batch: 'S20' },
    content: 'Great post Sarah! One thing I\'d add - having clear success metrics before launching really helps. Otherwise you end up in analysis paralysis trying to figure out if the launch was actually successful.',
    postedAt: '15m ago',
    upvotes: 14,
    isUpvoted: false,
    replies: [
      {
        id: '5-1',
        author: { name: 'Sarah Chen', avatarUrl: 'https://i.pravatar.cc/150?u=sarah', batch: 'W20' },
        content: '100%! We define 2-3 key metrics for every launch and commit to measuring them for at least 2 weeks before making any changes.',
        postedAt: '10m ago',
        upvotes: 6,
        isUpvoted: false,
      },
    ],
  },
];

const mockParticipants = [
  { id: '1', name: 'Sarah Chen', avatarUrl: 'https://i.pravatar.cc/150?u=sarah', company: 'Stripe', batch: 'W20', isFollowing: true },
  { id: '2', name: 'Michael Rodriguez', avatarUrl: 'https://i.pravatar.cc/150?u=michael', company: 'Notion', batch: 'S19', isFollowing: false },
  { id: '3', name: 'Emily Watson', avatarUrl: 'https://i.pravatar.cc/150?u=emily', company: 'Figma', batch: 'W21', isFollowing: true },
  { id: '4', name: 'Alex Kim', avatarUrl: 'https://i.pravatar.cc/150?u=alex', company: 'Linear', batch: 'W22', isFollowing: false },
  { id: '5', name: 'David Park', avatarUrl: 'https://i.pravatar.cc/150?u=david', company: 'Airbnb', batch: 'W19', isFollowing: false },
  { id: '6', name: 'Jessica Liu', avatarUrl: 'https://i.pravatar.cc/150?u=jessica', company: 'Vercel', batch: 'S21', isFollowing: true },
  { id: '7', name: 'Chris Taylor', avatarUrl: 'https://i.pravatar.cc/150?u=chris', company: 'Scale AI', batch: 'W21', isFollowing: false },
  { id: '8', name: 'Rachel Green', avatarUrl: 'https://i.pravatar.cc/150?u=rachel', company: 'Coinbase', batch: 'S20', isFollowing: false },
];

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#fefaf3',
    fontFamily: '"BDO Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '24px',
    display: 'grid',
    gridTemplateColumns: '1fr 280px',
    gap: '24px',
  },
  main: {
    minWidth: 0,
  },
  postContainer: {
    marginBottom: '24px',
  },
  commentsSection: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    padding: '24px',
  },
  commentsHeader: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#2F2C26',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e0e0e0',
  },
  sidebar: {
    position: 'sticky' as const,
    top: '88px',
    height: 'fit-content',
  },
};

export const PostDetailPage: React.FC = () => {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [comments] = useState(mockComments);
  const [participants, setParticipants] = useState(mockParticipants);

  const handleUpvote = (commentId: string) => {
    console.log('Upvote comment', commentId);
  };

  const handleReply = (commentId: string, content: string) => {
    console.log('Reply to comment', commentId, content);
  };

  const handleSubmitComment = (content: string) => {
    console.log('Submit new comment', content);
  };

  const handleFollowParticipant = (participantId: string) => {
    setParticipants(prev => prev.map(p => 
      p.id === participantId ? { ...p, isFollowing: !p.isFollowing } : p
    ));
  };

  return (
    <div style={styles.page}>
      <BookfaceHeader userName="John Doe" userAvatarUrl="https://i.pravatar.cc/150?u=johndoe" notificationCount={3} />
      
      <div style={styles.container}>
        <main style={styles.main}>
          <div style={styles.postContainer}>
            <PostCard
              {...mockPost}
              isLiked={isLiked}
              isBookmarked={isBookmarked}
              onLike={() => setIsLiked(!isLiked)}
              onBookmark={() => setIsBookmarked(!isBookmarked)}
              onComment={() => document.getElementById('comment-input')?.focus()}
              onShare={() => console.log('Share post')}
              onAuthorClick={() => console.log('View author profile')}
            />
          </div>
          
          <div style={styles.commentsSection}>
            <div style={styles.commentsHeader}>{mockComments.length} Comments</div>
            <CommentThread
              comments={comments}
              currentUserAvatar="https://i.pravatar.cc/150?u=johndoe"
              onUpvote={handleUpvote}
              onReply={handleReply}
              onReplyPrivately={(commentId) => console.log('Reply privately to', commentId)}
              onSubmitComment={handleSubmitComment}
            />
          </div>
        </main>
        
        <aside style={styles.sidebar}>
          <ConversationSidebar
            participants={participants}
            onFollowClick={handleFollowParticipant}
            onProfileClick={(id) => console.log('View profile', id)}
          />
        </aside>
      </div>
    </div>
  );
};
