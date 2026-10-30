import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router';
import { CheckCircle2, ExternalLink, KeyRound, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';

/**
 * Personal Gemini API key used by the interview simulator. Write-only: once saved,
 * the key is stored encrypted by the backend and never displayed again.
 */
export function GeminiKeyCard() {
  const { user, updateUser } = useAuthStore();
  const [apiKey, setApiKey] = useState('');

  const isDemo = Boolean(user?.isDemo);
  const hasKey = Boolean(user?.hasGeminiKey);

  const saveMutation = useMutation({
    mutationFn: (key: string) => authService.saveGeminiKey(key),
    onSuccess: (data) => {
      updateUser(data);
      setApiKey('');
      toast.success('Clé API vérifiée et enregistrée');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => authService.deleteGeminiKey(),
    onSuccess: (data) => {
      updateUser(data);
      toast.success('Clé API supprimée');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(apiKey.trim());
  };

  return (
    <Card className="border border-border/70">
      <CardHeader className="pb-4 border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              Clé API Google Gemini
            </CardTitle>
            <CardDescription className="text-xs">
              Le simulateur d'entretien utilise votre propre clé API
            </CardDescription>
          </div>
          {hasKey ? (
            <Badge variant="outline" className="text-success bg-success/10 text-xs whitespace-nowrap">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Clé enregistrée
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground text-xs whitespace-nowrap">
              Aucune clé
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4">
        {isDemo ? (
          <p className="text-xs text-muted-foreground leading-relaxed">
            Le simulateur d'entretien IA n'est pas disponible sur le compte de démonstration. Créez un compte gratuit
            et ajoutez votre clé API pour l'utiliser.
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Créez une clé gratuite sur{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline inline-flex items-center gap-0.5"
              >
                Google AI Studio <ExternalLink className="h-3 w-3" />
              </a>
              , puis collez-la ci-dessous. Les échanges avec l'IA sont décomptés de votre quota Google.
            </p>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Vos simulations (CV, lettre, réponses) sont envoyées à Google avec votre clé, selon les conditions de
              l'offre associée. Hors Union européenne, Suisse et Royaume-Uni, Google peut utiliser les données de
              l'offre gratuite pour améliorer ses modèles.{' '}
              <Link to="/privacy-policy#ia" className="text-primary hover:underline">
                En savoir plus
              </Link>
            </p>

            <form onSubmit={handleSave} className="space-y-1.5">
              <Label htmlFor="geminiApiKey" className="text-xs font-medium">
                {hasKey ? 'Remplacer la clé' : 'Clé API'}
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="geminiApiKey"
                  type="password"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="AIza..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!apiKey.trim() || saveMutation.isPending}
                  className="h-9 text-xs whitespace-nowrap"
                >
                  {saveMutation.isPending ? 'Vérification...' : 'Vérifier et enregistrer'}
                </Button>
              </div>
            </form>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-[11px] text-muted-foreground flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                Votre clé est chiffrée avant d'être stockée et n'est plus jamais affichée ni renvoyée à votre
                navigateur. Elle sert uniquement à vos simulations d'entretien et n'est pas incluse dans l'export de
                vos données.
              </span>
            </div>

            {hasKey && (
              <div className="flex justify-end pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="h-8 text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Supprimer ma clé
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
