import { useState, useEffect } from "react";
import { Mail, Eye, Clock, CheckCircle, AlertTriangle, Megaphone, Send } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/Button";

interface EmailTemplate {
  id: string;
  template_key: string;
  template_name: string;
  subject: string;
  body_html: string;
  body_text: string;
  variables: string[];
  description: string;
  language: "de" | "en";
  category: "transactional" | "marketing";
  created_at: string;
  updated_at: string;
}

const ACTIVE_TEMPLATE_KEYS = new Set([
  "registration",
  "magic_link",
  "password_reset",
  "tenant_password_reset",
  "referral_invitation",
  "referral_reward_earned",
  "trial_ended",
  "trial_ending",
  "ticket_reply",
  "admin_notify_new_ticket",
  "tenant_portal_activation",
  "subscription_started",
  "subscription_cancelled",
]);

const CRON_TEMPLATE_KEYS: Record<string, string> = {
  trial_ended: "cron-trial-ended",
  trial_ending: "cron-trial-ending",
};

export function AdminEmailTemplatesView() {
  const [groupedTemplates, setGroupedTemplates] = useState<
    Map<string, EmailTemplate[]>
  >(new Map());
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<"de" | "en">("de");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedTemplate, setEditedTemplate] = useState<EmailTemplate | null>(
    null
  );

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplateKey && groupedTemplates.has(selectedTemplateKey)) {
      const templates = groupedTemplates.get(selectedTemplateKey)!;
      const template = templates.find((t) => t.language === selectedLanguage);
      if (template) {
        setEditedTemplate({ ...template });
      }
    }
  }, [selectedTemplateKey, selectedLanguage, groupedTemplates]);

  async function loadTemplates() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("template_name");

      if (error) throw error;

      const grouped = new Map<string, EmailTemplate[]>();
      (data || []).forEach((template) => {
        if (!grouped.has(template.template_key)) {
          grouped.set(template.template_key, []);
        }
        grouped.get(template.template_key)!.push(template);
      });

      setGroupedTemplates(grouped);

      if (grouped.size > 0 && !selectedTemplateKey) {
        const firstKey = Array.from(grouped.keys())[0];
        setSelectedTemplateKey(firstKey);
      }
    } catch (err) {
      console.error("Error loading templates:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!editedTemplate) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("email_templates")
        .update({
          template_name: editedTemplate.template_name,
          subject: editedTemplate.subject,
          body_html: editedTemplate.body_html,
          body_text: editedTemplate.body_text,
          description: editedTemplate.description,
          category: editedTemplate.category,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editedTemplate.id);
      if (error) throw error;
      await loadTemplates();
      alert("Template erfolgreich gespeichert!");
    } catch (err) {
      console.error("Error saving template:", err);
      alert("Fehler beim Speichern des Templates");
    } finally {
      setSaving(false);
    }
  }

  function getVariableLabel(variable: string): string {
    const labels: Record<string, string> = {
      tenant_name: "Mieter Name",
      tenant_email: "Mieter E-Mail",
      portal_link: "Portal Link",
      landlord_name: "Vermieter Name",
      landlord_email: "Vermieter E-Mail",
      property_address: "Immobilien Adresse",
      property_name: "Immobilien Name",
      contract_start: "Vertragsbeginn",
      contract_end: "Vertragsende",
      rent_amount: "Miete Betrag",
      ticket_number: "Ticket Nummer",
      ticket_subject: "Ticket Betreff",
      ticket_message: "Ticket Nachricht",
      reply_message: "Antwort Nachricht",
      reset_link: "Passwort zurücksetzen Link",
      user_email: "Benutzer E-Mail",
    };
    return labels[variable] || variable;
  }

  function replaceVariables(
    content: string,
    variables: string[] | null | undefined
  ): string {
    let result = content;
    if (!variables || !Array.isArray(variables)) {
      return result;
    }
    variables.forEach((variable) => {
      const placeholder = `{{${variable}}}`;
      const exampleValue = `[${getVariableLabel(variable)}]`;
      result = result.replace(new RegExp(placeholder, "g"), exampleValue);
    });
    return result;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1 bg-white rounded overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold text-dark">E-Mail Templates</h2>
          <p className="text-xs text-gray-300 mt-1">
            {groupedTemplates.size} Templates
          </p>
        </div>
        <div className="divide-y divide-slate-200">
          {Array.from(groupedTemplates.entries()).map(([key, templates]) => {
            const deTemplate = templates.find((t) => t.language === "de");
            const enTemplate = templates.find((t) => t.language === "en");
            const displayTemplate = deTemplate || templates[0];
            const isActive = ACTIVE_TEMPLATE_KEYS.has(key);
            const cronJob = CRON_TEMPLATE_KEYS[key];
            const isMarketing = displayTemplate.category === "marketing";

            return (
              <button
                key={key}
                onClick={() => setSelectedTemplateKey(key)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedTemplateKey === key ? "bg-primary-blue/5" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isActive ? "bg-primary-blue/10" : "bg-gray-100"}`}
                  >
                    <Mail
                      className={`w-5 h-5 ${isActive ? "text-primary-blue" : "text-gray-300"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <h3
                        className={`font-semibold truncate ${isActive ? "text-dark" : "text-gray-400"}`}
                      >
                        {displayTemplate.template_name || key}
                      </h3>
                      {cronJob && (
                        <span title={`Cron: ${cronJob}`}>
                          <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-300 line-clamp-1">
                      {displayTemplate.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {deTemplate && (
                        <span className="inline-block px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700">
                          DE
                        </span>
                      )}
                      {enTemplate && (
                        <span className="inline-block px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">
                          EN
                        </span>
                      )}
                      {isMarketing ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs rounded bg-orange-100 text-orange-700">
                          <Megaphone className="w-3 h-3" />
                          Mkt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-600">
                          <Send className="w-3 h-3" />
                          Txn
                        </span>
                      )}
                      {isActive ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs rounded bg-emerald-100 text-emerald-700">
                          <CheckCircle className="w-3 h-3" />
                          Aktiv
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs rounded bg-amber-50 text-amber-600">
                          <AlertTriangle className="w-3 h-3" />
                          Unbenutzt
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="lg:col-span-3 bg-white rounded overflow-hidden">
        {editedTemplate ? (
          <div className="overflow-auto max-h-[calc(100vh-200px)]">
            <div className="p-6 border-b">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-dark">
                      {editedTemplate.template_name ||
                        editedTemplate.template_key}
                    </h2>
                    {ACTIVE_TEMPLATE_KEYS.has(editedTemplate.template_key) ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                        <CheckCircle className="w-3 h-3" />
                        Aktiv im Code
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-600">
                        <AlertTriangle className="w-3 h-3" />
                        Nicht im Code verwendet
                      </span>
                    )}
                    {CRON_TEMPLATE_KEYS[editedTemplate.template_key] && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                        <Clock className="w-3 h-3" />
                        {CRON_TEMPLATE_KEYS[editedTemplate.template_key]}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    {editedTemplate.description}
                  </p>
                </div>
                <Button onClick={handleSave} disabled={saving} variant="primary">
                  {saving ? "Speichern..." : "Speichern"}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Template-Schlüssel (nicht änderbar)
                  </label>
                  <input
                    type="text"
                    value={editedTemplate.template_key}
                    disabled
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 text-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Template-Name
                  </label>
                  <input
                    type="text"
                    value={editedTemplate.template_name}
                    onChange={(e) =>
                      setEditedTemplate({
                        ...editedTemplate,
                        template_name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    E-Mail Betreff
                  </label>
                  <input
                    type="text"
                    value={editedTemplate.subject}
                    onChange={(e) =>
                      setEditedTemplate({
                        ...editedTemplate,
                        subject: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Beschreibung
                  </label>
                  <input
                    type="text"
                    value={editedTemplate.description}
                    onChange={(e) =>
                      setEditedTemplate({
                        ...editedTemplate,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Sprache
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) =>
                      setSelectedLanguage(e.target.value as "de" | "en")
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="de">Deutsch</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Kategorie
                  </label>
                  <select
                    value={editedTemplate.category || "transactional"}
                    onChange={(e) =>
                      setEditedTemplate({
                        ...editedTemplate,
                        category: e.target.value as
                          | "transactional"
                          | "marketing",
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="transactional">Transaktional</option>
                    <option value="marketing">Marketing</option>
                  </select>
                </div>
                {editedTemplate.variables &&
                  editedTemplate.variables.length > 0 && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Verfügbare Variablen
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {editedTemplate.variables.map((variable) => (
                          <span
                            key={variable}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-blue/10 text-primary-blue text-xs rounded-full"
                            title={`{{${variable}}}`}
                          >
                            <span className="font-mono">{`{{${variable}}}`}</span>
                            <span className="text-gray-500">-</span>
                            <span className="font-medium">
                              {getVariableLabel(variable)}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  HTML Version
                </label>
                <textarea
                  value={editedTemplate.body_html}
                  onChange={(e) =>
                    setEditedTemplate({
                      ...editedTemplate,
                      body_html: e.target.value,
                    })
                  }
                  rows={16}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-y font-mono text-sm"
                />
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <label className="text-sm font-medium text-gray-400">
                      HTML Vorschau
                    </label>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-auto bg-gray-50 p-4 max-h-96">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: replaceVariables(
                          editedTemplate.body_html,
                          editedTemplate.variables || []
                        ),
                      }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Text Version (Plain Text)
                </label>
                <textarea
                  value={editedTemplate.body_text}
                  onChange={(e) =>
                    setEditedTemplate({
                      ...editedTemplate,
                      body_text: e.target.value,
                    })
                  }
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-y font-mono text-sm"
                />
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <label className="text-sm font-medium text-gray-400">
                      Text Vorschau
                    </label>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-auto bg-gray-50 p-4 max-h-64">
                    <pre className="whitespace-pre-wrap text-sm text-dark font-sans">
                      {replaceVariables(
                        editedTemplate.body_text,
                        editedTemplate.variables || []
                      )}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96 text-gray-300">
            <div className="text-center">
              <Mail className="w-16 h-16 mx-auto mb-4 text-gray-200" />
              <p>Wählen Sie ein Template aus der Liste</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
