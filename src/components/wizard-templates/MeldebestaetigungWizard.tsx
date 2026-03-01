import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import {
  generateMeldebestaetigungPdf,
  buildMeldebestaetigungFilename,
} from '../../lib/meldebestaetigungPdfGenerator';
import type {
  MeldebestaetigungStep,
  MeldebestaetigungWizardData,
  LandlordData,
} from './types';
import { MELDEBESTAETIGUNG_STEPS } from './types';
import StepVermieter, { isVermieterValid } from './StepVermieter';
import StepMeldebestaetigung, { isMeldebestaetigungValid } from './StepMeldebestaetigung';

interface Props {
  onBack: () => void;
  freshStart?: boolean;
}

const TEMPLATE_ID = 'meldebestaetigung';

function emptyWizardData(): MeldebestaetigungWizardData {
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
    form: {
      selbstgenutzesWohneigentum: false,
      eigentuemerName: '',
      eigentuemerStrasse: '',
      eigentuemerNr: '',
      eigentuemerPlz: '',
      eigentuemerStadt: '',
      einOderAuszug: 'einzug',
      datum: '',
      meldepflichtigePersonen: [{ name: '', geburtsdatum: '' }],
      beauftragtePersonName: '',
      beauftragtePersonStrasse: '',
      beauftragtePersonNr: '',
      beauftragtePersonPlz: '',
      beauftragtePersonStadt: '',
      mietobjektStrasse: '',
      mietobjektNr: '',
      mietobjektPlz: '',
      mietobjektStadt: '',
      mietobjektPraefix: '',
    },
  };
}

