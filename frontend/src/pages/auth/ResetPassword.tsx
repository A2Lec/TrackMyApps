import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { strongPasswordSchema } from '@/schemas/password';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Eye, EyeOff, KeyRound, Loader2, XCircle } from 'lucide-react';
import { LegalLinks } from '@/components/legal/LegalLinks';

const resetPasswordSchema = z.object({
  password: strongPasswordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const resetMutation = useMutation({
    mutationFn: (data: ResetPasswordForm) => authService.resetPassword(token!, data.password),
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe');
    },
  });

  const onSubmit = (data: ResetPasswordForm) => {
    setError('');
    resetMutation.mutate(data);
  };

  const state = !token ? 'invalid' : resetMutation.isSuccess ? 'success' : 'form';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 bg-background relative overflow-hidden">

      <Card className="w-full max-w-md border-0 bg-background sm:border sm:bg-card rounded-lg relative z-10">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            {state === 'success' ? (
              <CheckCircle className="h-12 w-12 text-success" />
            ) : state === 'invalid' ? (
              <XCircle className="h-12 w-12 text-destructive" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                <KeyRound className="h-6 w-6 text-white" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {state === 'success' ? 'Mot de passe modifié' : 'Nouveau mot de passe'}
          </CardTitle>
          <CardDescription className="text-sm">
            {state === 'success'
              ? 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.'
              : state === 'invalid'
                ? 'Ce lien de réinitialisation est incomplet.'
                : 'Choisissez un nouveau mot de passe pour votre compte'}
          </CardDescription>
        </CardHeader>

        {state === 'form' ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in-50">
                  {error}
                  {error.includes('expiré') && (
                    <>
                      {' '}
                      <Link to="/forgot-password" className="underline font-semibold">
                        Demander un nouveau lien
                      </Link>
                    </>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="h-10 rounded-lg pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-10 rounded-lg"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                className="w-full h-10 rounded-lg font-medium"
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer le mot de passe
              </Button>
            </CardFooter>
          </form>
        ) : (
          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button asChild className="w-full h-10 rounded-lg font-medium">
              <Link to={state === 'success' ? '/login' : '/forgot-password'}>
                {state === 'success' ? 'Se connecter' : 'Demander un nouveau lien'}
              </Link>
            </Button>
          </CardFooter>
        )}
      </Card>
      <LegalLinks className="relative z-10" />
    </div>
  );
}
