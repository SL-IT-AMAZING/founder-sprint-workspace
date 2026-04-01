import type { Preview, ReactRenderer } from '@storybook/react-vite'
import { withRouter, reactRouterParameters } from 'storybook-addon-remix-react-router'

import '../src/styles/normalize.css'
import '../src/styles/webflow.css'
import '../src/styles/outsome.webflow.css'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    reactRouter: reactRouterParameters({
      routing: { path: '/' },
    }),
  },
  decorators: [withRouter],
};

export default preview;