import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useSocket } from '../hooks/useSocket';
import { io } from 'socket.io-client';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
    io: vi.fn(() => ({
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        connected: false,
    })),
}));

describe('useSocket', () => {
    it('initializes socket connection', () => {
        const { result } = renderHook(() => useSocket({
            sessionId: '123',
            userId: 'user1',
            userName: 'Test User',
            role: 'interviewer'
        }));

        expect(io).toHaveBeenCalled();
        expect(result.current.isConnected).toBe(false); // Initially false until connect event
    });
});
