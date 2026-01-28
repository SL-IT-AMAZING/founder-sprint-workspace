import type { Meta, StoryObj } from '@storybook/react-vite'
import { AnimatedArrowLink, AnimatedArrowLinkExternal } from './AnimatedArrowLink'

const meta = {
  title: 'Components/AnimatedArrowLink',
  component: AnimatedArrowLink,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    to: {
      control: 'text',
      description: 'Internal route path',
    },
    children: {
      control: 'text',
      description: 'Link text',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof AnimatedArrowLink>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    to: '/',
    children: 'Learn More',
  },
}

export const WithLongText: Story = {
  args: {
    to: '/features',
    children: 'Explore all features and capabilities',
  },
}

export const MultipleLinks: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <AnimatedArrowLink to="/">Home</AnimatedArrowLink>
      <AnimatedArrowLink to="/about">About Us</AnimatedArrowLink>
      <AnimatedArrowLink to="/features">Features</AnimatedArrowLink>
      <AnimatedArrowLink to="/pricing">View Pricing</AnimatedArrowLink>
    </div>
  ),
}

export const External: StoryObj = {
  render: () => (
    <AnimatedArrowLinkExternal href="https://example.com">
      Visit External Site
    </AnimatedArrowLinkExternal>
  ),
}

export const ExternalLinks: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <AnimatedArrowLinkExternal href="https://github.com">GitHub</AnimatedArrowLinkExternal>
      <AnimatedArrowLinkExternal href="https://twitter.com">Twitter</AnimatedArrowLinkExternal>
      <AnimatedArrowLinkExternal href="https://linkedin.com">LinkedIn</AnimatedArrowLinkExternal>
    </div>
  ),
}
