import { useCallback, useEffect, useRef, useState } from 'react';

interface SocketMessage {
  type: 'code-change' | 'cursor-move' | 'user-joined' | 'user-left' | 'whiteboard-update';
  payload: unknown;
  userId: string;
  timestamp: number;
}

interface ConnectedUser {
  id: string;
  name: string;
  role: 'interviewer' | 'candidate';
  isActive: boolean;
}

interface UseSocketOptions {
  sessionId: string;
  userId: string;
  userName: string;
  role: 'interviewer' | 'candidate';
}

export function useSocket({ sessionId, userId, userName, role }: UseSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const lastEmitRef = useRef<number>(0);

  useEffect(() => {
    // Mock connection
    console.log(`[Socket] Connecting to session: ${sessionId}`);
    
    const connectTimeout = setTimeout(() => {
      setIsConnected(true);
      console.log(`[Socket] Connected as ${role}: ${userName}`);
      
      // Simulate other users
      const mockUsers: ConnectedUser[] = [
        { id: userId, name: userName, role, isActive: true },
      ];
      
      if (role === 'interviewer') {
        mockUsers.push({
          id: 'candidate-1',
          name: 'John Doe',
          role: 'candidate',
          isActive: true,
        });
      } else {
        mockUsers.push({
          id: 'interviewer-1',
          name: 'Alex Thompson',
          role: 'interviewer',
          isActive: true,
        });
      }
      
      setConnectedUsers(mockUsers);
    }, 500);

    return () => {
      clearTimeout(connectTimeout);
      console.log(`[Socket] Disconnected from session: ${sessionId}`);
      setIsConnected(false);
    };
  }, [sessionId, userId, userName, role]);

  const emit = useCallback((type: SocketMessage['type'], payload: unknown) => {
    const now = Date.now();
    // Throttle emissions to avoid console spam
    if (now - lastEmitRef.current < 100) return;
    lastEmitRef.current = now;

    const message: SocketMessage = {
      type,
      payload,
      userId,
      timestamp: now,
    };

    console.log(`[Socket] Emitting ${type}:`, {
      ...message,
      payload: typeof payload === 'string' && payload.length > 50 
        ? `${payload.substring(0, 50)}...` 
        : payload,
    });
  }, [userId]);

  const emitCodeChange = useCallback((code: string, language: string) => {
    emit('code-change', { code, language });
  }, [emit]);

  const emitCursorMove = useCallback((position: { line: number; column: number }) => {
    emit('cursor-move', position);
  }, [emit]);

  const emitWhiteboardUpdate = useCallback((data: unknown) => {
    emit('whiteboard-update', data);
  }, [emit]);

  return {
    isConnected,
    connectedUsers,
    emitCodeChange,
    emitCursorMove,
    emitWhiteboardUpdate,
  };
}
