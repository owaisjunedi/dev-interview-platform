import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Users, Zap, ChevronRight, LogIn, UserPlus, Hash, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { joinSession } from '@/services/api';
import { toast } from 'sonner';

const features = [
  {
    icon: Code2,
    title: 'Live Code Editor',
    description: 'Monaco-powered editor with syntax highlighting for 5+ languages',
  },
  {
    icon: Users,
    title: 'Real-time Collaboration',
    description: 'See code changes instantly with WebSocket synchronization',
  },
  {
    icon: Zap,
    title: 'Interactive Whiteboard',
    description: 'Sketch algorithms and explain your approach visually',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { login, signup, isLoading } = useAuth();

  const [selectedRole, setSelectedRole] = useState<'interviewer' | 'candidate' | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (authMode === 'login') {
        await login(email, password);
        toast.success('Welcome back!');
      } else {
        await signup(email, password, name);
        toast.success('Account created successfully!');
      }
      navigate('/dashboard');
    } catch (error) {
      toast.error(authMode === 'login' ? 'Invalid credentials' : 'Signup failed');
    }
  };

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId.trim() || !candidateName.trim()) {
      toast.error('Please enter both session ID and your name');
      return;
    }

    setIsJoining(true);
    try {
      await joinSession(sessionId, candidateName);
      localStorage.setItem('candidate_name', candidateName);
      localStorage.setItem('candidate_session', sessionId);
      toast.success('Joining session...');
      navigate(`/room/${sessionId}?role=candidate`);
    } catch (error) {
      toast.error('Invalid session ID. Please check with your interviewer.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleBack = () => {
    setSelectedRole(null);
    setEmail('');
    setPassword('');
    setName('');
    setSessionId('');
    setCandidateName('');
  };

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 cyber-grid opacity-30" />

      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '1s' }} />

      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Code2 className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-semibold tracking-tight">DevInterview.io</span>
          </motion.div>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Hero Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                  Conduct
                  <span className="text-gradient"> Technical Interviews </span>
                  Like a Pro
                </h1>

                <p className="text-lg text-muted-foreground max-w-lg">
                  Real-time code collaboration, interactive whiteboard, and comprehensive
                  interview tools in one seamless platform.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right: Role Selection or Auth Forms */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              <AnimatePresence mode="wait">
                {!selectedRole ? (
                  /* Role Selection */
                  <motion.div
                    key="role-selection"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-semibold mb-2">Get Started</h2>
                      <p className="text-muted-foreground">Select your role to continue</p>
                    </div>

                    <Card
                      className="glass-panel glow-border cursor-pointer hover:border-primary/50 transition-all hover:scale-[1.02]"
                      onClick={() => setSelectedRole('interviewer')}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <LogIn className="w-5 h-5 text-primary" />
                          I'm an Interviewer
                        </CardTitle>
                        <CardDescription>
                          Login or create an account to host and manage interviews
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button className="w-full" variant="default">
                          Continue as Interviewer
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </CardContent>
                    </Card>

                    <Card
                      className="glass-panel border-accent/30 cursor-pointer hover:border-accent/50 transition-all hover:scale-[1.02]"
                      onClick={() => setSelectedRole('candidate')}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <UserPlus className="w-5 h-5 text-accent" />
                          I'm a Candidate
                        </CardTitle>
                        <CardDescription>
                          Join an interview session with your session ID
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button className="w-full" variant="outline">
                          Continue as Candidate
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : selectedRole === 'interviewer' ? (
                  /* Interviewer Auth Form */
                  <motion.div
                    key="interviewer-form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="glass-panel glow-border">
                      <CardHeader>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleBack}
                          className="w-fit -ml-2 mb-2"
                        >
                          <ArrowLeft className="w-4 h-4 mr-1" />
                          Back
                        </Button>
                        <CardTitle className="flex items-center gap-2">
                          <LogIn className="w-5 h-5 text-primary" />
                          Interviewer Access
                        </CardTitle>
                        <CardDescription>
                          Login or create an account to manage interviews
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as 'login' | 'signup')}>
                          <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="signup">Sign Up</TabsTrigger>
                          </TabsList>

                          <form onSubmit={handleAuth} className="space-y-4">
                            <AnimatePresence mode="wait">
                              {authMode === 'signup' && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                >
                                  <Label htmlFor="name">Full Name</Label>
                                  <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Alex Thompson"
                                    className="mt-1"
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <div>
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <Label htmlFor="password">Password</Label>
                              <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="mt-1"
                              />
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                              {isLoading ? (
                                <span className="flex items-center gap-2">
                                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                                  Processing...
                                </span>
                              ) : (
                                <>
                                  {authMode === 'login' ? 'Login' : 'Create Account'}
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </>
                              )}
                            </Button>
                          </form>
                        </Tabs>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  /* Candidate Join Form */
                  <motion.div
                    key="candidate-form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="glass-panel border-accent/30">
                      <CardHeader>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleBack}
                          className="w-fit -ml-2 mb-2"
                        >
                          <ArrowLeft className="w-4 h-4 mr-1" />
                          Back
                        </Button>
                        <CardTitle className="flex items-center gap-2">
                          <UserPlus className="w-5 h-5 text-accent" />
                          Join as Candidate
                        </CardTitle>
                        <CardDescription>
                          Enter the session ID shared by your interviewer
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleJoinSession} className="space-y-4">
                          <div>
                            <Label htmlFor="candidateName">Your Name</Label>
                            <Input
                              id="candidateName"
                              value={candidateName}
                              onChange={(e) => setCandidateName(e.target.value)}
                              placeholder="John Doe"
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor="sessionId">Session ID</Label>
                            <div className="relative mt-1">
                              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="sessionId"
                                value={sessionId}
                                onChange={(e) => setSessionId(e.target.value)}
                                placeholder="Enter session ID from interviewer"
                                className="pl-9"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Ask your interviewer for the session ID to join
                            </p>
                          </div>

                          <Button
                            type="submit"
                            variant="outline"
                            className="w-full border-accent/50 hover:bg-accent hover:text-accent-foreground"
                            disabled={isJoining}
                          >
                            {isJoining ? (
                              <span className="flex items-center gap-2">
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                                Joining...
                              </span>
                            ) : (
                              <>
                                Join Session
                                <ArrowRight className="w-4 h-4 ml-1" />
                              </>
                            )}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="container mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} DevInterview.io — Built for technical excellence</p>
        </footer>
      </div>
    </div>
  );
}
