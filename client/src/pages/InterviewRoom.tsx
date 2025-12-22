import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  PhoneOff,
  Sun,
  Moon,
  Play,
  Code2,
  Users,
  FileText,
  PenTool,
  ListChecks,
  Terminal,
  Sparkles,
  StickyNote,
  Copy,
  Check,
  LogOut,
  Plus
} from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Editor from '@monaco-editor/react';
import 'tldraw/tldraw.css';
import { Whiteboard } from '@/components/Whiteboard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import {
  getSession,
  getQuestions,
  getCodeSuggestions,
  executeCode,
  saveCode,
  terminateSession,
  updateSession,
  Question,
  CodeSuggestion
} from '@/services/api';
import { toast } from 'sonner';

const LANGUAGES = [
  { value: 'python', label: 'Python', monacoId: 'python' },
  { value: 'javascript', label: 'JavaScript', monacoId: 'javascript' },
  { value: 'java', label: 'Java', monacoId: 'java' },
  { value: 'cpp', label: 'C++', monacoId: 'cpp' },
  { value: 'go', label: 'Go', monacoId: 'go' },
];

const LEVELS = [
  { value: 'junior', label: 'Junior' },
  { value: 'senior', label: 'Senior' },
];

const DEFAULT_CODE: Record<string, string> = {
  python: `# Welcome to DevInterview.io
# Write your solution below

def solution():
    # Your code here
    pass

# Example usage
if __name__ == "__main__":
    result = solution()
    print(result)
`,
  javascript: `// Welcome to DevInterview.io
// Write your solution below

function solution() {
    // Your code here
}

// Example usage
console.log(solution());
`,
  java: `// Welcome to DevInterview.io
// Write your solution below

public class Solution {
    public static void main(String[] args) {
        // Your code here
    }
}
`,
  cpp: `// Welcome to DevInterview.io
// Write your solution below

#include <iostream>
using namespace std;

int main() {
    // Your code here
    return 0;
}
`,
  go: `// Welcome to DevInterview.io
// Write your solution below

package main

import "fmt"

func main() {
    // Your code here
    fmt.Println("Hello, DevInterview!")
}
`,
};

