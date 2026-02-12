import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Eye, Pencil, AlertCircle, Users, Briefcase, Building2, FileText, ChevronDown, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

interface MailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  content: string;
}

interface MailTemplateEditorProps {
  template: MailTemplate | null;
  onBack: () => void;
  onSaved: () => void;
}

interface PlaceholderItem {
  key: string;
  label: string;
}

interface PlaceholderGroup {
  id: string;
  label: string;
  icon: typeof Users;
  items: PlaceholderItem[];
}

const CATEGORIES = ['Zahlungserinnerung', 'Mietvertrag', 'Nebenkostenabrechnung', 'Reparatur', 'Allgemein', 'Sonstiges'];

const PLACEHOLDER_GROUPS: PlaceholderGroup[] = [
  {
    id: 'mieter',
    label: 'Mieter',
    icon: Users,
    items: [
      { key: '{{mieter_anrede}}', label: 'Anrede' },
      { key: '{{mieter_name}}', label: 'Name' },
      { key: '{{mieter_vorname}}', label: 'Vorname' },
      { key: '{{mieter_nachname}}', label: 'Nachname' },
      { key: '{{mieter_strasse}}', label: 'Straße' },
      { key: '{{mieter_plz}}', label: 'PLZ' },
      { key: '{{mieter_ort}}', label: 'Ort' },
    ],
  },
  {
    id: 'vermieter',
    label: 'Vermieter',
    icon: Briefcase,
    items: [
      { key: '{{vermieter_name}}', label: 'Name/Firma' },
      { key: '{{vermieter_strasse}}', label: 'Straße' },
      { key: '{{vermieter_plz}}', label: 'PLZ' },
      { key: '{{vermieter_ort}}', label: 'Ort' },
    ],
  },
  {
    id: 'objekt',
    label: 'Objekt',
    icon: Building2,
    items: [
      { key: '{{objekt_name}}', label: 'Objektname' },
      { key: '{{objekt_strasse}}', label: 'Straße' },
      { key: '{{objekt_plz}}', label: 'PLZ' },
      { key: '{{objekt_ort}}', label: 'Ort' },
      { key: '{{einheit_name}}', label: 'Einheit' },
    ],
  },
  {
    id: 'mietvertrag',
    label: 'Mietvertrag',
    icon: FileText,
    items: [
      { key: '{{mietbeginn}}', label: 'Mietbeginn' },
      { key: '{{kaltmiete}}', label: 'Kaltmiete' },
      { key: '{{nebenkosten}}', label: 'Nebenkosten' },
      { key: '{{gesamtmiete}}', label: 'Gesamtmiete' },
      { key: '{{kaution}}', label: 'Kaution' },
    ],
  },
  {
    id: 'allgemein',
    label: 'Allgemein',
    icon: Calendar,
    items: [
      { key: '{{datum}}', label: 'Datum' },
      { key: '{{betrag}}', label: 'Betrag' },
    ],
  },
];

