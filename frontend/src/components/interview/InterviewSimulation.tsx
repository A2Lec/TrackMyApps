import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Bot, Loader2, Square } from 'lucide-react';
import { toast } from 'sonner';
import {
  interviewSimulationService,
  type InterviewFeedback,
  type InterviewMessage,
} from '@/services/interviewSimulation.service';
import { useSpeechRecognition, useSpeechSynthesis } from '@/hooks/useSpeech';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/errors';
import { categoryForInterviewer, getDifficultyLabel, getInterviewer, type SimulationConfig } from './constants';
import { SimulationSetup } from './SimulationSetup';
import { SessionHeader, type InputMode } from './SessionHeader';
import { MessageBubble } from './MessageBubble';
import { ChatComposer } from './ChatComposer';
import { VocalComposer } from './VocalComposer';
import { ExpandedSessionDialog } from './ExpandedSessionDialog';
import { SaveQuestionDialog, type QuestionDraft } from './SaveQuestionDialog';
import { FeedbackDialog } from './FeedbackDialog';

export interface InterviewSimulationProps {
  applicationId?: string;
  isFreePractice?: boolean;
  defaultTargetRole?: string;
  defaultContractType?: string;
  defaultJobDescription?: string;
}

const SPEECH_UNSUPPORTED =
  "La reconnaissance vocale n'est pas supportée sur ce navigateur (utilisez Chrome, Edge ou Safari).";

/**
 * AI interview simulator: setup screen, then a chat (text or voice) with a
 * Gemini-powered recruiter, ending with a scored debrief
 */
