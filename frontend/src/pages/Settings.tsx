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
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore, type Theme } from '@/store/uiStore';
import { authService } from '@/services/auth.service';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  getNotificationPermission,
  requestNotificationPermission,
  showBrowserNotification,
} from '@/utils/notifications';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'notifications' | 'appearance'>('profile');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
    mutationFn: (data: typeof profileData) => authService.updateProfile({
      ...data,
      graduationYear: data.graduationYear ? parseInt(data.graduationYear, 10) : undefined,
    }),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authService.updatePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
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
    mutationFn: (data: typeof notifications) => authService.updateProfile(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'account', label: 'Compte', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Apparence', icon: Sun },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez votre compte et vos préférences
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>
                  Mettez à jour vos informations de profil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) =>
                        setProfileData({ ...profileData, firstName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) =>
                        setProfileData({ ...profileData, lastName: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({ ...profileData, email: e.target.value })
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Informations académiques
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="school">École / Université</Label>
                      <Input
                        id="school"
                        value={profileData.school}
                        onChange={(e) =>
                          setProfileData({ ...profileData, school: e.target.value })
                        }
                        placeholder="Ex: EPITECH, HEC..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fieldOfStudy">Domaine d'études</Label>
                      <Input
                        id="fieldOfStudy"
                        value={profileData.fieldOfStudy}
                        onChange={(e) =>
                          setProfileData({ ...profileData, fieldOfStudy: e.target.value })
                        }
                        placeholder="Ex: Informatique, Commerce..."
                      />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="graduationYear">Année de diplôme</Label>
                    <Input
                      id="graduationYear"
                      type="number"
                      value={profileData.graduationYear}
                      onChange={(e) =>
                        setProfileData({ ...profileData, graduationYear: e.target.value })
                      }
                      placeholder="2025"
                      className="max-w-32"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Changer le mot de passe</CardTitle>
                  <CardDescription>
                    Mettez à jour votre mot de passe de connexion
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmer</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  {passwordData.newPassword &&
                    passwordData.confirmPassword &&
                    passwordData.newPassword !== passwordData.confirmPassword && (
                      <p className="text-sm text-destructive">
                        Les mots de passe ne correspondent pas
                      </p>
                    )}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleChangePassword}
                      disabled={
                        changePasswordMutation.isPending ||
                        !passwordData.currentPassword ||
                        !passwordData.newPassword ||
                        passwordData.newPassword !== passwordData.confirmPassword
                      }
                    >
                      Mettre à jour
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Session</CardTitle>
                  <CardDescription>
                    Gérez votre session de connexion
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Se déconnecter
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Exporter mes données</CardTitle>
                  <CardDescription>
                    Téléchargez toutes vos données personnelles (RGPD Article 15)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Vous pouvez exporter l'ensemble de vos données (candidatures, documents, rappels, entreprises) 
                    aux formats JSON ou CSV.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
                        window.location.href = `${apiBaseUrl}/user/export?format=json`;
                      }}
                    >
                      Exporter en JSON
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
                        window.location.href = `${apiBaseUrl}/user/export?format=csv`;
                      }}
                    >
                      Exporter en CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Zone de danger</CardTitle>
                  <CardDescription>
                    Actions irréversibles sur votre compte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer mon compte
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Préférences de notifications</CardTitle>
                <CardDescription>
                  Choisissez comment vous souhaitez être notifié
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Notifications par email</h4>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Label htmlFor="emailNotifications" className="font-medium cursor-pointer">
                          Recevoir les rappels par email
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Recevez un email à l'heure programmée pour chaque rappel
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
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Notifications navigateur</h4>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Label className="font-medium">
                          Activer les notifications push
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Recevez des notifications sur votre appareil (navigateur ouvert)
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={async () => {
                          const granted = await requestNotificationPermission();
                          if (granted) {
                            showBrowserNotification('Notifications activées !', {
                              body: 'Vous recevrez désormais vos rappels ici.'
                            });
                          }
                        }}
                      >
                        {getNotificationPermission() === 'granted' ? 'Test' : 'Activer'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Fréquence de relance</h4>
                  <div className="space-y-2">
                    <Label htmlFor="relanceFrequency">
                      Nombre de jours avant relance automatique
                    </Label>
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
                      className="w-32"
                    />
                    <p className="text-sm text-muted-foreground">
                      Délai recommandé après une candidature sans réponse
                    </p>
                  </div>
                </div>

                {updateNotificationsMutation.isSuccess && (
                  <Badge variant="outline" className="text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/30">
                    Préférences enregistrées
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Apparence</CardTitle>
                <CardDescription>
                  Personnalisez l'apparence de l'application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Thème</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', label: 'Clair', icon: Sun },
                      { value: 'dark', label: 'Sombre', icon: Moon },
                      { value: 'system', label: 'Système', icon: Monitor },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value as Theme)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                          theme === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-primary/50'
                        )}
                      >
                        <option.icon className="h-6 w-6" />
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {theme === 'system' 
                      ? 'Le thème s\'adapte automatiquement aux préférences de votre système'
                      : theme === 'dark'
                        ? 'Mode sombre activé'
                        : 'Mode clair activé'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer mon compte</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est
              irréversible et supprimera toutes vos données.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteAccountMutation.mutate()}
              disabled={deleteAccountMutation.isPending}
            >
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
