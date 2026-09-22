import { useState, useEffect, useRef, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { interviewSimulationService, InterviewMessage } from '@/services/interviewSimulation.service';
import { documentsService } from '@/services/documents.service';
import { useSpeechRecognition, useSpeechSynthesis } from '@/hooks/useSpeech';
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
  Copy,
  RotateCcw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageSquare,
  Square,
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
    label: "Manager d'équipe",
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
  const [inputMode, setInputMode] = useState<'chat' | 'vocal'>('chat');
  const [autoPlayVoice, setAutoPlayVoice] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [lastSpokenId, setLastSpokenId] = useState<string | null>(null);

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

  // Speech Recognition (Voice to text)
  const {
    isSupported: isSpeechSupported,
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // Speech Synthesis (Text to speech)
  const {
    isSupported: isSynthesisSupported,
    isSpeaking,
    speak,
    stop: stopSpeaking,
  } = useSpeechSynthesis();

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
          'Impossible de démarrer la simulation. Vérifiez que la clé API Gemini est configurée.'
      );
    },
  });

  const sendMutation = useMutation({
    mutationFn: ({ sessionId, message }: { sessionId: string; message: string }) =>
      interviewSimulationService.sendMessage(sessionId, message),
    onSuccess: () => {
      setMessage('');
      resetTranscript();
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

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages, startMutation.isPending, sendMutation.isPending, interimTranscript]);

  // Reset when changing application
  useEffect(() => {
    setSessionId(null);
    setMessage('');
    setShowSessions(false);
    stopListening();
    stopSpeaking();
  }, [applicationId]);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px';
    }
  }, [message]);

  // Synchronize speech transcript into message state
  useEffect(() => {
    if (transcript) {
      setMessage(transcript);
    }
  }, [transcript]);

  // Auto-play recruiter voice when a new model message arrives (if enabled)
  useEffect(() => {
    if (!session?.messages || session.messages.length === 0) return;
    const latest = session.messages[session.messages.length - 1];

    if (latest.role === 'model' && latest.id !== lastSpokenId) {
      setLastSpokenId(latest.id);
      if (autoPlayVoice && isSynthesisSupported) {
        setCurrentlySpeakingId(latest.id);
        speak(latest.content, () => setCurrentlySpeakingId(null));
      }
    }
  }, [session?.messages, autoPlayVoice, lastSpokenId, isSynthesisSupported, speak]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, [stopListening, stopSpeaking]);

  const handleStart = () => {
    startMutation.mutate({
      applicationId,
      interviewerType: config.interviewerType as any,
      difficulty: config.difficulty as any,
      cvId: config.cvId,
      lmId: config.lmId,
    });
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalMsg = message.trim();
    if (!finalMsg || !sessionId || sendMutation.isPending) return;

    if (isListening) {
      stopListening();
    }
    stopSpeaking();
    sendMutation.mutate({ sessionId, message: finalMsg });
  };

  const handleToggleListening = () => {
    if (!isSpeechSupported) {
      toast.error("La reconnaissance vocale n'est pas supportée sur ce navigateur (utilisez Chrome, Edge ou Safari).");
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      stopSpeaking();
      startListening();
    }
  };

  const handlePlayMessageAudio = (msg: InterviewMessage) => {
    if (!isSynthesisSupported) {
      toast.error("La synthèse vocale n'est pas disponible sur votre appareil.");
      return;
    }

    if (isSpeaking && currentlySpeakingId === msg.id) {
      stopSpeaking();
      setCurrentlySpeakingId(null);
    } else {
      stopListening();
      setCurrentlySpeakingId(msg.id);
      speak(msg.content, () => setCurrentlySpeakingId(null));
    }
  };

  const handleSwitchInputMode = (mode: 'chat' | 'vocal') => {
    setInputMode(mode);
    if (mode === 'vocal') {
      setAutoPlayVoice(true);
      if (!isSpeechSupported) {
        toast.info("Votre navigateur ne supporte pas la dictée vocale directe, mais vous pouvez écouter les réponses.");
      }
    }
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
                Entraînez-vous à l'oral ou à l'écrit avec un recruteur virtuel adapté au poste.
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
                    const Icon = type.icon;
                    const isSelected = config.interviewerType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setConfig({ ...config, interviewerType: type.id })}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-150',
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20'
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
                            {isSelected && <Badge className="text-[10px] py-0 px-1 h-4">Sélectionné</Badge>}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                            {type.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Choix de la difficulté */}
              <div className="space-y-2.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  2. Niveau d'exigence
                </Label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
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
                  L'IA personnalisera ses questions selon vos documents et vous permet de répondre par écrit ou à la voix.
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

  // 2. ACTIVE SESSION STREAM VIEW
  return (
    <>
      <Card className="flex flex-col border-border/80 shadow-xs overflow-hidden w-full min-w-0">
        {/* Header with Mode Switcher & Audio Controls */}
        <CardHeader className="p-3 sm:px-5 sm:py-3 border-b border-border/40 flex-col sm:flex-row sm:items-center sm:justify-between gap-3 space-y-0">
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

          {/* Mode Switcher (Chat vs Vocal) & Actions */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-muted/70 p-0.5 rounded-lg border text-xs">
              <button
                type="button"
                onClick={() => handleSwitchInputMode('chat')}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all',
                  inputMode === 'chat'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Mode texte classique"
              >
                <MessageSquare className="h-3 w-3" />
                <span>Chat</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchInputMode('vocal')}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all',
                  inputMode === 'vocal'
                    ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Mode vocal avec transcription"
              >
                <Mic className="h-3 w-3" />
                <span>Vocal</span>
              </button>
            </div>

            {/* Auto Audio Reading Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8',
                autoPlayVoice ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                setAutoPlayVoice(!autoPlayVoice);
              }}
              title={autoPlayVoice ? 'Lecture vocale IA active (Cliquer pour couper)' : 'Activer la voix de l\'IA'}
            >
              {autoPlayVoice ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </Button>

            {/* Expand & Leave */}
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
              onClick={() => {
                stopSpeaking();
                stopListening();
                setSessionId(null);
              }}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Quitter
            </Button>
          </div>
        </CardHeader>

        {/* Global Audio Speaking Status Bar */}
        {isSpeaking && (
          <div className="bg-primary/5 border-b border-primary/20 px-4 py-1.5 flex items-center justify-between text-xs text-primary animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span className="font-medium">Le recruteur s'exprime à l'oral...</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={stopSpeaking}
              className="h-6 px-2 text-[11px] text-primary hover:bg-primary/10"
            >
              <Square className="h-2.5 w-2.5 mr-1 fill-current" />
              Arrêter l'audio
            </Button>
          </div>
        )}

        {/* Messages Stream */}
        <div className="h-[440px] overflow-y-auto p-4 sm:p-5 space-y-4" ref={scrollRef}>
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
            const isMessageSpeaking = isSpeaking && currentlySpeakingId === msg.id;

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
                      'p-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap rounded-2xl shadow-2xs transition-all',
                      isUser
                        ? 'bg-primary text-primary-foreground rounded-tr-xs'
                        : isMessageSpeaking
                          ? 'bg-primary/10 border-2 border-primary text-foreground rounded-tl-xs'
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

                    {/* Copy button */}
                    <button
                      type="button"
                      onClick={() => copyMessage(msg.content)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground inline-flex items-center gap-0.5"
                      title="Copier le texte"
                    >
                      <Copy className="h-2.5 w-2.5" />
                    </button>

                    {/* Speaker Play button for recruiter questions */}
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handlePlayMessageAudio(msg)}
                        className={cn(
                          'inline-flex items-center gap-0.5 transition-colors',
                          isMessageSpeaking
                            ? 'text-primary font-bold'
                            : 'opacity-70 group-hover:opacity-100 hover:text-foreground'
                        )}
                        title={isMessageSpeaking ? 'Arrêter la lecture' : 'Écouter cette question'}
                      >
                        {isMessageSpeaking ? (
                          <>
                            <Square className="h-2.5 w-2.5 fill-current text-primary" />
                            <span className="text-[9px]">Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-2.5 w-2.5" />
                            <span className="text-[9px]">Écouter</span>
                          </>
                        )}
                      </button>
                    )}
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

          {/* Typing / IA thinking indicator */}
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

        {/* Dynamic Input Dock (Mode Chat vs Mode Vocal) */}
        <div className="p-3 sm:p-4 border-t border-border/40 bg-card">
          {inputMode === 'chat' ? (
            /* 1. Chat Mode: Textarea with Mic Dictation shortcut */
            <form onSubmit={handleSend} className="space-y-2">
              <div className="flex items-end gap-2">
                <div className="relative flex-1">
                  <Textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      isListening
                        ? 'Parlez maintenant, transcription en direct...'
                        : 'Rédigez votre réponse comme en réel...'
                    }
                    disabled={sendMutation.isPending}
                    rows={1}
                    className={cn(
                      'min-h-[44px] max-h-[160px] resize-none text-xs sm:text-sm py-2.5 pr-10 rounded-xl border-border/80 focus-visible:ring-primary/30 transition-all',
                      isListening && 'border-primary ring-2 ring-primary/20 bg-primary/5'
                    )}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                  />

                  {/* Inline Dictation Mic Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleListening}
                    disabled={sendMutation.isPending}
                    className={cn(
                      'absolute right-1.5 bottom-1.5 h-8 w-8 rounded-lg transition-all',
                      isListening
                        ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    title={isListening ? 'Arrêter la dictée' : 'Dicter vocalement'}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Send Button */}
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

              {/* Bottom footer status */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                <span className="hidden sm:inline">
                  {isListening ? (
                    <span className="text-red-500 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      Enregistrement vocal en cours...
                    </span>
                  ) : (
                    <>Appuyez sur <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border">Entrée</kbd> pour répondre</>
                  )}
                </span>
                <span className="sm:hidden">{isListening ? 'Écoute en cours...' : 'Entrée pour envoyer'}</span>
                {wordCount > 0 && <span>{wordCount} mot(s)</span>}
              </div>
            </form>
          ) : (
            /* 2. Vocal Mode: Large Interactive Audio Dock with Live Transcription */
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* Prominent Microphone Control Button */}
                <button
                  type="button"
                  onClick={handleToggleListening}
                  disabled={sendMutation.isPending}
                  className={cn(
                    'h-16 w-16 sm:h-14 sm:w-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 flex-shrink-0 shadow-sm relative',
                    isListening
                      ? 'bg-red-500 text-white ring-4 ring-red-500/20 shadow-md scale-105'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-6 w-6 sm:h-5 sm:w-5 animate-pulse" />
                      <span className="text-[9px] font-semibold mt-0.5">Stop</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-6 w-6 sm:h-5 sm:w-5" />
                      <span className="text-[9px] font-semibold mt-0.5">Parler</span>
                    </>
                  )}
                </button>

                {/* Live Transcription Box */}
                <div className="min-w-0 flex-1 w-full bg-muted/40 border border-border/70 rounded-xl p-3 flex flex-col justify-between min-h-[64px]">
                  <div className="text-xs sm:text-sm text-foreground">
                    {message.trim() ? (
                      <span className="leading-relaxed whitespace-pre-wrap">{message}</span>
                    ) : isListening ? (
                      <span className="text-primary italic animate-pulse">Écoute active... parlez distinctement dans votre micro</span>
                    ) : (
                      <span className="text-muted-foreground italic">
                        Cliquez sur le microphone pour dicter votre réponse à l'oral
                      </span>
                    )}

                    {interimTranscript && (
                      <span className="text-muted-foreground/70 italic ml-1">{interimTranscript}</span>
                    )}
                  </div>

                  {/* Waveform indicator when speaking */}
                  {isListening && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-[10px] text-red-500 font-medium mr-2">Audio capturé :</span>
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <span
                          key={i}
                          className="w-1 bg-red-500 rounded-full animate-pulse"
                          style={{
                            height: `${(i % 3) * 6 + 6}px`,
                            animationDelay: `${i * 120}ms`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Actions (Reset & Send) */}
                <div className="flex sm:flex-col items-center gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={sendMutation.isPending || !message.trim()}
                    className="h-10 sm:h-9 flex-1 sm:flex-none px-4 text-xs font-semibold shadow-xs"
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    ) : (
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Envoyer
                  </Button>
                  {message.trim() && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        resetTranscript();
                        setMessage('');
                      }}
                      className="h-8 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      Effacer
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Modal Fullscreen with Full Voice & Text capability */}
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
                placeholder="Rédigez ou dictez votre réponse..."
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
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleToggleListening}
                className={cn('h-11 w-11 rounded-xl shrink-0', isListening && 'bg-red-500 text-white')}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
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
