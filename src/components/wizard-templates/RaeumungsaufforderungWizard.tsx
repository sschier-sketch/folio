import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import {
  generateRaeumungsaufforderungPdf,
  buildRaeumungsaufforderungFilename,
} from '../../lib/raeumungsaufforderungPdfGenerator';
import type {
  RaeumungsaufforderungStep,
  RaeumungsaufforderungWizardData,
  LandlordData,
  TenantEntry,
} from './types';
import { RAEUMUNGSAUFFORDERUNG_STEPS } from './types';
import StepVermieter, { isVermieterValid } from './StepVermieter';
import StepMieter, { isMieterValid } from './StepMieter';
import StepAnsprache from './StepAnsprache';
import StepRaeumungSachverhalt, { isRaeumungSachverhaltValid } from './StepRaeumungSachverhalt';
import StepErgebnis from './StepErgebnis';
import StepVersand from './StepVersand';

interface Props {
  onBack: () => void;
  freshStart?: boolean;
}

const TEMPLATE_ID = 'raeumungsaufforderung';

function emptyWizardData(): RaeumungsaufforderungWizardData {
  return {
    landlord: {
      name: '',
      street: '',
      number: '',
      zip: '',
      city: '',
      prefix: '',
      country: 'Deutschland',
    },
    tenants: [
      {
        firstName: '',
        lastName: '',
        street: '',
        number: '',
        zip: '',
        city: '',
        prefix: '',
        country: 'Deutschland',
      },
    ],
    greeting: {
      hasPersonalGreeting: false,
      greetingText: '',
    },
    sachverhalt: {
      versanddatum: new Date().toISOString().split('T')[0],
      kuendigungsDatum: '',
      fristAuszug: '',
    },
  };
}