export default function MailTemplateEditor({ template, onBack, onSaved }: MailTemplateEditorProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Sonstiges');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (template) {
      setName(template.name);
      setCategory(template.category);
      setSubject(template.subject);
      setContent(template.content);
    } else {
      setName('');
      setCategory('Sonstiges');
      setSubject('');
      setContent('');
    }
    setTab('edit');
    setError('');
  }, [template]);

  function insertPlaceholder(placeholder: string) {
    setContent((prev) => prev + placeholder);
  }

  function toggleGroup(groupId: string) {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  function getPreviewContent() {
    let text = content;
    const replacements: Record<string, string> = {
      '{{mieter_anrede}}': 'Herr',
      '{{mieter_name}}': 'Max Mustermann',
      '{{mieter_vorname}}': 'Max',
      '{{mieter_nachname}}': 'Mustermann',
      '{{mieter_strasse}}': 'Musterstraße 12',
      '{{mieter_plz}}': '10115',
      '{{mieter_ort}}': 'Berlin',
      '{{vermieter_name}}': 'Hausverwaltung GmbH',
      '{{vermieter_strasse}}': 'Verwaltungsweg 5',
      '{{vermieter_plz}}': '10178',
      '{{vermieter_ort}}': 'Berlin',
      '{{objekt_name}}': 'Wohnanlage Sonnenhof',
      '{{objekt_strasse}}': 'Musterstraße 12',
      '{{objekt_plz}}': '10115',
      '{{objekt_ort}}': 'Berlin',
      '{{einheit_name}}': 'Wohnung 3A',
      '{{mietbeginn}}': '01.01.2026',
      '{{kaltmiete}}': '750,00 EUR',
      '{{nebenkosten}}': '200,00 EUR',
      '{{gesamtmiete}}': '950,00 EUR',
      '{{kaution}}': '2.250,00 EUR',
      '{{datum}}': new Date().toLocaleDateString('de-DE'),
      '{{betrag}}': '750,00 EUR',
      '{{immobilie}}': 'Musterstraße 12',
      '{{einheit}}': 'Wohnung 3A',
    };
    Object.entries(replacements).forEach(([key, value]) => {
      text = text.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });
    return text;
  }

  async function handleSave() {
    if (!user) return;
    if (!name.trim()) {
      setError('Bitte geben Sie einen Namen für die Vorlage ein.');
      return;
    }
    if (!content.trim()) {
      setError('Bitte geben Sie einen Inhalt für die Vorlage ein.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      user_id: user.id,
      name: name.trim(),
      category,
      subject: subject.trim(),
      content: content.trim(),
      updated_at: new Date().toISOString(),
    };

    if (template) {
      const { error: updateError } = await supabase
        .from('user_mail_templates')
        .update(payload)
        .eq('id', template.id);
      if (updateError) {
        setError('Fehler beim Speichern.');
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from('user_mail_templates')
        .insert(payload);
      if (insertError) {
        setError('Fehler beim Erstellen.');
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onSaved();
  }

  return (
    <div className="p-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück zu Vorlagen
      </button>

      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        {template ? 'Vorlage bearbeiten' : 'Neue Vorlage'}
      </h2>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('edit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative ${
            tab === 'edit' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'
          }`}
        >
          <Pencil className="w-3.5 h-3.5" />
          Bearbeiten
          {tab === 'edit' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
        </button>
        <button
          onClick={() => setTab('preview')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative ${
            tab === 'preview' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Vorschau
          {tab === 'preview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {tab === 'edit' ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Zahlungserinnerung"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Betreff</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Betreff der Nachricht"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Inhalt <span className="text-red-500">*</span>
              </label>
              <button
                onClick={() => setShowPlaceholders(!showPlaceholders)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <span className="text-gray-400">{'{ }'}</span>
                Platzhalter
              </button>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 min-w-0">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={14}
                  placeholder={"Schreiben Sie hier Ihre Vorlage...\n\nVerwenden Sie Platzhalter wie {{mieter_name}} für dynamische Inhalte."}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y leading-relaxed"
                />
                <p className="mt-1.5 text-xs text-gray-400">
                  Diese Vorlage kann für E-Mails verwendet werden.
                </p>
              </div>

              {showPlaceholders && (
                <div className="w-72 flex-shrink-0 border border-gray-200 rounded-lg bg-white overflow-hidden self-start max-h-[440px] overflow-y-auto">
                  {PLACEHOLDER_GROUPS.map((group) => {
                    const Icon = group.icon;
                    const isExpanded = expandedGroups[group.id] ?? false;
                    return (
                      <div key={group.id} className="border-b border-gray-100 last:border-b-0">
                        <button
                          onClick={() => toggleGroup(group.id)}
                          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-800">{group.label}</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-3 space-y-1">
                            {group.items.map((item) => (
                              <button
                                key={item.key}
                                onClick={() => insertPlaceholder(item.key)}
                                className="w-full flex items-center justify-between py-2.5 px-2 rounded-md hover:bg-gray-50 transition-colors group"
                              >
                                <span className="text-sm text-gray-700">{item.label}</span>
                                <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded group-hover:bg-gray-200 transition-colors">{item.key}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {subject && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Betreff</p>
              <p className="text-sm font-medium text-gray-900">{subject}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Inhalt</p>
            <div className="px-5 py-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {getPreviewContent() || 'Kein Inhalt vorhanden.'}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Platzhalter werden mit Beispieldaten angezeigt.
          </p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <Button variant="secondary" onClick={onBack}>
          Abbrechen
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Speichern...' : 'Speichern'}
        </Button>
      </div>
    </div>
  );
}
