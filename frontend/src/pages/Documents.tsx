import { useState, useRef, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsService } from '@/services/documents.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  FileText,
  File,
  Download,
  Trash2,
  MoreVertical,
  Upload,
  Star,
  StarOff,
  ExternalLink,
  Eye,
  FileCheck2,
} from 'lucide-react';
import { formatDate, cn, documentTypeLabels, documentTypeColors } from '@/lib/utils';
import type { Document as DocType, DocumentType } from '@/types';

export function DocumentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadData, setUploadData] = useState({
    name: '',
    type: 'CV' as DocumentType,
    file: null as File | null,
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsService.getAll(),
  });

  const uploadMutation = useMutation({
    mutationFn: (data: { name: string; type: DocumentType; file: File }) => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('type', data.type);
      formData.append('file', data.file);
      return documentsService.upload(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowUploadDialog(false);
      setUploadData({ name: '', type: 'CV', file: null });
      toast.success('Document importé avec succès');
    },
    onError: (err: any) => {
      toast.error('Erreur: ' + (err.response?.data?.message || err.message || 'Échec de l\'import'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: documentsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document supprimé');
    },
  });

  const toggleDefaultMutation = useMutation({
    mutationFn: ({ id, isDefault }: { id: string; isDefault: boolean }) =>
      documentsService.update(id, { isDefault }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Statut du document mis à jour');
    },
  });

  const handleUpload = () => {
    if (!uploadData.name.trim() || !uploadData.file) return;
    uploadMutation.mutate({
      name: uploadData.name.trim(),
      type: uploadData.type,
      file: uploadData.file,
    });
  };

  const onSelectFile = (file: File) => {
    const rawName = file.name.replace(/\.[^/.]+$/, '');
    setUploadData((prev) => ({
      ...prev,
      file,
      name: prev.name || rawName,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectFile(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onSelectFile(file);
    }
  }, []);

  const filteredDocuments = useMemo(() => {
    return (documents || []).filter((doc: DocType) => {
      const matchesSearch =
        !search ||
        doc.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || doc.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [documents, search, typeFilter]);

  const countsByType = useMemo(() => {
    const list = documents || [];
    return {
      all: list.length,
      CV: list.filter((d) => d.type === 'CV').length,
      COVER_LETTER: list.filter((d) => d.type === 'COVER_LETTER' || d.type === 'LETTRE_MOTIVATION').length,
      PORTFOLIO: list.filter((d) => d.type === 'PORTFOLIO').length,
      OTHER: list.filter((d) => d.type === 'OTHER').length,
    };
  }, [documents]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes || isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  if (isLoading) {
    return <DocumentsSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
      {/* 1. Header sobre & fonctionnel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/40 w-full min-w-0 animate-in fade-in-50 duration-300">
        <div className="space-y-1 min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground truncate">
            Documents & Pièces jointes
          </h1>
          <p className="text-sm text-muted-foreground truncate">
            Gérez vos versions de CV, lettres de motivation et portfolios pour vos candidatures
          </p>
        </div>

        <div className="flex-shrink-0 w-full sm:w-auto">
          <Button
            onClick={() => {
              setUploadData({ name: '', type: 'CV', file: null });
              setShowUploadDialog(true);
            }}
            size="sm"
            className="w-full sm:w-auto h-9 font-medium shadow-xs"
          >
            <Upload className="mr-1.5 h-4 w-4" />
            Importer un document
          </Button>
        </div>
      </div>

      {/* 2. Barre de recherche et filtres fins par chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
        <div className="relative flex-1 max-w-sm w-full min-w-0">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par titre de document..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-lg"
          />
        </div>

        {/* Chips de filtres par type */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
              typeFilter === 'all'
                ? 'bg-foreground text-background font-semibold'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
            )}
          >
            Tous ({countsByType.all})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('CV')}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
              typeFilter === 'CV'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
            )}
          >
            CVs ({countsByType.CV})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('COVER_LETTER')}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
              typeFilter === 'COVER_LETTER'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
            )}
          >
            Lettres ({countsByType.COVER_LETTER})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('PORTFOLIO')}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
              typeFilter === 'PORTFOLIO'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
            )}
          >
            Portfolios ({countsByType.PORTFOLIO})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('OTHER')}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
              typeFilter === 'OTHER'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
            )}
          >
            Autres ({countsByType.OTHER})
          </button>
        </div>
      </div>

      {/* 3. Grille des documents avec format bento épuré */}
      {filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full min-w-0">
          {filteredDocuments.map((doc: DocType) => {
            const isPdf = doc.fileName?.toLowerCase().endsWith('.pdf');

            return (
              <div
                key={doc.id}
                className="group relative rounded-xl border border-border/80 bg-card hover:border-primary/40 hover:shadow-xs transition-all overflow-hidden p-4 flex flex-col justify-between space-y-3 w-full min-w-0"
              >
                <div className="space-y-2.5 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="h-9 w-9 rounded-lg bg-muted/80 border border-border/60 flex items-center justify-center flex-shrink-0 text-foreground/80 group-hover:text-primary transition-colors">
                        {isPdf ? <FileText className="h-4.5 w-4.5" /> : <File className="h-4.5 w-4.5" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3
                          className="text-sm font-semibold text-foreground truncate cursor-pointer group-hover:text-primary transition-colors"
                          onClick={() => {
                            const viewUrl = documentsService.getViewUrl(doc.id);
                            window.open(viewUrl, '_blank');
                          }}
                          title={doc.name}
                        >
                          {doc.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {doc.fileName}
                        </p>
                      </div>
                    </div>

                    {/* Menu d'actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground flex-shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            const viewUrl = documentsService.getViewUrl(doc.id);
                            window.open(viewUrl, '_blank');
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Aperçu
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
                            try {
                              await documentsService.download(doc.id, doc.fileName);
                            } catch (error) {
                              toast.error('Impossible de télécharger le fichier');
                            }
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Télécharger
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            toggleDefaultMutation.mutate({ id: doc.id, isDefault: !doc.isDefault })
                          }
                        >
                          {doc.isDefault ? (
                            <>
                              <StarOff className="mr-2 h-4 w-4" />
                              Retirer le statut par défaut
                            </>
                          ) : (
                            <>
                              <Star className="mr-2 h-4 w-4" />
                              Définir comme document par défaut
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            if (confirm(`Supprimer le document "${doc.name}" ?`)) {
                              deleteMutation.mutate(doc.id);
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Badges de statut et type */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <Badge
                      variant="secondary"
                      className={cn('text-[10px] font-medium border-0 px-2 py-0.5', documentTypeColors[doc.type])}
                    >
                      {documentTypeLabels[doc.type] || doc.type}
                    </Badge>

                    {doc.isDefault && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        Par défaut
                      </span>
                    )}
                  </div>
                </div>

                {/* Pied de carte avec date et boutons rapides */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                  <span>Ajouté le {formatDate(doc.createdAt, 'short')}</span>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        const viewUrl = documentsService.getViewUrl(doc.id);
                        window.open(viewUrl, '_blank');
                      }}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Voir
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4 border border-dashed rounded-xl bg-card space-y-3">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground/50" />
          <h3 className="text-sm font-semibold text-foreground">Aucun document</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {search || typeFilter !== 'all'
              ? 'Aucun document ne correspond à votre recherche.'
              : 'Importez vos CVs et lettres de motivation pour les attacher directement à vos candidatures et simulations.'}
          </p>
          <Button
            size="sm"
            onClick={() => {
              setUploadData({ name: '', type: 'CV', file: null });
              setShowUploadDialog(true);
            }}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Importer mon premier document
          </Button>
        </div>
      )}

      {/* Modal d'import avec zone de Drag & Drop moderne */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importer un document</DialogTitle>
            <DialogDescription>
              Ajoutez un fichier pour l'utiliser lors de vos candidatures et entraînements IA.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Zone de Drag & Drop */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors',
                isDraggingOver
                  ? 'border-primary bg-primary/5'
                  : 'border-border/80 hover:border-primary/50 hover:bg-muted/30'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc"
                onChange={handleFileChange}
              />

              {uploadData.file ? (
                <div className="space-y-1.5 flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <FileCheck2 className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-foreground truncate max-w-[260px]">
                    {uploadData.file.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatFileSize(uploadData.file.size)} • Cliquer pour changer
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    Glissez votre fichier ici ou <span className="text-primary underline">parcourez</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Formats acceptés : PDF, DOCX (max 10 Mo)
                  </p>
                </div>
              )}
            </div>

            {/* Titre du document */}
            <div className="space-y-1.5">
              <Label htmlFor="doc-name" className="text-xs font-medium">Nom usuel du document *</Label>
              <Input
                id="doc-name"
                placeholder="Ex: CV Développeur Web 2026, Lettre Stage..."
                value={uploadData.name}
                onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            {/* Type de document */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Type de document</Label>
              <Select
                value={uploadData.type}
                onValueChange={(val) => setUploadData({ ...uploadData, type: val as DocumentType })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CV" className="text-xs">CV (Curriculum Vitae)</SelectItem>
                  <SelectItem value="COVER_LETTER" className="text-xs">Lettre de motivation</SelectItem>
                  <SelectItem value="PORTFOLIO" className="text-xs">Portfolio ou book</SelectItem>
                  <SelectItem value="OTHER" className="text-xs">Autre document</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowUploadDialog(false)}>
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={!uploadData.name.trim() || !uploadData.file || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? 'Importation en cours...' : 'Enregistrer le document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocumentsSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/40">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-40" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
