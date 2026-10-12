import { useState, useEffect, useRef, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  interviewSimulationService,
  InterviewMessage,
  InterviewFeedback,
} from '@/services/interviewSimulation.service';
import { documentsService } from '@/services/documents.service';
import api from '@/services/api';
import { useSpeechRecognition, useSpeechSynthesis } from '@/hooks/useSpeech';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
  X,
  Award,
  CheckCircle2,
  Target,
  Star,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface InterviewSimulationProps {
  applicationId?: string;
  isFreePractice?: boolean;
  defaultTargetRole?: string;
  defaultContractType?: string;
  defaultJobDescription?: string;
  onClose?: () => void;
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

export function InterviewSimulation({
  applicationId,
  isFreePractice,
  defaultTargetRole,
  defaultContractType,
  defaultJobDescription,
}: InterviewSimulationProps) {
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showSessions, setShowSessions] = useState(false);
  const [message, setMessage] = useState('');
  const [inputMode, setInputMode] = useState<'chat' | 'vocal'>('chat');
  const [autoPlayVoice, setAutoPlayVoice] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [lastSpokenId, setLastSpokenId] = useState<string | null>(null);

  // TICK-301: Feedback & scoring state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // TICK-303: Save to question bank state
  const [showSaveQuestionDialog, setShowSaveQuestionDialog] = useState(false);
  const [questionToSave, setQuestionToSave] = useState<{
    question: string;
    answer: string;
    category: string;
  } | null>(null);

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
    speechRate,
    setSpeechRate,
    frenchVoices,
    activeVoice,
    selectedVoiceURI,
    setSelectedVoiceURI,
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

  // Fetch existing sessions for this application or user
  const { data: existingSessions, refetch: refetchSessions } = useQuery({
    queryKey: ['interviewSessions', applicationId || 'all-sessions'],
    queryFn: () =>
      applicationId
        ? interviewSimulationService.getSessionsByApplication(applicationId)
        : interviewSimulationService.getAllSessions(),
  });

  // Fetch session if ID exists
  const { data: session, refetch: refetchSession } = useQuery({
    queryKey: ['interviewSession', sessionId],
    queryFn: () => interviewSimulationService.getSession(sessionId!),
    enabled: !!sessionId,
  });

  // TICK-301: Extract parsed feedback if present
  const feedbackMessage = session?.messages.find((m) => m.role === 'feedback');
  const parsedFeedback = useMemo<InterviewFeedback | null>(() => {
    if (!feedbackMessage) return null;
    try {
      return JSON.parse(feedbackMessage.content);
    } catch {
      return null;
    }
  }, [feedbackMessage]);

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

  const completeMutation = useMutation({
    mutationFn: () => interviewSimulationService.completeSession(sessionId!),
    onSuccess: () => {
      refetchSession();
      refetchSessions();
      setShowFeedbackModal(true);
      toast.success("Bilan d'entretien généré avec succès !");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la clôture de la session');
    },
  });

  const saveQuestionMutation = useMutation({
    mutationFn: (data: { question: string; answer?: string; category: string }) =>
      api.post('/interview-prep', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-prep'] });
      setShowSaveQuestionDialog(false);
      toast.success('Question sauvegardée dans votre banque avec succès !');
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement de la question");
    },
  });

  const handleSaveToQuestionBank = (questionText: string, index: number) => {
    const nextMsg = session?.messages[index + 1];
    const candidateAnswer = nextMsg && nextMsg.role === 'user' ? nextMsg.content : '';

    const activeInterviewer = session?.interviewerType || config.interviewerType;
    let category = 'BEHAVIORAL';
    if (activeInterviewer === 'TECHNICAL' || activeInterviewer === 'CTO') {
      category = 'TECHNICAL';
    } else if (activeInterviewer === 'MANAGER') {
      category = 'SITUATIONAL';
    }

    setQuestionToSave({
      question: questionText,
      answer: candidateAnswer,
      category,
    });
    setShowSaveQuestionDialog(true);
  };

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
        speak(latest.content, {
          rate: speechRate,
          onEnd: () => setCurrentlySpeakingId(null),
        });
      }
    }
  }, [session?.messages, autoPlayVoice, lastSpokenId, isSynthesisSupported, speak, speechRate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, [stopListening, stopSpeaking]);

  const handleStart = () => {
    setError(null);
    startMutation.mutate({
      applicationId: applicationId || undefined,
      isFreePractice: !!isFreePractice,
      targetRole: defaultTargetRole,
      contractType: defaultContractType,
      jobDescription: defaultJobDescription,
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

  const handleStartVocal = () => {
    if (!isSpeechSupported) {
      toast.error("La reconnaissance vocale n'est pas supportée sur ce navigateur (utilisez Chrome, Edge ou Safari).");
      return;
    }
    stopSpeaking();
    resetTranscript();
    setMessage('');
    startListening();
  };

  const handleStopAndSendVocal = () => {
    const finalTranscript = stopListening();
    const textToSend = (finalTranscript || message).trim();

    if (!textToSend) {
      setMessage('');
      resetTranscript();
      toast.info("Aucune parole détectée. Appuyez sur le micro pour parler.");
      return;
    }

    if (sessionId) {
      stopSpeaking();
      sendMutation.mutate({ sessionId, message: textToSend });
      setMessage('');
      resetTranscript();
      toast.success("Réponse vocale transmise au recruteur !", { duration: 1500 });
    }
  };

  const handleCancelVocal = () => {
    stopListening();
    resetTranscript();
    setMessage('');
    toast.info("Enregistrement annulé");
  };

  const handleToggleListening = () => {
    if (inputMode === 'vocal') {
      if (isListening) {
        handleStopAndSendVocal();
      } else {
        handleStartVocal();
      }
    } else {
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
      speak(msg.content, {
        rate: speechRate,
        onEnd: () => setCurrentlySpeakingId(null),
      });
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
    const type = session?.interviewerType || config.interviewerType;
    return INTERVIEWER_TYPES.find((t) => t.id === type) || INTERVIEWER_TYPES[0];
  }, [session?.interviewerType, config.interviewerType]);

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
                        {sess.status === 'COMPLETED' ? (
                          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 py-0 h-4 flex items-center gap-1">
                            <Award className="h-2.5 w-2.5 text-amber-500" />
                            <span>Bilan dispo</span>
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">En cours</span>
                        )}
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
              {/* Inform before personal data (CV text, answers) leaves for the AI provider */}
              <p className="text-[11px] leading-snug text-muted-foreground text-center">
                Le poste, l'offre, le texte des documents sélectionnés et vos réponses sont envoyés à Google Gemini
                pour générer l'entretien, sans être utilisés pour entraîner ses modèles.{' '}
                <a href="/privacy-policy#ia" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                  En savoir plus
                </a>
              </p>
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

            {/* Terminer l'entretien & Obtenir mon bilan (TICK-301) */}
            <Button
              variant={parsedFeedback ? "outline" : "default"}
              size="sm"
              className={cn(
                "h-8 text-xs font-semibold px-2.5 gap-1.5 shadow-xs",
                parsedFeedback ? "border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20" : ""
              )}
              onClick={() => {
                if (parsedFeedback) {
                  setShowFeedbackModal(true);
                } else {
                  completeMutation.mutate();
                }
              }}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Analyse...</span>
                </>
              ) : parsedFeedback ? (
                <>
                  <Award className="h-3.5 w-3.5 text-amber-500" />
                  <span>Mon Bilan ({parsedFeedback.score}/100)</span>
                </>
              ) : (
                <>
                  <Award className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Terminer & Bilan</span>
                  <span className="sm:hidden">Bilan</span>
                </>
              )}
            </Button>

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
          <div className="bg-primary/5 border-b border-primary/20 px-4 py-2 flex items-center justify-between text-xs text-primary animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5">
              <div className="flex items-end gap-0.5 h-3.5">
                <span className="w-1 h-2 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1 h-3.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1 h-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                <span className="w-1 h-4 bg-primary rounded-full animate-bounce [animation-delay:450ms]" />
                <span className="w-1 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:200ms]" />
              </div>
              <span className="font-medium">
                Le recruteur s'exprime à l'oral ({speechRate}x)...
              </span>
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

          {session?.messages
            ?.filter((m: InterviewMessage) => m.role !== 'feedback')
            .map((msg: InterviewMessage, index: number) => {
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

                    {/* Sauvegarder dans ma banque (TICK-303) */}
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleSaveToQuestionBank(msg.content, index)}
                        className="opacity-70 group-hover:opacity-100 hover:text-amber-500 inline-flex items-center gap-1 transition-colors text-[9px] text-muted-foreground ml-1"
                        title="Sauvegarder cette question dans ma banque"
                      >
                        <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                        <span>Sauvegarder</span>
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
            /* 2. Vocal Mode: Instant Voice Input & Live Transcription */
            <div className="space-y-3">
              {sendMutation.isPending ? (
                <div className="py-5 px-4 bg-muted/40 border border-border/60 rounded-2xl flex items-center justify-center gap-3 text-center animate-in fade-in duration-150">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-xs sm:text-sm font-medium text-foreground">
                    Le recruteur analyse votre réponse et prépare sa réplique...
                  </span>
                </div>
              ) : isListening ? (
                <div className="space-y-3 animate-in fade-in duration-200">
                  {/* Live recording card with waveform */}
                  <div className="bg-red-500/5 border-2 border-red-500/30 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                        Microphone actif — parlez distinctement
                      </span>
                      {/* Bouncing audio equalizer bars */}
                      <div className="flex items-end gap-0.5 h-4">
                        <span className="w-1 h-2 bg-red-500 rounded-full animate-pulse [animation-delay:0ms]" />
                        <span className="w-1 h-3.5 bg-red-500 rounded-full animate-pulse [animation-delay:150ms]" />
                        <span className="w-1 h-4 bg-red-500 rounded-full animate-pulse [animation-delay:300ms]" />
                        <span className="w-1 h-3 bg-red-500 rounded-full animate-pulse [animation-delay:450ms]" />
                        <span className="w-1 h-2 bg-red-500 rounded-full animate-pulse [animation-delay:200ms]" />
                      </div>
                    </div>

                    <div className="text-xs sm:text-sm text-foreground min-h-[48px] max-h-[120px] overflow-y-auto leading-relaxed">
                      {message.trim() ? (
                        <span className="font-medium">{message}</span>
                      ) : (
                        <span className="text-muted-foreground italic">
                          Écoute active en cours... vos paroles apparaîtront ici.
                        </span>
                      )}
                      {interimTranscript && (
                        <span className="text-muted-foreground/70 italic ml-1">{interimTranscript}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Stop & Send directly + Cancel */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleStopAndSendVocal}
                      className="flex-1 py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                    >
                      <Send className="h-4 w-4" />
                      <span>Terminer & Envoyer ma réponse</span>
                    </button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelVocal}
                      className="h-12 px-3 text-xs text-muted-foreground hover:text-foreground rounded-xl"
                      title="Annuler sans envoyer"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Push to talk / start button */}
                  <button
                    type="button"
                    onClick={handleStartVocal}
                    disabled={sendMutation.isPending}
                    className="w-full py-4 px-5 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-3.5 group active:scale-[0.99]"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary-foreground/15 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                      <Mic className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-xs sm:text-sm font-semibold truncate">Appuyer pour répondre à l'oral</div>
                      <div className="text-[11px] text-primary-foreground/80 truncate">
                        L'arrêt du micro enverra directement votre message
                      </div>
                    </div>
                  </button>

                  {/* Voice settings strip: cadence selector & voice name */}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-0.5 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground/80">Vitesse de lecture :</span>
                      <div className="flex items-center bg-muted/80 p-0.5 rounded-lg border text-[11px]">
                        {[
                          { r: 1.0, l: '1x' },
                          { r: 1.15, l: '1.15x' },
                          { r: 1.3, l: '1.3x' },
                        ].map(({ r, l }) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setSpeechRate(r)}
                            className={cn(
                              'px-2 py-0.5 rounded-md font-medium transition-colors',
                              speechRate === r
                                ? 'bg-background text-foreground shadow-2xs font-semibold'
                                : 'hover:text-foreground'
                            )}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Detected Voice display or picker */}
                    {frenchVoices.length > 1 ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground/80">Voix :</span>
                        <Select
                          value={selectedVoiceURI || activeVoice?.voiceURI || ''}
                          onValueChange={(val) => setSelectedVoiceURI(val)}
                        >
                          <SelectTrigger className="h-7 text-[11px] border-border/60 max-w-[160px] sm:max-w-[190px]">
                            <SelectValue placeholder="Voix du recruteur" />
                          </SelectTrigger>
                          <SelectContent>
                            {frenchVoices.map((v) => (
                              <SelectItem key={v.voiceURI} value={v.voiceURI} className="text-xs">
                                {v.name.replace(/Online \(Natural\) - French \(France\)|Microsoft |Google /gi, '').trim()}
                                {/natural|neural|online|google/i.test(v.name) && ' ✨'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      activeVoice && (
                        <span className="truncate max-w-[210px] text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="truncate font-medium">
                            {activeVoice.name.replace(/Online \(Natural\) - French \(France\)|Microsoft |Google /gi, '').trim() || 'Voix française'}
                          </span>
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
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

      {/* Dialogue Sauvegarde Question vers Banque de questions (TICK-303) */}
      <Dialog open={showSaveQuestionDialog} onOpenChange={setShowSaveQuestionDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              Ajouter à ma banque de questions
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cette question et votre réponse seront enregistrées dans votre module de préparation pour révision future.
            </DialogDescription>
          </DialogHeader>

          {questionToSave && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Catégorie</Label>
                <Select
                  value={questionToSave.category}
                  onValueChange={(val) => setQuestionToSave({ ...questionToSave, category: val })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEHAVIORAL">Comportemental / Fit humain</SelectItem>
                    <SelectItem value="TECHNICAL">Technique / Compétences</SelectItem>
                    <SelectItem value="SITUATIONAL">Mise en situation</SelectItem>
                    <SelectItem value="SALARY">Négociation & Salaire</SelectItem>
                    <SelectItem value="OTHER">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Question du recruteur</Label>
                <Textarea
                  value={questionToSave.question}
                  onChange={(e) => setQuestionToSave({ ...questionToSave, question: e.target.value })}
                  rows={3}
                  className="text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Votre réponse (optionnelle)</Label>
                <Textarea
                  value={questionToSave.answer}
                  onChange={(e) => setQuestionToSave({ ...questionToSave, answer: e.target.value })}
                  placeholder="Notes ou éléments clés de votre réponse..."
                  rows={4}
                  className="text-xs resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveQuestionDialog(false)}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              disabled={saveQuestionMutation.isPending || !questionToSave?.question.trim()}
              onClick={() => {
                if (questionToSave) {
                  saveQuestionMutation.mutate({
                    question: questionToSave.question,
                    answer: questionToSave.answer,
                    category: questionToSave.category,
                  });
                }
              }}
            >
              {saveQuestionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Sauvegarder dans la banque'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Bilan & Débriefing Post-Simulation (TICK-301) */}
      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-5 border-b border-border/40 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold">Bilan de votre simulation</DialogTitle>
                  <DialogDescription className="text-xs">
                    Analyse détaillée de vos réponses par notre coach IA
                  </DialogDescription>
                </div>
              </div>
              {parsedFeedback && (
                <div className="text-right">
                  <div className={cn(
                    "text-2xl font-bold font-mono tracking-tight",
                    parsedFeedback.score >= 75 ? "text-emerald-600 dark:text-emerald-400" :
                    parsedFeedback.score >= 50 ? "text-amber-600 dark:text-amber-400" :
                    "text-red-600 dark:text-red-400"
                  )}>
                    {parsedFeedback.score}<span className="text-xs font-normal text-muted-foreground">/100</span>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-[10px] font-medium border-0",
                    parsedFeedback.score >= 75 ? "bg-emerald-500/10 text-emerald-600" :
                    parsedFeedback.score >= 50 ? "bg-amber-500/10 text-amber-600" :
                    "bg-red-500/10 text-red-600"
                  )}>
                    {parsedFeedback.score >= 75 ? 'Très convaincant' : parsedFeedback.score >= 50 ? 'Prometteur' : 'À perfectionner'}
                  </Badge>
                </div>
              )}
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 p-5">
            {parsedFeedback ? (
              <div className="space-y-5">
                {/* Résumé global */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs sm:text-sm leading-relaxed text-foreground">
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> Synthèse générale
                  </p>
                  {parsedFeedback.summary}
                </div>

                {/* 3 Points forts & 3 Axes d'amélioration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Points forts */}
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2.5">
                    <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 uppercase tracking-wide">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Points forts observés
                    </div>
                    <ul className="space-y-2">
                      {parsedFeedback.strengths?.map((item, idx) => (
                        <li key={idx} className="text-xs text-foreground flex items-start gap-2 leading-relaxed">
                          <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Axes d'amélioration */}
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2.5">
                    <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                      <Target className="h-4 w-4 text-amber-500" />
                      Axes d'amélioration
                    </div>
                    <ul className="space-y-2">
                      {parsedFeedback.improvements?.map((item, idx) => (
                        <li key={idx} className="text-xs text-foreground flex items-start gap-2 leading-relaxed">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Reformulation idéale (Méthode STAR) */}
                {parsedFeedback.idealAnswer && (
                  <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                        <Star className="h-4 w-4 text-primary" />
                        Exemple de reformulation idéale (Méthode STAR)
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        Situation • Tâche • Action • Résultat
                      </Badge>
                    </div>
                    {parsedFeedback.idealAnswer.question && (
                      <div className="text-xs font-medium text-foreground bg-primary/5 border border-primary/20 p-2.5 rounded-lg">
                        <span className="font-semibold text-primary">Question analysée : </span>
                        {parsedFeedback.idealAnswer.question}
                      </div>
                    )}
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap bg-muted/30 p-3 rounded-lg border border-border/40">
                      {parsedFeedback.idealAnswer.improvedAnswer}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-xs">
                Aucun débriefing disponible pour cette session.
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="p-4 border-t border-border/40 shrink-0 flex items-center justify-between sm:justify-between">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                if (parsedFeedback) {
                  const idealText = parsedFeedback.idealAnswer
                    ? `\n\nQuestion analysée: ${parsedFeedback.idealAnswer.question}\nReformulation STAR:\n${parsedFeedback.idealAnswer.improvedAnswer}`
                    : '';
                  const text = `Bilan Entretien IA - Score: ${parsedFeedback.score}/100\n\nSynthèse:\n${parsedFeedback.summary}\n\nPoints forts:\n${parsedFeedback.strengths?.map(s => `- ${s}`).join('\n')}\n\nAxes d'amélioration:\n${parsedFeedback.improvements?.map(i => `- ${i}`).join('\n')}${idealText}`;
                  navigator.clipboard.writeText(text);
                  toast.success('Rapport copié dans le presse-papier !');
                }
              }}
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copier le rapport
            </Button>
            <Button size="sm" className="text-xs" onClick={() => setShowFeedbackModal(false)}>
              Fermer le bilan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