export default function MeldebestaetigungWizard({ onBack, freshStart }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<MeldebestaetigungStep>('vermieter');
  const [data, setData] = useState<MeldebestaetigungWizardData>(emptyWizardData());
  const [generating, setGenerating] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (user) initWizard();
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
        u?.full_name || '';
      profileLandlord.street = p?.address_street || u?.street || '';
      profileLandlord.number = p?.address_house_number || u?.house_number || '';
      profileLandlord.zip = p?.address_zip || u?.zip || '';
      profileLandlord.city = p?.address_city || u?.city || '';
    }

    let draftData: MeldebestaetigungWizardData | null = null;
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
        const saved = draft.draft_data as MeldebestaetigungWizardData;
        if (saved.landlord) {
          draftRow = { id: draft.id, current_step: draft.current_step };
          draftData = saved;
        }
      }
    }

    if (draftData && draftRow) {
      setDraftId(draftRow.id);
      const merged: MeldebestaetigungWizardData = {
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
      if (si >= 0 && si < MELDEBESTAETIGUNG_STEPS.length) {
        setStep(MELDEBESTAETIGUNG_STEPS[si].key);
      }
    } else {
      setData((prev) => ({
        ...prev,
        landlord: { ...prev.landlord, ...profileLandlord },
      }));
    }

    setReady(true);
  }

  const saveDraft = useCallback(
    async (currentData: MeldebestaetigungWizardData, currentStep: MeldebestaetigungStep) => {
      if (!user) return;
      const stepIdx = MELDEBESTAETIGUNG_STEPS.findIndex((s) => s.key === currentStep);
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

  const stepIdx = MELDEBESTAETIGUNG_STEPS.findIndex((s) => s.key === step);

  function canProceed(): boolean {
    switch (step) {
      case 'vermieter':
        return isVermieterValid(data.landlord);
      case 'meldebestaetigung':
        return isMeldebestaetigungValid(data.form);
      default:
        return true;
    }
  }

  async function goNext() {
    if (!canProceed()) return;
    const nextIdx = stepIdx + 1;
    if (nextIdx < MELDEBESTAETIGUNG_STEPS.length) {
      const nextStep = MELDEBESTAETIGUNG_STEPS[nextIdx].key;
      setStep(nextStep);
      saveDraft(data, nextStep);
    }
  }

  function goPrev() {
    const prevIdx = stepIdx - 1;
    if (prevIdx >= 0) {
      setStep(MELDEBESTAETIGUNG_STEPS[prevIdx].key);
    } else {
      onBack();
    }
  }

  async function handleDownload() {
    setGenerating(true);
    try {
      const blob = generateMeldebestaetigungPdf(data);
      const filename = buildMeldebestaetigungFilename(data.form);

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await saveDocumentToProperty(blob, filename);
      await deleteDraft();
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setGenerating(false);
    }
  }

  async function saveDocumentToProperty(blob: Blob, filename: string): Promise<void> {
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${user!.id}/wizard-documents/${Date.now()}_${safeFilename}`;
    await supabase.storage.from('documents').upload(filePath, blob, {
      contentType: 'application/pdf',
      upsert: true,
    });

    await supabase.from('documents').insert({
      user_id: user!.id,
      file_name: filename,
      file_path: filePath,
      file_type: 'application/pdf',
      document_type: 'meldebestaetigung',
      file_size: blob.size,
      shared_with_tenant: false,
      description: 'Meldebestätigung / Wohnungsgeberbestätigung (Assistent)',
    });
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
        <h1 className="text-3xl font-bold text-dark mb-2">
          Meldebestätigung erstellen
        </h1>
        <p className="text-gray-400">
          Erstellen Sie eine Wohnungsgeberbestätigung nach § 19 BMG.
        </p>
      </div>

      <div className="flex gap-8">
        <div className="w-52 flex-shrink-0 hidden md:block">
          <nav className="space-y-1 sticky top-4">
            {MELDEBESTAETIGUNG_STEPS.map((s, i) => {
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

            {step === 'meldebestaetigung' && (
              <StepMeldebestaetigung
                data={data.form}
                onChange={(form) => setData({ ...data, form })}
              />
            )}

            {step === 'ergebnis' && (
              <div>
                <div className="bg-blue-50 rounded-lg px-5 py-4 mb-6">
                  <h4 className="font-semibold text-dark mb-1 text-sm">Hinweise & Tipps</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Das Dokument wird nach dem Herunterladen automatisch im
                    Dokumentenbereich gespeichert, sodass Sie es jederzeit wieder finden.
                  </p>
                </div>

                <h3 className="text-2xl font-bold text-dark mb-2">Ihre Meldebestätigung ist bereit</h3>
                <p className="text-sm text-gray-500 mb-8">
                  Die Wohnungsgeberbestätigung wurde erfolgreich erstellt.
                </p>

                <div className="max-w-md mb-8">
                  <button
                    onClick={handleDownload}
                    disabled={generating}
                    className="w-full p-6 bg-white border-2 border-gray-200 rounded-lg text-left hover:border-primary-blue hover:bg-blue-50/30 transition-all group"
                  >
                    <h4 className="font-semibold text-dark mb-2 group-hover:text-primary-blue transition-colors">
                      {generating ? 'Wird erstellt...' : 'PDF herunterladen'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Laden Sie die Meldebestätigung als PDF herunter, drucken Sie sie aus und unterschreiben Sie.
                    </p>
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-semibold text-dark mb-3">Checkliste</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                      Prüfen Sie alle Angaben im Dokument auf Richtigkeit
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                      Unterschreiben Sie das Dokument als Vermieter
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                      Übergeben Sie die Bestätigung an den Mieter für die Anmeldung beim Einwohnermeldeamt
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {step !== 'ergebnis' && (
            <div className="flex items-center justify-between mt-6">
              <Button onClick={goPrev} variant="outlined">
                {stepIdx === 0 ? 'Abbrechen' : 'Zurück'}
              </Button>
              <Button onClick={goNext} disabled={!canProceed()} variant="dark">
                Weiter
              </Button>
            </div>
          )}

          {step === 'ergebnis' && (
            <div className="flex items-center justify-between mt-6">
              <Button onClick={() => setStep('meldebestaetigung')} variant="outlined">
                Zurück
              </Button>
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
