import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Calendar,
  Clock,
  Users,
  BarChart3,
  LogOut,
  ChevronRight,
  Trophy,
  TrendingUp,
  Code2,
  Search,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { getSessions, getStats, createSession, deleteSession, Session } from '@/services/api';
import { toast } from 'sonner';

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getScoreBadge = (score: number | null) => {
  if (score === null) return <Badge variant="outline">Pending</Badge>;
  if (score >= 85) return <Badge className="bg-accent text-accent-foreground">{score}%</Badge>;
  if (score >= 70) return <Badge className="bg-primary text-primary-foreground">{score}%</Badge>;
  return <Badge variant="secondary">{score}%</Badge>;
};

const getStatusBadge = (status: Session['status']) => {
  switch (status) {
    case 'completed':
      return <Badge variant="outline" className="border-accent/50 text-accent">Completed</Badge>;
    case 'in-progress':
      return <Badge className="bg-primary text-primary-foreground animate-pulse">In Progress</Badge>;
    case 'scheduled':
      return <Badge variant="secondary">Scheduled</Badge>;
    default:
      return null;
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState({ totalInterviews: 0, avgScore: 0, thisMonth: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New session form
  const [newSession, setNewSession] = useState({
    candidateName: '',
    candidateEmail: '',
    language: 'python',
    date: new Date().toISOString().slice(0, 16),
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    const loadData = async () => {
      try {
        const [sessionsData, statsData] = await Promise.all([getSessions(), getStats()]);
        setSessions(sessionsData);
        setStats(statsData);
      } catch (error) {
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, navigate]);

  const handleCreateSession = async () => {
    try {
      const session = await createSession(newSession);
      toast.success('Session created! Share the ID with your candidate.');
      setIsCreateOpen(false);
      navigate(`/room/${session.id}?role=interviewer`);
    } catch (error) {
      toast.error('Failed to create session');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) return;

    try {
      await deleteSession(id);
      setSessions(sessions.filter(s => s.id !== id));
      toast.success('Session deleted');
    } catch (error) {
      toast.error('Failed to delete session');
    }
  };

  const filteredSessions = sessions.filter(
    (s) =>
      s.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Code2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">DevInterview.io</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-3 gap-6"
        >
          <Card className="glass-panel">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Interviews</p>
                  <p className="text-3xl font-bold">{stats.totalInterviews}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-3xl font-bold">{stats.avgScore}%</p>
                </div>
                <div className="p-3 rounded-xl bg-accent/10">
                  <Trophy className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-3xl font-bold">{stats.thisMonth}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sessions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-panel">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Interview History
                </CardTitle>
                <CardDescription>
                  Manage and review your interview sessions
                </CardDescription>
              </div>

              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="shadow-glow">
                    <Plus className="w-4 h-4 mr-2" />
                    New Session
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-panel">
                  <DialogHeader>
                    <DialogTitle>Create Interview Session</DialogTitle>
                    <DialogDescription>
                      Set up a new coding interview session
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="candidateName">Candidate Name</Label>
                      <Input
                        id="candidateName"
                        value={newSession.candidateName}
                        onChange={(e) => setNewSession({ ...newSession, candidateName: e.target.value })}
                        placeholder="John Doe"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="candidateEmail">Candidate Email</Label>
                      <Input
                        id="candidateEmail"
                        type="email"
                        value={newSession.candidateEmail}
                        onChange={(e) => setNewSession({ ...newSession, candidateEmail: e.target.value })}
                        placeholder="john@example.com"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="language">Primary Language</Label>
                      <Select
                        value={newSession.language}
                        onValueChange={(v) => setNewSession({ ...newSession, language: v })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="python">Python</SelectItem>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="java">Java</SelectItem>
                          <SelectItem value="cpp">C++</SelectItem>
                          <SelectItem value="go">Go</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="date">Scheduled Date</Label>
                      <Input
                        id="date"
                        type="datetime-local"
                        value={newSession.date}
                        onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <Button onClick={handleCreateSession} className="w-full mt-4">
                      Create & Start Session
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent>
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or session ID..."
                  className="pl-9"
                />
              </div>

              {/* Table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Session ID</TableHead>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.map((session, index) => (
                      <motion.tr
                        key={session.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group hover:bg-muted/20 transition-colors"
                      >
                        <TableCell className="font-mono text-sm text-primary">
                          {session.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{session.candidateName}</p>
                            <p className="text-xs text-muted-foreground">{session.candidateEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            {formatDate(session.date)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            {session.duration > 0 ? `${session.duration} min` : '—'}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(session.status)}</TableCell>
                        <TableCell>{getScoreBadge(session.score)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/room/${session.id}?role=interviewer`)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {session.status === 'completed' ? 'Review' : 'Enter'}
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteSession(session.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
