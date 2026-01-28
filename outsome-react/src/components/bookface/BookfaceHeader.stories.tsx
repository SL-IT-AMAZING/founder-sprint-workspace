import type { Meta, StoryObj } from '@storybook/react';
import { BookfaceHeader } from './BookfaceHeader';

const meta: Meta<typeof BookfaceHeader> = {
  title: 'Bookface/BookfaceHeader',
  component: BookfaceHeader,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'light',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onLogoClick: { action: 'logo clicked' },
    onSearchSubmit: { action: 'search submitted' },
    onNotificationClick: { action: 'notification clicked' },
    onProfileClick: { action: 'profile clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof BookfaceHeader>;

export const Default: Story = {
  args: {
    userName: 'Jessica Livingston',
  },
};

export const WithNotifications: Story = {
  args: {
    userName: 'Paul Graham',
    notificationCount: 5,
  },
};

export const NoNotifications: Story = {
  args: {
    userName: 'Sam Altman',
    notificationCount: 0,
  },
};

export const HighNotificationCount: Story = {
  args: {
    userName: 'Garry Tan',
    notificationCount: 125,
  },
};

export const WithSearchInteraction: Story = {
  args: {
    userName: 'User',
  },
};

export const FullWidth: Story = {
  render: (args) => (
    <div style={{ width: '100%', minWidth: '1200px' }}>
      <BookfaceHeader {...args} />
    </div>
  ),
};
