import type { Meta, StoryObj } from '@storybook/react-vite'
import { Marquee } from './Marquee'

const SampleLogos = () => (
  <>
    <div style={{ padding: '0 40px', fontSize: '24px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
      Company One
    </div>
    <div style={{ padding: '0 40px', fontSize: '24px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
      Brand Two
    </div>
    <div style={{ padding: '0 40px', fontSize: '24px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
      Partner Three
    </div>
    <div style={{ padding: '0 40px', fontSize: '24px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
      Client Four
    </div>
    <div style={{ padding: '0 40px', fontSize: '24px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
      Sponsor Five
    </div>
  </>
)

const meta = {
  title: 'Components/Marquee',
  component: Marquee,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    duration: {
      control: { type: 'range', min: 10, max: 100, step: 5 },
      description: 'Animation duration in seconds',
    },
    reverse: {
      control: 'boolean',
      description: 'Reverse animation direction',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof Marquee>

export default meta

export const Default: StoryObj = {
  render: () => (
    <div style={{ overflow: 'hidden', width: '100%', padding: '40px 0' }}>
      <Marquee duration={40} reverse={false}>
        <SampleLogos />
      </Marquee>
    </div>
  ),
}

export const Fast: StoryObj = {
  render: () => (
    <div style={{ overflow: 'hidden', width: '100%', padding: '40px 0' }}>
      <Marquee duration={15} reverse={false}>
        <SampleLogos />
      </Marquee>
    </div>
  ),
}

export const Slow: StoryObj = {
  render: () => (
    <div style={{ overflow: 'hidden', width: '100%', padding: '40px 0' }}>
      <Marquee duration={80} reverse={false}>
        <SampleLogos />
      </Marquee>
    </div>
  ),
}

export const Reversed: StoryObj = {
  render: () => (
    <div style={{ overflow: 'hidden', width: '100%', padding: '40px 0' }}>
      <Marquee duration={40} reverse={true}>
        <SampleLogos />
      </Marquee>
    </div>
  ),
}

export const DoubleRow: StoryObj = {
  render: () => (
    <div style={{ overflow: 'hidden', width: '100%', padding: '40px 0' }}>
      <Marquee duration={40} reverse={false}>
        <SampleLogos />
      </Marquee>
      <div style={{ height: '20px' }} />
      <Marquee duration={35} reverse={true}>
        <SampleLogos />
      </Marquee>
    </div>
  ),
}
