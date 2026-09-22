import { useState } from 'react';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
  CheckCircle,
  Filter,
  BookOpen,
  Copy,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import { applicationsService } from '@/services/applications.service';
import { InterviewSimulation } from '@/components/InterviewSimulation';
import type { InterviewPrep } from '@/types';

type QuestionCategory = 'BEHAVIORAL' | 'TECHNICAL' | 'SITUATIONAL' | 'COMPANY_SPECIFIC' | 'OTHER';

const categoryLabels: Record<QuestionCategory, string> = {
  BEHAVIORAL: 'Comportemental',
  TECHNICAL: 'Technique',
  SITUATIONAL: 'Situationnel',
  COMPANY_SPECIFIC: 'Spécifique entreprise',
  OTHER: 'Autre',
};

const categoryColors: Record<QuestionCategory, string> = {
  BEHAVIORAL: 'bg-blue-500/10 text-blue-700 border-blue-200',
  TECHNICAL: 'bg-purple-500/10 text-purple-700 border-purple-200',
  SITUATIONAL: 'bg-green-500/10 text-green-700 border-green-200',
  COMPANY_SPECIFIC: 'bg-orange-500/10 text-orange-700 border-orange-200',
  OTHER: 'bg-gray-500/10 text-gray-700 border-gray-200',
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
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<QuestionCategory | 'all'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<InterviewPrep | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>('');
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'BEHAVIORAL' as QuestionCategory,
    notes: '',
    isFavorite: false,
  });

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
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InterviewPrep> }) =>
      interviewPrepService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-prep'] });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: interviewPrepService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-prep'] });
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
    if (!formData.question) return;

    if (editingQuestion) {
      updateMutation.mutate({ id: editingQuestion.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filteredQuestions = questions?.filter((q) => {
    const matchesSearch =
      !search ||
      q.question.toLowerCase().includes(search.toLowerCase()) ||
      q.answer?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || q.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const favoriteQuestions = filteredQuestions?.filter((q) => q.isFavorite);
  const otherQuestions = filteredQuestions?.filter((q) => !q.isFavorite);

  if (isLoadingQuestions || isLoadingApplications) {
    return <InterviewPrepSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Préparation entretiens</h1>
          <p className="text-muted-foreground">
            Préparez vos réponses et entraînez-vous avec l'IA
          </p>
        </div>
      </div>

      <Tabs defaultValue="questions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="questions" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Banque de questions
          </TabsTrigger>
          <TabsTrigger value="simulation" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Simulation IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle question
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={categoryFilter}
                onValueChange={(v) => setCategoryFilter(v as QuestionCategory | 'all')}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  <SelectItem value="BEHAVIORAL">Comportemental</SelectItem>
                  <SelectItem value="TECHNICAL">Technique</SelectItem>
                  <SelectItem value="SITUATIONAL">Situationnel</SelectItem>
                  <SelectItem value="COMPANY_SPECIFIC">Spécifique entreprise</SelectItem>
                  <SelectItem value="OTHER">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-semibold">{questions?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {(['BEHAVIORAL', 'TECHNICAL', 'SITUATIONAL', 'COMPANY_SPECIFIC'] as QuestionCategory[]).map(
              (category) => (
                <Card key={category}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg', categoryColors[category].split(' ')[0])}>
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{categoryLabels[category]}</p>
                        <p className="text-xl font-semibold">
                          {questions?.filter((q) => q.category === category).length || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>

          {/* Favorite Questions */}
          {favoriteQuestions && favoriteQuestions.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                Questions favorites ({favoriteQuestions.length})
              </h2>
              <Accordion type="multiple" className="space-y-2">
                {favoriteQuestions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    onEdit={() => openEditDialog(question)}
                    onDelete={() => deleteMutation.mutate(question.id)}
                    onToggleFavorite={() =>
                      toggleFavoriteMutation.mutate({ id: question.id, isFavorite: !question.isFavorite })
                    }
                    onCopy={copyToClipboard}
                  />
                ))}
              </Accordion>
            </div>
          )}

          {/* Other Questions */}
          {otherQuestions && otherQuestions.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">
                Toutes les questions ({otherQuestions.length})
              </h2>
              <Accordion type="multiple" className="space-y-2">
                {otherQuestions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    onEdit={() => openEditDialog(question)}
                    onDelete={() => deleteMutation.mutate(question.id)}
                    onToggleFavorite={() =>
                      toggleFavoriteMutation.mutate({ id: question.id, isFavorite: !question.isFavorite })
                    }
                    onCopy={copyToClipboard}
                  />
                ))}
              </Accordion>
            </div>
          )}

          {filteredQuestions?.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune question</h3>
              <p className="text-muted-foreground mb-4">
                {search || categoryFilter !== 'all'
                  ? 'Aucune question ne correspond à votre recherche'
                  : 'Ajoutez votre première question pour commencer à vous préparer'}
              </p>
              {!search && categoryFilter === 'all' && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle question
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="simulation">
          <Card>
            <CardHeader>
              <CardTitle>Simulation d'entretien</CardTitle>
              <CardDescription>
                Sélectionnez une candidature pour démarrer une simulation d'entretien personnalisée avec l'IA.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="max-w-md space-y-2">
                <Label>Candidature à préparer</Label>
                <Select value={selectedApplicationId} onValueChange={setSelectedApplicationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une candidature..." />
                  </SelectTrigger>
                  <SelectContent>
                    {applications?.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.companyName} - {app.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedApplicationId ? (
                <div className="mt-6 border rounded-lg overflow-hidden">
                  <InterviewSimulation applicationId={selectedApplicationId} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  <Bot className="h-12 w-12 mb-4 opacity-50" />
                  <h3 className="text-lg font-medium">Prêt à vous entraîner ?</h3>
                  <p>Sélectionnez une candidature ci-dessus pour commencer la simulation.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={closeDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Modifier la question' : 'Nouvelle question'}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion
                ? 'Modifiez votre question et votre réponse préparée'
                : 'Ajoutez une question d\'entretien et préparez votre réponse'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="question">Question *</Label>
              <Textarea
                id="question"
                placeholder="Parlez-moi de vous..."
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v as QuestionCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEHAVIORAL">Comportemental</SelectItem>
                  <SelectItem value="TECHNICAL">Technique</SelectItem>
                  <SelectItem value="SITUATIONAL">Situationnel</SelectItem>
                  <SelectItem value="COMPANY_SPECIFIC">Spécifique entreprise</SelectItem>
                  <SelectItem value="OTHER">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer">Réponse préparée</Label>
              <Textarea
                id="answer"
                placeholder="Votre réponse structurée..."
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Points clés à retenir, exemples..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingQuestion ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface QuestionCardProps {
  question: InterviewPrep;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onCopy: (text: string) => void;
}

function QuestionCard({ question, onEdit, onDelete, onToggleFavorite, onCopy }: QuestionCardProps) {
  return (
    <AccordionItem value={question.id} className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3 flex-1 text-left">
          <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{question.question}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className={cn('text-xs', categoryColors[question.category as QuestionCategory])}
              >
                {categoryLabels[question.category as QuestionCategory]}
              </Badge>
              {question.answer && (
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Réponse prête
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggleFavorite}
            >
              <Star
                className={cn(
                  'h-4 w-4',
                  question.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'
                )}
              />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
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
                <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-4">
        {question.answer ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Réponse préparée</p>
              <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                {question.answer}
              </p>
            </div>
            {question.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  Notes
                </p>
                <p className="text-sm text-muted-foreground">{question.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Aucune réponse préparée pour cette question
            </p>
            <Button variant="outline" size="sm" className="mt-2" onClick={onEdit}>
              Préparer une réponse
            </Button>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function InterviewPrepSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80 mt-2" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}
