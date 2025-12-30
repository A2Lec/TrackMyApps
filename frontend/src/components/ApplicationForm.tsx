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
import type { ApplicationStatus, JobType } from '@/types';

interface ApplicationFormData {
  companyName: string;
  position: string;
  jobType: JobType;
  location: string;
  jobUrl: string;
  salary: string;
  notes: string;
  jobDescription: string;
  status: ApplicationStatus;
}

interface ApplicationFormProps {
  formData: ApplicationFormData;
  onChange: (data: ApplicationFormData) => void;
}

export function ApplicationForm({ formData, onChange }: ApplicationFormProps) {
  const updateField = (field: keyof ApplicationFormData, value: string) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="companyName">Entreprise *</Label>
        <Input
          id="companyName"
          placeholder="Google, Doctolib..."
          value={formData.companyName}
          onChange={(e) => updateField('companyName', e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="position">Poste *</Label>
        <Input
          id="position"
          placeholder="Développeur Full-Stack..."
          value={formData.position}
          onChange={(e) => updateField('position', e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={formData.jobType}
            onValueChange={(value) => updateField('jobType', value as JobType)}
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
            value={formData.status}
            onValueChange={(value) => updateField('status', value as ApplicationStatus)}
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
          value={formData.location}
          onChange={(e) => updateField('location', e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="jobUrl">URL de l'annonce</Label>
        <Input
          id="jobUrl"
          placeholder="https://..."
          value={formData.jobUrl}
          onChange={(e) => updateField('jobUrl', e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="salary">Salaire / Rémunération</Label>
        <Input
          id="salary"
          placeholder="1200€/mois, 38k€/an..."
          value={formData.salary}
          onChange={(e) => updateField('salary', e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Notes personnelles..."
          value={formData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          className="min-h-24"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="jobDescription">Description de l'offre</Label>
        <Textarea
          id="jobDescription"
          placeholder="Collez ici le texte de l'annonce..."
          value={formData.jobDescription}
          onChange={(e) => updateField('jobDescription', e.target.value)}
          className="min-h-32"
        />
      </div>
    </div>
  );
}

export const initialApplicationFormData: ApplicationFormData = {
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
