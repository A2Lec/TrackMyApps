import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { AlertTriangle, Award, Bot, History, KeyRound, Loader2, Mic, ShieldCheck, Trash2 } from 'lucide-react';
import { documentsService } from '@/services/documents.service';
import { useAuthStore } from '@/store/authStore';
import type { InterviewSession } from '@/services/interviewSimulation.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DIFFICULTY_LEVELS, INTERVIEWER_TYPES, type SimulationConfig } from './constants';

interface SimulationSetupProps {
  config: SimulationConfig;
  onConfigChange: (config: SimulationConfig) => void;
  pastSessions: InterviewSession[];
  onOpenSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  isDeleting: boolean;
  error: string | null;
  onStart: () => void;
  isStarting: boolean;
}

/**
 * First screen of the simulator: interviewer, difficulty and documents, or the
 * history of past sessions
 */
export function SimulationSetup({
  config,
  onConfigChange,
  pastSessions,
  onOpenSession,
  onDeleteSession,
  isDeleting,
  error,
  onStart,
  isStarting,
}: SimulationSetupProps) {
  const [showSessions, setShowSessions] = useState(false);
  const user = useAuthStore((state) => state.user);
  const isDemo = Boolean(user?.isDemo);

  const { data: cvDocuments } = useQuery({
    queryKey: ['documents', 'CV'],
    queryFn: () => documentsService.getAll('CV'),
  });

  const { data: lmDocuments } = useQuery({
    queryKey: ['documents', 'LETTRE_MOTIVATION'],
    queryFn: () => documentsService.getAll('LETTRE_MOTIVATION'),
  });

  return (
    <Card className="border-border/80 overflow-hidden w-full min-w-0">
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

          {pastSessions.length > 0 && (
            <Button
              variant={showSessions ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowSessions(!showSessions)}
              className="text-xs h-8.5 self-start sm:self-center flex-shrink-0"
            >
              <History className="h-3.5 w-3.5 mr-1.5" />
              {showSessions ? 'Nouvelle session' : `Historique (${pastSessions.length})`}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {showSessions ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
              <span>Sélectionnez une session pour relire l'échange :</span>
              <span>{pastSessions.length} session(s)</span>
            </div>

            <div className="space-y-2">
              {pastSessions.map((sess) => (
                <div
                  key={sess.id}
                  onClick={() => onOpenSession(sess.id)}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-border/80 hover:border-primary/40 bg-card hover:bg-muted/30 transition-all cursor-pointer group"
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
                        <Badge variant="outline" className="text-[10px] bg-warning-soft text-warning-strong border-warning/40 py-0 h-4 flex items-center gap-1">
                          <Award className="h-2.5 w-2.5 text-warning-strong" />
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
                        onDeleteSession(sess.id);
                      }
                    }}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {isDemo ? (
              <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/30 text-xs flex items-start gap-2.5">
                <KeyRound className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>
                  Le simulateur n'est pas disponible sur le compte de démonstration. Créez un compte gratuit et ajoutez
                  votre clé API Gemini pour vous entraîner.
                </span>
              </div>
            ) : (
              !user?.hasGeminiKey && (
                <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/30 text-xs flex items-start gap-2.5">
                  <KeyRound className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>
                    Le simulateur utilise votre propre clé API Google Gemini (gratuite).{' '}
                    <Link to="/settings?tab=ai" className="text-primary font-semibold hover:underline">
                      Ajouter ma clé dans les paramètres
                    </Link>
                  </span>
                </div>
              )
            )}

            {error && (
              <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
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
                      onClick={() => onConfigChange({ ...config, interviewerType: type.id })}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border text-left transition-all duration-150',
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border/80 hover:border-border hover:bg-muted/30'
                      )}
                    >
                      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 border', type.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          {type.label}
                          {isSelected && <Badge className="text-[10px] py-0 px-1 h-4">Sélectionné</Badge>}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{type.desc}</p>
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
                      onClick={() => onConfigChange({ ...config, difficulty: lvl.id })}
                      className={cn(
                        'p-2.5 sm:p-3 rounded-lg border text-center transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary font-medium'
                          : 'border-border/80 text-muted-foreground hover:bg-muted/30'
                      )}
                    >
                      <div className="text-xs font-medium text-foreground">{lvl.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 truncate hidden sm:block">{lvl.desc}</div>
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
                  onValueChange={(val) => onConfigChange({ ...config, cvId: val === 'none' ? undefined : val })}
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
                  onValueChange={(val) => onConfigChange({ ...config, lmId: val === 'none' ? undefined : val })}
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

            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="leading-relaxed">
                L'IA personnalisera ses questions selon vos documents et vous permet de répondre par écrit ou à la voix.
              </span>
            </div>

            <Button className="w-full h-10 text-xs font-semibold" onClick={onStart} disabled={isStarting || isDemo}>
              {isStarting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Préparation de votre entretien...
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
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
