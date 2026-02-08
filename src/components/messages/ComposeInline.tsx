import { useState, useEffect } from 'react';
import { Send, Users, AtSign, Upload, File as FileIcon, Globe, Info, Building2, DoorOpen, ChevronRight, ArrowLeft, X, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { sanitizeFileName } from '../../lib/utils';

interface Property {
  id: string;
  name: string;
  address: string;
}

interface Unit {
  id: string;
  unit_number: string;
  unit_type: string;
}

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  property_id?: string;
  unit_id?: string;
}

interface MailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  content: string;
}

interface ComposeInlineProps {
  userAlias: string;
  onSent: () => void;
  onCancel: () => void;
}

export default function ComposeInline({ userAlias, onSent, onCancel }: ComposeInlineProps) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [recipientType, setRecipientType] = useState<'tenant' | 'manual'>('tenant');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [signature, setSignature] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [publishToPortal, setPublishToPortal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    if (user) {
      loadProperties();
      loadTemplates();
      loadSignature();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPropertyId) {
      loadUnits(selectedPropertyId);
      loadTenants(selectedPropertyId, '');
    } else {
      setUnits([]);
      setTenants([]);
    }
    setSelectedUnitId('');
    setSelectedTenant(null);
  }, [selectedPropertyId]);

  useEffect(() => {
    if (selectedPropertyId) {
      loadTenants(selectedPropertyId, selectedUnitId);
    }
    setSelectedTenant(null);
  }, [selectedUnitId]);

  async function loadSignature() {
    if (!user) return;
    const { data } = await supabase
      .from('user_mail_settings')
      .select('signature')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data?.signature) {
      setSignature(data.signature);
      setContent('\n\n--\n' + data.signature);
    }
  }

  async function loadProperties() {
    if (!user) return;
    const { data } = await supabase
      .from('properties')
      .select('id, name, address')
      .eq('user_id', user.id)
      .order('name');
    setProperties(data || []);
  }

  async function loadUnits(propertyId: string) {
    if (!user) return;
    const { data } = await supabase
      .from('property_units')
      .select('id, unit_number, unit_type')
      .eq('property_id', propertyId)
      .eq('user_id', user.id)
      .order('unit_number');
    setUnits(data || []);
  }

  async function loadTenants(propertyId: string, unitId: string) {
    if (!user) return;
    let query = supabase
      .from('tenants')
      .select('id, first_name, last_name, email, property_id, unit_id')
      .eq('user_id', user.id)
      .eq('property_id', propertyId)
      .eq('is_active', true)
      .order('last_name');
    if (unitId) query = query.eq('unit_id', unitId);
    const { data } = await query;
    setTenants(data || []);
  }

  async function loadTemplates() {
    if (!user) return;
    const { data } = await supabase
      .from('user_mail_templates')
      .select('id, name, category, subject, content')
      .eq('user_id', user.id)
      .order('name');
    setTemplates(data || []);
  }

  function applyTemplate(template: MailTemplate) {
    setSubject(template.subject);
    const sigBlock = signature ? '\n\n--\n' + signature : '';
    setContent(template.content + sigBlock);
    setShowTemplates(false);
  }

  async function uploadAttachment(): Promise<{ filePath: string } | null> {
    if (!attachedFile || !user) return null;
    const sanitized = sanitizeFileName(attachedFile.name);
    const fileName = `${Date.now()}_${sanitized}`;
    const filePath = `${user.id}/mail-attachments/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, attachedFile, { cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;
    return { filePath };
  }

  function getMessageBody() {
    return content.trim();
  }

  async function handleSend() {
    if (!user) return;
    setError('');
    const recipientEmail = recipientType === 'tenant'
      ? selectedTenant?.email || ''
      : manualEmail.trim();
    const rName = recipientType === 'tenant'
      ? `${selectedTenant?.first_name} ${selectedTenant?.last_name}`.trim()
      : manualName.trim() || manualEmail.trim();

    if (!recipientEmail && recipientType === 'manual') {
      setError('Bitte geben Sie eine E-Mail-Adresse ein.');
      return;
    }
    if (recipientType === 'tenant' && !selectedTenant) {
      setError('Bitte waehlen Sie einen Mieter aus.');
      return;
    }
    if (!subject.trim()) {
      setError('Bitte geben Sie einen Betreff ein.');
      return;
    }
    if (!getMessageBody()) {
      setError('Bitte geben Sie eine Nachricht ein.');
      return;
    }

    setSending(true);
    const tenantId = recipientType === 'tenant' ? selectedTenant?.id : undefined;

    try {
      let attachment: { filePath: string } | null = null;
      if (attachedFile) attachment = await uploadAttachment();

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      let emailText = getMessageBody();
      if (attachment && attachedFile) emailText += `\n\nAnhang: ${attachedFile.name}`;

      const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          to: recipientEmail,
          subject: subject.trim(),
          text: emailText,
          userId: user.id,
          useUserAlias: true,
          storeAsMessage: true,
          recipientName: rName,
          tenantId: tenantId || undefined,
          mailType: 'user_message',
          category: 'transactional',
          attachments: attachment && attachedFile ? [{
            filename: attachedFile.name,
            path: attachment.filePath,
          }] : undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        setError(result.error || 'Fehler beim Senden der Nachricht.');
        setSending(false);
        return;
      }

      if (tenantId) {
        await supabase.from('tenant_communications').insert({
          user_id: user.id,
          tenant_id: tenantId,
          communication_type: 'message',
          subject: subject.trim(),
          content: getMessageBody(),
          is_internal: !publishToPortal,
          attachment_id: attachment?.docId || null,
        });
      }

      setSending(false);
      onSent();
    } catch {
      setError('Fehler beim Senden der Nachricht.');
      setSending(false);
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 bg-white flex-shrink-0">
        <button
          onClick={onCancel}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <h2 className="text-base font-semibold text-gray-900">Neue Nachricht</h2>
        <div className="flex-1" />
        {templates.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              Vorlage
            </button>
            {showTemplates && (
              <div className="absolute right-0 top-10 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-2 max-h-64 overflow-y-auto">
                <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Vorlage auswählen</p>
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">{t.name}</p>
                    <p className="text-xs text-gray-500 truncate">{t.subject || t.category}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {error && (
          <div className="px-4 py-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => { setRecipientType('tenant'); setManualEmail(''); setManualName(''); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              recipientType === 'tenant' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4" /> Mieter
          </button>
          <button
            onClick={() => { setRecipientType('manual'); setSelectedTenant(null); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              recipientType === 'manual' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <AtSign className="w-4 h-4" /> E-Mail
          </button>
        </div>

        {recipientType === 'tenant' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Building2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                Immobilie
              </label>
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="">Immobilie auswaehlen...</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}{p.address ? ` - ${p.address}` : ''}</option>
                ))}
              </select>
            </div>

            {selectedPropertyId && units.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DoorOpen className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  Einheit
                </label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="">Alle Einheiten</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.unit_number}</option>
                  ))}
                </select>
              </div>
            )}

            {selectedPropertyId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Users className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  Mieter
                </label>
                {tenants.length > 0 ? (
                  <select
                    value={selectedTenant?.id || ''}
                    onChange={(e) => {
                      const t = tenants.find((t) => t.id === e.target.value);
                      setSelectedTenant(t || null);
                    }}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="">Mieter auswaehlen...</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.first_name} {t.last_name}{t.email ? ` (${t.email})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-400 py-2">Keine Mieter fuer diese Auswahl vorhanden.</p>
                )}
              </div>
            )}

            {selectedTenant && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-blue-800 font-medium">
                  {selectedTenant.first_name} {selectedTenant.last_name}
                </span>
                {selectedTenant.email && (
                  <span className="text-blue-600">{selectedTenant.email}</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail-Adresse</label>
              <input
                type="email"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                placeholder="empfaenger@beispiel.de"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (optional)</label>
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Name des Empfaengers"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Betreff</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Betreff der Nachricht"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nachricht</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            placeholder="Ihre Nachricht..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dokument anhaengen (optional)</label>
          {!attachedFile ? (
            <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
              <Upload className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Datei auswaehlen</span>
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setAttachedFile(file);
                }}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <FileIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 flex-1 truncate">{attachedFile.name}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {(attachedFile.size / 1024).toFixed(0)} KB
              </span>
              <button onClick={() => setAttachedFile(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {recipientType === 'tenant' && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50">
            <label className="flex items-center gap-3 px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={publishToPortal}
                onChange={(e) => setPublishToPortal(e.target.checked)}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
                <Globe className="w-4 h-4" />
                Im Mieterportal bereitstellen
              </div>
            </label>
            {publishToPortal && (
              <div className="px-4 pb-3 flex items-start gap-2 text-xs text-emerald-700">
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  {selectedTenant
                    ? `Die Nachricht wird im Mieterportal von ${selectedTenant.first_name} ${selectedTenant.last_name} angezeigt.`
                    : 'Bitte waehlen Sie einen Mieter aus.'}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <AtSign className="w-3 h-3" />
          Gesendet von: {userAlias ? `${userAlias}@rentab.ly` : 'Wird geladen...'}
        </div>
      </div>

      <div className="px-5 py-4 border-t border-gray-200 bg-white flex justify-end gap-3 flex-shrink-0">
        <button
          onClick={onCancel}
          className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Abbrechen
        </button>
        <button
          onClick={handleSend}
          disabled={sending}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          {sending ? 'Wird gesendet...' : 'Senden'}
        </button>
      </div>
    </div>
  );
}
