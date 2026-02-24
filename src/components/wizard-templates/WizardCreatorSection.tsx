import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import type { WizardTemplate } from './types';
import { WIZARD_CATEGORIES } from './types';

interface DraftInfo {
  id: string;
  template_id: string;
  current_step: number;
  updated_at: string;
}

interface Props {
  onStartWizard: (templateId: string, freshStart?: boolean) => void;
}

export default function WizardCreatorSection({ onStartWizard }: Props) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<WizardTemplate[]>([]);
  const [drafts, setDrafts] = useState<DraftInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    try {
      const promises: Promise<any>[] = [
        supabase
          .from('wizard_templates')
          .select('id, category, title, description')
          .eq('is_active', true)
          .order('sort_order'),
      ];

      if (user) {
        promises.push(
          supabase
            .from('wizard_drafts')
            .select('id, template_id, current_step, updated_at')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false }),
        );
      }

      const [tplRes, draftRes] = await Promise.all(promises);
      if (tplRes.data) setTemplates(tplRes.data);
      if (draftRes?.data) setDrafts(draftRes.data);
    } catch (err) {
      console.error('Error loading wizard data:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatDraftDate(iso: string): string {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const categoriesWithTemplates = WIZARD_CATEGORIES.filter((cat) =>
    templates.some((t) => t.category === cat.id),
  );

  const activeCategory = selectedCategory || (categoriesWithTemplates[0]?.id ?? null);

  const filteredTemplates = activeCategory
    ? templates.filter((t) => t.category === activeCategory)
    : templates;

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-8 mb-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-100 rounded w-96" />
          <div className="h-32 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (templates.length === 0) return null;

  return (
    <div className="bg-white rounded-lg overflow-hidden mb-8">
      <div className="p-6 lg:p-8">
        <h2 className="text-xl font-bold text-dark mb-1">Schritt-für-Schritt Dokument erstellen</h2>
        <p className="text-sm text-gray-500 mb-6">
          Erstellen Sie professionelle Dokumente mit wenigen Klicks. Der Assistent führt Sie Schritt für Schritt durch den Prozess.
        </p>

        {drafts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Entwürfe fortsetzen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {drafts.map((draft) => {
                const tpl = templates.find((t) => t.id === draft.template_id);
                if (!tpl) return null;
                return (
                  <button
                    key={draft.id}
                    onClick={() => onStartWizard(draft.template_id)}
                    className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left hover:bg-amber-100 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark truncate group-hover:text-amber-800 transition-colors">
                        {tpl.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        Zuletzt bearbeitet: {formatDraftDate(draft.updated_at)}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-amber-600 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {categoriesWithTemplates.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {categoriesWithTemplates.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="border border-gray-200 rounded-lg p-5 hover:border-gray-300 hover:shadow-sm transition-all flex flex-col"
            >
              <h3 className="font-semibold text-dark mb-2">{tpl.title}</h3>
              <p className="text-sm text-gray-500 flex-1 mb-4">{tpl.description}</p>
              <Button
                onClick={() => onStartWizard(tpl.id, true)}
                variant="dark"
                className="self-start"
              >
                Dokument erstellen
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
