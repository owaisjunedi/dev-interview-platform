import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App', () => {
    it('renders without crashing', () => {
        render(<App />);
        // Check for the main heading or title from the Landing page
        const elements = screen.getAllByText(/DevInterview.io/i);
        expect(elements.length).toBeGreaterThan(0);
        expect(elements[0]).toBeInTheDocument();

        // Check for parts of the heading to avoid whitespace/splitting issues
        expect(screen.getByText(/Conduct/i)).toBeInTheDocument();
        expect(screen.getByText(/Technical Interviews/i)).toBeInTheDocument();
    });
});
