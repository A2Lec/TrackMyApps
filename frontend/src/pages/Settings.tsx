import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  User,
  Mail,
  GraduationCap,
  Lock,
  Bell,
  Moon,
  Sun,
  Monitor,
  Trash2,
  Save,
  LogOut,
  Download,
  CheckCircle2,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useUIStore, type Theme } from '@/store/uiStore';
import { authService } from '@/services/auth.service';
import { remindersService } from '@/services/reminders.service';
import { generateIcsContent, downloadIcsFile } from '@/lib/calendarExport';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  getNotificationPermission,
  requestNotificationPermission,
  showBrowserNotification,
} from '@/utils/notifications';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'notifications' | 'appearance'>('profile');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    school: user?.school || '',
    fieldOfStudy: user?.fieldOfStudy || '',
    graduationYear: user?.graduationYear?.toString() || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: user?.emailNotifications ?? true,
    relanceFrequency: user?.relanceFrequency ?? 7,
  });

  const { theme, setTheme } = useUIStore();

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof profileData) =>
      authService.updateProfile({
        ...data,
        graduationYear: data.graduationYear ? parseInt(data.graduationYear, 10) : undefined,
      }),
    onSuccess: (updatedUser) => {
      // Merge instead of replacing so fields absent from the response (e.g. emailVerified) are kept
      updateUser(updatedUser);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authService.updatePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => authService.deleteAccount(),
    onSuccess: () => {
      logout();
      navigate('/login');
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: (data: typeof notifications) =>
      authService.updatePreferences(data.emailNotifications, data.relanceFrequency),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const [isExportingCalendar, setIsExportingCalendar] = useState(false);

  const handleExportCalendar = async () => {
    try {
      setIsExportingCalendar(true);
      const reminders = await remindersService.getAll();
      if (!reminders || reminders.length === 0) {
        toast.info('Aucun rappel ou entretien à exporter');
        return;
      }
      const events = reminders.map((r) => ({
        title: r.title,
        description:
          r.description ||
          (r.application
            ? `Poste : ${r.application.position} chez ${r.application.companyName}`
            : undefined),
        startDate: new Date(r.dueDate),
        durationMinutes: 30,
      }));
      const icsContent = generateIcsContent(events);
      downloadIcsFile('trackmyapps-agenda.ics', icsContent);
      toast.success(`${reminders.length} rappel(s) et entretien(s) exporté(s)`);
    } catch {
      toast.error("Erreur lors de l'export du calendrier");
    } finally {
      setIsExportingCalendar(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabs = [
    { id: 'profile', label: 'Profil personnel', icon: User },
    { id: 'account', label: 'Compte & Sécurité', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Apparence', icon: Sun },
  ] as const;

  const initials = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`.toUpperCase() || 'U';

  return (
    <div className="space-y-6 w-full min-w-0 overflow-x-hidden animate-in fade-in-50 duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gérez votre identité, vos préférences de notification et la sécurité de votre compte
        </p>
      </div>

      {/* Main Grid: Responsive Tab Navigation & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full min-w-0">
        {/* Navigation Tabs (Horizontal on mobile, vertical sidebar on lg) */}
        <div className="lg:col-span-3 w-full min-w-0">
          {/* Mobile horizontal pill navigation */}
          <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                    isActive
                      ? 'bg-foreground text-background font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Desktop vertical sidebar navigation */}
          <Card className="hidden lg:block border border-border/70 shadow-xs">
            <CardContent className="p-3">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Tab Content Panes */}
        <div className="lg:col-span-9 space-y-6 w-full min-w-0">
          {/* 1. Profile Tab */}
          {activeTab === 'profile' && (
            <Card className="border border-border/70 shadow-xs">
              <CardHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Informations personnelles</CardTitle>
                    <CardDescription className="text-xs">
                      Vos coordonnées utilisées pour personnaliser vos candidatures et simulations
                    </CardDescription>
                  </div>
                  {/* Avatar Initials Badge */}
                  <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                    {initials}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-xs font-medium">Prénom</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs font-medium">Nom</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium">Adresse email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-primary" />
                    Formation & Parcours
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="school" className="text-xs font-medium">École / Université</Label>
                      <Input
                        id="school"
                        value={profileData.school}
                        onChange={(e) => setProfileData({ ...profileData, school: e.target.value })}
                        placeholder="Ex: EPITECH, Sorbonne, HEC..."
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fieldOfStudy" className="text-xs font-medium">Domaine d'études</Label>
                      <Input
                        id="fieldOfStudy"
                        value={profileData.fieldOfStudy}
                        onChange={(e) => setProfileData({ ...profileData, fieldOfStudy: e.target.value })}
                        placeholder="Ex: Génie Logiciel, Data Science..."
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="graduationYear" className="text-xs font-medium">Année de promotion / diplôme</Label>
                    <Input
                      id="graduationYear"
                      type="number"
                      value={profileData.graduationYear}
                      onChange={(e) => setProfileData({ ...profileData, graduationYear: e.target.value })}
                      placeholder="2026"
                      className="h-9 w-32 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  {profileSuccess ? (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in-50">
                      <CheckCircle2 className="h-4 w-4" /> Modifications enregistrées !
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Modifications sauvegardées sur le serveur</span>
                  )}
                  <Button
                    size="sm"
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    className="h-9 text-xs"
                  >
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    Enregistrer le profil
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 2. Account & Security Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              {/* Password update */}
              <Card className="border border-border/70 shadow-xs">
                <CardHeader className="pb-4 border-b">
                  <CardTitle className="text-base font-semibold">Mot de passe de connexion</CardTitle>
                  <CardDescription className="text-xs">
                    Protégez l'accès à vos candidatures en maintenant un mot de passe sécurisé
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="currentPassword" className="text-xs font-medium">Mot de passe actuel</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="newPassword" className="text-xs font-medium">Nouveau mot de passe</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword" className="text-xs font-medium">Confirmation</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                  {passwordData.newPassword &&
                    passwordData.confirmPassword &&
                    passwordData.newPassword !== passwordData.confirmPassword && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Les mots de passe saisis ne correspondent pas.
                      </p>
                    )}

                  <div className="flex items-center justify-between pt-3">
                    {passwordSuccess && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Mot de passe mis à jour !
                      </span>
                    )}
                    <Button
                      size="sm"
                      onClick={handleChangePassword}
                      disabled={
                        changePasswordMutation.isPending ||
                        !passwordData.currentPassword ||
                        !passwordData.newPassword ||
                        passwordData.newPassword !== passwordData.confirmPassword
                      }
                      className="h-9 text-xs ml-auto"
                    >
                      Mettre à jour
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* RGPD Export */}
              <Card className="border border-border/70 shadow-xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-semibold">Portabilité des données (RGPD)</CardTitle>
                  <CardDescription className="text-xs">
                    Téléchargez l'intégralité de vos candidatures, documents et rappels enregistrés
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Conformément à l'Article 20 du RGPD, vous disposez d'un droit à la portabilité. Vos données sont exportables immédiatement aux formats ouverts standards.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
                        window.location.href = `${apiBaseUrl}/user/export?format=json`;
                      }}
                      className="h-8 text-xs"
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Exporter en JSON
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
                        window.location.href = `${apiBaseUrl}/user/export?format=csv`;
                      }}
                      className="h-8 text-xs"
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Exporter en CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Synchronisation Calendrier (TICK-403) */}
              <Card className="border border-border/70 shadow-xs">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        Synchronisation Agenda & Calendrier (.ics)
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Exportez tous vos entretiens et rappels vers Google Agenda, Apple Calendar ou Outlook
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Le format universel <strong>iCalendar (.ics)</strong> vous permet d'intégrer en quelques secondes tous vos créneaux et relances prévus sur votre téléphone ou ordinateur sans partager vos identifiants.
                  </p>
                  <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground space-y-1.5 border border-border/50">
                    <p className="font-semibold text-foreground text-[11px] uppercase tracking-wider">Comment l'utiliser :</p>
                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                      <li><strong>Apple Calendar (Mac / iPhone) :</strong> Ouvrez simplement le fichier téléchargé.</li>
                      <li><strong>Google Agenda :</strong> Paramètres ➔ Importer et exporter ➔ Sélectionner le fichier .ics.</li>
                      <li><strong>Outlook :</strong> Fichier ➔ Ouvrir et exporter ➔ Importer un calendrier iCalendar.</li>
                    </ul>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCalendar}
                      disabled={isExportingCalendar}
                      className="h-8 text-xs font-semibold"
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      {isExportingCalendar ? 'Export en cours...' : 'Télécharger mon agenda (.ics)'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border border-red-500/30 bg-red-500/5 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Zone de danger
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Déconnexion de votre session ou suppression définitive de votre compte
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 flex flex-wrap items-center justify-between gap-3">
                  <Button variant="outline" size="sm" onClick={handleLogout} className="h-8 text-xs">
                    <LogOut className="mr-1.5 h-3.5 w-3.5" />
                    Se déconnecter
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="h-8 text-xs"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Supprimer mon compte
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 3. Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card className="border border-border/70 shadow-xs">
              <CardHeader className="pb-4 border-b">
                <CardTitle className="text-base font-semibold">Préférences de notification</CardTitle>
                <CardDescription className="text-xs">
                  Ajustez les alertes et les fréquences de relance de candidatures
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-6">
                {/* Email Notifications */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label htmlFor="emailNotifications" className="text-xs font-semibold cursor-pointer">
                      Rappels et alertes par email
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Recevez un récapitulatif par email le matin de chaque échéance programmée
                    </p>
                  </div>
                  <Checkbox
                    id="emailNotifications"
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => {
                      const updated = { ...notifications, emailNotifications: !!checked };
                      setNotifications(updated);
                      updateNotificationsMutation.mutate(updated);
                    }}
                  />
                </div>

                {/* Browser Push */}
                <div className="flex items-start justify-between gap-4 pt-4 border-t">
                  <div>
                    <Label className="text-xs font-semibold">Notifications navigateur</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Notifications système en temps réel lorsque l'onglet est actif
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const granted = await requestNotificationPermission();
                      if (granted) {
                        showBrowserNotification('Notifications activées !', {
                          body: 'Vous recevrez désormais vos rappels ici.',
                        });
                      }
                    }}
                    className="h-8 text-xs"
                  >
                    {getNotificationPermission() === 'granted' ? 'Tester' : 'Activer'}
                  </Button>
                </div>

                {/* Relance Frequency */}
                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="relanceFrequency" className="text-xs font-semibold">
                    Fréquence des relances suggérées (jours)
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="relanceFrequency"
                      type="number"
                      min="1"
                      max="30"
                      value={notifications.relanceFrequency}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        if (value > 0) {
                          setNotifications({ ...notifications, relanceFrequency: value });
                        }
                      }}
                      onBlur={() => updateNotificationsMutation.mutate(notifications)}
                      className="h-9 w-24 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">jours sans retour recruteur</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Délai recommandé : 7 à 10 jours ouvrés pour relancer poliment une entreprise.
                  </p>
                </div>

                {updateNotificationsMutation.isSuccess && (
                  <Badge variant="outline" className="text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30 text-xs">
                    Préférences de notification mises à jour
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}

          {/* 4. Appearance Tab */}
          {activeTab === 'appearance' && (
            <Card className="border border-border/70 shadow-xs">
              <CardHeader className="pb-4 border-b">
                <CardTitle className="text-base font-semibold">Thème de l'interface</CardTitle>
                <CardDescription className="text-xs">
                  Choisissez votre environnement de travail favori
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: 'Clair', icon: Sun, desc: 'Luminosité standard et contrastes fins' },
                    { value: 'dark', label: 'Sombre', icon: Moon, desc: 'Repos visuel et contraste feutré' },
                    { value: 'system', label: 'Système', icon: Monitor, desc: 'Synchronisé avec votre OS' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value as Theme)}
                      className={cn(
                        'flex flex-col text-left p-3.5 rounded-lg border-2 transition-all duration-150',
                        theme === option.value
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/10'
                          : 'border-border/70 hover:border-border hover:bg-muted/40'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <option.icon className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold">{option.label}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        {option.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg text-red-600 dark:text-red-400">
              Supprimer mon compte définitivement
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cette action est irréversible. L'ensemble de vos candidatures, documents, rappels et statistiques seront supprimés de manière permanente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(false)} className="h-9 text-xs">
              Annuler
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteAccountMutation.mutate()}
              disabled={deleteAccountMutation.isPending}
              className="h-9 text-xs"
            >
              Confirmer la suppression
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
