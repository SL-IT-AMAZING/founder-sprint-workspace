import type { Meta, StoryObj } from '@storybook/react';
import { PostCard } from './PostCard';
import type { PostCardProps } from './PostCard';
import { useState } from 'react';

const meta: Meta<typeof PostCard> = {
  title: 'Bookface/PostCard',
  component: PostCard,
  tags: ['autodocs'],
  argTypes: {
    onLike: { action: 'liked' },
    onComment: { action: 'commented' },
    onBookmark: { action: 'bookmarked' },
    onShare: { action: 'shared' },
    onAuthorClick: { action: 'author clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof PostCard>;

const defaultAuthor = {
  name: 'Garry Tan',
  avatarUrl: 'https://i.pravatar.cc/150?u=garry',
  batch: 'S08',
  company: 'Y Combinator',
};

const defaultContent = "Just met with a founder who built an entire MVP in a weekend using pure hustle. Reminds me of the early days of Airbnb. It's not about the code, it's about solving the problem.";

export const Default: Story = {
  args: {
    id: '1',
    author: defaultAuthor,
    content: defaultContent,
    postedAt: '2h ago',
    likes: 42,
    comments: 12,
    views: 1205,
    isLiked: false,
    isBookmarked: false,
  },
};

export const Liked: Story = {
  args: {
    ...Default.args,
    isLiked: true,
    likes: 43,
  },
};

export const WithLinkPreview: Story = {
  args: {
    id: '2',
    author: {
      name: 'Paul Graham',
      batch: 'Founder',
      company: 'YC',
      avatarUrl: 'https://i.pravatar.cc/150?u=pg',
    },
    content: "I wrote a new essay about how to do great work. It applies to startups, art, science, and pretty much everything else.",
    postedAt: '5h ago',
    likes: 856,
    comments: 142,
    views: 15400,
    linkPreview: {
      url: 'http://paulgraham.com/greatwork.html',
      title: 'How to Do Great Work',
      description: 'If you collected lists of techniques for doing great work in a lot of different fields, what would the intersection look like?',
      domain: 'paulgraham.com',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Paul_Graham_2008.jpg/440px-Paul_Graham_2008.jpg', 
    },
  },
};

export const WithTags: Story = {
  args: {
    ...Default.args,
    content: "Looking for recommendations on the best dev tools for managing secrets in production. What is everyone using these days?",
    tags: ['ask-yc', 'dev-tools', 'security'],
    likes: 5,
    comments: 24,
  },
};

export const LongContent: Story = {
  args: {
    ...Default.args,
    author: {
        name: 'Sam Altman',
        company: 'OpenAI',
        batch: 'S05'
    },
    content: `The most important thing for a startup is to move fast. Speed is your primary advantage over incumbents. 

But speed doesn't just mean writing code quickly. It means making decisions quickly. It means shipping, getting feedback, and iterating. 

Don't spend weeks debating the perfect architecture. Build it, ship it, break it, fix it. The market will tell you what's wrong faster than any internal meeting ever could. 

Also, remember that "moving fast" is not an excuse for sloppy work on the things that matter (security, user privacy). But for most product features, perfect is the enemy of done.`,
    likes: 1200,
    comments: 340,
    postedAt: '1d ago',
  },
};

const InteractivePostCard = (args: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(args.isLiked);
  const [likes, setLikes] = useState(args.likes);
  const [isBookmarked, setIsBookmarked] = useState(args.isBookmarked);

  const handleLike = () => {
    if (isLiked) {
      setLikes(likes - 1);
      setIsLiked(false);
    } else {
      setLikes(likes + 1);
      setIsLiked(true);
    }
    args.onLike?.();
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    args.onBookmark?.();
  };

  return (
    <PostCard
      {...args}
      isLiked={isLiked}
      likes={likes}
      isBookmarked={isBookmarked}
      onLike={handleLike}
      onBookmark={handleBookmark}
    />
  );
};

export const Interactive: Story = {
  render: (args) => <InteractivePostCard {...args} />,
  args: {
    ...Default.args,
  },
};

export const FeedExample: Story = {
  render: () => (
    <div style={{ backgroundColor: '#f6f6ef', padding: '20px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <InteractivePostCard 
        {...WithLinkPreview.args as PostCardProps} 
      />
      <InteractivePostCard 
        {...Default.args as PostCardProps} 
        author={{name: 'Dalton Caldwell', batch: 'W12', company: 'YC Group Partner'}}
        content="Don't die. That's the only rule."
        postedAt="4h ago"
      />
      <InteractivePostCard 
        {...WithTags.args as PostCardProps} 
        id="3"
        postedAt="6h ago"
      />
    </div>
  ),
};
