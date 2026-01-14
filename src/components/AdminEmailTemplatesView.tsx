import { useState, useEffect } from "react";
import { Mail, Save, Eye, Code, FileText } from "lucide-react";
import { supabase } from "../lib/supabase";
interface EmailTemplate {
  id: string;
  template_key: string;
  template_name: string;
  subject: string;
  body_html: string;
  body_text: string;
  variables: string[];
  description: string;
  language: 'de' | 'en';
  created_at: string;
  updated_at: string;
}
export function AdminEmailTemplatesView() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<"html" | "text">("html");
  const [editedTemplate, setEditedTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [languageFilter, setLanguageFilter] = useState<'all' | 'de' | 'en'>('all');
  useEffect(() => {
    loadTemplates();
  }, [languageFilter]);
  useEffect(() => {
    if (selectedTemplate) {
      setEditedTemplate({ ...selectedTemplate });
    }
  }, [selectedTemplate]);
  async function loadTemplates() {
    try {
      setLoading(true);
      let query = supabase
        .from("email_templates")
        .select("*")
        .order("template_name");

      if (languageFilter !== 'all') {
        query = query.eq('language', languageFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTemplates(data || []);
      if (data && data.length > 0 && !selectedTemplate) {
        setSelectedTemplate(data[0]);
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
          updated_at: new Date().toISOString(),
        })
        .eq("id", editedTemplate.id);
      if (error) throw error;
      await loadTemplates();
      setSelectedTemplate(editedTemplate);
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

  function replaceVariables(content: string, variables: string[]): string {
    let result = content;
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
        {" "}
        <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />{" "}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {" "}
      <div className="lg:col-span-1 bg-white rounded overflow-hidden">
        {" "}
        <div className="p-4 border-b">
          {" "}
          <h2 className="text-lg font-bold text-dark">E-Mail Templates</h2>{" "}
          <p className="text-xs text-gray-300 mt-1">
            {templates.length} Templates
          </p>{" "}
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Sprache filtern
            </label>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value as 'all' | 'de' | 'en')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="all">Alle Sprachen</option>
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>{" "}
        <div className="divide-y divide-slate-200">
          {" "}
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedTemplate?.id === template.id ? "bg-primary-blue/5" : ""}`}
            >
              {" "}
              <div className="flex items-start gap-3">
                {" "}
                <div className="flex-shrink-0 w-10 h-10 bg-primary-blue/10 rounded-full flex items-center justify-center">
                  {" "}
                  <Mail className="w-5 h-5 text-primary-blue" />{" "}
                </div>{" "}
                <div className="flex-1 min-w-0">
                  {" "}
                  <h3 className="font-semibold text-dark mb-1">
                    {template.template_name}
                  </h3>{" "}
                  <p className="text-xs text-gray-300 line-clamp-2">
                    {template.description}
                  </p>{" "}
                  <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded ${template.language === 'de' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {template.language === 'de' ? 'Deutsch' : 'English'}
                  </span>{" "}
                </div>{" "}
              </div>{" "}
            </button>
          ))}{" "}
        </div>{" "}
      </div>{" "}
      <div className="lg:col-span-3 bg-white rounded overflow-hidden">
        {" "}
        {editedTemplate ? (
          <div className="flex flex-col h-[calc(100vh-300px)]">
            {" "}
            <div className="p-6 border-b">
              {" "}
              <div className="flex items-start justify-between mb-4">
                {" "}
                <div className="flex-1">
                  {" "}
                  <h2 className="text-xl font-bold text-dark mb-1">
                    {editedTemplate.template_name}
                  </h2>{" "}
                  <p className="text-sm text-gray-400">
                    {editedTemplate.description}
                  </p>{" "}
                </div>{" "}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {" "}
                  {saving ? (
                    <>
                      {" "}
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                      Speichern...{" "}
                    </>
                  ) : (
                    <>
                      {" "}
                      <Save className="w-4 h-4" /> Speichern{" "}
                    </>
                  )}{" "}
                </button>{" "}
              </div>{" "}
              <div className="space-y-4">
                {" "}
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {" "}
                    Template-Schlüssel (nicht änderbar){" "}
                  </label>{" "}
                  <input
                    type="text"
                    value={editedTemplate.template_key}
                    disabled
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 text-gray-300"
                  />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {" "}
                    Template-Name{" "}
                  </label>{" "}
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
                  />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {" "}
                    E-Mail Betreff{" "}
                  </label>{" "}
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
                  />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {" "}
                    Beschreibung{" "}
                  </label>{" "}
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
                  />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {" "}
                    Sprache (nicht änderbar){" "}
                  </label>{" "}
                  <input
                    type="text"
                    value={editedTemplate.language === 'de' ? 'Deutsch' : 'English'}
                    disabled
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 text-gray-300"
                  />{" "}
                </div>{" "}
                {editedTemplate.variables &&
                  editedTemplate.variables.length > 0 && (
                    <div>
                      {" "}
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        {" "}
                        Verfügbare Variablen{" "}
                      </label>{" "}
                      <div className="flex flex-wrap gap-2">
                        {" "}
                        {editedTemplate.variables.map((variable) => (
                          <span
                            key={variable}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-blue/10 text-primary-blue text-xs rounded-full"
                            title={`{{${variable}}}`}
                          >
                            {" "}
                            <span className="font-mono">{`{{${variable}}}`}</span>
                            <span className="text-gray-500">—</span>
                            <span className="font-medium">{getVariableLabel(variable)}</span>
                          </span>
                        ))}{" "}
                      </div>{" "}
                    </div>
                  )}{" "}
              </div>{" "}
            </div>{" "}
            <div className="flex-1 overflow-hidden flex flex-col">
              {" "}
              <div className="flex gap-2 p-4 border-b">
                {" "}
                <button
                  onClick={() => setPreviewMode("html")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${previewMode === "html" ? "bg-primary-blue text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
                >
                  {" "}
                  <Code className="w-4 h-4" /> HTML{" "}
                </button>{" "}
                <button
                  onClick={() => setPreviewMode("text")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${previewMode === "text" ? "bg-primary-blue text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
                >
                  {" "}
                  <FileText className="w-4 h-4" /> Text{" "}
                </button>{" "}
              </div>{" "}
              <div className="flex-1 overflow-hidden grid grid-cols-2 gap-4 p-4">
                {" "}
                <div className="flex flex-col h-full">
                  {" "}
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {" "}
                    {previewMode === "html" ? "HTML Code" : "Text-Version"}{" "}
                  </label>{" "}
                  <textarea
                    value={
                      previewMode === "html"
                        ? editedTemplate.body_html
                        : editedTemplate.body_text
                    }
                    onChange={(e) =>
                      setEditedTemplate({
                        ...editedTemplate,
                        [previewMode === "html" ? "body_html" : "body_text"]:
                          e.target.value,
                      })
                    }
                    className="flex-1 w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none font-mono text-sm"
                  />{" "}
                </div>{" "}
                <div className="flex flex-col h-full">
                  {" "}
                  <div className="flex items-center gap-2 mb-2">
                    {" "}
                    <Eye className="w-4 h-4 text-gray-400" />{" "}
                    <label className="text-sm font-medium text-gray-400">
                      Vorschau
                    </label>{" "}
                  </div>{" "}
                  <div className="flex-1 rounded-lg overflow-auto bg-white p-4">
                    {" "}
                    {previewMode === "html" ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: replaceVariables(
                            editedTemplate.body_html,
                            editedTemplate.variables || [],
                          ),
                        }}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm text-dark font-sans">
                        {" "}
                        {replaceVariables(
                          editedTemplate.body_text,
                          editedTemplate.variables || [],
                        )}{" "}
                      </pre>
                    )}{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>
        ) : (
          <div className="flex items-center justify-center h-96 text-gray-300">
            {" "}
            <div className="text-center">
              {" "}
              <Mail className="w-16 h-16 mx-auto mb-4 text-gray-200" />{" "}
              <p>Wählen Sie ein Template aus der Liste</p>{" "}
            </div>{" "}
          </div>
        )}{" "}
      </div>{" "}
    </div>
  );
}
