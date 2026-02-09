import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Eye, Pencil, AlertCircle } from 'lucide-react';
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

const CATEGORIES = ['Zahlungserinnerung', 'Mietvertrag', 'Nebenkostenabrechnung', 'Reparatur', 'Allgemein', 'Sonstiges'];

const PLACEHOLDERS = [
  { key: '{{mieter_name}}', label: 'Mietername' },
  { key: '{{mieter_vorname}}', label: 'Vorname' },
  { key: '{{mieter_nachname}}', label: 'Nachname' },
  { key: '{{immobilie}}', label: 'Immobilie' },
  { key: '{{einheit}}', label: 'Einheit' },
  { key: '{{datum}}', label: 'Datum' },
  { key: '{{betrag}}', label: 'Betrag' },
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
    setShowPlaceholders(false);
  }

  function getPreviewContent() {
    let text = content;
    text = text.replace(/\{\{mieter_name\}\}/g, 'Max Mustermann');
    text = text.replace(/\{\{mieter_vorname\}\}/g, 'Max');
    text = text.replace(/\{\{mieter_nachname\}\}/g, 'Mustermann');
    text = text.replace(/\{\{immobilie\}\}/g, 'Musterstraße 12');
    text = text.replace(/\{\{einheit\}\}/g, 'Wohnung 3A');
    text = text.replace(/\{\{datum\}\}/g, new Date().toLocaleDateString('de-DE'));
    text = text.replace(/\{\{betrag\}\}/g, '750,00 EUR');
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
    <div className="p-6 max-w-3xl">
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
              <div className="relative">
                <button
                  onClick={() => setShowPlaceholders(!showPlaceholders)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <span className="text-gray-400">{'{ }'}</span>
                  Platzhalter
                </button>
                {showPlaceholders && (
                  <div className="absolute right-0 top-8 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                    {PLACEHOLDERS.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => insertPlaceholder(p.key)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <span>{p.label}</span>
                        <span className="text-xs text-gray-400 font-mono">{p.key}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              placeholder={"Schreiben Sie hier Ihre Vorlage...\n\nVerwenden Sie Platzhalter wie {{mieter_name}} für dynamische Inhalte."}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y leading-relaxed"
            />
            <p className="mt-1.5 text-xs text-gray-400">
              Diese Vorlage kann für E-Mails verwendet werden.
            </p>
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

      <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-200">
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
