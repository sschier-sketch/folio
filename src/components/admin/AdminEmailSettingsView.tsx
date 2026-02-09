import { useState, useEffect } from 'react';
import {
  ShieldBan,
  Forward,
  Trash2,
  AlertCircle,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  AtSign,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';

interface ReservedAlias {
  alias_localpart: string;
  reason: string | null;
  created_at: string;
}

interface ForwardingRule {
  source_alias: string;
  forward_to_email: string;
  is_active: boolean;
  created_at: string;
}

type Tab = 'reserved' | 'forwarding';

export default function AdminEmailSettingsView() {
  const [activeTab, setActiveTab] = useState<Tab>('reserved');

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-gray-200">
        <TabButton
          active={activeTab === 'reserved'}
          icon={<ShieldBan className="w-4 h-4" />}
          label="Gesperrte Alias-Namen"
          onClick={() => setActiveTab('reserved')}
        />
        <TabButton
          active={activeTab === 'forwarding'}
          icon={<Forward className="w-4 h-4" />}
          label="Weiterleitungen"
          onClick={() => setActiveTab('forwarding')}
        />
      </div>

      {activeTab === 'reserved' && <ReservedAliasesSection />}
      {activeTab === 'forwarding' && <ForwardingRulesSection />}
    </div>
  );
}

