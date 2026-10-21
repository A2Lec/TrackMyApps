import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/BrandLogo';
import { LEGAL } from '@/lib/legal';
import { LegalLinks } from './LegalLinks';

export interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

interface LegalPageProps {
  title: string;
  intro?: ReactNode;
  sections: LegalSection[];
}

export function LegalPage({ title, intro, sections }: LegalPageProps) {
  const navigate = useNavigate();

  // Opened from an email or a new tab there is no history to go back to
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/'));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={goBack} className="-ml-3">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <BrandLogo title="" className="h-7 w-7" />
            {LEGAL.siteName}
          </Link>
        </div>

        <header className="mb-8 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">Dernière mise à jour : {LEGAL.lastUpdated}</p>
          {intro && <div className="pt-2 text-muted-foreground leading-relaxed">{intro}</div>}
        </header>

        <nav aria-label="Sommaire" className="mb-10 rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-semibold mb-2">Sommaire</p>
          <ol className="grid gap-1 sm:grid-cols-2 text-sm list-decimal list-inside text-muted-foreground">
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="hover:text-foreground hover:underline">
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-10">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-6">
              <h2 className="text-xl font-semibold mb-3">
                {index + 1}. {section.title}
              </h2>
              <div className="legal-content space-y-3 text-sm leading-relaxed text-foreground/90">{section.content}</div>
            </section>
          ))}
        </div>

        <footer className="mt-16 pt-6 border-t border-border">
          <LegalLinks />
        </footer>
      </div>
    </div>
  );
}

/** Two-column table used for cookies, processors and retention periods */
export function LegalTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50">
          <tr>
            {head.map((cell) => (
              <th key={cell} scope="col" className="px-3 py-2 font-semibold">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border align-top">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
