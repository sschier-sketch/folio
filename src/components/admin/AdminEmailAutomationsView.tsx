import { useState, useEffect } from "react";
import {
  Zap,
  Clock,
  Play,
  Pause,
  ChevronDown,
  ChevronRight,
  Mail,
  Settings2,
  Users,
  CalendarClock,
  Send,
  Info,
  Pencil,
  Save,
  X,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button } from "../ui/Button";

interface Automation {
  id: string;
  name: string;
  description: string;
  template_key: string;
  trigger_type: "cron" | "event" | "manual";
  trigger_event: string | null;
  trigger_config: Record<string, any>;
  audience_filter: Record<string, any>;
  is_active: boolean;
  edge_function: string | null;
  last_run_at: string | null;
  total_sent: number;
  created_at: string;
  updated_at: string;
}

interface EditState {
  id: string;
  description: string;
  trigger_config: Record<string, any>;
  is_active: boolean;
}

const TRIGGER_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  cron: { label: "Zeitgesteuert", color: "bg-amber-100 text-amber-700" },
  event: { label: "Ereignisbasiert", color: "bg-blue-100 text-blue-700" },
  manual: { label: "Manuell", color: "bg-gray-100 text-gray-600" },
};

export default function AdminEmailAutomationsView() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAutomations();
  }, []);

  async function loadAutomations() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("email_automations")
        .select("*")
        .order("name");
      if (error) throw error;
      setAutomations(data || []);
    } catch (err) {
      console.error("Error loading automations:", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(automation: Automation) {
    try {
      const { error } = await supabase
        .from("email_automations")
        .update({
          is_active: !automation.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", automation.id);
      if (error) throw error;
      await loadAutomations();
    } catch (err) {
      console.error("Error toggling automation:", err);
    }
  }

  function startEdit(automation: Automation) {
    setEditState({
      id: automation.id,
      description: automation.description,
      trigger_config: { ...automation.trigger_config },
      is_active: automation.is_active,
    });
  }

  async function saveEdit() {
    if (!editState) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("email_automations")
        .update({
          description: editState.description,
          trigger_config: editState.trigger_config,
          is_active: editState.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editState.id);
      if (error) throw error;
      setEditState(null);
      await loadAutomations();
    } catch (err) {
      console.error("Error saving automation:", err);
    } finally {
      setSaving(false);
    }
  }

  function renderTriggerConfig(automation: Automation) {
    const config = automation.trigger_config;
    const entries = Object.entries(config).filter(
      ([k]) => !k.startsWith("configurable")
    );
    if (entries.length === 0) return null;

    return (
      <div className="space-y-1.5">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            <span className="text-gray-400 min-w-[140px]">
              {formatConfigKey(key)}:
            </span>
            <span className="text-dark font-medium">{String(value)}</span>
          </div>
        ))}
        {config.configurable_env && (
          <div className="flex items-center gap-2 text-xs mt-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200">
            <Settings2 className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="text-amber-700">
              Konfigurierbar via Umgebungsvariable:{" "}
              <code className="font-mono bg-amber-100 px-1 rounded">
                {config.configurable_env}
              </code>
            </span>
          </div>
        )}
      </div>
    );
  }

  function renderAudienceFilter(automation: Automation) {
    const filter = automation.audience_filter;
    return (
      <div className="space-y-1.5">
        {filter.segment && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-dark font-medium">
              {formatSegment(filter.segment)}
            </span>
          </div>
        )}
        {filter.conditions && Array.isArray(filter.conditions) && (
          <div className="mt-2 space-y-1">
            {filter.conditions.map((condition: string, i: number) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs text-gray-500"
              >
                <span className="text-gray-300 mt-0.5">-</span>
                <span>{condition}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderEditableConfig() {
    if (!editState) return null;
    const config = editState.trigger_config;

    return (
      <div className="space-y-3">
        {config.days_before_expiry !== undefined && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Tage vor Ablauf
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={config.days_before_expiry}
              onChange={(e) =>
                setEditState({
                  ...editState,
                  trigger_config: {
                    ...config,
                    days_before_expiry: parseInt(e.target.value) || 7,
                  },
                })
              }
              className="w-24 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Beschreibung
          </label>
          <textarea
            value={editState.description}
            onChange={(e) =>
              setEditState({ ...editState, description: e.target.value })
            }
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeCount = automations.filter((a) => a.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-dark">E-Mail Automationen</h2>
          <p className="text-sm text-gray-400 mt-1">
            {activeCount} von {automations.length} aktiv
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs text-blue-700">
              Automationen werden durch Events oder Cron Jobs ausgeloest
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {automations.map((automation) => {
          const isExpanded = expandedId === automation.id;
          const isEditing = editState?.id === automation.id;
          const triggerMeta =
            TRIGGER_TYPE_LABELS[automation.trigger_type] ||
            TRIGGER_TYPE_LABELS.manual;

          return (
            <div
              key={automation.id}
              className={`bg-white rounded-xl border transition-all ${
                automation.is_active
                  ? "border-gray-100"
                  : "border-gray-100 opacity-60"
              }`}
            >
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() =>
                  setExpandedId(isExpanded ? null : automation.id)
                }
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    automation.is_active ? "bg-blue-50" : "bg-gray-100"
                  }`}
                >
                  {automation.trigger_type === "cron" ? (
                    <CalendarClock
                      className={`w-5 h-5 ${automation.is_active ? "text-blue-600" : "text-gray-400"}`}
                    />
                  ) : (
                    <Zap
                      className={`w-5 h-5 ${automation.is_active ? "text-blue-600" : "text-gray-400"}`}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-dark text-sm truncate">
                      {automation.name}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${triggerMeta.color}`}
                    >
                      {triggerMeta.label}
                    </span>
                    {automation.is_active ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                        <Play className="w-3 h-3" />
                        Aktiv
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
                        <Pause className="w-3 h-3" />
                        Pausiert
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {automation.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-400">Template</p>
                    <p className="text-xs font-mono text-gray-600">
                      {automation.template_key}
                    </p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-xs text-gray-400">Gesendet</p>
                    <p className="text-sm font-semibold text-dark">
                      {automation.total_sent}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 p-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Ausloeser & Timing
                      </h4>
                      {isEditing ? (
                        renderEditableConfig()
                      ) : (
                        renderTriggerConfig(automation)
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Zielgruppe
                      </h4>
                      {renderAudienceFilter(automation)}
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Edge Function:</span>
                          <span className="font-mono text-xs text-gray-600">
                            {automation.edge_function || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Letzter Lauf:</span>
                          <span className="text-dark">
                            {automation.last_run_at
                              ? new Date(
                                  automation.last_run_at
                                ).toLocaleDateString("de-DE", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Erstellt:</span>
                          <span className="text-dark">
                            {new Date(automation.created_at).toLocaleDateString(
                              "de-DE"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-100">
                    {isEditing ? (
                      <>
                        <Button
                          onClick={saveEdit}
                          disabled={saving}
                          variant="primary"
                        >
                          <Save className="w-4 h-4 mr-1.5" />
                          {saving ? "Speichern..." : "Speichern"}
                        </Button>
                        <Button
                          onClick={() => setEditState(null)}
                          variant="secondary"
                        >
                          <X className="w-4 h-4 mr-1.5" />
                          Abbrechen
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => startEdit(automation)}
                          variant="secondary"
                        >
                          <Pencil className="w-4 h-4 mr-1.5" />
                          Bearbeiten
                        </Button>
                        <Button
                          onClick={() => toggleActive(automation)}
                          variant="secondary"
                        >
                          {automation.is_active ? (
                            <>
                              <Pause className="w-4 h-4 mr-1.5" />
                              Pausieren
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-1.5" />
                              Aktivieren
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>

                  {!automation.is_active && (
                    <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        Diese Automation ist pausiert. E-Mails werden nicht
                        verschickt, bis sie wieder aktiviert wird. Die
                        Deaktivierung hier dient nur zur Dokumentation -- die
                        tatsaechliche Ausfuehrung wird durch die Edge Function
                        gesteuert.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {automations.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Zap className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p>Keine Automationen konfiguriert</p>
        </div>
      )}
    </div>
  );
}

function formatConfigKey(key: string): string {
  const labels: Record<string, string> = {
    timing: "Zeitpunkt",
    days_before_expiry: "Tage vor Ablauf",
    cron_schedule: "Zeitplan",
    configurable_env: "Env-Variable",
  };
  return labels[key] || key.replace(/_/g, " ");
}

function formatSegment(segment: string): string {
  const labels: Record<string, string> = {
    alle_neuen_nutzer: "Alle neuen Nutzer",
    free_mit_trial: "Free-Nutzer mit aktiver Testphase",
    free_trial_abgelaufen: "Free-Nutzer mit abgelaufener Testphase",
    anfragender_nutzer: "Anfragender Nutzer",
    mieter: "Mieter",
    eingeladene_person: "Eingeladene Person",
    ticket_ersteller: "Ticket-Ersteller",
    admin_team: "Admin-Team",
    ticket_absender: "Ticket-Absender",
    aktivierter_mieter: "Aktivierter Mieter",
    neuer_pro_nutzer: "Neuer Pro-Nutzer",
    kündigender_nutzer: "Kuendigender Nutzer",
  };
  return labels[segment] || segment;
}
