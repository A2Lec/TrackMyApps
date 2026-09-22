import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { applicationSchema, type ApplicationFormData } from '@/schemas/application';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companiesService } from '@/services/companies.service';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const defaultFormValues: ApplicationFormData = {
  companyName: '',
  position: '',
  jobType: 'STAGE',
  location: '',
  jobUrl: '',
  salary: '',
  notes: '',
  jobDescription: '',
  status: 'SENT',
};

interface ApplicationFormProps {
  onSubmit: (data: ApplicationFormData) => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<ApplicationFormData>;
  submitRef?: React.MutableRefObject<(() => void) | null>;
}

export function ApplicationForm({ onSubmit, isSubmitting: _isSubmitting, defaultValues, submitRef }: ApplicationFormProps) {
  const hasInitialDetails = Boolean(
    defaultValues?.location ||
    defaultValues?.jobUrl ||
    defaultValues?.salary ||
    defaultValues?.notes ||
    defaultValues?.jobDescription
  );

  const [showDetails, setShowDetails] = useState(hasInitialDetails);

  // Fetch companies for datalist autocomplete
  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesService.getAll(),
    staleTime: 60000,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { ...defaultFormValues, ...defaultValues },
  });

  // Automatically expand details if errors occur in optional fields
  useEffect(() => {
    if (errors.jobUrl || errors.location) {
      setShowDetails(true);
    }
  }, [errors.jobUrl, errors.location]);

  const handleFormSubmit = (data: ApplicationFormData) => {
    const sanitizedData: ApplicationFormData = {
      ...data,
      location: data.location?.trim() || 'Non précisée',
    };
    onSubmit(sanitizedData);
  };

  useEffect(() => {
    if (submitRef) {
      submitRef.current = handleSubmit(handleFormSubmit);
    }
  }, [submitRef, handleSubmit]);

  const jobType = watch('jobType');
  const status = watch('status');

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Essential Fields (TICK-103) */}
      <div className="space-y-2">
        <Label htmlFor="companyName">Entreprise *</Label>
        <Input
          id="companyName"
          list="company-suggestions"
          placeholder="Google, Doctolib..."
          autoComplete="off"
          {...register('companyName')}
          aria-invalid={!!errors.companyName}
        />
        <datalist id="company-suggestions">
          {companies?.map((c) => (
            <option key={c.id} value={c.name} />
          ))}
        </datalist>
        {errors.companyName && (
          <p className="text-sm text-destructive">{errors.companyName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="position">Poste *</Label>
        <Input
          id="position"
          placeholder="Développeur Full-Stack..."
          {...register('position')}
          aria-invalid={!!errors.position}
        />
        {errors.position && (
          <p className="text-sm text-destructive">{errors.position.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type de contrat</Label>
          <Select
            value={jobType}
            onValueChange={(value) => setValue('jobType', value as ApplicationFormData['jobType'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="bottom" className="z-50">
              <SelectItem value="STAGE">Stage</SelectItem>
              <SelectItem value="ALTERNANCE">Alternance</SelectItem>
              <SelectItem value="CDI">CDI</SelectItem>
              <SelectItem value="JOB_ETUDIANT">Job étudiant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Statut initial</Label>
          <Select
            value={status}
            onValueChange={(value) => setValue('status', value as ApplicationFormData['status'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="bottom" className="z-50">
              <SelectItem value="DRAFT">Brouillon</SelectItem>
              <SelectItem value="SENT">Envoyée</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Collapsible Secondary / Optional Fields (TICK-103) */}
      <div className="pt-2 border-t border-border/60">
        <button
          type="button"
          onClick={() => setShowDetails((prev) => !prev)}
          className="flex items-center justify-between w-full py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary group-hover:rotate-45 transition-transform" />
            Détails complémentaires (optionnel)
          </span>
          <ChevronDown
            className={cn('h-4 w-4 transition-transform duration-200', showDetails && 'rotate-180')}
          />
        </button>

        {showDetails && (
          <div className="space-y-4 pt-3 animate-in fade-in-50 duration-200">
            <div className="space-y-2">
              <Label htmlFor="location">Localisation</Label>
              <Input
                id="location"
                placeholder="Paris, Lyon, Remote... (optionnel)"
                {...register('location')}
                aria-invalid={!!errors.location}
              />
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobUrl">URL de l'annonce</Label>
              <Input
                id="jobUrl"
                placeholder="https://..."
                {...register('jobUrl')}
                aria-invalid={!!errors.jobUrl}
              />
              {errors.jobUrl && (
                <p className="text-sm text-destructive">{errors.jobUrl.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Salaire / Rémunération</Label>
              <Input
                id="salary"
                placeholder="1200€/mois, 38k€/an..."
                {...register('salary')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Notes personnelles..."
                {...register('notes')}
                className="min-h-20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobDescription">Description de l'offre</Label>
              <Textarea
                id="jobDescription"
                placeholder="Collez ici le texte de l'annonce..."
                {...register('jobDescription')}
                className="min-h-24"
              />
            </div>
          </div>
        )}
      </div>
    </form>
  );
}

// Keep this export for backward compat but update type
export { defaultFormValues as initialApplicationFormData };
export type { ApplicationFormData };
