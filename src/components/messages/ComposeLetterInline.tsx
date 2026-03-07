import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, AtSign, Building2, DoorOpen, Users, Upload, File as FileIcon,
  X, Globe, Info, AlertTriangle, Calendar, ChevronRight,
  Mail as MailIcon, FolderOpen,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
  getLetterXpressConfig,
  createLetterXpressJob,
  preparePdfForDispatch,
  setAccessToken,
} from '../../lib/letterxpress-api';
import type { LxConfig } from '../../lib/letterxpress-api';
import { Button } from '../ui/Button';

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

interface ComposeLetterInlineProps {
  onSent: () => void;
  onCancel: () => void;
  onNavigatePostalSettings: () => void;
  onSwitchToEmail: () => void;
}

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export default function ComposeLetterInline({
  onSent,
  onCancel,
  onNavigatePostalSettings,
  onSwitchToEmail,
}: ComposeLetterInlineProps) {
  const { user, session } = useAuth();
  const { dataOwnerId } = usePermissions();

  useEffect(() => {
    setAccessToken(session?.access_token ?? null);
    return () => setAccessToken(null);
  }, [session?.access_token]);

  const [lxConfig, setLxConfig] = useState<LxConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState('');

  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState('');

  const [colorMode, setColorMode] = useState<'1' | '4'>('1');
  const [registeredType, setRegisteredType] = useState<'' | 'r1' | 'r2'>('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [notice, setNotice] = useState('');

  const [saveToTenantFile, setSaveToTenantFile] = useState(false);
  const [publishToPortal, setPublishToPortal] = useState(false);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const hasCredentials = lxConfig && lxConfig.has_api_key && lxConfig.is_enabled;

  const selectedTenant = useMemo(() => {
    if (!selectedTenantId) return null;
    return tenants.find(t => t.id === selectedTenantId) || null;
  }, [selectedTenantId, tenants]);

  const hasTenantSelected = !!selectedTenantId;

  useEffect(() => {
    loadConfig();
    loadProperties();
  }, [dataOwnerId]);

  useEffect(() => {
    if (selectedPropertyId) {
      loadUnits(selectedPropertyId);
      loadTenants(selectedPropertyId, '');
    } else {
      setUnits([]);
      setTenants([]);
    }
    setSelectedUnitId('');
    setSelectedTenantId('');
  }, [selectedPropertyId]);

  useEffect(() => {
    if (selectedPropertyId) {
      loadTenants(selectedPropertyId, selectedUnitId);
    }
    setSelectedTenantId('');
  }, [selectedUnitId]);

  useEffect(() => {
    if (!hasTenantSelected) {
      setSaveToTenantFile(false);
      setPublishToPortal(false);
    }
  }, [hasTenantSelected]);

  useEffect(() => {
    if (!saveToTenantFile) {
      setPublishToPortal(false);
    }
  }, [saveToTenantFile]);

  async function loadConfig() {
    if (!dataOwnerId) return;
    setConfigLoading(true);
    setConfigError('');
    try {
      const config = await getLetterXpressConfig();
      setLxConfig(config);
    } catch (err: any) {
      if (err?.code === 'LX_NOT_CONFIGURED') {
        setLxConfig(null);
      } else {
        setConfigError('Konfiguration konnte nicht geladen werden.');
      }
    } finally {
      setConfigLoading(false);
    }
  }

  async function loadProperties() {
    if (!dataOwnerId) return;
    const { data } = await supabase
      .from('properties')
      .select('id, name, address')
      .eq('user_id', dataOwnerId)
      .order('name');
    setProperties(data || []);
  }

  async function loadUnits(propertyId: string) {
    if (!dataOwnerId) return;
    const { data } = await supabase
      .from('property_units')
      .select('id, unit_number, unit_type')
      .eq('property_id', propertyId)
      .eq('user_id', dataOwnerId)
      .order('unit_number');
    setUnits(data || []);
  }

  async function loadTenants(propertyId: string, unitId: string) {
    if (!dataOwnerId) return;
    let query = supabase
      .from('tenants')
      .select('id, first_name, last_name, email, property_id, unit_id')
      .eq('user_id', dataOwnerId)
      .eq('property_id', propertyId)
      .eq('is_active', true)
      .order('last_name');
    if (unitId) query = query.eq('unit_id', unitId);
    const { data } = await query;
    setTenants(data || []);
  }

  function handleFileSelect(file: File | undefined) {
    setPdfError('');
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setPdfError('Nur PDF-Dateien sind zulässig.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setPdfError('Die Datei überschreitet die maximale Größe von 50 MB.');
      return;
    }
    setPdfFile(file);
  }

  function validateDispatchDate(): boolean {
    if (!dispatchDate) return true;
    const d = new Date(dispatchDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today;
  }

  async function saveDocumentForTenant(
    pdfBlob: File,
    tenantData: Tenant,
    shareWithTenant: boolean,
  ): Promise<string | null> {
    if (!dataOwnerId || !tenantData.property_id) return null;

    const safeFilename = pdfBlob.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${dataOwnerId}/brief-documents/${Date.now()}_${safeFilename}`;

    await supabase.storage.from('documents').upload(filePath, pdfBlob, {
      contentType: 'application/pdf',
      upsert: false,
    });

    const { data: docRow } = await supabase
      .from('documents')
      .insert({
        user_id: dataOwnerId,
        file_name: pdfBlob.name,
        file_path: filePath,
        file_type: 'application/pdf',
        document_type: 'brief',
        file_size: pdfBlob.size,
        shared_with_tenant: shareWithTenant,
        description: 'Briefversand via Nachrichten',
      })
      .select('id')
      .maybeSingle();

    if (docRow?.id) {
      const associations: Array<{
        document_id: string;
        association_type: string;
        association_id: string;
        created_by: string;
      }> = [];

      if (tenantData.property_id) {
        associations.push({
          document_id: docRow.id,
          association_type: 'property',
          association_id: tenantData.property_id,
          created_by: dataOwnerId,
        });
      }

      if (tenantData.unit_id) {
        associations.push({
          document_id: docRow.id,
          association_type: 'unit',
          association_id: tenantData.unit_id,
          created_by: dataOwnerId,
        });
      }

      associations.push({
        document_id: docRow.id,
        association_type: 'tenant',
        association_id: tenantData.id,
        created_by: dataOwnerId,
      });

      if (associations.length > 0) {
        await supabase.from('document_associations').insert(associations);
      }

      return docRow.id;
    }

    return null;
  }

  async function handleSend() {
    if (!user || !dataOwnerId) return;
    setError('');

    if (!hasCredentials) {
      setError('Briefversand-Zugangsdaten nicht konfiguriert.');
      return;
    }
    if (!pdfFile) {
      setError('Bitte laden Sie ein PDF hoch.');
      return;
    }
    if (pdfFile.type !== 'application/pdf') {
      setError('Nur PDF-Dateien sind zulässig.');
      return;
    }
    if (pdfFile.size > MAX_FILE_SIZE_BYTES) {
      setError('Die Datei überschreitet die maximale Größe von 50 MB.');
      return;
    }
    if (!validateDispatchDate()) {
      setError('Das Versanddatum muss in der Zukunft liegen.');
      return;
    }
    if (publishToPortal && !hasTenantSelected) {
      setError('Portalbereitstellung erfordert eine Mieterzuordnung.');
      return;
    }
    if (saveToTenantFile && !hasTenantSelected) {
      setError('Ablage in der Mieterakte erfordert eine Mieterzuordnung.');
      return;
    }

    setSending(true);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const { base64_file, base64_file_checksum } = await preparePdfForDispatch(arrayBuffer);

      const result = await createLetterXpressJob({
        base64_file,
        base64_file_checksum,
        filename_original: pdfFile.name,
        ...(registeredType ? { registered: registeredType as 'r1' | 'r2' } : {}),
        ...(dispatchDate ? { dispatch_date: dispatchDate } : {}),
        ...(notice.trim() ? { notice: notice.trim() } : {}),
        specification: {
          color: colorMode,
          mode: 'simplex',
          shipping: 'auto',
        },
      });

      if (!result.success) {
        setError('Fehler beim Erstellen des Briefauftrags.');
        setSending(false);
        return;
      }

      const externalJobId = result.job?.id;

      if (hasTenantSelected && externalJobId) {
        await supabase
          .from('letterxpress_jobs')
          .update({
            tenant_id: selectedTenantId,
            save_to_tenant_file: saveToTenantFile,
            publish_to_portal: publishToPortal,
          })
          .eq('user_id', dataOwnerId)
          .eq('external_job_id', externalJobId);
      }

      if (saveToTenantFile && selectedTenant) {
        const docId = await saveDocumentForTenant(
          pdfFile,
          selectedTenant,
          publishToPortal,
        );

        if (docId && externalJobId) {
          await supabase
            .from('letterxpress_jobs')
            .update({ document_id: docId })
            .eq('user_id', dataOwnerId)
            .eq('external_job_id', externalJobId);
        }
      }

      if (hasTenantSelected) {
        await supabase.from('tenant_communications').insert({
          user_id: dataOwnerId,
          tenant_id: selectedTenantId,
          communication_type: 'letter',
          subject: `Brief: ${pdfFile.name}`,
          content: `Briefversand via LetterXpress (Auftrag #${externalJobId || '-'})`,
          is_internal: !publishToPortal,
        });
      }

      setSuccess(true);
      setTimeout(() => onSent(), 1500);
    } catch (err: any) {
      console.error('Letter send error:', err);
      const msg = err?.message || 'Fehler beim Briefversand.';
      setError(msg.includes('LX_') ? 'Fehler beim Briefversand. Bitte prüfen Sie Ihre Zugangsdaten.' : msg);
    } finally {
      setSending(false);
    }
  }

  const showUnitDropdown = selectedPropertyId && units.length > 0;
  const showTenantDropdown = selectedPropertyId && tenants.length > 0;

  const todayStr = new Date().toISOString().split('T')[0];

  if (configLoading) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h2 className="text-base font-semibold text-gray-900">Brief versenden</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h2 className="text-base font-semibold text-gray-900">Brief versenden</h2>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mb-4 mx-auto">
              <MailIcon className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Brief erfolgreich übergeben</h3>
            <p className="text-sm text-gray-500">
              Der Auftrag wurde an LetterXpress übermittelt. Den Status können Sie unter Profil &rarr; Briefversand verfolgen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 bg-white flex-shrink-0">
        <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <h2 className="text-base font-semibold text-gray-900">Neue Nachricht</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <div className="flex gap-2">
          <button
            onClick={onSwitchToEmail}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
          >
            <Users className="w-4 h-4" /> Mieter
          </button>
          <button
            onClick={onSwitchToEmail}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
          >
            <AtSign className="w-4 h-4" /> E-Mail
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-50 text-blue-700 border border-blue-200"
          >
            <MailIcon className="w-4 h-4" /> Brief
          </button>
        </div>

        {!hasCredentials && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  Briefversand nicht eingerichtet
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Für den Briefversand sind noch keine Zugangsdaten hinterlegt. Bitte richten Sie LetterXpress zuerst unter Profil &rarr; Briefversand ein.
                </p>
                <Button
                  variant="primary"
                  onClick={onNavigatePostalSettings}
                  className="mt-3"
                >
                  <svg viewBox="0 0 120 120" className="w-4 h-4 flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="120" height="120" rx="12" fill="#E5194B" />
                    <path d="M20 95V25h18v52h28V95H20Z" fill="#1A2744" />
                    <path d="M52 25l20 35-20 35h20l20-35-20-35H52Z" fill="#1A2744" />
                    <path d="M82 25h18v70H82l20-35-20-35Z" fill="#1A2744" />
                  </svg>
                  Zugangsdaten hinterlegen
                </Button>
              </div>
            </div>
          </div>
        )}

        {configError && (
          <div className="px-4 py-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {configError}
          </div>
        )}

        {error && (
          <div className="px-4 py-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 space-y-1">
              <p>Bitte laden Sie ein druckfertiges PDF hoch. Die Empfängeradresse muss im PDF bereits korrekt enthalten sein.</p>
              <p>Ein versendeter Brief kann nur innerhalb von 15 Minuten storniert werden.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mieterzuordnung (optional)</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Building2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Immobilie
            </label>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              disabled={!hasCredentials}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">Immobilie auswählen...</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}{p.address ? ` - ${p.address}` : ''}</option>
              ))}
            </select>
          </div>

          {showUnitDropdown && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DoorOpen className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                Einheit
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                disabled={!hasCredentials}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">Alle Einheiten</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.unit_number}</option>
                ))}
              </select>
            </div>
          )}

          {showTenantDropdown && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Users className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                Mieter
              </label>
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                disabled={!hasCredentials}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">Kein Mieter zuordnen</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.first_name} {t.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedTenant && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border bg-blue-50 border-blue-200">
              <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-blue-800 font-medium">
                {selectedTenant.first_name} {selectedTenant.last_name}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-5 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">PDF-Dokument *</p>

          {!pdfFile ? (
            <label className={`flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-lg transition-colors ${
              hasCredentials
                ? 'border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50'
                : 'border-gray-200 cursor-not-allowed bg-gray-50'
            }`}>
              <Upload className="w-5 h-5 text-gray-400" />
              <div className="text-center">
                <span className="text-sm text-gray-500 block">PDF-Datei auswählen</span>
                <span className="text-xs text-gray-400">Max. 50 MB</span>
              </div>
              <input
                type="file"
                accept="application/pdf,.pdf"
                disabled={!hasCredentials}
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <FileIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-gray-700 flex-1 truncate">{pdfFile.name}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {(pdfFile.size / (1024 * 1024)).toFixed(1)} MB
              </span>
              <button
                onClick={() => { setPdfFile(null); setPdfError(''); }}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {pdfError && (
            <p className="text-xs text-red-600">{pdfError}</p>
          )}
        </div>

        <div className="border-t border-gray-100 pt-5 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Versandoptionen</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farbe</label>
              <select
                value={colorMode}
                onChange={(e) => setColorMode(e.target.value as '1' | '4')}
                disabled={!hasCredentials}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="1">Schwarzweiß</option>
                <option value="4">Farbe</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Einschreiben</label>
              <select
                value={registeredType}
                onChange={(e) => setRegisteredType(e.target.value as '' | 'r1' | 'r2')}
                disabled={!hasCredentials}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">Kein Einschreiben</option>
                <option value="r1">Einschreiben Einwurf</option>
                <option value="r2">Einschreiben</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Versanddatum (optional)
            </label>
            <input
              type="date"
              value={dispatchDate}
              min={todayStr}
              onChange={(e) => setDispatchDate(e.target.value)}
              disabled={!hasCredentials}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1">Leer lassen für sofortigen Versand.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interne Notiz (optional)</label>
            <input
              type="text"
              value={notice}
              onChange={(e) => setNotice(e.target.value.slice(0, 255))}
              maxLength={255}
              placeholder="z.B. Mahnung Mieter Müller"
              disabled={!hasCredentials}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1">{notice.length}/255</p>
          </div>
        </div>

        {hasTenantSelected && (
          <div className="border-t border-gray-100 pt-5 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ablage</p>

            <div className="rounded-lg border border-gray-200 bg-gray-50/50">
              <label className="flex items-center gap-3 px-4 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToTenantFile}
                  onChange={(e) => setSaveToTenantFile(e.target.checked)}
                  disabled={!hasCredentials}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FolderOpen className="w-4 h-4" />
                  In der Mieterakte speichern
                </div>
              </label>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50">
              <label className={`flex items-center gap-3 px-4 py-3 ${saveToTenantFile ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                <input
                  type="checkbox"
                  checked={publishToPortal}
                  onChange={(e) => setPublishToPortal(e.target.checked)}
                  disabled={!hasCredentials || !saveToTenantFile}
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
                    Das Dokument wird im Mieterportal von {selectedTenant?.first_name} {selectedTenant?.last_name} sichtbar.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-gray-200 bg-white flex items-center justify-between gap-3 flex-shrink-0">
        <div className="text-xs text-gray-400 min-w-0 truncate">
          {sending && <span>Brief wird übermittelt...</span>}
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Button variant="secondary" onClick={onCancel} disabled={sending}>
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={sending || !hasCredentials || !pdfFile}
          >
            {sending ? 'Wird gesendet...' : 'Brief senden'}
          </Button>
        </div>
      </div>
    </div>
  );
}
