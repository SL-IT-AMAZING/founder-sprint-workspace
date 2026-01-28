import { useState } from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { FeedTabs, defaultTabs } from './FeedTabs';

export default {
  title: 'Bookface/FeedTabs',
  component: FeedTabs,
  argTypes: {
    onTabChange: { action: 'tabChanged' },
  },
} as Meta<typeof FeedTabs>;

const Template: StoryFn<typeof FeedTabs> = (args) => <FeedTabs {...args} />;

export const Default = Template.bind({});
Default.args = {
  tabs: defaultTabs,
  activeTab: 'top',
};

export const RecentSelected = Template.bind({});
RecentSelected.args = {
  tabs: defaultTabs,
  activeTab: 'recent',
};

export const WithCounts = Template.bind({});
WithCounts.args = {
  tabs: [
    { id: 'top', label: 'Top' },
    { id: 'recent', label: 'Recent', count: 5 },
    { id: 'general', label: 'General' },
    { id: 'recruiting', label: 'Recruiting', count: 12 },
  ],
  activeTab: 'recruiting',
};

export const CustomTabs = Template.bind({});
CustomTabs.args = {
  tabs: [
    { id: 'all', label: 'All Posts' },
    { id: 'following', label: 'Following' },
    { id: 'saved', label: 'Saved' },
  ],
  activeTab: 'all',
};

export const Interactive = () => {
  const [activeTab, setActiveTab] = useState('top');
  
  return (
    <FeedTabs
      tabs={defaultTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
};