export function InterviewSimulation({
  applicationId,
  isFreePractice,
  defaultTargetRole,
  defaultContractType,
  defaultJobDescription,
}: InterviewSimulationProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('chat');
  const [autoPlayVoice, setAutoPlayVoice] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questionDraft, setQuestionDraft] = useState<QuestionDraft | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<SimulationConfig>({ interviewerType: 'HR', difficulty: 'MEDIUM' });
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    isSupported: isSpeechSupported,
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

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

  // Another application was opened: back to the setup screen
  const [shownApplicationId, setShownApplicationId] = useState(applicationId);
  if (applicationId !== shownApplicationId) {
    setShownApplicationId(applicationId);
    setSessionId(null);
    setMessage('');
  }

  // Dictation fills the answer box as the user speaks
  const [shownTranscript, setShownTranscript] = useState(transcript);
  if (transcript !== shownTranscript) {
    setShownTranscript(transcript);
    if (transcript) setMessage(transcript);
  }

  // Silence the microphone and the voice when leaving the application or unmounting
  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, [applicationId, stopListening, stopSpeaking]);

  const { data: existingSessions, refetch: refetchSessions } = useQuery({
    queryKey: ['interviewSessions', applicationId || 'all-sessions'],
    queryFn: () =>
      applicationId
        ? interviewSimulationService.getSessionsByApplication(applicationId)
        : interviewSimulationService.getAllSessions(),
  });

  const { data: session, refetch: refetchSession } = useQuery({
    queryKey: ['interviewSession', sessionId],
    queryFn: () => interviewSimulationService.getSession(sessionId!),
    enabled: !!sessionId,
  });

  const conversation = useMemo(() => session?.messages.filter((m) => m.role !== 'feedback') ?? [], [session]);

  const feedback = useMemo<InterviewFeedback | null>(() => {
    const feedbackMessage = session?.messages.find((m) => m.role === 'feedback');
    if (!feedbackMessage) return null;
    try {
      return JSON.parse(feedbackMessage.content);
    } catch {
      return null;
    }
  }, [session]);

  const interviewer = getInterviewer(session?.interviewerType ?? config.interviewerType);
  const difficultyLabel = getDifficultyLabel(session?.difficulty ?? config.difficulty);

  const playMessage = (id: string | null, text: string) => {
    if (!isSynthesisSupported) return;
    setSpeakingMessageId(id);
    speak(text, { rate: speechRate, onEnd: () => setSpeakingMessageId(null) });
  };

  const startMutation = useMutation({
    mutationFn: interviewSimulationService.startSession,
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setError(null);
      refetchSessions();
      if (autoPlayVoice) playMessage(null, data.message);
    },
    onError: (err) => {
      setError(getErrorMessage(err, 'Impossible de démarrer la simulation. Vérifiez que la clé API Gemini est configurée.'));
    },
  });

  const sendMutation = useMutation({
    mutationFn: ({ sessionId, message }: { sessionId: string; message: string }) =>
      interviewSimulationService.sendMessage(sessionId, message),
    onSuccess: async () => {
      setMessage('');
      resetTranscript();
      const { data } = await refetchSession();
      const latest = data?.messages.at(-1);
      if (autoPlayVoice && latest?.role === 'model') {
        playMessage(latest.id, latest.content);
      }
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Erreur lors de la communication avec l'IA"));
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => interviewSimulationService.completeSession(sessionId!),
    onSuccess: () => {
      refetchSession();
      refetchSessions();
      setShowFeedback(true);
      toast.success("Bilan d'entretien généré avec succès !");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Erreur lors de la clôture de la session'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: interviewSimulationService.deleteSession,
    onSuccess: () => {
      refetchSessions();
      toast.success('Session supprimée');
    },
  });

  // Keep the latest message in view
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages, startMutation.isPending, sendMutation.isPending, interimTranscript]);

  const sendAnswer = (text: string) => {
    if (!text || !sessionId || sendMutation.isPending) return;
    stopSpeaking();
    sendMutation.mutate({ sessionId, message: text });
  };

  const handleStart = () => {
    setError(null);
    startMutation.mutate({
      applicationId: applicationId || undefined,
      isFreePractice: !!isFreePractice,
      targetRole: defaultTargetRole,
      contractType: defaultContractType,
      jobDescription: defaultJobDescription,
      ...config,
    });
  };

  const handleSend = () => {
    if (isListening) stopListening();
    sendAnswer(message.trim());
  };

  const handleStartVocal = () => {
    if (!isSpeechSupported) {
      toast.error(SPEECH_UNSUPPORTED);
      return;
    }
    stopSpeaking();
    resetTranscript();
    setMessage('');
    startListening();
  };

  const handleStopAndSendVocal = () => {
    const textToSend = (stopListening() || message).trim();
    setMessage('');
    resetTranscript();

    if (!textToSend) {
      toast.info('Aucune parole détectée. Appuyez sur le micro pour parler.');
      return;
    }
    sendAnswer(textToSend);
    toast.success('Réponse vocale transmise au recruteur !', { duration: 1500 });
  };

  const handleCancelVocal = () => {
    stopListening();
    resetTranscript();
    setMessage('');
    toast.info('Enregistrement annulé');
  };

  // Dictation into the text box (chat mode and full-screen view)
  const handleToggleDictation = () => {
    if (!isSpeechSupported) {
      toast.error(SPEECH_UNSUPPORTED);
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      stopSpeaking();
      startListening();
    }
  };

  const handlePlayMessage = (msg: InterviewMessage) => {
    if (!isSynthesisSupported) {
      toast.error("La synthèse vocale n'est pas disponible sur votre appareil.");
      return;
    }
    if (isSpeaking && speakingMessageId === msg.id) {
      stopSpeaking();
      setSpeakingMessageId(null);
    } else {
      stopListening();
      playMessage(msg.id, msg.content);
    }
  };

  const handleInputModeChange = (mode: InputMode) => {
    setInputMode(mode);
    if (mode === 'vocal') {
      setAutoPlayVoice(true);
      if (!isSpeechSupported) {
        toast.info('Votre navigateur ne supporte pas la dictée vocale directe, mais vous pouvez écouter les réponses.');
      }
    }
  };

  // Pre-fill the question bank with the recruiter question and the answer that followed
  const handleSaveQuestion = (index: number) => {
    const next = conversation[index + 1];
    setQuestionDraft({
      question: conversation[index].content,
      answer: next?.role === 'user' ? next.content : '',
      category: categoryForInterviewer(interviewer.id),
    });
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Message copié dans le presse-papier');
  };

  if (!sessionId) {
    return (
      <SimulationSetup
        key={applicationId}
        config={config}
        onConfigChange={setConfig}
        pastSessions={existingSessions?.filter((s) => (s._count?.messages || 0) > 1) ?? []}
        onOpenSession={setSessionId}
        onDeleteSession={(id) => deleteMutation.mutate(id)}
        isDeleting={deleteMutation.isPending}
        error={error}
        onStart={handleStart}
        isStarting={startMutation.isPending}
      />
    );
  }

  return (
    <>
      <Card className="flex flex-col border-border/80 overflow-hidden w-full min-w-0">
        <SessionHeader
          interviewerLabel={interviewer.label}
          interviewerColor={interviewer.color}
          difficultyLabel={difficultyLabel}
          messageCount={session?.messages.length}
          inputMode={inputMode}
          onInputModeChange={handleInputModeChange}
          feedback={feedback}
          isCompleting={completeMutation.isPending}
          onFeedback={() => (feedback ? setShowFeedback(true) : completeMutation.mutate())}
          autoPlayVoice={autoPlayVoice}
          onToggleAutoPlay={() => {
            if (isSpeaking) stopSpeaking();
            setAutoPlayVoice(!autoPlayVoice);
          }}
          onExpand={() => setIsExpanded(true)}
          onLeave={() => {
            stopSpeaking();
            stopListening();
            setSessionId(null);
          }}
        />

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
              <span className="font-medium">Le recruteur s'exprime à l'oral ({speechRate}x)...</span>
            </div>
            <Button variant="ghost" size="sm" onClick={stopSpeaking} className="h-6 px-2 text-[11px] text-primary hover:bg-primary/10">
              <Square className="h-2.5 w-2.5 mr-1 fill-current" />
              Arrêter l'audio
            </Button>
          </div>
        )}

        <div className="h-[440px] overflow-y-auto p-4 sm:p-5 space-y-4" ref={scrollRef}>
          {startMutation.isPending && (
            <div className="flex items-start gap-2.5 max-w-[85%]">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="rounded-lg rounded-tl-sm bg-muted/60 border border-border/40 p-3.5 text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>Le recruteur prépare la première question...</span>
              </div>
            </div>
          )}

          {conversation.map((msg, index) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              interviewerLabel={interviewer.label}
              isSpeaking={isSpeaking && speakingMessageId === msg.id}
              onCopy={() => copyMessage(msg.content)}
              onPlayAudio={() => handlePlayMessage(msg)}
              onSaveQuestion={() => handleSaveQuestion(index)}
            />
          ))}

          {sendMutation.isPending && (
            <div className="flex items-start gap-2.5 max-w-[85%]">
              <div className="h-7 w-7 rounded-full bg-muted border border-border/60 flex items-center justify-center flex-shrink-0 text-foreground/80">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="rounded-lg rounded-tl-xs bg-muted/60 border border-border/40 px-4 py-3 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:300ms]" />
                <span className="text-[11px] text-muted-foreground ml-2 font-medium">Le recruteur formule sa réponse...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 border-t border-border/40 bg-card">
          {inputMode === 'chat' ? (
            <ChatComposer
              message={message}
              onMessageChange={setMessage}
              onSend={handleSend}
              isSending={sendMutation.isPending}
              isListening={isListening}
              onToggleDictation={handleToggleDictation}
            />
          ) : (
            <VocalComposer
              transcript={message}
              interimTranscript={interimTranscript}
              isSending={sendMutation.isPending}
              isListening={isListening}
              onStart={handleStartVocal}
              onStopAndSend={handleStopAndSendVocal}
              onCancel={handleCancelVocal}
              speechRate={speechRate}
              onSpeechRateChange={setSpeechRate}
              voices={frenchVoices}
              activeVoice={activeVoice}
              selectedVoiceURI={selectedVoiceURI}
              onVoiceChange={setSelectedVoiceURI}
            />
          )}
        </div>
      </Card>

      <ExpandedSessionDialog
        open={isExpanded}
        onOpenChange={setIsExpanded}
        title={`Simulation : ${interviewer.label} (${difficultyLabel})`}
        interviewerLabel={interviewer.label}
        messages={conversation}
        message={message}
        onMessageChange={setMessage}
        onSend={handleSend}
        isSending={sendMutation.isPending}
        isListening={isListening}
        onToggleDictation={handleToggleDictation}
      />

      <SaveQuestionDialog initialDraft={questionDraft} onClose={() => setQuestionDraft(null)} />

      <FeedbackDialog open={showFeedback} onOpenChange={setShowFeedback} feedback={feedback} />
    </>
  );
}