export default function RaeumungsaufforderungWizard({ onBack, freshStart }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<RaeumungsaufforderungStep>('vermieter');
  const [data, setData] = useState<RaeumungsaufforderungWizardData>(emptyWizardData());
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (user) {
      initWizard();
    }
  }, [user]);

  async function initWizard() {
    const [profileRes, userRes] = await Promise.all([
      supabase
        .from('account_profiles')
        .select('first_name, last_name, address_street, address_house_number, address_zip, address_city')
        .eq('user_id', user!.id)
        .maybeSingle(),
      supabase
        .from('users')
        .select('full_name, street, house_number, zip, city')
        .eq('id', user!.id)
        .maybeSingle(),
    ]);

    const p = profileRes.data;
    const u = userRes.data;

    const profileLandlord: Partial<LandlordData> = {};
    if (p || u) {
      profileLandlord.name =
        (p && `${p.first_name || ''} ${p.last_name || ''}`.trim()) ||
        u?.full_name ||
        '';
      profileLandlord.street = p?.address_street || u?.street || '';
      profileLandlord.number = p?.address_house_number || u?.house_number || '';
      profileLandlord.zip = p?.address_zip || u?.zip || '';
      profileLandlord.city = p?.address_city || u?.city || '';
    }

    let draftData: RaeumungsaufforderungWizardData | null = null;
    let draftRow: { id: string; current_step: number | null } | null = null;

    if (!freshStart) {
      const { data: draft } = await supabase
        .from('wizard_drafts')
        .select('*')
        .eq('user_id', user!.id)
        .eq('template_id', TEMPLATE_ID)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (draft) {
        const saved = draft.draft_data as RaeumungsaufforderungWizardData;
        if (saved.landlord) {
          draftRow = { id: draft.id, current_step: draft.current_step };
          draftData = saved;
        }
      }
    }

    if (draftData && draftRow) {
      setDraftId(draftRow.id);
      const merged: RaeumungsaufforderungWizardData = {
        ...draftData,
        landlord: {
          ...draftData.landlord,
          name: draftData.landlord.name || profileLandlord.name || '',
          street: draftData.landlord.street || profileLandlord.street || '',
          number: draftData.landlord.number || profileLandlord.number || '',
          zip: draftData.landlord.zip || profileLandlord.zip || '',
          city: draftData.landlord.city || profileLandlord.city || '',
        },
      };
      setData(merged);
      const si = draftRow.current_step || 0;
      if (si >= 0 && si < RAEUMUNGSAUFFORDERUNG_STEPS.length) {
        setStep(RAEUMUNGSAUFFORDERUNG_STEPS[si].key);
      }
    } else {
      setData((prev) => ({
        ...prev,
        landlord: {
          ...prev.landlord,
          ...profileLandlord,
        },
      }));
    }

    setReady(true);
  }

  const saveDraft = useCallback(
    async (currentData: RaeumungsaufforderungWizardData, currentStep: RaeumungsaufforderungStep) => {
      if (!user) return;
      const stepIdx = RAEUMUNGSAUFFORDERUNG_STEPS.findIndex((s) => s.key === currentStep);
      const payload = {
        user_id: user.id,
        template_id: TEMPLATE_ID,
        draft_data: currentData as any,
        current_step: stepIdx,
        updated_at: new Date().toISOString(),
      };

      if (draftId) {
        await supabase.from('wizard_drafts').update(payload).eq('id', draftId);
      } else {
        const { data: inserted } = await supabase
          .from('wizard_drafts')
          .insert(payload)
          .select('id')
          .maybeSingle();
        if (inserted) setDraftId(inserted.id);
      }
    },
    [user, draftId],
  );

  const stepIdx = RAEUMUNGSAUFFORDERUNG_STEPS.findIndex((s) => s.key === step);

  function canProceed(): boolean {
    switch (step) {
      case 'vermieter':
        return isVermieterValid(data.landlord);
      case 'mieter':
        return isMieterValid(data.tenants);
      case 'ansprache':
        return true;
      case 'sachverhalt':
        return isRaeumungSachverhaltValid(data.sachverhalt);
      default:
        return true;
    }
  }

  async function goNext() {
    if (!canProceed()) return;
    const nextIdx = stepIdx + 1;
    if (nextIdx < RAEUMUNGSAUFFORDERUNG_STEPS.length) {
      const nextStep = RAEUMUNGSAUFFORDERUNG_STEPS[nextIdx].key;
      setStep(nextStep);
      saveDraft(data, nextStep);
    }
  }

  function goPrev() {
    const prevIdx = stepIdx - 1;
    if (prevIdx >= 0) {
      setStep(RAEUMUNGSAUFFORDERUNG_STEPS[prevIdx].key);
    } else {
      onBack();
    }
  }

  async function handleDownload() {
    setGenerating(true);
    try {
      const blob = generateRaeumungsaufforderungPdf(data);
      const filename = buildRaeumungsaufforderungFilename(data.tenants);

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await saveDocumentToProperty(blob, filename, false);
      await deleteDraft();
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend(betreff: string, nachricht: string, sharePortal: boolean) {
    setSending(true);
    try {
      const blob = generateRaeumungsaufforderungPdf(data);
      const filename = buildRaeumungsaufforderungFilename(data.tenants);

      await saveDocumentToProperty(blob, filename, sharePortal);

      const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const emailAttachmentPath = `${user!.id}/email-attachments/${Date.now()}_${safeFilename}`;
      const { error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(emailAttachmentPath, blob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      const attachments =
        !uploadErr ? [{ filename, path: emailAttachmentPath }] : [];

      for (const tenant of data.tenants) {
        if (tenant.tenantId) {
          const { data: tenantRow } = await supabase
            .from('tenants')
            .select('email')
            .eq('id', tenant.tenantId)
            .maybeSingle();

          if (tenantRow?.email) {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const session = (await supabase.auth.getSession()).data.session;

            await fetch(`${supabaseUrl}/functions/v1/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token || supabaseKey}`,
                'apikey': supabaseKey,
              },
              body: JSON.stringify({
                to: tenantRow.email,
                subject: betreff,
                text: nachricht,
                userId: user!.id,
                mailType: 'raeumungsaufforderung',
                category: 'transactional',
                recipientName: `${tenant.firstName} ${tenant.lastName}`.trim(),
                tenantId: tenant.tenantId,
                useUserAlias: true,
                storeAsMessage: true,
                attachments,
              }),
            });
          }
        }
      }

      await deleteDraft();
      setSent(true);
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  }

  async function saveDocumentToProperty(blob: Blob, filename: string, shareWithTenant: boolean): Promise<string | null> {
    const primaryTenant = data.tenants[0];
    if (!primaryTenant?.propertyId) return null;

    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${user!.id}/wizard-documents/${Date.now()}_${safeFilename}`;
    await supabase.storage.from('documents').upload(filePath, blob, {
      contentType: 'application/pdf',
      upsert: true,
    });

    const { data: docRow } = await supabase
      .from('documents')
      .insert({
        user_id: user!.id,
        file_name: filename,
        file_path: filePath,
        file_type: 'application/pdf',
        document_type: 'raeumungsaufforderung',
        file_size: blob.size,
        shared_with_tenant: shareWithTenant,
        description: 'Räumungsaufforderung (Assistent)',
      })
      .select('id')
      .maybeSingle();

    if (docRow?.id) {
      const associations = [];

      if (primaryTenant.propertyId) {
        associations.push({
          document_id: docRow.id,
          association_type: 'property',
          association_id: primaryTenant.propertyId,
          created_by: user!.id,
        });
      }

      if (primaryTenant.unitId) {
        associations.push({
          document_id: docRow.id,
          association_type: 'unit',
          association_id: primaryTenant.unitId,
          created_by: user!.id,
        });
      }

      for (const t of data.tenants) {
        if (t.tenantId) {
          associations.push({
            document_id: docRow.id,
            association_type: 'tenant',
            association_id: t.tenantId,
            created_by: user!.id,
          });
        }
      }

      if (associations.length > 0) {
        await supabase.from('document_associations').insert(associations);
      }
    }

    return filePath;
  }

  async function deleteDraft() {
    if (draftId) {
      await supabase.from('wizard_drafts').delete().eq('id', draftId);
      setDraftId(null);
    }
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-primary-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-dark transition-colors mb-4 inline-block"
        >
          &larr; Zurück zur Vorlagenübersicht
        </button>
        <h1 className="text-3xl font-bold text-dark mb-2">Räumungsaufforderung erstellen</h1>
        <p className="text-gray-400">
          Erstellen Sie Schritt für Schritt eine rechtssichere Räumungsaufforderung an einen gekündigten Mieter.
        </p>
      </div>

      <div className="flex gap-8">
        <div className="w-52 flex-shrink-0 hidden md:block">
          <nav className="space-y-1 sticky top-4">
            {RAEUMUNGSAUFFORDERUNG_STEPS.map((s, i) => {
              const isActive = s.key === step;
              const isDone = i < stepIdx;
              const isClickable = isDone;

              return (
                <button
                  key={s.key}
                  onClick={() => isClickable && setStep(s.key)}
                  disabled={!isClickable && !isActive}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors flex items-center gap-3 ${
                    isActive
                      ? 'bg-blue-50 text-primary-blue font-medium'
                      : isDone
                      ? 'text-emerald-600 hover:bg-gray-50 cursor-pointer'
                      : 'text-gray-400 cursor-default'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                      isActive
                        ? 'bg-primary-blue text-white'
                        : isDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {isDone ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                  {s.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-lg p-6 lg:p-8 min-h-[400px]">
            {step === 'vermieter' && (
              <StepVermieter
                data={data.landlord}
                onChange={(landlord) => setData({ ...data, landlord })}
              />
            )}

            {step === 'mieter' && (
              <StepMieter
                tenants={data.tenants}
                onChange={(tenants: TenantEntry[]) => setData({ ...data, tenants })}
              />
            )}

            {step === 'ansprache' && (
              <StepAnsprache
                data={data.greeting}
                onChange={(greeting) => setData({ ...data, greeting })}
              />
            )}

            {step === 'sachverhalt' && (
              <StepRaeumungSachverhalt
                data={data.sachverhalt}
                onChange={(sachverhalt) => setData({ ...data, sachverhalt })}
              />
            )}

            {step === 'ergebnis' && (
              <StepErgebnis
                generating={generating}
                onDownload={handleDownload}
                onSendDigital={() => setStep('versand')}
              />
            )}

            {step === 'versand' && (
              <StepVersand
                tenants={data.tenants}
                sending={sending}
                sent={sent}
                portalEnabled={true}
                onSend={handleSend}
              />
            )}
          </div>

          {step !== 'ergebnis' && step !== 'versand' && (
            <div className="flex items-center justify-between mt-6">
              <Button onClick={goPrev} variant="outlined">
                {stepIdx === 0 ? 'Abbrechen' : 'Zurück'}
              </Button>
              <Button onClick={goNext} disabled={!canProceed()} variant="dark">
                Weiter
              </Button>
            </div>
          )}

          {step === 'versand' && !sent && (
            <div className="flex items-center justify-between mt-6">
              <Button onClick={() => setStep('ergebnis')} variant="outlined">
                Zurück
              </Button>
            </div>
          )}

          {sent && (
            <div className="flex justify-center mt-6">
              <Button onClick={onBack} variant="primary">
                Zur Vorlagenübersicht
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
