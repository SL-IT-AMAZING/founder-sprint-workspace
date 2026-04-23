import type { Meta, StoryObj } from '@storybook/react-vite'
import Footer from './Footer'

const meta = {
  title: 'Components/Footer',
  component: Footer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Footer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <Footer />,
}

export const WithPageContent: Story = {
  render: () => (
    <div>
      <div style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>Page Content Above Footer</h1>
        <p>
          This demonstrates how the footer looks with page content above it.
          The footer contains navigation links, newsletter subscription form,
          and social media links.
        </p>
      </div>
      <Footer />
    </div>
  ),
}

export const FullPage: Story = {
  render: () => (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>Full Page Layout</h1>
        <p>
          This shows the footer in a full-page context where it naturally
          sits at the bottom of the viewport.
        </p>
      </div>
      <Footer />
    </div>
  ),
}