export default function InterviewRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = (searchParams.get('role') || 'candidate') as 'interviewer' | 'candidate';
  const { user, isAuthenticated } = useAuth();

  // Theme
  const [isDark, setIsDark] = useState(true);

  // Timer
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();

  // Code
  const [code, setCode] = useState(DEFAULT_CODE.python);
  const [language, setLanguage] = useState('python');
  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState('');

  // Left panel
  const [leftTab, setLeftTab] = useState('question');
  const [questionLang, setQuestionLang] = useState('python');
  const [questionLevel, setQuestionLevel] = useState('junior');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // Custom Question
  const [customQuestionTitle, setCustomQuestionTitle] = useState('');
  const [customQuestionDesc, setCustomQuestionDesc] = useState('');

  // Right panel
  const [rightTab, setRightTab] = useState('console');
  const [suggestions, setSuggestions] = useState<CodeSuggestion[]>([]);
  const [adminNotes, setAdminNotes] = useState('');
  const [sessionScore, setSessionScore] = useState<string>('');
  const [copiedId, setCopiedId] = useState(false);

  // Fetch session data
  useEffect(() => {
    if (!sessionId) return;

    const fetchSession = async () => {
      try {
        const session = await getSession(sessionId);
        if (session) {
          if (session.notes) setAdminNotes(session.notes);
          if (session.score !== null && session.score !== undefined) setSessionScore(session.score.toString());
          if (session.language) setLanguage(session.language);
          // We could also set code if we saved it in the session, but currently we don't save code text in session model
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
        toast.error('Failed to load session details');
      }
    };

    fetchSession();
  }, [sessionId]);

  // Socket
  const userId = user?.id || localStorage.getItem('candidate_session') || 'guest';
  const userName = user?.name || localStorage.getItem('candidate_name') || 'Guest';

  const { isConnected, connectedUsers, emitCodeChange, emitCustomQuestion, emitExecutionResult } = useSocket({
    sessionId: sessionId || '',
    userId,
    userName,
    role,
    onCodeChange: (newCode, newLang) => {
      if (newCode !== code) {
        isRemoteUpdate.current = true;
        setCode(newCode);
      }
      if (newLang !== language) {
        isRemoteUpdate.current = true;
        setLanguage(newLang);
      }
    },
    onCustomQuestion: (data: any) => {
      if (data.question) {
        setSelectedQuestion(data.question);
        setLeftTab('question');
        toast.info('New question set by interviewer');
      }
    },
    onExecutionResult: (data: any) => {
      if (data.output || data.error) {
        setOutput(data.error ? `Error:\n${data.error}` : data.output);
        setRightTab('console');
      }
    }
  });

  // Timer effect
  useEffect(() => {
    // Function to update elapsed time
    const updateTimer = () => {
      if (!sessionId) return;
      getSession(sessionId).then(session => {
        if (session && session.date) {
          const start = new Date(session.date).getTime();
          const now = Date.now();
          const diff = Math.floor((now - start) / 1000);
          setElapsedTime(diff > 0 ? diff : 0);
        }
      });
    };

    // Initial update
    updateTimer();

    timerRef.current = setInterval(() => {
      // Instead of incrementing, we should recalculate to avoid drift and ensure sync
      // But fetching session every second is too much.
      // Let's just increment locally, but re-sync occasionally or just rely on start time.
      // Better: store startTime in state and calculate diff.
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId]);

  // Sync timer with session start time when session data is loaded
  useEffect(() => {
    if (!sessionId) return;
    getSession(sessionId).then(session => {
      if (session && session.date) {
        const start = new Date(session.date).getTime();
        const now = Date.now();
        const diff = Math.floor((now - start) / 1000);
        setElapsedTime(diff > 0 ? diff : 0);
      }
    });
  }, [sessionId]);

  // Theme effect
  useEffect(() => {
    document.documentElement.classList.toggle('light', !isDark);
  }, [isDark]);

  const isRemoteUpdate = useRef(false);

  // Auto-save and emit code changes
  useEffect(() => {
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      emitCodeChange(code, language);
      if (sessionId) {
        saveCode(sessionId, code, language);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [code, language, sessionId, emitCodeChange]);

  // AI suggestions (interviewer only)
  useEffect(() => {
    if (role !== 'interviewer' || code.length < 50) return;

    const timeout = setTimeout(async () => {
      const newSuggestions = await getCodeSuggestions(code, language);
      setSuggestions(newSuggestions);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [code, language, role]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (!code.trim() || code === DEFAULT_CODE[language]) {
      setCode(DEFAULT_CODE[newLang] || '');
    }
  };

  const handleRunCode = async () => {
    if (!['python', 'javascript'].includes(language)) {
      toast.error(`Execution not supported for ${language}. Only Python and JavaScript can run.`);
      return;
    }

    setIsExecuting(true);
    setOutput('Running...\n');
    setRightTab('console');

    try {
      const result = await executeCode(code, language);
      const outputText = result.error ? `Error:\n${result.error}` : result.output;
      setOutput(outputText);
      emitExecutionResult({ output: result.output, error: result.error });
    } catch (error) {
      const errorText = `Execution failed: ${error}`;
      setOutput(errorText);
      emitExecutionResult({ error: errorText });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleGenerateQuestions = async () => {
    setIsLoadingQuestions(true);
    try {
      const qs = await getQuestions(questionLang, questionLevel);
      setQuestions(qs);
      toast.success('Questions generated!');
    } catch (error) {
      toast.error('Failed to generate questions');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleSetCustomQuestion = () => {
    if (!customQuestionTitle.trim()) {
      toast.error('Please enter a question title');
      return;
    }

    const newQuestion: Question = {
      id: `custom-${Date.now()}`,
      title: customQuestionTitle,
      difficulty: 'medium', // Default
      category: 'Custom',
    };

    setSelectedQuestion(newQuestion);
    setLeftTab('question');
    emitCustomQuestion(newQuestion);
    toast.success('Custom question set!');
  };

  const handleTerminate = async () => {
    if (!confirm('Are you sure you want to terminate this session?')) return;

    try {
      if (sessionId) await terminateSession(sessionId);
      toast.success('Session terminated');
      navigate(role === 'interviewer' ? '/dashboard' : '/');
    } catch (error) {
      toast.error('Failed to terminate session');
    }
  };

  const handleLeave = () => {
    if (confirm('Are you sure you want to leave the session?')) {
      navigate(role === 'interviewer' ? '/dashboard' : '/');
    }
  };

  const handleSaveSession = async () => {
    if (!sessionId) return;
    try {
      await updateSession(sessionId, {
        notes: adminNotes,
        score: sessionScore ? parseInt(sessionScore) : undefined
      });
      toast.success('Session details saved');
    } catch (error) {
      toast.error('Failed to save session details');
    }
  };

  const handleCopySessionId = () => {
    navigator.clipboard.writeText(sessionId || '');
    setCopiedId(true);
    toast.success('Session ID copied!');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getDifficultyColor = (difficulty: Question['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'text-accent';
      case 'medium': return 'text-primary';
      case 'hard': return 'text-destructive';
    }
  };

  const getSuggestionIcon = (type: CodeSuggestion['type']) => {
    switch (type) {
      case 'error': return '🔴';
      case 'warning': return '🟡';
      case 'info': return '🔵';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            <span className="font-semibold">DevInterview.io</span>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {sessionId}
            </Badge>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopySessionId}>
              {copiedId ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-4">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Connected Users */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div className="flex -space-x-2">
              {connectedUsers.map((u) => (
                <div
                  key={u.id}
                  className="w-7 h-7 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-medium"
                  title={u.name}
                >
                  {u.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs text-muted-foreground">{connectedUsers.length} online</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDark(!isDark)}
            className="h-8 w-8"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLeave}
            className="gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            Leave
          </Button>

          {role === 'interviewer' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleTerminate}
              className="gap-1.5"
            >
              <PhoneOff className="w-4 h-4" />
              End Session
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Left Panel - Resources */}
          <Panel defaultSize={25} minSize={20} maxSize={40}>
            <div className="h-full flex flex-col border-r border-border bg-card/30">
              <Tabs value={leftTab} onValueChange={setLeftTab} className="flex-1 flex flex-col">
                <TabsList className={`mx-2 mt-2 grid w-auto ${role === 'interviewer' ? 'grid-cols-4' : 'grid-cols-2'}`}>
                  <TabsTrigger value="question" className="gap-1.5 text-xs">
                    <FileText className="w-3.5 h-3.5" />
                    Question
                  </TabsTrigger>
                  <TabsTrigger value="whiteboard" className="gap-1.5 text-xs">
                    <PenTool className="w-3.5 h-3.5" />
                    Whiteboard
                  </TabsTrigger>
                  {role === 'interviewer' && (
                    <>
                      <TabsTrigger value="questions" className="gap-1.5 text-xs">
                        <ListChecks className="w-3.5 h-3.5" />
                        Top 10
                      </TabsTrigger>
                      <TabsTrigger value="custom" className="gap-1.5 text-xs">
                        <Plus className="w-3.5 h-3.5" />
                        Custom
                      </TabsTrigger>
                    </>
                  )}
                </TabsList>

                <TabsContent value="question" className="flex-1 m-0 p-3 overflow-auto">
                  <ScrollArea className="h-full">
                    {selectedQuestion ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge className={getDifficultyColor(selectedQuestion.difficulty)}>
                            {selectedQuestion.difficulty}
                          </Badge>
                          <Badge variant="outline">{selectedQuestion.category}</Badge>
                        </div>
                        <h2 className="text-lg font-semibold">{selectedQuestion.title}</h2>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {selectedQuestion.id.startsWith('custom') ? selectedQuestion.title : `Solve the "${selectedQuestion.title}" problem using your preferred approach. Consider edge cases and optimize for time/space complexity.`}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedQuestion(null)}
                        >
                          Clear Selection
                        </Button>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                        <div>
                          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">No question selected</p>
                          <p className="text-xs mt-1">Go to "Top 10" or "Custom" tab to set a question</p>
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="whiteboard" className="flex-1 m-0 overflow-hidden">
                  <div className="h-full tldraw-container">
                    <Whiteboard />
                  </div>
                </TabsContent>

                {role === 'interviewer' && (
                  <>
                    <TabsContent value="questions" className="flex-1 m-0 p-3 overflow-auto">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Language</Label>
                            <Select value={questionLang} onValueChange={setQuestionLang}>
                              <SelectTrigger className="mt-1 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {LANGUAGES.map((l) => (
                                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Level</Label>
                            <Select value={questionLevel} onValueChange={setQuestionLevel}>
                              <SelectTrigger className="mt-1 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {LEVELS.map((l) => (
                                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={handleGenerateQuestions}
                          disabled={isLoadingQuestions}
                          className="w-full"
                        >
                          {isLoadingQuestions ? (
                            <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-1.5" />
                              Generate Questions
                            </>
                          )}
                        </Button>

                        <ScrollArea className="h-[calc(100%-120px)]">
                          <div className="space-y-2">
                            {questions.map((q, i) => (
                              <motion.div
                                key={q.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                              >
                                <Card
                                  className="cursor-pointer hover:border-primary/50 transition-colors"
                                  onClick={() => {
                                    setSelectedQuestion(q);
                                    setLeftTab('question');
                                    emitCustomQuestion(q);
                                  }}
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-muted-foreground">#{i + 1}</span>
                                      <Badge variant="outline" className={`text-xs ${getDifficultyColor(q.difficulty)}`}>
                                        {q.difficulty}
                                      </Badge>
                                    </div>
                                    <p className="text-sm font-medium">{q.title}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{q.category}</p>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </TabsContent>

                    <TabsContent value="custom" className="flex-1 m-0 p-3 overflow-auto">
                      <div className="space-y-4">
                        <div>
                          <Label>Question Title</Label>
                          <Input
                            value={customQuestionTitle}
                            onChange={(e) => setCustomQuestionTitle(e.target.value)}
                            placeholder="e.g. Design a URL Shortener"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Description (Optional)</Label>
                          <Textarea
                            value={customQuestionDesc}
                            onChange={(e) => setCustomQuestionDesc(e.target.value)}
                            placeholder="Enter problem details..."
                            className="mt-1 h-32"
                          />
                        </div>
                        <Button onClick={handleSetCustomQuestion} className="w-full">
                          Set Question
                        </Button>
                      </div>
                    </TabsContent>
                  </>
                )}
              </Tabs>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

          {/* Center Panel - Code Editor */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
              {/* Editor Toolbar */}
              <div className="h-12 border-b border-border bg-card/50 flex items-center justify-between px-3 shrink-0">
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-36 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  size="sm"
                  onClick={handleRunCode}
                  disabled={isExecuting || !['python', 'javascript'].includes(language)}
                  className="gap-1.5"
                >
                  {isExecuting ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Run Code
                </Button>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={LANGUAGES.find(l => l.value === language)?.monacoId || 'python'}
                  theme={isDark ? 'vs-dark' : 'light'}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', monospace",
                    padding: { top: 16 },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                  }}
                />
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

          {/* Right Panel - Output & Feedback */}
          <Panel defaultSize={25} minSize={20} maxSize={40}>
            <div className="h-full flex flex-col border-l border-border bg-card/30">
              <Tabs value={rightTab} onValueChange={setRightTab} className="flex-1 flex flex-col">
                <TabsList className={`mx-2 mt-2 grid w-auto ${role === 'interviewer' ? 'grid-cols-3' : 'grid-cols-1'}`}>
                  <TabsTrigger value="console" className="gap-1.5 text-xs">
                    <Terminal className="w-3.5 h-3.5" />
                    Console
                  </TabsTrigger>
                  {role === 'interviewer' && (
                    <>
                      <TabsTrigger value="ai" className="gap-1.5 text-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Hints
                      </TabsTrigger>
                      <TabsTrigger value="notes" className="gap-1.5 text-xs">
                        <StickyNote className="w-3.5 h-3.5" />
                        Notes
                      </TabsTrigger>
                    </>
                  )}
                </TabsList>

                <TabsContent value="console" className="flex-1 m-0 p-3 overflow-auto">
                  <div className="h-full rounded-lg bg-background/50 border border-border p-3 font-mono text-sm">
                    <ScrollArea className="h-full">
                      {output ? (
                        <pre className="whitespace-pre-wrap text-muted-foreground">{output}</pre>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          <div className="text-center">
                            <Terminal className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-xs">Run your code to see output</p>
                          </div>
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </TabsContent>

                {role === 'interviewer' && (
                  <>
                    <TabsContent value="ai" className="flex-1 m-0 p-3 overflow-auto">
                      <ScrollArea className="h-full">
                        <div className="space-y-2">
                          {suggestions.length > 0 ? (
                            suggestions.map((s, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                              >
                                <Card className="bg-background/50">
                                  <CardContent className="p-3">
                                    <div className="flex items-start gap-2">
                                      <span>{getSuggestionIcon(s.type)}</span>
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Line {s.line}</p>
                                        <p className="text-sm">{s.message}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))
                          ) : (
                            <div className="h-full flex items-center justify-center text-center text-muted-foreground py-8">
                              <div>
                                <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-xs">AI suggestions will appear as the candidate writes code</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="notes" className="flex-1 m-0 p-3 overflow-hidden">
                      <div className="h-full flex flex-col gap-4">
                        <div>
                          <Label className="text-xs mb-2">Interview Notes (Private)</Label>
                          <Textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Add your observations, feedback..."
                            className="resize-none font-mono text-sm h-32"
                          />
                        </div>
                        <div>
                          <Label className="text-xs mb-2">Score (0-100)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={sessionScore}
                            onChange={(e) => setSessionScore(e.target.value)}
                            placeholder="85"
                          />
                        </div>
                        <Button onClick={handleSaveSession} variant="secondary" className="mt-auto">
                          Save Session Details
                        </Button>
                      </div>
                    </TabsContent>
                  </>
                )}
              </Tabs>

              {/* Connected Users Footer */}
              <div className="h-14 border-t border-border px-3 flex items-center">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Connected:</span>
                  <div className="flex gap-2">
                    {connectedUsers.map((u) => (
                      <div key={u.id} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-accent" />
                        <span className="text-xs">{u.name}</span>
                        <Badge variant="outline" className="text-[10px] px-1 h-4">
                          {u.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
