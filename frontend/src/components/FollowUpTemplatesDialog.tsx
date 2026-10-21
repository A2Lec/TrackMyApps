import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Mail } from 'lucide-react';

interface Template {
  id: string;
  title: string;
  badge: string;
  subject: string;
  body: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'post-candidature',
    title: 'Relance candidature (J+7)',
    badge: 'Recommandé à J+7',
    subject: "Candidature au poste de [Poste] — Suivi de dossier",
    body: `Bonjour [Nom du recruteur / Madame, Monsieur],

Je me permets de vous contacter pour faire suite à ma candidature transmise le [Date] pour le poste de [Intitulé du poste].

Toujours très enthousiaste à l'idée d'intégrer vos équipes et de contribuer à vos projets, je souhaitais savoir si vous aviez pu examiner mon dossier et si vous aviez besoin d'éléments complémentaires sur mon profil.

Je reste à votre entière disposition pour convenir d'un échange téléphonique ou d'un entretien à votre convenance.

En vous remerciant pour votre temps et votre attention, je vous souhaite une excellente journée.

Bien cordialement,
[Votre Prénom] [Votre Nom]
[Votre Téléphone] | [Votre LinkedIn / Portfolio]`,
  },
  {
    id: 'post-entretien',
    title: 'Post-entretien (J+1 à J+3)',
    badge: 'Remerciements & Intérêt',
    subject: "Remerciements suite à notre entretien — Poste de [Poste]",
    body: `Bonjour [Nom du recruteur],

Je tenais à vous remercier pour la qualité de notre échange du [Date] concernant l'opportunité de [Intitulé du poste].

Notre discussion a particulièrement confirmé mon intérêt pour les missions présentées, notamment [mentionner un projet ou défi évoqué en entretien]. Je suis convaincu(e) de pouvoir rapidement apporter ma contribution sur ces sujets.

Restant à votre disposition pour toute information complémentaire pour la suite du processus, je vous souhaite une agréable semaine.

Bien cordialement,
[Votre Prénom] [Votre Nom]`,
  },
  {
    id: 'contact-direct',
    title: 'Prise de contact directe',
    badge: 'Court & Impactant',
    subject: "Candidature spontanée / Suivi — [Votre Nom]",
    body: `Bonjour [Prénom ou Nom du contact],

J'espère que vous allez bien. J'ai récemment candidaté pour le poste de [Intitulé du poste] au sein de votre équipe chez [Entreprise].

Particulièrement motivé(e) par la trajectoire de l'entreprise et par vos enjeux actuels, je serais ravi(e) d'échanger brièvement avec vous afin de vous présenter les compétences pratiques que je peux apporter.

Seriez-vous ouvert(e) à un bref échange téléphonique de 10 minutes cette semaine ?

Merci d'avance pour votre accueil,
[Votre Prénom] [Votre Nom]`,
  },
];

interface FollowUpTemplatesDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  companyName?: string;
  position?: string;
}

export function FollowUpTemplatesDialog({
  trigger,
  open,
  onOpenChange,
  companyName,
  position,
}: FollowUpTemplatesDialogProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getCustomizedTemplate = (template: Template) => {
    let subject = template.subject;
    let body = template.body;

    if (position) {
      subject = subject.replace(/\[Poste\]/g, position).replace(/\[Intitulé du poste\]/g, position);
      body = body.replace(/\[Poste\]/g, position).replace(/\[Intitulé du poste\]/g, position);
    }
    if (companyName) {
      subject = subject.replace(/\[Entreprise\]/g, companyName).replace(/\[Nom Entreprise\]/g, companyName);
      body = body.replace(/\[Entreprise\]/g, companyName).replace(/\[Nom Entreprise\]/g, companyName);
    }

    return { ...template, subject, body };
  };

  const handleCopy = (template: Template) => {
    const customized = getCustomizedTemplate(template);
    const fullText = `Objet : ${customized.subject}\n\n${customized.body}`;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopiedId(template.id);
      toast.success('Modèle copié dans le presse-papier !');
      setTimeout(() => setCopiedId(null), 2500);
    }).catch(() => {
      toast.error("Impossible d'accéder au presse-papier");
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-lg">Modèles d'emails de relance</DialogTitle>
              <DialogDescription className="text-xs">
                Modèles professionnels éprouvés, prêts à copier et personnalisables pour vos démarches.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="post-candidature" className="w-full mt-2">
          <TabsList className="grid grid-cols-3 w-full h-9 bg-muted/60 p-0.5">
            {TEMPLATES.map((tpl) => (
              <TabsTrigger key={tpl.id} value={tpl.id} className="text-xs truncate">
                {tpl.title.split(' ')[0]} {tpl.title.split(' ')[1] || ''}
              </TabsTrigger>
            ))}
          </TabsList>

          {TEMPLATES.map((tpl) => {
            const customized = getCustomizedTemplate(tpl);
            return (
              <TabsContent key={tpl.id} value={tpl.id} className="space-y-4 pt-3">
                <div className="flex items-center justify-between gap-2 bg-muted/40 p-3 rounded-lg border border-border/70">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-xs text-foreground">{tpl.title}</span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {tpl.badge}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      <strong>Objet :</strong> {customized.subject}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleCopy(tpl)}
                    className="h-8 text-xs font-semibold flex-shrink-0"
                  >
                    {copiedId === tpl.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1 text-success" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        Copier le modèle
                      </>
                    )}
                  </Button>
                </div>

                <div className="relative">
                  <pre className="p-4 rounded-lg bg-muted/30 border border-border/80 font-sans text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed select-text overflow-x-auto">
                    {customized.body}
                  </pre>
                </div>

                <p className="text-[11px] text-muted-foreground italic flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  Conseil pro : remplacez les éléments entre crochets avant d'envoyer l'email.
                </p>
              </TabsContent>
            );
          })}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
