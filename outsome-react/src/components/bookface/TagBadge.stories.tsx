import type { Meta, StoryObj } from '@storybook/react';
import { TagBadge } from './TagBadge';

const meta: Meta<typeof TagBadge> = {
  title: 'Bookface/TagBadge',
  component: TagBadge,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['gray', 'blue', 'green', 'orange', 'purple'],
    },
    size: {
      control: 'radio',
      options: ['sm', 'md'],
    },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof TagBadge>;

export const Default: Story = {
  args: {
    label: 'CONSUMER',
    color: 'gray',
    size: 'md',
  },
};

export const AllColors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px' }}>
      <TagBadge label="GRAY" color="gray" />
      <TagBadge label="BLUE" color="blue" />
      <TagBadge label="GREEN" color="green" />
      <TagBadge label="ORANGE" color="orange" />
      <TagBadge label="PURPLE" color="purple" />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <TagBadge label="SMALL" size="sm" />
      <TagBadge label="MEDIUM" size="md" />
    </div>
  ),
};

export const Clickable: Story = {
  args: {
    label: 'CLICK ME',
    color: 'blue',
    onClick: () => alert('Tag clicked!'),
  },
};

export const TagGroup: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '6px' }}>
      <TagBadge label="SAAS" color="gray" />
      <TagBadge label="B2B" color="gray" />
      <TagBadge label="ENTERPRISE" color="gray" />
    </div>
  ),
};

export const RealWorldExample: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '6px' }}>
      <TagBadge label="FINTECH" color="blue" />
      <TagBadge label="B2B" color="gray" />
      <TagBadge label="AI" color="purple" />
    </div>
  ),
};
