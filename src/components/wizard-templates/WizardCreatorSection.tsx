import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import type { WizardTemplate } from './types';
import { WIZARD_CATEGORIES } from './types';

interface Props {
  onStartWizard: (templateId: string) => void;
}

export default function WizardCreatorSection({ onStartWizard }: Props) {
  const [templates, setTemplates] = useState<WizardTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const { data } = await supabase
        .from('wizard_templates')
        .select('id, category, title, description')
        .eq('is_active', true)
        .order('sort_order');
      if (data) {
        setTemplates(data);
        if (data.length > 0) {
          const firstCat = data[0].category;
          setSelectedCategory(firstCat);
        }
      }
    } catch (err) {
      console.error('Error loading wizard templates:', err);
    } finally {
      setLoading(false);
    }
  }

  const categoriesWithTemplates = WIZARD_CATEGORIES.filter((cat) =>
    templates.some((t) => t.category === cat.id),
  );

  const filteredTemplates = selectedCategory
    ? templates.filter((t) => t.category === selectedCategory)
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
        <h2 className="text-xl font-bold text-dark mb-1">Dokument erstellen</h2>
        <p className="text-sm text-gray-500 mb-6">
          Erstellen Sie professionelle Dokumente mit wenigen Klicks. Der Assistent führt Sie Schritt für Schritt durch den Prozess.
        </p>

        {categoriesWithTemplates.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {categoriesWithTemplates.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
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
                onClick={() => onStartWizard(tpl.id)}
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
