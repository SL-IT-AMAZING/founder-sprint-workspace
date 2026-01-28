import type { Meta, StoryObj } from '@storybook/react-vite'
import { AnimatedButton, AnimatedButtonExternal } from './AnimatedButton'

const meta = {
  title: 'Components/AnimatedButton',
  component: AnimatedButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['dark', 'light', 'light-2'],
      description: 'Button style variant',
    },
    size: {
      control: 'select',
      options: ['default', 'small'],
      description: 'Button size',
    },
    to: {
      control: 'text',
      description: 'Internal route path',
    },
    children: {
      control: 'text',
      description: 'Button label',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof AnimatedButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    to: '/',
    children: 'Get Started',
    variant: 'dark',
    size: 'default',
  },
}

export const Dark: Story = {
  args: {
    to: '/',
    children: 'Dark Button',
    variant: 'dark',
    size: 'default',
  },
}

export const Light: Story = {
  args: {
    to: '/',
    children: 'Light Button',
    variant: 'light',
    size: 'default',
  },
}

export const Light2: Story = {
  args: {
    to: '/',
    children: 'Light 2 Button',
    variant: 'light-2',
    size: 'default',
  },
}

export const Small: Story = {
  args: {
    to: '/',
    children: 'Small Button',
    variant: 'dark',
    size: 'small',
  },
}

export const SmallLight: Story = {
  args: {
    to: '/',
    children: 'Small Light',
    variant: 'light',
    size: 'small',
  },
}

export const AllVariants: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
      <AnimatedButton to="/" variant="dark" size="default">Dark Default</AnimatedButton>
      <AnimatedButton to="/" variant="light" size="default">Light Default</AnimatedButton>
      <AnimatedButton to="/" variant="light-2" size="default">Light-2 Default</AnimatedButton>
      <AnimatedButton to="/" variant="dark" size="small">Dark Small</AnimatedButton>
      <AnimatedButton to="/" variant="light" size="small">Light Small</AnimatedButton>
      <AnimatedButton to="/" variant="light-2" size="small">Light-2 Small</AnimatedButton>
    </div>
  ),
}

export const External: StoryObj = {
  render: () => (
    <AnimatedButtonExternal href="https://example.com" variant="dark" size="default">
      External Link
    </AnimatedButtonExternal>
  ),
}
