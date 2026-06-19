import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  it('renders the message and shapes', () => {
    render(<EmptyState message="Test message" />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
    // Expect 6 shapes
    const shapes = screen.getAllByRole('img', { hidden: true });
    // Since shapes are divs without role, query by class
    const shapeDivs = document.querySelectorAll('.shape');
    expect(shapeDivs.length).toBe(6);
  });
});
