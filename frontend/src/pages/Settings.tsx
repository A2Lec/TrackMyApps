import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Briefcase,
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
    emailReminders: true,
    emailWeeklyReport: true,
    browserNotifications: false,
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
      authService.changePassword(data.currentPassword, data.newPassword),
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
                  <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <p className="font-medium">Rappels</p>
                        <p className="text-sm text-muted-foreground">
                          Recevez un email pour chaque rappel programmé
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.emailReminders}
                        onChange={(e) =>
                          setNotifications({ ...notifications, emailReminders: e.target.checked })
                        }
                        className="h-4 w-4"
                        disabled
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <p className="font-medium">Rapport hebdomadaire</p>
                        <p className="text-sm text-muted-foreground">
                          Résumé de vos candidatures chaque semaine
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.emailWeeklyReport}
                        onChange={(e) =>
                          setNotifications({ ...notifications, emailWeeklyReport: e.target.checked })
                        }
                        className="h-4 w-4"
                        disabled
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Notifications navigateur</h4>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-medium">Notifications push</p>
                      <p className="text-sm text-muted-foreground">
                        Recevez des notifications dans votre navigateur
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.browserNotifications}
                      onChange={(e) =>
                        setNotifications({ ...notifications, browserNotifications: e.target.checked })
                      }
                      className="h-4 w-4"
                      disabled
                    />
                  </label>
                </div>

                <Badge variant="outline" className="text-yellow-700 bg-yellow-50">
                  Les notifications par email sont désactivées pour le moment
                </Badge>
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
