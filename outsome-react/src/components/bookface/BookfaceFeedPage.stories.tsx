import type { Meta, StoryObj } from '@storybook/react';
import { BookfaceFeedPage } from './BookfaceFeedPage';

const meta: Meta<typeof BookfaceFeedPage> = {
  title: 'Bookface/Pages/FeedPage',
  component: BookfaceFeedPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof BookfaceFeedPage>;

export const Default: Story = {};

export const EmptyFeed: Story = {
  args: {
    posts: [],
  },
};

export const SinglePost: Story = {
  args: {
    posts: [
      {
        id: '1',
        author: {
          name: 'Jane Doe',
          avatarUrl: 'https://i.pravatar.cc/150?u=jane',
          batch: 'W23',
          company: 'Acme Inc',
        },
        content: 'This is a single post example to test the layout.',
        postedAt: '1h ago',
        likes: 42,
        comments: 5,
        views: 100,
      },
    ],
  },
};

export const WithLinkPreviews: Story = {
  args: {
    posts: [
      {
        id: '1',
        author: {
          name: 'Tech News',
          avatarUrl: 'https://i.pravatar.cc/150?u=tech',
          batch: 'S22',
        },
        content: 'Check out this amazing article about the future of AI!',
        linkPreview: {
          url: 'https://example.com/ai-future',
          title: 'The Future of AI: What to Expect in 2025',
          description: 'A comprehensive look at upcoming AI trends and technologies that will shape our world.',
          imageUrl: 'https://picsum.photos/400/200',
          domain: 'example.com',
        },
        postedAt: '3h ago',
        likes: 156,
        comments: 28,
        views: 3200,
      },
      {
        id: '2',
        author: {
          name: 'Startup Weekly',
          avatarUrl: 'https://i.pravatar.cc/150?u=startup',
          batch: 'W21',
        },
        content: 'Great fundraising tips from YC partners.',
        linkPreview: {
          url: 'https://ycombinator.com/blog',
          title: 'How to Raise Your Seed Round',
          description: 'Expert advice from YC partners on successfully closing your seed round.',
          domain: 'ycombinator.com',
        },
        postedAt: '5h ago',
        likes: 89,
        comments: 12,
      },
    ],
  },
};

export const NoPeopleToFollow: Story = {
  args: {
    peopleToFollow: [],
  },
};
