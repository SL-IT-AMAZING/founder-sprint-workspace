import type { Meta, StoryObj } from '@storybook/react-vite'
import { RotatingEmblem } from './RotatingEmblem'

const meta = {
  title: 'Components/RotatingEmblem',
  component: RotatingEmblem,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1a1a1a' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof RotatingEmblem>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    className: '',
  },
  render: (args) => (
    <div style={{ width: '400px', height: '400px', position: 'relative' }}>
      <RotatingEmblem {...args} />
    </div>
  ),
}

export const Small: Story = {
  args: {
    className: '',
  },
  render: (args) => (
    <div style={{ width: '200px', height: '200px', position: 'relative' }}>
      <RotatingEmblem {...args} />
    </div>
  ),
}

export const Large: Story = {
  args: {
    className: '',
  },
  render: (args) => (
    <div style={{ width: '600px', height: '600px', position: 'relative' }}>
      <RotatingEmblem {...args} />
    </div>
  ),
}

export const OnLightBackground: Story = {
  parameters: {
    backgrounds: { default: 'light' },
  },
  args: {
    className: '',
  },
  render: (args) => (
    <div style={{ width: '400px', height: '400px', position: 'relative' }}>
      <RotatingEmblem {...args} />
    </div>
  ),
}
