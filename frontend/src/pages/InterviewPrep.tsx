import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  MessageSquare,
  Lightbulb,
  Star,
  MoreVertical,
  Edit,
  Trash2,
  BookOpen,
  Copy,
  Bot,
  Mic,
  ChevronDown,
  Building2,
  HelpCircle,
  Target,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import { applicationsService } from '@/services/applications.service';
import { InterviewSimulation } from '@/components/InterviewSimulation';
import type { InterviewPrep } from '@/types';
import { toast } from 'sonner';

type QuestionCategory = 'BEHAVIORAL' | 'TECHNICAL' | 'SITUATIONAL' | 'COMPANY_SPECIFIC' | 'OTHER';

const categoryLabels: Record<QuestionCategory, string> = {
  BEHAVIORAL: 'Comportemental',
  TECHNICAL: 'Technique',
  SITUATIONAL: 'Situationnel',
  COMPANY_SPECIFIC: 'Spécifique entreprise',
  OTHER: 'Autre',
};

const categoryColors: Record<QuestionCategory, string> = {
  BEHAVIORAL: 'bg-secondary text-status-sent border-border   ',
  TECHNICAL: 'bg-secondary text-status-interview border-border   ',
  SITUATIONAL: 'bg-success/10 text-success border-success/40   ',
  COMPANY_SPECIFIC: 'bg-warning-soft text-warning-strong border-warning/40   ',
  OTHER: 'bg-muted text-foreground border-border   ',
};

const interviewPrepService = {
  getAll: async (): Promise<InterviewPrep[]> => {
    const response = await api.get('/interview-prep');
    return response.data;
  },
  create: async (data: Partial<InterviewPrep>): Promise<InterviewPrep> => {
    const response = await api.post('/interview-prep', data);
    return response.data;
  },
  update: async (id: string, data: Partial<InterviewPrep>): Promise<InterviewPrep> => {
    const response = await api.put(`/interview-prep/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/interview-prep/${id}`);
  },
};

