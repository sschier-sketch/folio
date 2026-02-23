import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import {
  generateKuendigungPdf,
  buildKuendigungFilename,
} from '../../lib/kuendigungPdfGenerator';
import type {
  KuendigungStep,
  KuendigungWizardData,
  TenantEntry,
} from './types';
import { KUENDIGUNG_STEPS } from './types';
import StepVermieter, { isVermieterValid } from './StepVermieter';
import StepMieter, { isMieterValid } from './StepMieter';
import StepAnsprache from './StepAnsprache';
import StepSachverhalt, { isSachverhaltValid } from './StepSachverhalt';
import StepErgebnis from './StepErgebnis';
import StepVersand from './StepVersand';

interface Props {
  onBack: () => void;
}

function emptyWizardData(): KuendigungWizardData {
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
      eingangsdatum: '',
      kuendigungsdatum: '',
      schreibenVom: '',
      appointments: [
        {
          id: 'initial',
          date: '',
          timeFrom: '10:00',
          timeTo: '12:00',
        },
      ],
    },
  };
}

export default function KuendigungWizard({ onBack }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<KuendigungStep>('vermieter');
  const [data, setData] = useState<KuendigungWizardData>(emptyWizardData());
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadDraft();
    }
  }, [user]);

  async function loadProfile() {
    const [profileRes, userRes] = await Promise.all([
      supabase
        .from('account_profiles')
        .select('first_name, last_name, address_street, address_zip, address_city')
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

    if (p || u) {
      setData((prev) => ({
        ...prev,
        landlord: {
          ...prev.landlord,
          name:
            (p && `${p.first_name || ''} ${p.last_name || ''}`.trim()) ||
            u?.full_name ||
            prev.landlord.name,
          street: p?.address_street || u?.street || prev.landlord.street,
          number: u?.house_number || prev.landlord.number,
          zip: p?.address_zip || u?.zip || prev.landlord.zip,
          city: p?.address_city || u?.city || prev.landlord.city,
        },
      }));
    }
  }

  async function loadDraft() {
    const { data: draft } = await supabase
      .from('wizard_drafts')
      .select('*')
      .eq('user_id', user!.id)
      .eq('template_id', 'kuendigungsbestaetigung')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (draft) {
      setDraftId(draft.id);
      const saved = draft.draft_data as KuendigungWizardData;
      if (saved.landlord) {
        setData(saved);
        const stepIdx = draft.current_step || 0;
        if (stepIdx >= 0 && stepIdx < KUENDIGUNG_STEPS.length) {
          setStep(KUENDIGUNG_STEPS[stepIdx].key);
        }
      }
    }
  }

  const saveDraft = useCallback(
    async (currentData: KuendigungWizardData, currentStep: KuendigungStep) => {
      if (!user) return;
      const stepIdx = KUENDIGUNG_STEPS.findIndex((s) => s.key === currentStep);
      const payload = {
        user_id: user.id,
        template_id: 'kuendigungsbestaetigung',
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

  const stepIdx = KUENDIGUNG_STEPS.findIndex((s) => s.key === step);

  function canProceed(): boolean {
    switch (step) {
      case 'vermieter':
        return isVermieterValid(data.landlord);
      case 'mieter':
        return isMieterValid(data.tenants);
      case 'ansprache':
        return true;
      case 'sachverhalt':
        return isSachverhaltValid(data.sachverhalt);
      default:
        return true;
    }
  }

  async function goNext() {
    if (!canProceed()) return;
    const nextIdx = stepIdx + 1;
    if (nextIdx < KUENDIGUNG_STEPS.length) {
      const nextStep = KUENDIGUNG_STEPS[nextIdx].key;
      setStep(nextStep);
      saveDraft(data, nextStep);
    }
  }

  function goPrev() {
    const prevIdx = stepIdx - 1;
    if (prevIdx >= 0) {
      setStep(KUENDIGUNG_STEPS[prevIdx].key);
    } else {
      onBack();
    }
  }

  async function handleDownload() {
    setGenerating(true);
    try {
      const blob = generateKuendigungPdf(data);
      const filename = buildKuendigungFilename(data.tenants);

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
      const blob = generateKuendigungPdf(data);
      const filename = buildKuendigungFilename(data.tenants);

      await saveDocumentToProperty(blob, filename, sharePortal);

      for (const tenant of data.tenants) {
        if (tenant.tenantId) {
          const { data: tenantRow } = await supabase
            .from('tenants')
            .select('email')
            .eq('id', tenant.tenantId)
            .maybeSingle();

          if (tenantRow?.email) {
            await supabase.from('email_queue').insert({
              user_id: user!.id,
              to_email: tenantRow.email,
              subject: betreff,
              body: nachricht,
              status: 'pending',
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

  async function saveDocumentToProperty(blob: Blob, filename: string, shareWithTenant: boolean) {
    const primaryTenant = data.tenants[0];
    if (!primaryTenant?.propertyId) return;

    const filePath = `${user!.id}/wizard-documents/${filename}`;
    await supabase.storage.from('documents').upload(filePath, blob, {
      contentType: 'application/pdf',
      upsert: true,
    });

    await supabase.from('property_documents').insert({
      property_id: primaryTenant.propertyId,
      user_id: user!.id,
      document_name: filename,
      document_type: 'kuendigungsbestaetigung',
      file_url: filePath,
      file_size: blob.size,
      shared_with_tenant: shareWithTenant,
      unit_id: primaryTenant.unitId || null,
    });
  }

  async function deleteDraft() {
    if (draftId) {
      await supabase.from('wizard_drafts').delete().eq('id', draftId);
      setDraftId(null);
    }
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
        <h1 className="text-3xl font-bold text-dark mb-2">Kündigungsbestätigung erstellen</h1>
        <p className="text-gray-400">
          Erstellen Sie Schritt für Schritt eine rechtssichere Kündigungsbestätigung.
        </p>
      </div>

      <div className="flex gap-8">
        <div className="w-52 flex-shrink-0 hidden md:block">
          <nav className="space-y-1 sticky top-4">
            {KUENDIGUNG_STEPS.map((s, i) => {
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
              <StepSachverhalt
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
              <Button onClick={goPrev} variant="cancel">
                {stepIdx === 0 ? 'Abbrechen' : 'Zurück'}
              </Button>
              <Button onClick={goNext} disabled={!canProceed()} variant="dark">
                Weiter
              </Button>
            </div>
          )}

          {step === 'versand' && !sent && (
            <div className="flex items-center justify-between mt-6">
              <Button onClick={() => setStep('ergebnis')} variant="cancel">
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
