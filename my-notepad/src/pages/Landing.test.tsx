import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Landing from './Landing';

describe('Landing', () => {
  it('renders app name and tagline', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: 'Noted' })).toBeInTheDocument();
    expect(screen.getByText(/Never was so easy to do tasks/)).toBeInTheDocument();
    expect(screen.getByText(/Notes and tasks in one place/)).toBeInTheDocument();
  });

  it('has link to app', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
    const link = screen.getByRole('link', { name: /try noted|open app/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/app');
  });

  it('renders footer with author link', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
    const footerLink = screen.getByRole('link', { name: 'Lleïr' });
    expect(footerLink).toHaveAttribute('href', 'https://lleir.com');
  });
});
