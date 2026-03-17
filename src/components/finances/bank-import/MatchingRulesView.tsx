import { useState, useEffect } from 'react';
import {
  RotateCcw,
  Loader,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Zap,
  ArrowDownUp,
  CircleDollarSign,
  Home,
  AlertCircle,
  Ban,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermissions } from '../../../hooks/usePermissions';
import {
  listMatchingRules,
  updateMatchingRule,
  deleteMatchingRule,
  getAutoApplySetting,
  setAutoApplySetting,
} from '../../../lib/bankImport';
import type { BankMatchingRule } from '../../../lib/bankImport/types';

export default function MatchingRulesView() {
  const { user } = useAuth();
  const { dataOwnerId } = usePermissions();
  const [rules, setRules] = useState<BankMatchingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoApply, setAutoApply] = useState(false);
  const [autoApplyLoading, setAutoApplyLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const userId = dataOwnerId || user?.id || '';

  useEffect(() => {
    if (userId) {
      loadRules();
      loadAutoApply();
    }
  }, [userId]);

  async function loadRules() {
    setLoading(true);
    try {
      const data = await listMatchingRules(userId);
      setRules(data);
    } finally {
      setLoading(false);
    }
  }

  async function loadAutoApply() {
    const value = await getAutoApplySetting(userId);
    setAutoApply(value);
  }

  async function handleToggleAutoApply() {
    setAutoApplyLoading(true);
    try {
      const newValue = !autoApply;
      await setAutoApplySetting(userId, newValue);
      setAutoApply(newValue);
    } finally {
      setAutoApplyLoading(false);
    }
  }

  async function handleToggleActive(rule: BankMatchingRule) {
    setTogglingId(rule.id);
    try {
      await updateMatchingRule(userId, rule.id, { is_active: !rule.is_active });
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r))
      );
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(ruleId: string) {
    setDeletingId(ruleId);
    try {
      await deleteMatchingRule(userId, ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } finally {
      setDeletingId(null);
    }
  }

  function formatAmount(cents: number) {
    return (cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function getTargetLabel(rule: BankMatchingRule) {
    if (rule.target_type === 'rent_payment') return 'Mietzahlung';
    if (rule.target_type === 'expense') return 'Ausgabe';
    if (rule.target_type === 'income_entry') return 'Einnahme';
    if (rule.target_type === 'ignore') return 'Ignorieren';
    return rule.target_type;
  }

  function getTargetIcon(rule: BankMatchingRule) {
    if (rule.target_type === 'rent_payment') return Home;
    if (rule.target_type === 'expense') return ArrowDownUp;
    if (rule.target_type === 'ignore') return Ban;
    return CircleDollarSign;
  }

  function getTargetDetail(rule: BankMatchingRule) {
    const config = rule.target_config || {};
    const parts: string[] = [];
    if (config.category) parts.push(String(config.category));
    if (config.description) parts.push(String(config.description));
    return parts.join(' - ') || null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              autoApply ? 'bg-emerald-100' : 'bg-gray-100'
            }`}>
              <Zap className={`w-5 h-5 ${autoApply ? 'text-emerald-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-dark">
                Vorschlaege automatisch anwenden
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Wenn aktiviert, werden nach jedem Import Regel-basierte Vorschlaege automatisch zugeordnet.
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleAutoApply}
            disabled={autoApplyLoading}
            className="flex-shrink-0 transition-colors"
          >
            {autoApplyLoading ? (
              <Loader className="w-7 h-7 text-gray-400 animate-spin" />
            ) : autoApply ? (
              <ToggleRight className="w-10 h-10 text-emerald-500" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-gray-300" />
            )}
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-dark">Zuordnungsregeln</h3>
            <span className="text-xs text-gray-400">({rules.length})</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
            <Loader className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        ) : rules.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <RotateCcw className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500 mb-1">
              Noch keine Regeln erstellt
            </p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Regeln werden automatisch erstellt, wenn Sie bei einer Zuordnung die Option
              &quot;Zuordnung in Zukunft automatisch anwenden&quot; aktivieren.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden divide-y divide-gray-100">
            {rules.map((rule) => {
              const TargetIcon = getTargetIcon(rule);
              const detail = getTargetDetail(rule);
              const isToggling = togglingId === rule.id;
              const isDeleting = deletingId === rule.id;

              return (
                <div
                  key={rule.id}
                  className={`px-4 py-3.5 flex items-center gap-4 transition-colors ${
                    !rule.is_active ? 'opacity-50 bg-gray-50/50' : ''
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    rule.target_type === 'ignore'
                      ? 'bg-gray-200'
                      : rule.direction === 'credit' ? 'bg-emerald-100' : 'bg-amber-100'
                  }`}>
                    <TargetIcon className={`w-4 h-4 ${
                      rule.target_type === 'ignore'
                        ? 'text-gray-500'
                        : rule.direction === 'credit' ? 'text-emerald-600' : 'text-amber-600'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-dark truncate">
                        {rule.counterparty_name}
                      </p>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        rule.target_type === 'rent_payment'
                          ? 'bg-blue-100 text-blue-700'
                          : rule.target_type === 'expense'
                          ? 'bg-amber-100 text-amber-700'
                          : rule.target_type === 'ignore'
                          ? 'bg-gray-200 text-gray-600'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {getTargetLabel(rule)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-500 tabular-nums font-medium">
                        {formatAmount(rule.amount_cents)} EUR
                      </span>
                      {detail && (
                        <span className="text-xs text-gray-400 truncate">{detail}</span>
                      )}
                      {rule.match_count > 0 && (
                        <span className="text-[10px] text-gray-400">
                          {rule.match_count}x angewendet
                        </span>
                      )}
                      {rule.last_matched_at && (
                        <span className="text-[10px] text-gray-400">
                          Zuletzt: {new Date(rule.last_matched_at).toLocaleDateString('de-DE')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggleActive(rule)}
                      disabled={isToggling}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      title={rule.is_active ? 'Regel deaktivieren' : 'Regel aktivieren'}
                    >
                      {isToggling ? (
                        <Loader className="w-4 h-4 text-gray-400 animate-spin" />
                      ) : rule.is_active ? (
                        <ToggleRight className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-gray-300" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Regel loeschen"
                    >
                      {isDeleting ? (
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 space-y-1">
            <p className="font-medium">So funktionieren die Regeln:</p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-600">
              <li>Regeln werden beim Zuordnen oder Ignorieren einer Transaktion erstellt (Checkbox aktivieren)</li>
              <li>Nach jedem Import werden automatisch Vorschlaege generiert</li>
              <li>Ignorier-Regeln werden immer sofort angewendet (ohne Auto-Anwendung)</li>
              <li>Bei aktivierter Auto-Anwendung werden Zuordnungs-Treffer direkt zugeordnet</li>
              <li>Matching basiert auf exaktem Abgleich von Name und Betrag</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
