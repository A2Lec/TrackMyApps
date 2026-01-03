import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { interviewSimulationService, InterviewMessage } from '@/services/interviewSimulation.service';
import { documentsService } from '@/services/documents.service';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Send, Bot, User, Loader2, AlertTriangle, Maximize2, History, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InterviewSimulationProps {
  applicationId: string;
}

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
      setError(err.response?.data?.message || "Impossible de démarrer la simulation. Vérifiez que la clé API est configurée.");
    }
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
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
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
    if (!message.trim() || !sessionId) return;
    sendMutation.mutate({ sessionId, message });
  };

  if (!sessionId) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              Simulation d'entretien IA
            </CardTitle>
            {existingSessions && existingSessions.filter(s => (s._count?.messages || 0) > 1).length > 0 && (
              <Button 
                variant={showSessions ? "default" : "outline"}
                size="sm" 
                onClick={() => setShowSessions(!showSessions)}
                className={showSessions ? "" : "border-2 whitespace-nowrap"}
              >
                <History className="h-4 w-4 mr-2" />
                {showSessions ? 'Nouvelle session' : 'Sessions précédentes'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {showSessions ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Sélectionnez une session pour la reprendre ou la relire :
              </p>
              {existingSessions?.filter(sess => (sess._count?.messages || 0) > 1).map((sess) => (
                <Card key={sess.id} className="cursor-pointer hover:border-primary transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between" onClick={() => setSessionId(sess.id)}>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{sess.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{new Date(sess.createdAt).toLocaleDateString('fr-FR')}</span>
                          <span>•</span>
                          <span>{sess._count?.messages || 0} messages</span>
                          <span>•</span>
                          <span className="capitalize">{sess.status === 'IN_PROGRESS' ? 'En cours' : 'Terminée'}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
                            deleteMutation.mutate(sess.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Cette fonctionnalité utilise l'IA de Google (Gemini). Les informations de cette candidature (Description du poste, CV, Lettre de motivation) seront envoyées à Google pour générer l'entretien. Ne partagez pas d'informations sensibles (bancaires, mots de passe, etc.) pendant la conversation.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type d'interlocuteur</Label>
              <Select
                value={config.interviewerType}
                onValueChange={(val) => setConfig({ ...config, interviewerType: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HR">Recruteur RH (Soft skills, motivation)</SelectItem>
                  <SelectItem value="MANAGER">Manager (Expérience, fit équipe)</SelectItem>
                  <SelectItem value="TECHNICAL">Expert Technique (Compétences dures)</SelectItem>
                  <SelectItem value="CTO">CTO (Vision, architecture)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Difficulté</Label>
              <Select
                value={config.difficulty}
                onValueChange={(val) => setConfig({ ...config, difficulty: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Facile (Bienveillant)</SelectItem>
                  <SelectItem value="MEDIUM">Moyen (Standard)</SelectItem>
                  <SelectItem value="HARD">Difficile (Challengeant)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>CV (optionnel)</Label>
              <Select
                value={config.cvId}
                onValueChange={(val) => setConfig({ ...config, cvId: val === 'none' ? undefined : val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un CV" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {cvDocuments?.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.name} {doc.isDefault && '(★ Par défaut)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Lettre de motivation (optionnel)</Label>
              <Select
                value={config.lmId}
                onValueChange={(val) => setConfig({ ...config, lmId: val === 'none' ? undefined : val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une LM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {lmDocuments?.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.name} {doc.isDefault && '(★ Par défaut)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
                className="w-full" 
                onClick={handleStart} 
                disabled={startMutation.isPending}
            >
              {startMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Démarrage...
                </>
              ) : (
                'Commencer la simulation'
              )}
            </Button>
          </div>
          </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card className="flex flex-col">
      <CardHeader className="border-b py-3">
        <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Entretien avec {config.interviewerType} ({config.difficulty})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(true)}>
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSessionId(null)}>
                  Quitter
              </Button>
            </div>
        </div>
      </CardHeader>
      
      <ScrollArea className="h-[450px] p-4" ref={scrollRef}>
        <div className="space-y-4">
            {/* Initial loading state or messages */}
            {startMutation.isPending && (
                 <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3 max-w-[80%] flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>L'IA prépare l'entretien...</span>
                    </div>
                </div>
            )}

          {session?.messages.map((msg: InterviewMessage) => (
            <div
              key={msg.id}
              className={cn(
                'flex w-full',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'rounded-lg px-4 py-2 max-w-[80%]',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <div className="flex items-center gap-2 mb-1 opacity-70 text-xs">
                    {msg.role === 'user' ? <User className="h-3 w-3"/> : <Bot className="h-3 w-3"/>}
                    <span>{msg.role === 'user' ? 'Vous' : 'Recruteur'}</span>
                </div>
                <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
              </div>
            </div>
          ))}
          
          {sendMutation.isPending && (
             <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 max-w-[80%] flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Le recruteur écrit...</span>
                </div>
            </div>
          )}
          
           {/* Invisible element to scroll to */}
           <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Votre réponse..."
            disabled={sendMutation.isPending}
            autoFocus
            rows={1}
            className="min-h-[40px] max-h-[200px] resize-none overflow-y-auto"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <Button type="submit" size="icon" disabled={sendMutation.isPending || !message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
    
    <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Entretien avec {config.interviewerType} ({config.difficulty})
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {startMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 max-w-[80%] flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>L'IA prépare l'entretien...</span>
                </div>
              </div>
            )}

            {session?.messages.map((msg: InterviewMessage) => (
              <div
                key={msg.id}
                className={cn(
                  'flex w-full',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'rounded-lg px-4 py-2 max-w-[80%]',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1 opacity-70 text-xs">
                    {msg.role === 'user' ? <User className="h-3 w-3"/> : <Bot className="h-3 w-3"/>}
                    <span>{msg.role === 'user' ? 'Vous' : 'Recruteur'}</span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                </div>
              </div>
            ))}
            
            {sendMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 max-w-[80%] flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Le recruteur écrit...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t shrink-0">
          <form onSubmit={handleSend} className="flex gap-2 items-end">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Votre réponse..."
              disabled={sendMutation.isPending}
              rows={1}
              className="min-h-[40px] max-h-[200px] resize-none overflow-y-auto"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <Button type="submit" size="icon" disabled={sendMutation.isPending || !message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
