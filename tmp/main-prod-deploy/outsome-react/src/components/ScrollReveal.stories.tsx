import type { Meta, StoryObj } from '@storybook/react-vite'
import ScrollReveal from './ScrollReveal'

const SampleCard = ({ title }: { title: string }) => (
  <div
    style={{
      padding: '40px',
      background: '#f5f5f5',
      borderRadius: '12px',
      textAlign: 'center',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    }}
  >
    <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{title}</h3>
    <p style={{ margin: '16px 0 0', color: '#666' }}>
      This content reveals on scroll
    </p>
  </div>
)

const meta = {
  title: 'Components/ScrollReveal',
  component: ScrollReveal,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    y: {
      control: { type: 'range', min: 0, max: 200, step: 8 },
      description: 'Initial Y offset in pixels',
    },
    duration: {
      control: { type: 'range', min: 0.1, max: 2, step: 0.1 },
      description: 'Animation duration in seconds',
    },
    delay: {
      control: { type: 'range', min: 0, max: 1, step: 0.1 },
      description: 'Animation delay in seconds',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof ScrollReveal>

export default meta

export const Default: StoryObj = {
  render: () => (
    <div style={{ padding: '100vh 40px 200px' }}>
      <p style={{ textAlign: 'center', marginBottom: '100px' }}>
        Scroll down to see the reveal animation
      </p>
      <ScrollReveal y={48} duration={0.6} delay={0}>
        <SampleCard title="Revealed Content" />
      </ScrollReveal>
    </div>
  ),
}

export const LargeOffset: StoryObj = {
  render: () => (
    <div style={{ padding: '100vh 40px 200px' }}>
      <p style={{ textAlign: 'center', marginBottom: '100px' }}>
        Scroll down - larger offset animation
      </p>
      <ScrollReveal y={100} duration={0.8} delay={0}>
        <SampleCard title="Large Y Offset" />
      </ScrollReveal>
    </div>
  ),
}

export const SlowAnimation: StoryObj = {
  render: () => (
    <div style={{ padding: '100vh 40px 200px' }}>
      <p style={{ textAlign: 'center', marginBottom: '100px' }}>
        Scroll down - slow reveal
      </p>
      <ScrollReveal y={48} duration={1.5} delay={0}>
        <SampleCard title="Slow Reveal" />
      </ScrollReveal>
    </div>
  ),
}

export const StaggeredReveal: StoryObj = {
  render: () => (
    <div style={{ padding: '100vh 40px 200px' }}>
      <p style={{ textAlign: 'center', marginBottom: '100px' }}>
        Scroll down - staggered animation
      </p>
      <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
        <ScrollReveal y={48} duration={0.6} delay={0}>
          <SampleCard title="First" />
        </ScrollReveal>
        <ScrollReveal y={48} duration={0.6} delay={0.15}>
          <SampleCard title="Second" />
        </ScrollReveal>
        <ScrollReveal y={48} duration={0.6} delay={0.3}>
          <SampleCard title="Third" />
        </ScrollReveal>
      </div>
    </div>
  ),
}

export const MultipleRows: StoryObj = {
  render: () => (
    <div style={{ padding: '50vh 40px 200px', maxWidth: '800px', margin: '0 auto' }}>
      <p style={{ textAlign: 'center', marginBottom: '100px' }}>
        Scroll to reveal multiple sections
      </p>
      <ScrollReveal y={48} duration={0.6}>
        <SampleCard title="Section One" />
      </ScrollReveal>
      <div style={{ height: '100px' }} />
      <ScrollReveal y={48} duration={0.6}>
        <SampleCard title="Section Two" />
      </ScrollReveal>
      <div style={{ height: '100px' }} />
      <ScrollReveal y={48} duration={0.6}>
        <SampleCard title="Section Three" />
      </ScrollReveal>
    </div>
  ),
}
