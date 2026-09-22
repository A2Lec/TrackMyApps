import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { applicationSchema, type ApplicationFormData } from '@/schemas/application';
import { useEffect } from 'react';
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

  useEffect(() => {
    if (submitRef) {
      submitRef.current = handleSubmit(onSubmit);
    }
  }, [submitRef, handleSubmit, onSubmit]);

  const jobType = watch('jobType');
  const status = watch('status');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="companyName">Entreprise *</Label>
        <Input
          id="companyName"
          placeholder="Google, Doctolib..."
          {...register('companyName')}
          aria-invalid={!!errors.companyName}
        />
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
          <Label>Type</Label>
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
          <Label>Statut</Label>
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

      <div className="space-y-2">
        <Label htmlFor="location">Localisation *</Label>
        <Input
          id="location"
          placeholder="Paris, Lyon, Remote..."
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
          className="min-h-24"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobDescription">Description de l'offre</Label>
        <Textarea
          id="jobDescription"
          placeholder="Collez ici le texte de l'annonce..."
          {...register('jobDescription')}
          className="min-h-32"
        />
      </div>
    </form>
  );
}

// Keep this export for backward compat but update type
export { defaultFormValues as initialApplicationFormData };
export type { ApplicationFormData };
