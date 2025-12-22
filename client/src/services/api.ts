// Mock API Service - Replace with real API calls later
// All functions return Promises with 500ms delay

const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

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

// Mock Data
const mockUser: User = {
  id: '1',
  email: 'interviewer@devinterview.io',
  name: 'Alex Thompson',
  role: 'interviewer',
};

const mockSessions: Session[] = [
  {
    id: 'sess-001',
    candidateName: 'Sarah Chen',
    candidateEmail: 'sarah@example.com',
    date: '2024-01-15T10:00:00Z',
    duration: 45,
    score: 85,
    status: 'completed',
    language: 'Python',
  },
  {
    id: 'sess-002',
    candidateName: 'Marcus Johnson',
    candidateEmail: 'marcus@example.com',
    date: '2024-01-14T14:30:00Z',
    duration: 60,
    score: 72,
    status: 'completed',
    language: 'JavaScript',
  },
  {
    id: 'sess-003',
    candidateName: 'Emily Rodriguez',
    candidateEmail: 'emily@example.com',
    date: '2024-01-13T09:00:00Z',
    duration: 50,
    score: 91,
    status: 'completed',
    language: 'Java',
  },
  {
    id: 'sess-004',
    candidateName: 'David Kim',
    candidateEmail: 'david@example.com',
    date: '2024-01-12T16:00:00Z',
    duration: 55,
    score: 68,
    status: 'completed',
    language: 'C++',
  },
  {
    id: 'sess-005',
    candidateName: 'Lisa Wang',
    candidateEmail: 'lisa@example.com',
    date: '2024-01-16T11:00:00Z',
    duration: 0,
    score: null,
    status: 'scheduled',
    language: 'Python',
  },
];

