import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import App from './App';

it('renders without crashing', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
});
