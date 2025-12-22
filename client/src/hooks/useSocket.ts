import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

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
  onCodeChange?: (code: string, language: string) => void;
  onWhiteboardUpdate?: (data: unknown) => void;
  onCustomQuestion?: (data: unknown) => void;
  onExecutionResult?: (data: unknown) => void;
}

// Initialize socket outside component to prevent multiple connections
let socket: Socket | null = null;

export function useSocket({ sessionId, userId, userName, role, onCodeChange, onWhiteboardUpdate, onCustomQuestion, onExecutionResult }: UseSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const lastEmitRef = useRef<number>(0);

  useEffect(() => {
    if (!socket) {
      // Connect to the backend server (proxy handles /ws or direct URL)
      // Using relative path to leverage Vite proxy in dev and same-origin in prod
      socket = io({
        path: '/socket.io', // Standard path for python-socketio
        transports: ['websocket'],
        autoConnect: false,
      });
    }

    if (!socket.connected) {
      socket.connect();
    }

    function onConnect() {
      setIsConnected(true);
      console.log('[Socket] Connected');
      socket?.emit('join_room', { roomId: sessionId, user: { id: userId, name: userName, role } });
    }

    function onDisconnect() {
      setIsConnected(false);
      console.log('[Socket] Disconnected');
    }

    function onUserJoined(data: { user: ConnectedUser }) {
      console.log('[Socket] User joined:', data);
      // We rely on room_users for the list, but we can keep this for notifications if needed
      // setConnectedUsers(prev => {
      //   if (prev.find(u => u.id === data.user.id)) return prev;
      //   return [...prev, data.user];
      // });
    }

    function onUserLeft(data: { userId: string }) {
      console.log('[Socket] User left:', data);
      // We rely on room_users for the list
      // setConnectedUsers(prev => prev.filter(u => u.id !== data.userId));
    }

    function onRoomUsers(data: { users: ConnectedUser[] }) {
      console.log('[Socket] Room users update:', data);
      setConnectedUsers(data.users);
    }

    function onCodeUpdate(data: { code: string, language: string }) {
      if (onCodeChange) onCodeChange(data.code, data.language);
    }

    function onWhiteboardUpdateEvent(data: unknown) {
      if (onWhiteboardUpdate) onWhiteboardUpdate(data);
    }

    function onCustomQuestionEvent(data: unknown) {
      if (onCustomQuestion) onCustomQuestion(data);
    }

    function onExecutionResultEvent(data: unknown) {
      if (onExecutionResult) onExecutionResult(data);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('room_users', onRoomUsers);
    socket.on('code_change', onCodeUpdate);
    socket.on('whiteboard_update', onWhiteboardUpdateEvent);
    socket.on('custom_question', onCustomQuestionEvent);
    socket.on('execution_result', onExecutionResultEvent);

    // Initial join if already connected
    if (socket.connected) {
      onConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket?.off('connect', onConnect);
      socket?.off('disconnect', onDisconnect);
      socket?.off('user_joined', onUserJoined);
      socket?.off('user_left', onUserLeft);
      socket?.off('room_users', onRoomUsers);
      socket?.off('code_change', onCodeUpdate);
      socket?.off('whiteboard_update', onWhiteboardUpdateEvent);
      socket?.off('custom_question', onCustomQuestionEvent);
      socket?.off('execution_result', onExecutionResultEvent);

      // Only leave room, don't disconnect socket to keep it alive for other components if needed
      // But for this app, we can disconnect to be safe and clean
      // socket?.emit('leave_room', { roomId: sessionId, userId });
      // socket?.disconnect();
    };
  }, [sessionId, userId, userName, role, onCodeChange, onWhiteboardUpdate, onCustomQuestion, onExecutionResult]);

  const emit = useCallback((type: string, payload: unknown) => {
    if (!socket?.connected) return;
    // Fix lint error: Spread types may only be created from object types
    const message = { ...payload as object, roomId: sessionId, userId };
    socket.emit(type, message);
  }, [sessionId, userId]);

  const emitCodeChange = useCallback((code: string, language: string) => {
    emit('code_change', { code, language });
  }, [emit]);

  const emitCursorMove = useCallback((position: { line: number; column: number }) => {
    emit('cursor_move', position);
  }, [emit]);

  const emitWhiteboardUpdate = useCallback((data: unknown) => {
    emit('whiteboard_update', data);
  }, [emit]);

  const emitCustomQuestion = useCallback((question: unknown) => {
    emit('custom_question', { question });
  }, [emit]);

  const emitExecutionResult = useCallback((result: unknown) => {
    emit('execution_result', result);
  }, [emit]);

  return {
    isConnected,
    connectedUsers,
    emitCodeChange,
    emitCursorMove,
    emitWhiteboardUpdate,
    emitCustomQuestion,
    emitExecutionResult,
  };
}
