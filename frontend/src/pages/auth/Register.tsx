import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { strongPasswordSchema } from '@/schemas/password';
import { Link, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { useDelayedFlag } from '@/hooks/useDelayedFlag';
import { SlowServerHint, SLOW_LOADING_DELAY_MS } from '@/components/loading/SlowServerHint';
import { prefetchPages } from '@/lib/pageLoaders';
import { BrandLogo } from '@/components/BrandLogo';
import { LegalLinks } from '@/components/legal/LegalLinks';
import { LEGAL } from '@/lib/legal';
import { getErrorMessage } from '@/lib/errors';

const registerSchema = z.object({
  email: z.email('Email invalide'),
  password: strongPasswordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  school: z.string().optional(),
  graduationYear: z.string().optional(),
  field: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      navigate('/');
    },
    onError: (error) => {
      setError(getErrorMessage(error, "Erreur lors de l'inscription"));
    },
  });

  // The dashboard is the next screen: download it while the user fills the form
  useEffect(() => {
    prefetchPages(['dashboard']);
  }, []);

  const isSlow = useDelayedFlag(registerMutation.isPending, SLOW_LOADING_DELAY_MS);

  const onSubmit = (data: RegisterForm) => {
    setError('');
    const { confirmPassword: _, graduationYear, ...rest } = data;
    registerMutation.mutate({
      ...rest,
      graduationYear: graduationYear ? parseInt(graduationYear, 10) : undefined,
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 bg-background relative overflow-hidden py-8 sm:py-12">

      <Card className="w-full max-w-lg border-0 bg-background sm:border sm:bg-card rounded-lg relative z-10">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <BrandLogo className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">Créer un compte</CardTitle>
          <CardDescription className="text-sm">
            Rejoignez TrackMyApps pour gérer efficacement vos recherches de stage et d'alternance
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in-50">
                {error}
              </div>
            )}

            {/* Identité */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  placeholder="Jean"
                  className="h-10 rounded-lg"
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p className="text-xs text-destructive font-medium">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  placeholder="Dupont"
                  className="h-10 rounded-lg"
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p className="text-xs text-destructive font-medium">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Adresse email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="jean.dupont@etudiant.fr"
                autoComplete="email"
                className="h-10 rounded-lg"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Mot de passe & confirmation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password">Mot de passe *</Label>
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
                    aria-label={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirmer *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="h-10 rounded-lg pr-10"
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirmPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Section Études (optionnelle) */}
            <div className="pt-2 border-t border-border/60">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-3">
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
                <span>Profil étudiant (Optionnel)</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="school" className="text-xs">École ou Université</Label>
                  <Input
                    id="school"
                    placeholder="ex. Paris-Saclay, EPITECH, HEC..."
                    className="h-9 text-xs rounded-lg"
                    {...register('school')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="field" className="text-xs">Filière / Domaine</Label>
                    <Input
                      id="field"
                      placeholder="ex. Informatique, Marketing..."
                      className="h-9 text-xs rounded-lg"
                      {...register('field')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="graduationYear" className="text-xs">Promotion</Label>
                    <Input
                      id="graduationYear"
                      type="number"
                      placeholder="2026"
                      className="h-9 text-xs rounded-lg"
                      {...register('graduationYear')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              className="w-full h-10 rounded-lg font-medium"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {registerMutation.isPending ? 'Création du compte…' : 'Créer mon compte gratuitement'}
            </Button>
            {isSlow && <SlowServerHint />}
            <p className="text-xs text-muted-foreground text-center">
              En créant un compte, vous confirmez avoir au moins {LEGAL.minimumAge} ans et acceptez les{' '}
              <Link to="/terms-of-service" className="text-primary hover:underline">conditions générales d'utilisation</Link>.
              Vos données sont traitées conformément à notre{' '}
              <Link to="/privacy-policy" className="text-primary hover:underline">politique de confidentialité</Link>.
            </p>

            <p className="text-xs sm:text-sm text-muted-foreground text-center mt-1">
              Vous avez déjà un compte ?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      <LegalLinks className="relative z-10" />
    </div>
  );
}
