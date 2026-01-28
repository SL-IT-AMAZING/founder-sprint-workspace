import type { Meta, StoryFn } from '@storybook/react';
import { BatchBadge } from './BatchBadge';

export default {
  title: 'Bookface/BatchBadge',
  component: BatchBadge,
  argTypes: {
    batch: { control: 'text' },
    size: {
      control: { type: 'select', options: ['sm', 'md', 'lg'] },
    },
    variant: {
      control: { type: 'select', options: ['default', 'outline'] },
    },
  },
} as Meta<typeof BatchBadge>;

const Template: StoryFn<typeof BatchBadge> = (args) => <BatchBadge {...args} />;

export const Default = Template.bind({});
Default.args = {
  batch: 'W20',
};

export const AllBatches = () => (
  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
    <BatchBadge batch="W20" />
    <BatchBadge batch="S13" />
    <BatchBadge batch="W17" />
    <BatchBadge batch="S22" />
    <BatchBadge batch="W24" />
  </div>
);

export const AllSizes = () => (
  <div style={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
    <BatchBadge batch="W20" size="sm" />
    <BatchBadge batch="W20" size="md" />
    <BatchBadge batch="W20" size="lg" />
  </div>
);

export const OutlineVariant = () => (
  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
    <BatchBadge batch="W20" variant="outline" size="sm" />
    <BatchBadge batch="S22" variant="outline" size="md" />
    <BatchBadge batch="W24" variant="outline" size="lg" />
  </div>
);

export const InlineWithText = () => (
  <div style={{ fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
      <span style={{ fontWeight: 'bold', fontSize: '14px' }}>John Smith</span>
      <BatchBadge batch="W20" size="sm" />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Sarah Jones</span>
      <BatchBadge batch="S13" size="md" />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontWeight: 'bold', fontSize: '20px' }}>Michael Chen</span>
      <BatchBadge batch="W24" size="lg" />
    </div>
  </div>
);
