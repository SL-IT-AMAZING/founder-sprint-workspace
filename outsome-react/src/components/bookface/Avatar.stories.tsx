import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Bookface/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    badge: { control: 'text' },
    showBadge: { control: 'boolean' },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    alt: 'Jane Doe',
    size: 'md',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
      <Avatar src="https://i.pravatar.cc/150?u=1" alt="User 1" size="xs" />
      <Avatar src="https://i.pravatar.cc/150?u=1" alt="User 1" size="sm" />
      <Avatar src="https://i.pravatar.cc/150?u=1" alt="User 1" size="md" />
      <Avatar src="https://i.pravatar.cc/150?u=1" alt="User 1" size="lg" />
      <Avatar src="https://i.pravatar.cc/150?u=1" alt="User 1" size="xl" />
    </div>
  ),
};

export const WithBadge: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?u=8',
    alt: 'Paul Graham',
    size: 'lg',
    badge: 'W20',
    showBadge: true,
  },
};

export const WithoutImage: Story = {
  args: {
    alt: 'Sam Altman',
    size: 'md',
    badge: 'S13',
    showBadge: true,
  },
};

export const Clickable: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?u=12',
    alt: 'Click Me',
    size: 'md',
    onClick: () => console.log('Avatar clicked'),
  },
};
