import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useDelayedFlag } from '@/hooks/useDelayedFlag';
import { SlowServerHint, SLOW_LOADING_DELAY_MS } from '@/components/loading/SlowServerHint';
import { prefetchPages } from '@/lib/pageLoaders';
import { BrandLogo } from '@/components/BrandLogo';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type LoginForm = z.infer<typeof loginSchema>;

const demoCredentials = {
  email: 'user@trackmyapps.com',
  password: 'password123',
} as const;

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      navigate('/');
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Identifiants invalides');
    },
  });

  // The dashboard is the next screen: download it while the user types
  useEffect(() => {
    prefetchPages(['dashboard']);
  }, []);

  const isSlow = useDelayedFlag(loginMutation.isPending, SLOW_LOADING_DELAY_MS);

  const onSubmit = (data: LoginForm) => {
    setError('');
    loginMutation.mutate(data);
  };

  const handleDemoLogin = () => {
    setError('');
    loginMutation.mutate(demoCredentials);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-background to-blue-50/40 dark:from-neutral-950 dark:via-background dark:to-blue-950/20 relative overflow-hidden">
      {/* Decorative ambient gradients */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md border-border/80 bg-card/95 backdrop-blur-md shadow-2xl shadow-primary/5 rounded-2xl relative z-10">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <BrandLogo className="h-12 w-12 drop-shadow-lg" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Connexion</CardTitle>
          <CardDescription className="text-sm">
            Ravi de vous revoir ! Accédez à vos candidatures en cours
          </CardDescription>
        </CardHeader>
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <Link to="/forgot-password" className="text-xs text-primary font-medium hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-10 rounded-lg pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              className="w-full h-10 rounded-lg font-medium shadow-sm shadow-primary/20"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {loginMutation.isPending ? 'Connexion…' : 'Se connecter'}
            </Button>
            {isSlow && <SlowServerHint />}
            
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 rounded-lg border-primary/30 hover:bg-primary/5 text-primary hover:text-primary transition-colors"
              onClick={handleDemoLogin}
              disabled={loginMutation.isPending}
            >
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
              Tester avec le compte démo (1 clic)
            </Button>

            <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Créer un compte
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
