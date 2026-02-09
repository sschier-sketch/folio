import { useState, useEffect } from 'react';
import { Plus, FileText, Search, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

interface MailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface MailTemplatesListProps {
  onEdit: (template: MailTemplate) => void;
  onCreate: () => void;
}

const CATEGORIES = ['Alle', 'Zahlungserinnerung', 'Mietvertrag', 'Nebenkostenabrechnung', 'Reparatur', 'Allgemein', 'Sonstiges'];

export default function MailTemplatesList({ onEdit, onCreate }: MailTemplatesListProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Alle');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadTemplates();
  }, [user]);

  async function loadTemplates() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('user_mail_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    setTemplates(data || []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Vorlage wirklich löschen?')) return;
    await supabase.from('user_mail_templates').delete().eq('id', id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    setOpenMenuId(null);
  }

  const filtered = templates.filter((t) => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'Alle' || t.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse flex gap-4 p-4 bg-white border border-gray-100 rounded-xl">
            <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-48" />
              <div className="h-3 bg-gray-100 rounded w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Vorlagen</h2>
          <p className="text-sm text-gray-500 mt-0.5">{templates.length} {templates.length === 1 ? 'Vorlage' : 'Vorlagen'} gespeichert</p>
        </div>
        <Button variant="primary" onClick={onCreate}>
          Neue Vorlage
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Vorlage suchen..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            {templates.length === 0 ? 'Noch keine Vorlagen' : 'Keine Ergebnisse'}
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mb-4">
            {templates.length === 0
              ? 'Erstellen Sie Ihre erste Vorlage, um beim Schreiben von E-Mails Zeit zu sparen.'
              : 'Passen Sie die Suchkriterien an.'}
          </p>
          {templates.length === 0 && (
            <Button variant="primary" onClick={onCreate}>
              Erste Vorlage erstellen
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((template) => (
            <div
              key={template.id}
              className="group flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => onEdit(template)}
            >
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors">
                <FileText className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{template.name}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {template.subject || 'Kein Betreff'}
                </p>
              </div>
              <span className="hidden sm:inline-flex px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full flex-shrink-0">
                {template.category}
              </span>
              <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setOpenMenuId(openMenuId === template.id ? null : template.id)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
                {openMenuId === template.id && (
                  <div className="absolute right-0 top-8 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                    <button
                      onClick={() => { onEdit(template); setOpenMenuId(null); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Bearbeiten
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Löschen
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
