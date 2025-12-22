import axios from 'axios';

// Configure axios to use the backend URL
// In dev, Vite proxy handles /api requests if configured, but here we might hit localhost:8000 directly
// or use relative paths if proxy is set up.
// Let's use relative paths assuming Vite proxy is working for /api or similar,
// BUT our backend is at localhost:8000 and we didn't set up /api proxy, only /ws.
// Let's set base URL to localhost:8000 for now.
const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('devinterview_token'); // Matches useAuth persistence
  // Note: useAuth uses 'devinterview-auth' key for zustand persist, which stores { state: { token: ... } }
  // We need to parse that or just rely on the token being passed or stored separately.
  // Let's check how useAuth stores it. It uses 'devinterview-auth'.
  // For simplicity, let's assume we can get it from localStorage or the caller passes it.
  // Actually, let's try to parse it.
  const authStorage = localStorage.getItem('devinterview-auth');
  if (authStorage) {
    try {
      const { state } = JSON.parse(authStorage);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch (e) {
      console.error("Failed to parse auth token", e);
    }
  }
  return config;
});

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'interviewer' | 'candidate';
}

export interface Session {
  id: string;
  candidateName: string;
  candidateEmail: string;
  date: string;
  duration: number; // in minutes
  score: number | null;
  status: 'scheduled' | 'in-progress' | 'completed';
  notes?: string;
  language?: string;
}

export interface Question {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export interface CodeSuggestion {
  line: number;
  type: 'error' | 'warning' | 'info';
  message: string;
}

// Auth APIs
export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
}

export async function signup(email: string, password: string, name: string): Promise<{ user: User; token: string }> {
  const response = await api.post('/auth/signup', { email, password, name });
  return response.data;
}

export async function logout(): Promise<void> {
  // No backend endpoint for logout usually with JWT
}

export async function getCurrentUser(): Promise<User | null> {
  // We don't have a /me endpoint, but we can rely on stored user
  // or implement one. For now, return null if no token.
  return null;
}

// Session APIs
export async function getSessions(): Promise<Session[]> {
  const response = await api.get('/sessions');
  return response.data;
}

export async function getSession(id: string): Promise<Session | null> {
  try {
    const response = await api.get(`/sessions/${id}`);
    return response.data;
  } catch (e) {
    return null;
  }
}

export async function createSession(data: Partial<Session>): Promise<Session> {
  const response = await api.post('/sessions', data);
  return response.data;
}

export async function updateSession(id: string, data: Partial<Session>): Promise<Session> {
  const response = await api.put(`/sessions/${id}`, data);
  return response.data;
}

export async function terminateSession(id: string): Promise<void> {
  await api.post(`/sessions/${id}/terminate`);
}

// Code APIs
export async function saveCode(sessionId: string, code: string, language: string): Promise<void> {
  // Backend doesn't have saveCode endpoint yet, but we can use updateSession or just log it
  // For now, we'll skip or implement a dummy
  console.log('Saving code...', sessionId);
}

export async function getCodeSuggestions(code: string, language: string): Promise<CodeSuggestion[]> {
  // Mock AI suggestions based on code analysis
  const suggestions: CodeSuggestion[] = [];

  const lines = code.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('var ')) {
      suggestions.push({
        line: index + 1,
        type: 'warning',
        message: "Consider using 'let' or 'const' instead of 'var'",
      });
    }
    if (line.includes('console.log')) {
      suggestions.push({
        line: index + 1,
        type: 'info',
        message: 'Remember to remove console.log before production',
      });
    }
    if (line.includes('== ') && !line.includes('===')) {
      suggestions.push({
        line: index + 1,
        type: 'warning',
        message: 'Use strict equality (===) instead of loose equality (==)',
      });
    }
    // Add a generic suggestion for testing if code is short
    if (code.length > 10 && index === 0) {
      suggestions.push({
        line: 1,
        type: 'info',
        message: 'AI Hint: Good start! Remember to handle edge cases.',
      });
    }
  });

  return suggestions;
}

// Questions APIs
export async function getQuestions(language: string, level: string): Promise<Question[]> {
  const response = await api.get('/resources/questions', { params: { language, level } });
  return response.data;
}

// Execution APIs
export async function executeCode(code: string, language: string): Promise<{ output: string; error?: string }> {
  const response = await api.post('/execute', { code, language });
  return response.data;
}

// Stats
export async function getStats(): Promise<{ totalInterviews: number; avgScore: number; thisMonth: number }> {
  const sessions = await getSessions();
  const completed = sessions.filter(s => s.status === 'completed');
  const scores = completed.filter(s => s.score !== null && s.score !== undefined).map(s => s.score as number);

  return {
    totalInterviews: completed.length,
    avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    thisMonth: sessions.filter(s => new Date(s.date).getMonth() === new Date().getMonth()).length,
  };
}

// Join Session (for candidates)
export async function joinSession(sessionId: string, name: string): Promise<{ session: Session; role: 'candidate' }> {
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error('Session not found. Please check the session ID.');
  }
  return { session, role: 'candidate' };
}