const mockQuestions: Record<string, Question[]> = {
  'python-junior': [
    { id: 'q1', title: 'Reverse a String', difficulty: 'easy', category: 'Strings' },
    { id: 'q2', title: 'Find Duplicates in Array', difficulty: 'easy', category: 'Arrays' },
    { id: 'q3', title: 'Two Sum Problem', difficulty: 'easy', category: 'Arrays' },
    { id: 'q4', title: 'Palindrome Check', difficulty: 'easy', category: 'Strings' },
    { id: 'q5', title: 'FizzBuzz', difficulty: 'easy', category: 'Logic' },
    { id: 'q6', title: 'Fibonacci Sequence', difficulty: 'medium', category: 'Recursion' },
    { id: 'q7', title: 'Valid Parentheses', difficulty: 'medium', category: 'Stacks' },
    { id: 'q8', title: 'Merge Sorted Lists', difficulty: 'medium', category: 'Linked Lists' },
    { id: 'q9', title: 'Binary Search', difficulty: 'easy', category: 'Algorithms' },
    { id: 'q10', title: 'Count Words in String', difficulty: 'easy', category: 'Strings' },
  ],
  'python-senior': [
    { id: 'q11', title: 'LRU Cache Implementation', difficulty: 'hard', category: 'Design' },
    { id: 'q12', title: 'Graph Traversal (BFS/DFS)', difficulty: 'medium', category: 'Graphs' },
    { id: 'q13', title: 'Dynamic Programming - Knapsack', difficulty: 'hard', category: 'DP' },
    { id: 'q14', title: 'Serialize/Deserialize Binary Tree', difficulty: 'hard', category: 'Trees' },
    { id: 'q15', title: 'Rate Limiter Design', difficulty: 'hard', category: 'Design' },
    { id: 'q16', title: 'Concurrent Task Scheduler', difficulty: 'hard', category: 'Concurrency' },
    { id: 'q17', title: 'Trie Implementation', difficulty: 'medium', category: 'Trees' },
    { id: 'q18', title: 'Sliding Window Maximum', difficulty: 'hard', category: 'Arrays' },
    { id: 'q19', title: 'System Design - URL Shortener', difficulty: 'hard', category: 'Design' },
    { id: 'q20', title: 'Topological Sort', difficulty: 'medium', category: 'Graphs' },
  ],
  'javascript-junior': [
    { id: 'q21', title: 'Array Methods (map, filter, reduce)', difficulty: 'easy', category: 'Arrays' },
    { id: 'q22', title: 'Promise Basics', difficulty: 'medium', category: 'Async' },
    { id: 'q23', title: 'DOM Manipulation', difficulty: 'easy', category: 'DOM' },
    { id: 'q24', title: 'Closure Examples', difficulty: 'medium', category: 'Functions' },
    { id: 'q25', title: 'Event Handling', difficulty: 'easy', category: 'Events' },
    { id: 'q26', title: 'Object Destructuring', difficulty: 'easy', category: 'Objects' },
    { id: 'q27', title: 'Async/Await Basics', difficulty: 'medium', category: 'Async' },
    { id: 'q28', title: 'Array Flatten', difficulty: 'medium', category: 'Arrays' },
    { id: 'q29', title: 'Debounce Function', difficulty: 'medium', category: 'Functions' },
    { id: 'q30', title: 'Deep Clone Object', difficulty: 'medium', category: 'Objects' },
  ],
  'javascript-senior': [
    { id: 'q31', title: 'Implement Promise.all', difficulty: 'hard', category: 'Async' },
    { id: 'q32', title: 'Virtual DOM Implementation', difficulty: 'hard', category: 'DOM' },
    { id: 'q33', title: 'Event Emitter Pattern', difficulty: 'medium', category: 'Design' },
    { id: 'q34', title: 'Prototype Chain Deep Dive', difficulty: 'hard', category: 'Objects' },
    { id: 'q35', title: 'Memory Leak Detection', difficulty: 'hard', category: 'Performance' },
    { id: 'q36', title: 'Web Workers Usage', difficulty: 'medium', category: 'Concurrency' },
    { id: 'q37', title: 'Custom Hook Implementation', difficulty: 'medium', category: 'React' },
    { id: 'q38', title: 'State Management from Scratch', difficulty: 'hard', category: 'Design' },
    { id: 'q39', title: 'Tree Shaking Concepts', difficulty: 'medium', category: 'Build' },
    { id: 'q40', title: 'Service Worker Caching', difficulty: 'hard', category: 'PWA' },
  ],
  'java-junior': [
    { id: 'q41', title: 'OOP Basics', difficulty: 'easy', category: 'OOP' },
    { id: 'q42', title: 'Collections Framework', difficulty: 'medium', category: 'Collections' },
    { id: 'q43', title: 'String Manipulation', difficulty: 'easy', category: 'Strings' },
    { id: 'q44', title: 'Exception Handling', difficulty: 'easy', category: 'Exceptions' },
    { id: 'q45', title: 'Interface vs Abstract Class', difficulty: 'medium', category: 'OOP' },
    { id: 'q46', title: 'ArrayList vs LinkedList', difficulty: 'medium', category: 'Collections' },
    { id: 'q47', title: 'HashMap Implementation', difficulty: 'medium', category: 'Collections' },
    { id: 'q48', title: 'Multithreading Basics', difficulty: 'medium', category: 'Concurrency' },
    { id: 'q49', title: 'Generics Usage', difficulty: 'medium', category: 'Generics' },
    { id: 'q50', title: 'Stream API Basics', difficulty: 'medium', category: 'Streams' },
  ],
  'java-senior': [
    { id: 'q51', title: 'JVM Memory Model', difficulty: 'hard', category: 'JVM' },
    { id: 'q52', title: 'Garbage Collection Tuning', difficulty: 'hard', category: 'JVM' },
    { id: 'q53', title: 'Concurrent Collections', difficulty: 'hard', category: 'Concurrency' },
    { id: 'q54', title: 'Design Patterns Implementation', difficulty: 'medium', category: 'Design' },
    { id: 'q55', title: 'Spring Framework Internals', difficulty: 'hard', category: 'Spring' },
    { id: 'q56', title: 'Microservices Architecture', difficulty: 'hard', category: 'Architecture' },
    { id: 'q57', title: 'JDBC Connection Pooling', difficulty: 'medium', category: 'Database' },
    { id: 'q58', title: 'Lambda & Functional Interfaces', difficulty: 'medium', category: 'Functional' },
    { id: 'q59', title: 'CompletableFuture Usage', difficulty: 'hard', category: 'Async' },
    { id: 'q60', title: 'Custom Annotations', difficulty: 'medium', category: 'Reflection' },
  ],
};

// Auth APIs
export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  await delay();
  if (email && password) {
    return { user: mockUser, token: 'mock-jwt-token-xyz123' };
  }
  throw new Error('Invalid credentials');
}