export function InterviewPrepPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab & application selection from query params if available
  const tabParam = searchParams.get('tab');
  const appParam = searchParams.get('applicationId');

  const [activeTab, setActiveTab] = useState<string>(tabParam || 'questions');
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>(appParam || '');
  const [simulationMode, setSimulationMode] = useState<'application' | 'free'>('application');
  const [freeTargetRole, setFreeTargetRole] = useState('Développeur Full-Stack');
  const [freeContractType, setFreeContractType] = useState('CDI');
  const [freeJobDescription, setFreeJobDescription] = useState('');
  const [isFreePracticeActive, setIsFreePracticeActive] = useState(false);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<QuestionCategory | 'all'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<InterviewPrep | null>(null);
  const [showStarGuide, setShowStarGuide] = useState(false);

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'BEHAVIORAL' as QuestionCategory,
    notes: '',
    isFavorite: false,
  });

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);

  useEffect(() => {
    if (appParam) {
      setSelectedApplicationId(appParam);
      setSimulationMode('application');
    }
  }, [appParam]);

  const { data: questions, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['interview-prep'],
    queryFn: interviewPrepService.getAll,
  });

  const { data: applicationsData, isLoading: isLoadingApplications } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsService.getAll({}, 1, 100),
  });
  const applications = applicationsData?.data;

  const createMutation = useMutation({
    mutationFn: interviewPrepService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-prep'] });
      toast.success('Question ajoutée');
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InterviewPrep> }) =>
      interviewPrepService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-prep'] });
      toast.success('Question mise à jour');
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: interviewPrepService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-prep'] });
      toast.success('Question supprimée');
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      interviewPrepService.update(id, { isFavorite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-prep'] });
    },
  });

  const closeDialog = () => {
    setShowCreateDialog(false);
    setEditingQuestion(null);
    setShowStarGuide(false);
    setFormData({
      question: '',
      answer: '',
      category: 'BEHAVIORAL',
      notes: '',
      isFavorite: false,
    });
  };

  const openEditDialog = (question: InterviewPrep) => {
    setEditingQuestion(question);
    setFormData({
      question: question.question,
      answer: question.answer || '',
      category: question.category as QuestionCategory,
      notes: question.notes || '',
      isFavorite: question.isFavorite,
    });
    setShowCreateDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.question.trim()) return;

    if (editingQuestion) {
      updateMutation.mutate({ id: editingQuestion.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Réponse copiée dans le presse-papier');
  };

  const filteredQuestions = useMemo(() => {
    return questions?.filter((q) => {
      const matchesSearch =
        !search ||
        q.question.toLowerCase().includes(search.toLowerCase()) ||
        q.answer?.toLowerCase().includes(search.toLowerCase()) ||
        q.notes?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || q.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [questions, search, categoryFilter]);

  const favoriteQuestions = useMemo(() => filteredQuestions?.filter((q) => q.isFavorite) || [], [filteredQuestions]);
  const regularQuestions = useMemo(() => filteredQuestions?.filter((q) => !q.isFavorite) || [], [filteredQuestions]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: questions?.length || 0 };
    questions?.forEach((q) => {
      counts[q.category] = (counts[q.category] || 0) + 1;
    });
    return counts;
  }, [questions]);

  if (isLoadingQuestions || isLoadingApplications) {
    return <InterviewPrepSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
      {/* 1. Header sobre & fonctionnel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/40 w-full min-w-0 animate-in fade-in-50 duration-300">
        <div className="space-y-1 min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground truncate">
            Préparation & Simulation d'entretien
          </h1>
          <p className="text-sm text-muted-foreground truncate">
            Révisez vos questions types et entraînez-vous en conditions réelles avec l'IA
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
          {activeTab === 'questions' ? (
            <Button
              onClick={() => setShowCreateDialog(true)}
              size="sm"
              className="w-full sm:w-auto h-9 font-medium"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Nouvelle question
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('questions')}
              className="w-full sm:w-auto h-9 font-medium"
            >
              <BookOpen className="mr-1.5 h-4 w-4" />
              Voir les questions
            </Button>
          )}
        </div>
      </div>

      {/* 2. Onglets principaux */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val);
          setSearchParams((prev) => {
            prev.set('tab', val);
            return prev;
          });
        }}
        className="space-y-6 w-full min-w-0"
      >
        <div className="flex items-center justify-between border-b border-border/40 pb-2 overflow-x-auto w-full min-w-0">
          <TabsList className="bg-muted/60 p-1 h-9 rounded-lg">
            <TabsTrigger value="questions" className="text-xs font-medium px-3.5 gap-2">
              <BookOpen className="h-3.5 w-3.5" />
              Banque de questions ({questions?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="simulation" className="text-xs font-medium px-3.5 gap-2">
              <Bot className="h-3.5 w-3.5 text-primary" />
              Simulation IA
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: BANQUE DE QUESTIONS */}
        <TabsContent value="questions" className="space-y-6 m-0 w-full min-w-0">
          {/* Barre de recherche et filtres fins */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
            <div className="relative flex-1 max-w-sm w-full min-w-0">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une question ou un mot-clé..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-lg"
              />
            </div>

            {/* Chips de catégories */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                  categoryFilter === 'all'
                    ? 'bg-foreground text-background font-semibold'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                )}
              >
                Toutes ({categoryCounts.all || 0})
              </button>
              {(['BEHAVIORAL', 'TECHNICAL', 'SITUATIONAL', 'COMPANY_SPECIFIC'] as QuestionCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                    categoryFilter === cat
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                  )}
                >
                  {categoryLabels[cat]} ({categoryCounts[cat] || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Questions Favorites */}
          {favoriteQuestions.length > 0 && (
            <div className="space-y-3 w-full min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Star className="h-3.5 w-3.5 text-warning-strong fill-warning" />
                <span>Questions clés favorites ({favoriteQuestions.length})</span>
              </div>
              <div className="space-y-2.5 w-full min-w-0">
                {favoriteQuestions.map((q) => (
                  <QuestionCardItem
                    key={q.id}
                    question={q}
                    onEdit={() => openEditDialog(q)}
                    onDelete={() => deleteMutation.mutate(q.id)}
                    onToggleFavorite={() =>
                      toggleFavoriteMutation.mutate({ id: q.id, isFavorite: !q.isFavorite })
                    }
                    onCopy={copyToClipboard}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Autres Questions */}
          {regularQuestions.length > 0 && (
            <div className="space-y-3 w-full min-w-0">
              {favoriteQuestions.length > 0 && (
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2">
                  <span>Toutes les questions ({regularQuestions.length})</span>
                </div>
              )}
              <div className="space-y-2.5 w-full min-w-0">
                {regularQuestions.map((q) => (
                  <QuestionCardItem
                    key={q.id}
                    question={q}
                    onEdit={() => openEditDialog(q)}
                    onDelete={() => deleteMutation.mutate(q.id)}
                    onToggleFavorite={() =>
                      toggleFavoriteMutation.mutate({ id: q.id, isFavorite: !q.isFavorite })
                    }
                    onCopy={copyToClipboard}
                  />
                ))}
              </div>
            </div>
          )}

          {/* État vide */}
          {filteredQuestions?.length === 0 && (
            <div className="text-center py-12 px-4 border border-dashed rounded-lg bg-card">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <h3 className="text-sm font-semibold text-foreground">Aucune question trouvée</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                {search || categoryFilter !== 'all'
                  ? 'Aucune question ne correspond à vos filtres actuels.'
                  : 'Constituez votre banque de questions pour préparer vos réponses calmement.'}
              </p>
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Ajouter une question
              </Button>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: SIMULATION IA */}
        <TabsContent value="simulation" className="space-y-5 m-0 w-full min-w-0">
          {/* Segmented switcher: Entraînement libre vs Candidature ciblée */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 bg-muted/40 rounded-lg border border-border/60">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSimulationMode('free')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  simulationMode === 'free'
                    ? 'bg-background text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Target className="h-3.5 w-3.5 text-primary" />
                <span>Entraînement libre</span>
              </button>
              <button
                type="button"
                onClick={() => setSimulationMode('application')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  simulationMode === 'application'
                    ? 'bg-background text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <span>Candidature ciblée ({applications?.length || 0})</span>
              </button>
            </div>
            <div className="text-[11px] text-muted-foreground px-2">
              {simulationMode === 'free'
                ? 'Simulation directe sans polluer votre tableau de bord'
                : "Questions calibrées sur l'entreprise & l'offre"}
            </div>
          </div>

          {simulationMode === 'free' ? (
            !isFreePracticeActive ? (
              <Card className="border-border/80 w-full min-w-0 overflow-hidden">
                <CardHeader className="p-4 sm:p-5 border-b border-border/40">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Paramètres de l'entraînement libre
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Précisez le poste et le type de contrat pour adapter le niveau d'exigence et le scénario de l'entretien.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Poste visé *</Label>
                      <Input
                        placeholder="Ex: Développeur Full-Stack, Product Manager..."
                        value={freeTargetRole}
                        onChange={(e) => setFreeTargetRole(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Type de contrat</Label>
                      <Select value={freeContractType} onValueChange={setFreeContractType}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CDI">CDI</SelectItem>
                          <SelectItem value="CDD">CDD</SelectItem>
                          <SelectItem value="STAGE">Stage</SelectItem>
                          <SelectItem value="ALTERNANCE">Alternance</SelectItem>
                          <SelectItem value="FREELANCE">Freelance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Fiche de poste ou compétences clés (optionnel)</Label>
                    <Textarea
                      placeholder="Copiez-collez une description d'offre ou listez des mots-clés / compétences clés (ex: React, Node, microservices, agilité)..."
                      value={freeJobDescription}
                      onChange={(e) => setFreeJobDescription(e.target.value)}
                      rows={3}
                      className="text-xs resize-none"
                    />
                  </div>

                  <Button
                    onClick={() => setIsFreePracticeActive(true)}
                    disabled={!freeTargetRole.trim()}
                    className="w-full h-10 text-xs font-semibold"
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    Lancer la simulation libre
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/80 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-primary/40 text-primary font-medium">
                      Entraînement libre
                    </Badge>
                    <span className="font-semibold text-foreground">{freeTargetRole}</span>
                    <span className="text-muted-foreground">• {freeContractType}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setIsFreePracticeActive(false)}
                  >
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                    Changer de poste
                  </Button>
                </div>

                <InterviewSimulation
                  isFreePractice={true}
                  defaultTargetRole={freeTargetRole}
                  defaultContractType={freeContractType}
                  defaultJobDescription={freeJobDescription}
                />
              </div>
            )
          ) : (
            <Card className="border-border/80 w-full min-w-0 overflow-hidden">
              <CardHeader className="p-4 sm:p-5 border-b border-border/40">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      Candidature ciblée pour l'entretien
                    </CardTitle>
                    <CardDescription className="text-xs">
                      L'IA contextualisera ses questions à partir de l'entreprise et de l'offre choisie.
                    </CardDescription>
                  </div>

                  <div className="w-full sm:w-72 flex-shrink-0">
                    <Select
                      value={selectedApplicationId}
                      onValueChange={(val) => {
                        setSelectedApplicationId(val);
                        setSearchParams((prev) => {
                          prev.set('applicationId', val);
                          return prev;
                        });
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Choisir une opportunité..." />
                      </SelectTrigger>
                      <SelectContent>
                        {applications?.map((app) => (
                          <SelectItem key={app.id} value={app.id} className="text-xs">
                            {app.companyName} — {app.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0 sm:p-4 w-full min-w-0">
                {selectedApplicationId ? (
                  <div className="w-full min-w-0">
                    <InterviewSimulation applicationId={selectedApplicationId} />
                  </div>
                ) : (
                  <div className="py-16 text-center px-4 space-y-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Sélectionnez une candidature</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Choisissez une entreprise dans la liste ci-dessus pour lancer une session d'entraînement personnalisée.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Créer / Modifier une Question avec Guide STAR */}
      <Dialog open={showCreateDialog} onOpenChange={closeDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Modifier la question' : 'Nouvelle question type'}
            </DialogTitle>
            <DialogDescription>
              Structurez vos réponses pour aborder vos prochains entretiens avec sérénité.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Question d'entretien *</Label>
              <Textarea
                placeholder="Ex: Parlez-moi d'une situation où vous avez surmonté un conflit technique..."
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                rows={2}
                className="text-xs sm:text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v as QuestionCategory })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEHAVIORAL" className="text-xs">Comportemental</SelectItem>
                    <SelectItem value="TECHNICAL" className="text-xs">Technique</SelectItem>
                    <SelectItem value="SITUATIONAL" className="text-xs">Situationnel</SelectItem>
                    <SelectItem value="COMPANY_SPECIFIC" className="text-xs">Spécifique entreprise</SelectItem>
                    <SelectItem value="OTHER" className="text-xs">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end pb-0.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStarGuide(!showStarGuide)}
                  className="w-full h-9 text-xs text-muted-foreground hover:text-foreground"
                >
                  <HelpCircle className="h-3.5 w-3.5 mr-1 text-primary" />
                  {showStarGuide ? 'Masquer méthode STAR' : 'Méthode STAR'}
                </Button>
              </div>
            </div>

            {/* Méthode STAR explicative */}
            {showStarGuide && (
              <div className="p-3.5 rounded-lg bg-muted/50 border border-border/80 text-xs space-y-1.5 text-muted-foreground animate-in fade-in-50 duration-200">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Mic className="h-3.5 w-3.5 text-primary" />
                  Structurez avec la méthode STAR :
                </div>
                <ul className="space-y-1 list-disc list-inside text-[11px] leading-relaxed">
                  <li><strong>S (Situation)</strong> : Le contexte de votre expérience.</li>
                  <li><strong>T (Tâche)</strong> : L'objectif ou le problème à résoudre.</li>
                  <li><strong>A (Action)</strong> : Ce que VOUS avez concrètement entrepris.</li>
                  <li><strong>R (Résultat)</strong> : Les bénéfices quantifiés ou le bilan d'apprentissage.</li>
                </ul>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Réponse préparée</Label>
              <Textarea
                placeholder="Rédigez les points clés de votre réponse..."
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                rows={4}
                className="text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Notes personnelles ou mots-clés</Label>
              <Input
                placeholder="Ex: mentionner le projet React/Node, parler du délai de 48h..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog} size="sm">
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.question.trim()} size="sm">
              {editingQuestion ? 'Enregistrer' : 'Créer la question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Composant individuel de carte de question sobre et pliable
function QuestionCardItem({
  question,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopy,
}: {
  question: InterviewPrep;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onCopy: (text: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border/80 bg-card hover:border-border transition-all overflow-hidden w-full min-w-0">
      <div
        className="p-3.5 sm:p-4 flex items-start justify-between gap-3 cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className={cn(
                'text-[10px] font-medium border-0 px-2 py-0.5',
                categoryColors[question.category as QuestionCategory] || 'bg-muted text-muted-foreground'
              )}
            >
              {categoryLabels[question.category as QuestionCategory] || question.category}
            </Badge>

            {question.answer && (
              <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/40">
                Réponse prête
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-foreground leading-snug">
            {question.question}
          </h3>
        </div>

        {/* Actions rapides à droite */}
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFavorite}
            className="h-8 w-8 text-muted-foreground hover:text-warning-strong"
          >
            <Star
              className={cn(
                'h-4 w-4',
                question.isFavorite ? 'text-warning-strong fill-warning' : 'text-muted-foreground/60'
              )}
            />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              {question.answer && (
                <DropdownMenuItem onClick={() => onCopy(question.answer!)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copier la réponse
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')} />
          </Button>
        </div>
      </div>

      {/* Contenu dépliable */}
      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-border/40 bg-muted/15 space-y-3 w-full min-w-0">
          {question.answer ? (
            <div className="space-y-1.5 pt-2">
              <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span>Réponse préparée :</span>
                <button
                  type="button"
                  onClick={() => onCopy(question.answer!)}
                  className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <Copy className="h-3 w-3" />
                  Copier
                </button>
              </div>
              <div className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed p-3.5 rounded-lg bg-card border border-border/60">
                {question.answer}
              </div>
            </div>
          ) : (
            <div className="py-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Aucune réponse rédigée pour cette question.</span>
              <Button variant="outline" size="sm" onClick={onEdit} className="h-7 text-xs">
                Rédiger
              </Button>
            </div>
          )}

          {question.notes && (
            <div className="text-xs text-muted-foreground flex items-start gap-1.5 pt-1">
              <Lightbulb className="h-3.5 w-3.5 text-warning-strong flex-shrink-0 mt-0.5" />
              <span>Notes : {question.notes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InterviewPrepSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/40">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
