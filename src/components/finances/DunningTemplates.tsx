import { useState, useEffect } from "react";
import { Mail, Save, RotateCcw, Info } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface EmailTemplate {
  id: string;
  dunning_level: number;
  subject: string;
  message: string;
  is_active: boolean;
}

export default function DunningTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [user]);

  const loadTemplates = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("dunning_email_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("dunning_level", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setTemplates(data);
      } else {
        await createDefaultTemplates();
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultTemplates = async () => {
    if (!user) return;

    const defaultTemplates = [
      {
        user_id: user.id,
        dunning_level: 1,
        subject: "Freundliche Erinnerung: Mietzahlung",
        message: `Sehr geehrte/r [TENANT_NAME],

wir möchten Sie freundlich daran erinnern, dass die Miete für [PROPERTY_NAME] in Höhe von [AMOUNT] zum [DUE_DATE] fällig war.

Möglicherweise haben Sie die Überweisung vergessen. Bitte überweisen Sie den Betrag zeitnah.

Mit freundlichen Grüßen`,
        is_active: true
      },
      {
        user_id: user.id,
        dunning_level: 2,
        subject: "Zahlungsaufforderung: Ausstehende Miete",
        message: `Sehr geehrte/r [TENANT_NAME],

trotz freundlicher Erinnerung ist die Miete für [PROPERTY_NAME] in Höhe von [AMOUNT] noch nicht eingegangen.

Wir fordern Sie hiermit formell auf, den Betrag innerhalb von 7 Tagen zu überweisen. Andernfalls müssen wir weitere Schritte einleiten.

Mit freundlichen Grüßen`,
        is_active: true
      },
      {
        user_id: user.id,
        dunning_level: 3,
        subject: "MAHNUNG: Überfällige Mietzahlung",
        message: `Sehr geehrte/r [TENANT_NAME],

trotz mehrfacher Erinnerung ist die Miete für [PROPERTY_NAME] in Höhe von [AMOUNT] noch nicht eingegangen.

Wir mahnen Sie hiermit offiziell und fordern Sie auf, den ausstehenden Betrag zzgl. Mahngebühren in Höhe von 5,00 € (Gesamt: [TOTAL_AMOUNT]) innerhalb von 5 Tagen zu überweisen.

Bei weiterer Nichtzahlung behalten wir uns rechtliche Schritte vor.

Mit freundlichen Grüßen`,
        is_active: true
      }
    ];

    try {
      const { data, error } = await supabase
        .from("dunning_email_templates")
        .insert(defaultTemplates)
        .select();

      if (error) throw error;
      if (data) setTemplates(data);
    } catch (error) {
      console.error("Error creating default templates:", error);
    }
  };

  const handleSaveTemplate = async (template: EmailTemplate) => {
    if (!user) return;

    setSaving(template.dunning_level);

    try {
      const { error } = await supabase
        .from("dunning_email_templates")
        .update({
          subject: template.subject,
          message: template.message,
          updated_at: new Date().toISOString()
        })
        .eq("id", template.id);

      if (error) throw error;

      alert("Template erfolgreich gespeichert");
      setEditingTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Fehler beim Speichern des Templates");
    } finally {
      setSaving(null);
    }
  };

  const handleResetTemplate = async (level: number) => {
    if (!confirm("Template auf Standardwerte zurücksetzen?")) return;

    const defaultTemplates: Record<number, { subject: string; message: string }> = {
      1: {
        subject: "Freundliche Erinnerung: Mietzahlung",
        message: `Sehr geehrte/r [TENANT_NAME],

wir möchten Sie freundlich daran erinnern, dass die Miete für [PROPERTY_NAME] in Höhe von [AMOUNT] zum [DUE_DATE] fällig war.

Möglicherweise haben Sie die Überweisung vergessen. Bitte überweisen Sie den Betrag zeitnah.

Mit freundlichen Grüßen`
      },
      2: {
        subject: "Zahlungsaufforderung: Ausstehende Miete",
        message: `Sehr geehrte/r [TENANT_NAME],

trotz freundlicher Erinnerung ist die Miete für [PROPERTY_NAME] in Höhe von [AMOUNT] noch nicht eingegangen.

Wir fordern Sie hiermit formell auf, den Betrag innerhalb von 7 Tagen zu überweisen. Andernfalls müssen wir weitere Schritte einleiten.

Mit freundlichen Grüßen`
      },
      3: {
        subject: "MAHNUNG: Überfällige Mietzahlung",
        message: `Sehr geehrte/r [TENANT_NAME],

trotz mehrfacher Erinnerung ist die Miete für [PROPERTY_NAME] in Höhe von [AMOUNT] noch nicht eingegangen.

Wir mahnen Sie hiermit offiziell und fordern Sie auf, den ausstehenden Betrag zzgl. Mahngebühren in Höhe von 5,00 € (Gesamt: [TOTAL_AMOUNT]) innerhalb von 5 Tagen zu überweisen.

Bei weiterer Nichtzahlung behalten wir uns rechtliche Schritte vor.

Mit freundlichen Grüßen`
      }
    };

    const template = templates.find(t => t.dunning_level === level);
    if (!template) return;

    const defaultTemplate = defaultTemplates[level];

    try {
      const { error } = await supabase
        .from("dunning_email_templates")
        .update({
          subject: defaultTemplate.subject,
          message: defaultTemplate.message,
          updated_at: new Date().toISOString()
        })
        .eq("id", template.id);

      if (error) throw error;

      alert("Template zurückgesetzt");
      loadTemplates();
    } catch (error) {
      console.error("Error resetting template:", error);
      alert("Fehler beim Zurücksetzen");
    }
  };

  const getLevelInfo = (level: number) => {
    switch (level) {
      case 1:
        return {
          title: "Stufe 1: Freundliche Erinnerung",
          color: "bg-blue-50 border-blue-200",
          icon: "text-blue-600"
        };
      case 2:
        return {
          title: "Stufe 2: Formelle Zahlungsaufforderung",
          color: "bg-amber-50 border-amber-200",
          icon: "text-amber-600"
        };
      case 3:
        return {
          title: "Stufe 3: Mahnung",
          color: "bg-red-50 border-red-200",
          icon: "text-red-600"
        };
      default:
        return {
          title: "Unbekannte Stufe",
          color: "bg-gray-50 border-gray-200",
          icon: "text-gray-600"
        };
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt Templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }} className="border rounded-lg p-4">
        <p className="text-sm font-medium text-blue-900 mb-1">Platzhalter:</p>
        <ul className="space-y-1 text-sm text-blue-900">
          <li><code className="bg-white/60 px-2 py-0.5 rounded">[TENANT_NAME]</code> - Name des Mieters</li>
          <li><code className="bg-white/60 px-2 py-0.5 rounded">[PROPERTY_NAME]</code> - Name der Immobilie/Einheit</li>
          <li><code className="bg-white/60 px-2 py-0.5 rounded">[AMOUNT]</code> - Offener Betrag</li>
          <li><code className="bg-white/60 px-2 py-0.5 rounded">[DUE_DATE]</code> - Fälligkeitsdatum</li>
          <li><code className="bg-white/60 px-2 py-0.5 rounded">[TOTAL_AMOUNT]</code> - Gesamtbetrag inkl. Mahngebühren</li>
        </ul>
      </div>

      {templates.map((template) => {
        const levelInfo = getLevelInfo(template.dunning_level);
        const isEditing = editingTemplate?.id === template.id;
        const currentTemplate = isEditing ? editingTemplate : template;

        return (
          <div key={template.id} className={`border rounded-lg p-6 ${levelInfo.color}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Mail className={`w-6 h-6 ${levelInfo.icon}`} />
                <h3 className="text-lg font-semibold text-dark">{levelInfo.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleResetTemplate(template.dunning_level)}
                  style={{ backgroundColor: "#faf8f8", color: "#000000" }}
                  className="px-3 py-1.5 text-sm rounded-lg hover:bg-[#bdbfcb] transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Zurücksetzen
                </button>
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setEditingTemplate(null)}
                      style={{ backgroundColor: "#faf8f8", color: "#000000" }}
                      className="px-3 py-1.5 text-sm rounded-lg hover:bg-[#bdbfcb] transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={() => handleSaveTemplate(currentTemplate)}
                      disabled={saving === template.dunning_level}
                      className="px-3 py-1.5 text-sm text-white bg-primary-blue rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saving === template.dunning_level ? "Speichert..." : "Speichern"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditingTemplate({ ...template })}
                    className="px-3 py-1.5 text-sm text-primary-blue hover:text-blue-700 border border-primary-blue rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Bearbeiten
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Betreff
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={currentTemplate.subject}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...currentTemplate,
                        subject: e.target.value
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue bg-white"
                  />
                ) : (
                  <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg">
                    {currentTemplate.subject}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nachricht
                </label>
                {isEditing ? (
                  <textarea
                    value={currentTemplate.message}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...currentTemplate,
                        message: e.target.value
                      })
                    }
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue bg-white font-mono text-sm"
                  />
                ) : (
                  <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg whitespace-pre-wrap font-mono text-sm">
                    {currentTemplate.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