function TabButton({ active, icon, label, onClick }: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ReservedAliasesSection() {
  const [aliases, setAliases] = useState<ReservedAlias[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAlias, setNewAlias] = useState('');
  const [newReason, setNewReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadAliases();
  }, []);

  async function loadAliases() {
    setLoading(true);
    const { data, error } = await supabase
      .from('reserved_email_aliases')
      .select('*')
      .order('alias_localpart');
    if (!error && data) setAliases(data);
    setLoading(false);
  }

  function validateAlias(val: string): string | null {
    const v = val.toLowerCase().trim();
    if (v.length < 2) return 'Mindestens 2 Zeichen erforderlich.';
    if (v.length > 64) return 'Maximal 64 Zeichen erlaubt.';
    if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(v) && v.length > 1) {
      return 'Erlaubt: a-z, 0-9, Punkt, Minus, Unterstrich. Muss mit Buchstabe/Zahl beginnen und enden.';
    }
    if (v.includes('..')) return 'Keine aufeinanderfolgenden Punkte erlaubt.';
    return null;
  }

  async function handleAdd() {
    const cleaned = newAlias.toLowerCase().trim();
    const validationError = validateAlias(cleaned);
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    if (aliases.some(a => a.alias_localpart === cleaned)) {
      setMessage({ type: 'error', text: 'Dieser Alias ist bereits gesperrt.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const { error } = await supabase.from('reserved_email_aliases').insert({
      alias_localpart: cleaned,
      reason: newReason.trim() || null,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: `"${cleaned}" wurde gesperrt.` });
      setNewAlias('');
      setNewReason('');
      await loadAliases();
    }
    setSaving(false);
  }

  async function handleDelete(alias: string) {
    if (!confirm(`Alias "${alias}" wirklich freigeben?`)) return;
    const { error } = await supabase
      .from('reserved_email_aliases')
      .delete()
      .eq('alias_localpart', alias);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setAliases(prev => prev.filter(a => a.alias_localpart !== alias));
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <ShieldBan className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Neuen Alias sperren</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Gesperrte Alias-Namen koennen nicht von Nutzern als E-Mail-Adresse verwendet werden.
            </p>
          </div>
        </div>

        {message && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm mb-4 ${
            message.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message.type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 flex-shrink-0" />}
            {message.text}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-0">
              <input
                type="text"
                value={newAlias}
                onChange={e => setNewAlias(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                placeholder="alias-name"
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <span className="px-3 py-2.5 bg-gray-50 border border-l-0 border-gray-200 rounded-r-lg text-sm text-gray-400 whitespace-nowrap">
                @rentab.ly
              </span>
            </div>
          </div>
          <input
            type="text"
            value={newReason}
            onChange={e => setNewReason(e.target.value)}
            placeholder="Grund (optional)"
            className="sm:w-48 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <Button
            onClick={handleAdd}
            disabled={saving || !newAlias.trim()}
            variant="danger"
          >
            Sperren
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">
            Gesperrte Alias-Namen ({aliases.length})
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
          </div>
        ) : aliases.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Keine gesperrten Aliases vorhanden
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alias</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grund</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Erstellt</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {aliases.map(alias => (
                  <tr key={alias.alias_localpart} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <AtSign className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{alias.alias_localpart}</span>
                        <span className="text-xs text-gray-400">@rentab.ly</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500">
                      {alias.reason || '-'}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-400">
                      {new Date(alias.created_at).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(alias.alias_localpart)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Freigeben"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ForwardingRulesSection() {
  const [rules, setRules] = useState<ForwardingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAlias, setEditAlias] = useState<string | null>(null);
  const [formSource, setFormSource] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  async function loadRules() {
    setLoading(true);
    const { data, error } = await supabase
      .from('email_forwarding_rules')
      .select('*')
      .order('source_alias');
    if (!error && data) setRules(data);
    setLoading(false);
  }

  function resetForm() {
    setFormSource('');
    setFormTarget('');
    setFormActive(true);
    setEditAlias(null);
    setShowForm(false);
  }

  function startEdit(rule: ForwardingRule) {
    setEditAlias(rule.source_alias);
    setFormSource(rule.source_alias);
    setFormTarget(rule.forward_to_email);
    setFormActive(rule.is_active);
    setShowForm(true);
  }

  function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function handleSave() {
    const cleanedSource = formSource.toLowerCase().trim();
    const cleanedTarget = formTarget.trim();

    if (!cleanedSource) {
      setMessage({ type: 'error', text: 'Quell-Alias ist erforderlich.' });
      return;
    }
    if (!validateEmail(cleanedTarget)) {
      setMessage({ type: 'error', text: 'Bitte geben Sie eine gueltige Ziel-E-Mail-Adresse ein.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    if (editAlias) {
      const { error } = await supabase
        .from('email_forwarding_rules')
        .update({
          forward_to_email: cleanedTarget,
          is_active: formActive,
        })
        .eq('source_alias', editAlias);

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: 'Weiterleitung aktualisiert.' });
        resetForm();
        await loadRules();
      }
    } else {
      const { error } = await supabase.from('email_forwarding_rules').insert({
        source_alias: cleanedSource,
        forward_to_email: cleanedTarget,
        is_active: formActive,
      });

      if (error) {
        setMessage({ type: 'error', text: error.message.includes('duplicate') ? 'Diese Quell-Adresse existiert bereits.' : error.message });
      } else {
        setMessage({ type: 'success', text: `Weiterleitung fuer ${cleanedSource}@rentab.ly erstellt.` });
        resetForm();
        await loadRules();
      }
    }
    setSaving(false);
  }

  async function handleToggle(rule: ForwardingRule) {
    const { error } = await supabase
      .from('email_forwarding_rules')
      .update({ is_active: !rule.is_active })
      .eq('source_alias', rule.source_alias);
    if (!error) {
      setRules(prev => prev.map(r =>
        r.source_alias === rule.source_alias ? { ...r, is_active: !r.is_active } : r
      ));
    }
  }

  async function handleDelete(alias: string) {
    if (!confirm(`Weiterleitung fuer "${alias}@rentab.ly" wirklich loeschen?`)) return;
    const { error } = await supabase
      .from('email_forwarding_rules')
      .delete()
      .eq('source_alias', alias);
    if (!error) {
      setRules(prev => prev.filter(r => r.source_alias !== alias));
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Forward className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">E-Mail-Weiterleitungen</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Eingehende E-Mails an System-Adressen (@rentab.ly) an externe Postfaecher weiterleiten.
              </p>
            </div>
          </div>
          {!showForm && (
            <Button
              onClick={() => { resetForm(); setShowForm(true); }}
              variant="primary"
            >
              Neue Regel
            </Button>
          )}
        </div>

        {message && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm mb-4 ${
            message.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message.type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 flex-shrink-0" />}
            {message.text}
          </div>
        )}

        {showForm && (
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Quell-Adresse</label>
                <div className="flex items-center gap-0">
                  <input
                    type="text"
                    value={formSource}
                    onChange={e => setFormSource(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                    placeholder="willkommen"
                    disabled={!!editAlias}
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                  <span className="px-3 py-2.5 bg-gray-100 border border-l-0 border-gray-200 rounded-r-lg text-sm text-gray-400 whitespace-nowrap">
                    @rentab.ly
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Ziel-Adresse</label>
                <input
                  type="email"
                  value={formTarget}
                  onChange={e => setFormTarget(e.target.value)}
                  placeholder="ziel@example.com"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setFormActive(!formActive)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {formActive ? (
                  <ToggleRight className="w-5 h-5 text-green-600" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-gray-400" />
                )}
                {formActive ? 'Aktiv' : 'Inaktiv'}
              </button>

              <div className="flex items-center gap-2">
                <Button
                  onClick={resetForm}
                  variant="secondary"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !formSource.trim() || !formTarget.trim()}
                  variant="primary"
                >
                  {editAlias ? 'Aktualisieren' : 'Erstellen'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">
            Aktive Weiterleitungen ({rules.length})
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
          </div>
        ) : rules.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Keine Weiterleitungen konfiguriert
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quelle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ziel</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Erstellt</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rules.map(rule => (
                  <tr key={rule.source_alias} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <AtSign className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{rule.source_alias}</span>
                        <span className="text-xs text-gray-400">@rentab.ly</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-sm text-gray-700">{rule.forward_to_email}</span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <button
                        onClick={() => handleToggle(rule)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          rule.is_active
                            ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {rule.is_active ? (
                          <><ToggleRight className="w-3.5 h-3.5" /> Aktiv</>
                        ) : (
                          <><ToggleLeft className="w-3.5 h-3.5" /> Inaktiv</>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-400">
                      {new Date(rule.created_at).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEdit(rule)}
                          className="px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDelete(rule.source_alias)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Loeschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
