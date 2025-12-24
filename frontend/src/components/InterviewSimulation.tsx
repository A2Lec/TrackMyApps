import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { interviewSimulationService, InterviewMessage } from '@/services/interviewSimulation.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Send, Bot, User, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InterviewSimulationProps {
  applicationId: string;
}

export function InterviewSimulation({ applicationId }: InterviewSimulationProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [config, setConfig] = useState({
    interviewerType: 'HR',
    difficulty: 'MEDIUM',
  });
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages, startMutation.isPending, sendMutation.isPending]);

  useEffect(() => {
    setSessionId(null);
    setMessage('');
  }, [applicationId]);

  const handleStart = () => {
    startMutation.mutate({
      applicationId,
      interviewerType: config.interviewerType,
      difficulty: config.difficulty,
    });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !sessionId) return;
    sendMutation.mutate({ sessionId, message });
  };

  if (!sessionId) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Simulation d'entretien IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b py-3">
        <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Entretien avec {config.interviewerType} ({config.difficulty})
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setSessionId(null)}>
                Quitter
            </Button>
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
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
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Votre réponse..."
            disabled={sendMutation.isPending}
            autoFocus
          />
          <Button type="submit" size="icon" disabled={sendMutation.isPending || !message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
