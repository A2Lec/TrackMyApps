import { useState, useEffect, useRef, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { interviewSimulationService, InterviewMessage } from '@/services/interviewSimulation.service';
import { documentsService } from '@/services/documents.service';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Send,
  Bot,
  User,
  Loader2,
  AlertTriangle,
  Maximize2,
  Minimize2,
  History,
  Trash2,
  Sparkles,
  Briefcase,
  Users,
  Code2,
  ShieldCheck,
  CheckCircle2,
  Copy,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface InterviewSimulationProps {
  applicationId: string;
}

const INTERVIEWER_TYPES = [
  {
    id: 'HR',
    label: 'Recruteur RH',
    desc: 'Soft skills, motivation et parcours',
    icon: Users,
    color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 'MANAGER',
    label: 'Manager d\'équipe',
    desc: 'Expérience, méthode et intégration',
    icon: Briefcase,
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  },
  {
    id: 'TECHNICAL',
    label: 'Lead Technique',
    desc: 'Compétences dures, architecture et code',
    icon: Code2,
    color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  {
    id: 'CTO',
    label: 'Directeur Technique',
    desc: 'Vision globale et choix stratégiques',
    icon: Sparkles,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
];

const DIFFICULTY_LEVELS = [
  { id: 'EASY', label: 'Bienveillant', desc: 'Idéal premier entraînement' },
  { id: 'MEDIUM', label: 'Standard', desc: 'Conditions réelles' },
  { id: 'HARD', label: 'Exigeant', desc: 'Questions pointues & relances' },
];

export function InterviewSimulation({ applicationId }: InterviewSimulationProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showSessions, setShowSessions] = useState(false);
  const [message, setMessage] = useState('');
  const [config, setConfig] = useState({
    interviewerType: 'HR',
    difficulty: 'MEDIUM',
    cvId: undefined as string | undefined,
    lmId: undefined as string | undefined,
  });
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch available documents
  const { data: cvDocuments } = useQuery({
    queryKey: ['documents', 'CV'],
    queryFn: () => documentsService.getAll('CV'),
  });

  const { data: lmDocuments } = useQuery({
    queryKey: ['documents', 'LETTRE_MOTIVATION'],
    queryFn: () => documentsService.getAll('LETTRE_MOTIVATION'),
  });

  // Fetch existing sessions for this application
  const { data: existingSessions, refetch: refetchSessions } = useQuery({
    queryKey: ['interviewSessions', applicationId],
    queryFn: () => interviewSimulationService.getSessionsByApplication(applicationId),
  });

  // Fetch session if ID exists
  const { data: session, refetch: refetchSession } = useQuery({
    queryKey: ['interviewSession', sessionId],
    queryFn: () => interviewSimulationService.getSession(sessionId!),
    enabled: !!sessionId,
  });

  const startMutation = useMutation({
    mutationFn: interviewSimulationService.startSession,
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setError(null);
      refetchSessions();
    },
    onError: (err: any) => {
      setError(
        err.response?.data?.message ||
          "Impossible de démarrer la simulation. Vérifiez que la clé API Gemini est configurée."
      );
    },
  });

  const sendMutation = useMutation({
    mutationFn: ({ sessionId, message }: { sessionId: string; message: string }) =>
      interviewSimulationService.sendMessage(sessionId, message),
    onSuccess: () => {
      setMessage('');
      refetchSession();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: interviewSimulationService.deleteSession,
    onSuccess: () => {
      refetchSessions();
      toast.success('Session supprimée');
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages, startMutation.isPending, sendMutation.isPending]);

  useEffect(() => {
    setSessionId(null);
    setMessage('');
    setShowSessions(false);
  }, [applicationId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px';
    }
  }, [message]);

  const handleStart = () => {
    startMutation.mutate({
      applicationId,
      interviewerType: config.interviewerType,
      difficulty: config.difficulty,
      cvId: config.cvId,
      lmId: config.lmId,
    });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !sessionId || sendMutation.isPending) return;
    sendMutation.mutate({ sessionId, message: message.trim() });
  };

  const wordCount = useMemo(() => {
    if (!message.trim()) return 0;
    return message.trim().split(/\s+/).length;
  }, [message]);

  const currentInterviewer = useMemo(() => {
    return INTERVIEWER_TYPES.find((t) => t.id === config.interviewerType) || INTERVIEWER_TYPES[0];
  }, [config.interviewerType]);

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Message copié dans le presse-papier');
  };

  // 1. CONFIGURATION VIEW
  if (!sessionId) {
    const validPastSessions = existingSessions?.filter((s) => (s._count?.messages || 0) > 1) || [];

    return (
      <Card className="border-border/80 shadow-xs overflow-hidden w-full min-w-0">
        <CardHeader className="p-4 sm:p-6 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  Simulateur d'Entretien IA
                </CardTitle>
                <Badge variant="outline" className="text-[11px] font-medium border-primary/30 text-primary">
                  Propulsé par Gemini
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Entraînez-vous avec un recruteur virtuel adapté au poste et à vos documents.
              </CardDescription>
            </div>

            {validPastSessions.length > 0 && (
              <Button
                variant={showSessions ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowSessions(!showSessions)}
                className="text-xs h-8.5 self-start sm:self-center flex-shrink-0"
              >
                <History className="h-3.5 w-3.5 mr-1.5" />
                {showSessions ? 'Nouvelle session' : `Historique (${validPastSessions.length})`}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {showSessions ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
                <span>Sélectionnez une session pour relire l'échange :</span>
                <span>{validPastSessions.length} session(s)</span>
              </div>

              <div className="space-y-2">
                {validPastSessions.map((sess) => (
                  <div
                    key={sess.id}
                    onClick={() => setSessionId(sess.id)}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 hover:border-primary/40 bg-card hover:bg-muted/30 transition-all cursor-pointer group"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {sess.title || 'Entretien sans titre'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                        <span>{new Date(sess.createdAt).toLocaleDateString('fr-FR')}</span>
                        <span>•</span>
                        <span>{sess._count?.messages || 0} messages</span>
                        <span>•</span>
                        <span className="capitalize">{sess.status === 'IN_PROGRESS' ? 'En cours' : 'Terminée'}</span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Supprimer cette session ?')) {
                          deleteMutation.mutate(sess.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Choix de l'interlocuteur */}
              <div className="space-y-2.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  1. Profil de l'interlocuteur
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {INTERVIEWER_TYPES.map((type) => {
                    const isSelected = config.interviewerType === type.id;
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setConfig({ ...config, interviewerType: type.id })}
                        className={cn(
                          'p-3.5 rounded-xl border text-left transition-all flex items-start gap-3',
                          isSelected
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                            : 'border-border/80 hover:border-border hover:bg-muted/30'
                        )}
                      >
                        <div
                          className={cn(
                            'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 border',
                            type.color
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            {type.label}
                            {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary ml-auto" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{type.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Difficulté */}
              <div className="space-y-2.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  2. Niveau d'exigence
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTY_LEVELS.map((lvl) => {
                    const isSelected = config.difficulty === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setConfig({ ...config, difficulty: lvl.id })}
                        className={cn(
                          'p-2.5 sm:p-3 rounded-xl border text-center transition-all',
                          isSelected
                            ? 'border-primary bg-primary/5 text-primary font-medium'
                            : 'border-border/80 text-muted-foreground hover:bg-muted/30'
                        )}
                      >
                        <div className="text-xs font-medium text-foreground">{lvl.label}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 truncate hidden sm:block">
                          {lvl.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Documents rattachés */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">CV rattaché (optionnel)</Label>
                  <Select
                    value={config.cvId || 'none'}
                    onValueChange={(val) => setConfig({ ...config, cvId: val === 'none' ? undefined : val })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Aucun CV sélectionné" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun (générique)</SelectItem>
                      {cvDocuments?.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id} className="text-xs">
                          {doc.name} {doc.isDefault && '★'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Lettre de motivation (optionnel)</Label>
                  <Select
                    value={config.lmId || 'none'}
                    onValueChange={(val) => setConfig({ ...config, lmId: val === 'none' ? undefined : val })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Aucune lettre sélectionnée" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune (générique)</SelectItem>
                      {lmDocuments?.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id} className="text-xs">
                          {doc.name} {doc.isDefault && '★'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Note d'information sobre */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="leading-relaxed">
                  L'IA analysera le descriptif de l'offre et vos documents pour vous poser des questions réalistes.
                </span>
              </div>

              {/* Bouton de démarrage */}
              <Button
                className="w-full h-10 text-xs font-semibold shadow-xs"
                onClick={handleStart}
                disabled={startMutation.isPending}
              >
                {startMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Préparation de votre entretien...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Commencer la simulation
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // 2. CHAT STREAM VIEW
  return (
    <>
      <Card className="flex flex-col border-border/80 shadow-xs overflow-hidden w-full min-w-0">
        {/* En-tête de chat moderne */}
        <CardHeader className="p-3.5 sm:px-5 sm:py-3 border-b border-border/40 flex-row items-center justify-between gap-3 space-y-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={cn(
                'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 border',
                currentInterviewer.color
              )}
            >
              <Bot className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
                <span>{currentInterviewer.label}</span>
                <span className="text-muted-foreground/60">•</span>
                <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0 h-4">
                  {DIFFICULTY_LEVELS.find((d) => d.id === config.difficulty)?.label || 'Standard'}
                </Badge>
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {session?.messages ? `${session.messages.length} échange(s)` : 'En cours'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setIsExpanded(true)}
              title="Agrandir en plein écran"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={() => setSessionId(null)}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Quitter
            </Button>
          </div>
        </CardHeader>

        {/* Zone de messages */}
        <div className="h-[460px] overflow-y-auto p-4 sm:p-5 space-y-4" ref={scrollRef}>
          {startMutation.isPending && (
            <div className="flex items-start gap-2.5 max-w-[85%]">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-muted/60 border border-border/40 p-3.5 text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>Le recruteur prépare la première question...</span>
              </div>
            </div>
          )}

          {session?.messages.map((msg: InterviewMessage) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={cn('flex items-start gap-2.5 w-full group', isUser ? 'justify-end' : 'justify-start')}
              >
                {!isUser && (
                  <div className="h-7 w-7 rounded-full bg-muted border border-border/60 flex items-center justify-center flex-shrink-0 text-foreground/80 mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}

                <div className={cn('relative max-w-[85%] sm:max-w-[78%]', isUser ? 'text-right' : 'text-left')}>
                  <div
                    className={cn(
                      'p-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap rounded-2xl shadow-2xs',
                      isUser
                        ? 'bg-primary text-primary-foreground rounded-tr-xs'
                        : 'bg-muted/70 text-foreground border border-border/40 rounded-tl-xs'
                    )}
                  >
                    {msg.content}
                  </div>

                  <div
                    className={cn(
                      'flex items-center gap-2 text-[10px] text-muted-foreground mt-1 px-1',
                      isUser ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <span>{isUser ? 'Vous' : currentInterviewer.label}</span>
                    <button
                      type="button"
                      onClick={() => copyMessage(msg.content)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground inline-flex items-center gap-0.5"
                    >
                      <Copy className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>

                {isUser && (
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground mt-0.5 text-xs font-semibold">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Indicateur de frappe fluide */}
          {sendMutation.isPending && (
            <div className="flex items-start gap-2.5 max-w-[85%]">
              <div className="h-7 w-7 rounded-full bg-muted border border-border/60 flex items-center justify-center flex-shrink-0 text-foreground/80">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="rounded-2xl rounded-tl-xs bg-muted/60 border border-border/40 px-4 py-3 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:300ms]" />
                <span className="text-[11px] text-muted-foreground ml-2 font-medium">Le recruteur formule sa réponse...</span>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* Barre de saisie épurée */}
        <div className="p-3 sm:p-4 border-t border-border/40 bg-card">
          <form onSubmit={handleSend} className="space-y-2">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Rédigez votre réponse comme en réel..."
                disabled={sendMutation.isPending}
                autoFocus
                rows={1}
                className="min-h-[44px] max-h-[160px] resize-none text-xs sm:text-sm py-2.5 rounded-xl border-border/80 focus-visible:ring-primary/30"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={sendMutation.isPending || !message.trim()}
                className="h-11 w-11 rounded-xl flex-shrink-0 shadow-xs"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <span className="hidden sm:inline">
                Appuyez sur <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border">Entrée</kbd> pour répondre
              </span>
              <span className="sm:hidden">Entrée pour envoyer</span>
              {wordCount > 0 && <span>{wordCount} mot(s)</span>}
            </div>
          </form>
        </div>
      </Card>

      {/* Modal Plein écran */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-[96vw] w-full h-[92vh] p-0 gap-0 flex flex-col rounded-2xl overflow-hidden">
          <DialogHeader className="p-4 border-b border-border/40 flex-row items-center justify-between space-y-0 shrink-0">
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              Simulation : {currentInterviewer.label} ({DIFFICULTY_LEVELS.find((d) => d.id === config.difficulty)?.label})
            </DialogTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsExpanded(false)}>
              <Minimize2 className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <ScrollArea className="flex-1 p-4 sm:p-6">
            <div className="space-y-4 max-w-3xl mx-auto">
              {session?.messages.map((msg: InterviewMessage) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={cn('flex items-start gap-2.5 w-full', isUser ? 'justify-end' : 'justify-start')}
                  >
                    {!isUser && (
                      <div className="h-7 w-7 rounded-full bg-muted border border-border/60 flex items-center justify-center flex-shrink-0 text-foreground/80 mt-0.5">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div className={cn('max-w-[80%]', isUser ? 'text-right' : 'text-left')}>
                      <div
                        className={cn(
                          'p-4 text-sm leading-relaxed whitespace-pre-wrap rounded-2xl',
                          isUser
                            ? 'bg-primary text-primary-foreground rounded-tr-xs'
                            : 'bg-muted/70 text-foreground border border-border/40 rounded-tl-xs'
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                    {isUser && (
                      <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground mt-0.5 text-xs font-semibold">
                        <User className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border/40 bg-card shrink-0">
            <form onSubmit={handleSend} className="max-w-3xl mx-auto flex items-end gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Rédigez votre réponse..."
                disabled={sendMutation.isPending}
                rows={1}
                className="min-h-[44px] max-h-[160px] resize-none text-sm py-2.5 rounded-xl border-border/80"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              <Button type="submit" size="icon" disabled={sendMutation.isPending || !message.trim()} className="h-11 w-11 rounded-xl shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
