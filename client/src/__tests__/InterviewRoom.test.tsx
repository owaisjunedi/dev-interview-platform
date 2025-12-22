import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import InterviewRoom from '../pages/InterviewRoom';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('@/hooks/useSocket', () => ({
    useSocket: () => ({
        isConnected: true,
        connectedUsers: [],
        emitCodeChange: vi.fn(),
        emitCursorMove: vi.fn(),
        emitWhiteboardUpdate: vi.fn(),
        emitCustomQuestion: vi.fn(),
        emitExecutionResult: vi.fn(),
    }),
}));

vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: '1', name: 'Test User' },
        isAuthenticated: true,
    }),
}));

vi.mock('@/services/api', () => ({
    getSession: vi.fn().mockResolvedValue({
        id: '123',
        candidateName: 'John Doe',
        status: 'scheduled',
        language: 'python'
    }),
    getQuestions: vi.fn().mockResolvedValue([]),
    getCodeSuggestions: vi.fn().mockResolvedValue([]),
}));

describe('InterviewRoom', () => {
    it('renders the interview room', async () => {
        render(
            <BrowserRouter>
                <InterviewRoom />
            </BrowserRouter>
        );

        // Check for main elements
        expect(screen.getByText('DevInterview.io')).toBeInTheDocument();
        expect(screen.getByText('Run Code')).toBeInTheDocument();
    });
});