export async function signup(email: string, password: string, name: string): Promise<{ user: User; token: string }> {
  await delay();
  return {
    user: { ...mockUser, email, name },
    token: 'mock-jwt-token-xyz123',
  };
}

export async function logout(): Promise<void> {
  await delay(300);
}

export async function getCurrentUser(): Promise<User | null> {
  await delay(300);
  const isLoggedIn = localStorage.getItem('devinterview_token');
  return isLoggedIn ? mockUser : null;
}

// Session APIs
export async function getSessions(): Promise<Session[]> {
  await delay();
  return mockSessions;
}

export async function getSession(id: string): Promise<Session | null> {
  await delay();
  return mockSessions.find(s => s.id === id) || null;
}

export async function createSession(data: Partial<Session>): Promise<Session> {
  await delay();
  const newSession: Session = {
    id: `sess-${Date.now()}`,
    candidateName: data.candidateName || 'New Candidate',
    candidateEmail: data.candidateEmail || 'candidate@example.com',
    date: data.date || new Date().toISOString(),
    duration: 0,
    score: null,
    status: 'scheduled',
    language: data.language || 'Python',
  };
  return newSession;
}

export async function updateSession(id: string, data: Partial<Session>): Promise<Session> {
  await delay();
  const session = mockSessions.find(s => s.id === id);
  if (!session) throw new Error('Session not found');
  return { ...session, ...data };
}

export async function terminateSession(id: string): Promise<void> {
  await delay();
}

// Code APIs
export async function saveCode(sessionId: string, code: string, language: string): Promise<void> {
  await delay(300);
  console.log('Code saved:', { sessionId, language, codeLength: code.length });
}

export async function getCodeSuggestions(code: string, language: string): Promise<CodeSuggestion[]> {
  await delay(800);
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
  });

  // Add some mock suggestions if code is substantial
  if (code.length > 100) {
    suggestions.push({
      line: Math.floor(lines.length / 2),
      type: 'info',
      message: 'Consider adding error handling for edge cases',
    });
  }

  return suggestions;
}

// Questions APIs
export async function getQuestions(language: string, level: string): Promise<Question[]> {
  await delay(600);
  const key = `${language.toLowerCase()}-${level.toLowerCase()}`;
  return mockQuestions[key] || mockQuestions['python-junior'];
}

// Execution APIs (Mock)
export async function executeCode(code: string, language: string): Promise<{ output: string; error?: string }> {
  await delay(1000);
  
  try {
    if (language === 'javascript') {
      // Safe-ish eval for demo purposes
      const logs: string[] = [];
      const mockConsole = {
        log: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
      };
      
      const wrappedCode = `
        (function(console) {
          ${code}
        })(mockConsole)
      `;
      
      try {
        // eslint-disable-next-line no-eval
        eval(wrappedCode.replace('mockConsole', JSON.stringify(mockConsole)));
        return { output: logs.join('\n') || 'Code executed successfully (no output)' };
      } catch (e) {
        return { output: '', error: String(e) };
      }
    }
    
    if (language === 'python') {
      // Check if Pyodide is available
      if (typeof (window as any).pyodide !== 'undefined') {
        try {
          const result = await (window as any).pyodide.runPythonAsync(code);
          return { output: String(result) || 'Code executed successfully' };
        } catch (e) {
          return { output: '', error: String(e) };
        }
      }
      return { output: '', error: 'Python runtime not loaded. In production, Pyodide will be available.' };
    }
    
    return { output: '', error: `Execution not supported for ${language}. Only Python and JavaScript can be run.` };
  } catch (e) {
    return { output: '', error: String(e) };
  }
}

// Stats
export async function getStats(): Promise<{ totalInterviews: number; avgScore: number; thisMonth: number }> {
  await delay();
  return {
    totalInterviews: mockSessions.filter(s => s.status === 'completed').length,
    avgScore: Math.round(mockSessions.filter(s => s.score).reduce((a, b) => a + (b.score || 0), 0) / mockSessions.filter(s => s.score).length),
    thisMonth: mockSessions.filter(s => new Date(s.date).getMonth() === new Date().getMonth()).length,
  };
}

// Join Session (for candidates)
export async function joinSession(sessionId: string, name: string): Promise<{ session: Session; role: 'candidate' }> {
  await delay();
  const session = mockSessions.find(s => s.id === sessionId);
  if (!session) {
    throw new Error('Session not found. Please check the session ID.');
  }
  return { session, role: 'candidate' };
}
