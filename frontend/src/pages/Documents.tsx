import { useState } from 'react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsService } from '@/services/documents.service';
import { Card, CardContent } from '@/components/ui/card';
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
  Plus,
  Search,
  FileText,
  File,
  Download,
  Trash2,
  MoreVertical,
  Upload,
  Filter,
  Star,
  StarOff,
} from 'lucide-react';
import { formatDate, cn, documentTypeLabels, documentTypeColors } from '@/lib/utils';
import type { Document as DocType, DocumentType } from '@/types';

export function DocumentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
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
    },
  });

  const deleteMutation = useMutation({
    mutationFn: documentsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const toggleDefaultMutation = useMutation({
    mutationFn: ({ id, isDefault }: { id: string; isDefault: boolean }) =>
      documentsService.update(id, { isDefault }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const handleUpload = () => {
    if (!uploadData.name || !uploadData.file) return;
    uploadMutation.mutate({
      name: uploadData.name,
      type: uploadData.type,
      file: uploadData.file,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadData({ ...uploadData, file, name: uploadData.name || file.name.split('.')[0] });
    }
  };

  const filteredDocuments = (documents || []).filter((doc: DocType) => {
    const matchesSearch =
      !search ||
      doc.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return <DocumentsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">
            Gérez vos CV, lettres de motivation et portfolios
          </p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Importer un document
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
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as DocumentType | 'all')}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="CV">CV</SelectItem>
              <SelectItem value="COVER_LETTER">Lettre de motivation</SelectItem>
              <SelectItem value="PORTFOLIO">Portfolio</SelectItem>
              <SelectItem value="OTHER">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">CV</p>
                <p className="text-lg sm:text-xl font-semibold">
                  {(documents || []).filter((d: DocType) => d.type === 'CV').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg flex-shrink-0">
                <File className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Lettres</p>
                <p className="text-lg sm:text-xl font-semibold">
                  {(documents || []).filter((d: DocType) => d.type === 'COVER_LETTER' || d.type === 'LETTRE_MOTIVATION').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg flex-shrink-0">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Portfolios</p>
                <p className="text-lg sm:text-xl font-semibold">
                  {(documents || []).filter((d: DocType) => d.type === 'PORTFOLIO').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-gray-500/10 rounded-lg flex-shrink-0">
                <File className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Autres</p>
                <p className="text-lg sm:text-xl font-semibold">
                  {(documents || []).filter((d: DocType) => d.type === 'OTHER').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments?.map((doc) => (
          <Card key={doc.id} className="hover:border-primary transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={cn('p-2 rounded-lg', documentTypeColors[doc.type].split(' ')[0])}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <h3 
                        className="font-medium truncate cursor-pointer"
                        onClick={() => {
                          const viewUrl = documentsService.getViewUrl(doc.id);
                          window.open(viewUrl, '_blank');
                        }}
                      >
                        {doc.name}
                      </h3>
                      {doc.isDefault && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={cn('text-xs', documentTypeColors[doc.type])}>
                        {documentTypeLabels[doc.type]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 truncate">
                      Ajouté le {formatDate(doc.createdAt)}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
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
                      <FileText className="mr-2 h-4 w-4" />
                      Afficher
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        try {
                          await documentsService.download(doc.id, doc.fileName);
                        } catch (error) {
                          console.error('Download error:', error);
                          toast.error('Erreur lors du téléchargement. Le fichier est peut-être introuvable sur le serveur.');
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
                          Retirer des favoris
                        </>
                      ) : (
                        <>
                          <Star className="mr-2 h-4 w-4" />
                          Définir par défaut
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => deleteMutation.mutate(doc.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocuments?.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun document</h3>
          <p className="text-muted-foreground mb-4">
            {search || typeFilter !== 'all'
              ? 'Aucun document ne correspond à votre recherche'
              : 'Importez votre premier document pour commencer'}
          </p>
          {!search && typeFilter === 'all' && (
            <Button onClick={() => setShowUploadDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Importer un document
            </Button>
          )}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importer un document</DialogTitle>
            <DialogDescription>
              Formats acceptés : PDF, DOCX (max 5 Mo)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="space-y-2">
              <Label htmlFor="file">Fichier</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nom du document</Label>
              <Input
                id="name"
                placeholder="Mon CV 2024..."
                value={uploadData.name}
                onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Type de document</Label>
              <Select
                value={uploadData.type}
                onValueChange={(v) => setUploadData({ ...uploadData, type: v as DocumentType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CV">CV</SelectItem>
                  <SelectItem value="COVER_LETTER">Lettre de motivation</SelectItem>
                  <SelectItem value="PORTFOLIO">Portfolio</SelectItem>
                  <SelectItem value="OTHER">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpload} disabled={uploadMutation.isPending || !uploadData.file}>
              {uploadMutation.isPending ? 'Import en cours...' : 'Importer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocumentsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}
