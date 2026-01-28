import type { Meta, StoryObj } from '@storybook/react-vite'
import Navbar from './Navbar'

const meta = {
  title: 'Components/Navbar',
  component: Navbar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Navbar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div style={{ minHeight: '200px' }}>
      <Navbar />
    </div>
  ),
}

export const WithContent: Story = {
  render: () => (
    <div>
      <Navbar />
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>Page Content</h1>
        <p>
          This demonstrates the navbar with page content below it.
          Hover over the navigation items to see the dropdown menus.
        </p>
      </div>
    </div>
  ),
}

export const OnDarkBackground: Story = {
  render: () => (
    <div style={{ background: '#1a1a1a', minHeight: '400px' }}>
      <Navbar />
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
        <h1>Dark Page</h1>
        <p>
          Testing navbar visibility on dark backgrounds.
        </p>
      </div>
    </div>
  ),
}

export const ScrollBehavior: Story = {
  render: () => (
    <div>
      <Navbar />
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>Scrollable Page</h1>
        {Array.from({ length: 20 }).map((_, i) => (
          <p key={i} style={{ marginBottom: '20px' }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
            tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
            veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
            commodo consequat.
          </p>
        ))}
      </div>
    </div>
  ),
}
