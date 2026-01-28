import type { Meta, StoryObj } from '@storybook/react';
import { PersonCard } from './PersonCard';
import type { PersonCardProps } from './PersonCard';
import { useState } from 'react';

const meta: Meta<typeof PersonCard> = {
  title: 'Bookface/PersonCard',
  component: PersonCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onFollowClick: { action: 'clicked' },
    onProfileClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof PersonCard>;

export const Default: Story = {
  args: {
    name: 'Garry Tan',
    batch: 'S08',
    role: 'President & CEO',
    company: 'Y Combinator',
    isFollowing: false,
    avatarUrl: 'https://bookface-images.s3.amazonaws.com/avatars/18328c385ec56677f59f63568c2c8f82.jpg',
  },
};

export const Following: Story = {
  args: {
    name: 'Paul Graham',
    batch: 'S05',
    role: 'Founder',
    company: 'Y Combinator',
    isFollowing: true,
  },
};

export const WithCompanyAndRole: Story = {
  args: {
    name: 'Jessica Livingston',
    batch: 'S05',
    role: 'Co-founder',
    company: 'Y Combinator',
  },
};

export const WithoutBatch: Story = {
  args: {
    name: 'Unknown Founder',
    company: 'Stealth Startup',
    role: 'CEO',
  },
};

export const WithoutAvatar: Story = {
  args: {
    name: 'Sam Altman',
    batch: 'W05',
    company: 'OpenAI',
    role: 'CEO',
  },
};

const InteractiveCard = (args: PersonCardProps) => {
  const [isFollowing, setIsFollowing] = useState(args.isFollowing || false);
  return (
    <PersonCard
      {...args}
      isFollowing={isFollowing}
      onFollowClick={() => setIsFollowing(!isFollowing)}
    />
  );
};

export const Interactive: Story = {
  render: (args) => <InteractiveCard {...args} />,
  args: {
    name: 'Michael Seibel',
    batch: 'W07',
    role: 'Managing Director',
    company: 'Y Combinator',
  },
};

export const PeopleList: Story = {
  render: () => (
    <div style={{ width: '320px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
      <div style={{ padding: '12px', borderBottom: '1px solid #e0e0e0', fontWeight: 600 }}>
        People to follow
      </div>
      <PersonCard
        name="Garry Tan"
        batch="S08"
        role="President & CEO"
        company="Y Combinator"
        avatarUrl="https://bookface-images.s3.amazonaws.com/avatars/18328c385ec56677f59f63568c2c8f82.jpg"
      />
      <PersonCard
        name="Paul Graham"
        batch="S05"
        role="Founder"
        company="Y Combinator"
        isFollowing={true}
      />
      <PersonCard
        name="Michael Seibel"
        batch="W07"
        role="Managing Director"
        company="Y Combinator"
      />
    </div>
  ),
};
