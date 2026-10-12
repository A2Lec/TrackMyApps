import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, KeyRound, Loader2, MailCheck } from 'lucide-react';
import { LegalLinks } from '@/components/legal/LegalLinks';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const forgotMutation = useMutation({
    mutationFn: (data: ForgotPasswordForm) => authService.forgotPassword(data.email),
    onSuccess: (_result, data) => {
      setSentTo(data.email);
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || "Erreur lors de l'envoi de l'email");
    },
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    setError('');
    forgotMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 bg-gradient-to-br from-slate-50 via-background to-blue-50/40 dark:from-neutral-950 dark:via-background dark:to-blue-950/20 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md border-border/80 bg-card/95 backdrop-blur-md shadow-2xl shadow-primary/5 rounded-2xl relative z-10">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/25">
              {sentTo ? <MailCheck className="h-6 w-6 text-white" /> : <KeyRound className="h-6 w-6 text-white" />}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Mot de passe oublié</CardTitle>
          <CardDescription className="text-sm">
            {sentTo
              ? 'Vérifiez votre boîte de réception'
              : 'Indiquez votre adresse email pour recevoir un lien de réinitialisation'}
          </CardDescription>
        </CardHeader>

        {sentTo ? (
          <>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Si un compte existe pour <span className="font-medium text-foreground">{sentTo}</span>, un email
                contenant un lien de réinitialisation vient d'être envoyé.
              </p>
              <p>Le lien est valable 1 heure. Pensez à vérifier vos spams.</p>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button asChild className="w-full h-10 rounded-lg font-medium">
                <Link to="/login">Retour à la connexion</Link>
              </Button>
              <button
                type="button"
                onClick={() => setSentTo(null)}
                className="text-xs sm:text-sm text-primary font-semibold hover:underline"
              >
                Utiliser une autre adresse
              </button>
            </CardFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in-50">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nom@exemple.com"
                  autoComplete="email"
                  className="h-10 rounded-lg"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                className="w-full h-10 rounded-lg font-medium shadow-sm shadow-primary/20"
                disabled={forgotMutation.isPending}
              >
                {forgotMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Envoyer le lien
              </Button>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Retour à la connexion
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
      <LegalLinks className="relative z-10" />
    </div>
  );
}
