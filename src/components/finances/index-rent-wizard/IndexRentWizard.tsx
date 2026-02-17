import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthContext";
import { Button } from "../../ui/Button";
import { createRentPeriod, getLatestVpiValues } from "../../../lib/rentPeriods";
import { generateIndexRentPdfBlob } from "../../../lib/indexRentPdfGenerator";
import type { WizardCalc, WizardState, WizardStep } from "./types";
import StepOverview from "./StepOverview";
import StepVpi, { isVpiStepValid } from "./StepVpi";
import StepParties, { isPartiesStepValid } from "./StepParties";
import StepPreview from "./StepPreview";
import StepFinalize from "./StepFinalize";

const STEPS: { key: WizardStep; label: string }[] = [
  { key: "overview", label: "\u00DCbersicht" },
  { key: "vpi", label: "VPI-Eingabe" },
  { key: "parties", label: "Parteien" },
  { key: "preview", label: "Vorschau" },
  { key: "finalize", label: "Finalisieren" },
];

interface Props {
  calc: WizardCalc;
  onClose: () => void;
  onComplete: () => void;
}

function computeEarliestEffectiveDate(possibleSince: string | null, lastRentChangeDate: string | null): string {
  const today = new Date();
  const nextNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 1);

  let earliest = nextNextMonth;

  if (possibleSince) {
    const ps = new Date(possibleSince);
    if (ps > earliest) earliest = ps;
  }

  if (lastRentChangeDate) {
    const lrc = new Date(lastRentChangeDate);
    const twelveMonthsAfter = new Date(lrc.getFullYear() + 1, lrc.getMonth(), lrc.getDate());
    if (twelveMonthsAfter > earliest) earliest = twelveMonthsAfter;
  }

  return earliest.toISOString().split("T")[0];
}

export default function IndexRentWizard({ calc, onClose, onComplete }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<WizardStep>("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const rc = calc.rental_contract;
  const tenant = rc.tenants;
  const property = rc.properties;

  const [state, setState] = useState<WizardState>({
    currentRent: rc.monthly_rent || rc.cold_rent || rc.base_rent || 0,
    currentUtilities: rc.additional_costs || rc.utilities_advance || 0,
    currentRentValidFrom: "",
    lastChangeDate: null,
    lastChangeReason: null,
    effectiveDate: "",
    vpiOldMonth: "",
    vpiOldValue: "",
    vpiNewMonth: "",
    vpiNewValue: "",
    landlordName: "",
    landlordAddress: "",
    tenantName: `${tenant.first_name || ""} ${tenant.last_name || ""}`.trim() || tenant.name || "",
    tenantSalutation: (tenant.salutation === "Herr" ? "male" : tenant.salutation === "Frau" ? "female" : "neutral") as WizardState["tenantSalutation"],
    tenantAddress: [
      [tenant.street, tenant.house_number].filter(Boolean).join(" "),
      [tenant.zip_code, tenant.city].filter(Boolean).join(" "),
    ].filter(Boolean).join("\n"),
    propertyAddress: property.address || property.name || "",
    unitNumber: "",
    contractDate: rc.contract_start || rc.start_date || "",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const [profileRes, historyRes, vpiRes, unitRes] = await Promise.all([
        supabase.from("account_profiles").select("first_name, last_name, company_name, address_street, address_zip, address_city").eq("user_id", user?.id).maybeSingle(),
        supabase.from("rent_history").select("effective_date, cold_rent, reason, status").eq("contract_id", calc.contract_id).order("effective_date", { ascending: false }),
        getLatestVpiValues(calc.contract_id),
        rc.unit_id ? supabase.from("property_units").select("unit_number").eq("id", rc.unit_id).maybeSingle() : Promise.resolve({ data: null }),
      ]);

      const profile = profileRes.data;
      const history = (historyRes.data || []).filter((h: any) => (h.status || "active") === "active");

      let currentRent = state.currentRent;
      let currentUtilities = state.currentUtilities;
      let currentRentValidFrom = rc.contract_start || rc.start_date || "";
      let lastChangeDate: string | null = null;
      let lastChangeReason: string | null = null;

      if (history.length > 0) {
        const today = new Date().toISOString().split("T")[0];
        const activeEntries = history.filter((h: any) => h.effective_date <= today);
        if (activeEntries.length > 0) {
          currentRent = activeEntries[0].cold_rent;
          currentUtilities = activeEntries[0].utilities || currentUtilities;
          currentRentValidFrom = activeEntries[0].effective_date;
        }
        if (history.length > 1) {
          const second = activeEntries.length > 1 ? activeEntries[0] : null;
          if (second) {
            lastChangeDate = second.effective_date;
            lastChangeReason = second.reason;
          }
        }
        if (activeEntries.length >= 2) {
          lastChangeDate = activeEntries[0].effective_date;
          lastChangeReason = activeEntries[0].reason;
        }
      }

      const landlordName = profile
        ? (profile.company_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim())
        : "";
      const landlordAddress = profile
        ? `${profile.address_street || ""}, ${profile.address_zip || ""} ${profile.address_city || ""}`.replace(/^,\s*/, "").replace(/,\s*$/, "")
        : "";

      const effectiveDate = computeEarliestEffectiveDate(calc.possible_since, lastChangeDate);

      setState((prev) => ({
        ...prev,
        currentRent,
        currentUtilities,
        currentRentValidFrom,
        lastChangeDate,
        lastChangeReason,
        effectiveDate,
        vpiOldMonth: vpiRes?.vpiOldMonth || "",
        vpiOldValue: vpiRes?.vpiOldValue?.toString() || "",
        vpiNewMonth: "",
        vpiNewValue: "",
        landlordName,
        landlordAddress,
        unitNumber: unitRes.data?.unit_number || "",
      }));
    } catch (err) {
      console.error("Error loading wizard data:", err);
    } finally {
      setLoading(false);
    }
  }

  const updateState = (partial: Partial<WizardState>) => setState((prev) => ({ ...prev, ...partial }));

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const canGoNext = (): boolean => {
    if (step === "overview") return true;
    if (step === "vpi") return isVpiStepValid(state);
    if (step === "parties") return isPartiesStepValid(state);
    if (step === "preview") return true;
    return false;
  };

  const goNext = () => {
    if (stepIndex < STEPS.length - 1 && canGoNext()) {
      setStep(STEPS[stepIndex + 1].key);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1].key);
  };

  async function handleFinalize() {
    if (!user || saving) return;
    setSaving(true);

    try {
      const oldVal = parseFloat(state.vpiOldValue) || 0;
      const newVal = parseFloat(state.vpiNewValue) || 0;
      const newRent = Math.round(state.currentRent * (newVal / oldVal) * 100) / 100;
      const today = new Date().toISOString().split("T")[0];
      const createdDate = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

      const blob = generateIndexRentPdfBlob({
        landlordName: state.landlordName,
        landlordAddress: state.landlordAddress,
        tenantName: state.tenantName,
        tenantSalutation: state.tenantSalutation,
        tenantAddress: state.tenantAddress,
        propertyAddress: state.propertyAddress,
        unitNumber: state.unitNumber,
        contractDate: state.contractDate,
        currentRent: state.currentRent,
        newRent,
        utilities: state.currentUtilities,
        vpiOldMonth: state.vpiOldMonth,
        vpiOldValue: oldVal,
        vpiNewMonth: state.vpiNewMonth,
        vpiNewValue: newVal,
        effectiveDate: state.effectiveDate,
        lastRentValidFrom: state.currentRentValidFrom,
        createdDate,
      });
      setPdfBlob(blob);

      const fileName = `${user.id}/index-increase/${state.effectiveDate.substring(0, 7)}/Indexmieterhoehung_${tenant.last_name || "Mieter"}_${state.effectiveDate}.pdf`;

      const { error: uploadError } = await supabase.storage.from("documents").upload(fileName, blob, {
        cacheControl: "3600",
        upsert: false,
        contentType: "application/pdf",
      });
      if (uploadError) throw uploadError;

      const { data: docRecord, error: docError } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          file_name: `Indexmieterhoehung_${state.tenantName.replace(/\s+/g, "_")}_${state.effectiveDate}.pdf`,
          file_path: fileName,
          file_size: blob.size,
          file_type: "application/pdf",
          document_type: "index_increase_notice",
          description: `Indexmieterh\u00F6hung f\u00FCr ${state.tenantName}, wirksam ab ${state.effectiveDate}`,
          document_date: today,
          shared_with_tenant: false,
          metadata: {
            vpi_old_month: state.vpiOldMonth,
            vpi_old_value: oldVal,
            vpi_new_month: state.vpiNewMonth,
            vpi_new_value: newVal,
            old_rent: state.currentRent,
            new_rent: newRent,
            effective_from: state.effectiveDate,
            contract_id: calc.contract_id,
            tenant_id: rc.tenant_id,
          },
        })
        .select("id")
        .maybeSingle();
      if (docError) throw docError;

      if (docRecord) {
        await supabase.from("document_associations").insert([
          { document_id: docRecord.id, association_type: "tenant", association_id: rc.tenant_id, created_by: user.id },
          { document_id: docRecord.id, association_type: "rental_contract", association_id: calc.contract_id, created_by: user.id },
          { document_id: docRecord.id, association_type: "property", association_id: rc.property_id, created_by: user.id },
        ]);
      }

      const isImmediatelyActive = state.effectiveDate <= today;
      await createRentPeriod({
        contractId: calc.contract_id,
        userId: user.id,
        effectiveDate: state.effectiveDate,
        coldRent: newRent,
        utilities: state.currentUtilities,
        reason: "index",
        status: isImmediatelyActive ? "active" : "planned",
        notes: `Indexmieterh\u00F6hung: VPI ${oldVal.toFixed(1)} \u2192 ${newVal.toFixed(1)}`,
        vpiOldMonth: state.vpiOldMonth,
        vpiOldValue: oldVal,
        vpiNewMonth: state.vpiNewMonth,
        vpiNewValue: newVal,
        syncToContract: isImmediatelyActive,
      });

      await supabase
        .from("index_rent_calculations")
        .update({
          status: "applied",
          applied_at: new Date().toISOString(),
          notes: `Indexmieterh\u00F6hung durchgef\u00FChrt: ${state.currentRent.toFixed(2)} \u2192 ${newRent.toFixed(2)} \u20AC, wirksam ab ${state.effectiveDate}`,
        })
        .eq("id", calc.id);

      setSaved(true);
    } catch (err) {
      console.error("Error finalizing:", err);
      alert("Fehler beim Erstellen der Indexmieterh\u00F6hung. Bitte versuchen Sie es erneut.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
        <div className="bg-white rounded-xl p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="text-sm text-gray-500 mt-4">Daten werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-dark">Indexmieterh\u00F6hung erstellen</h2>
          {!saved && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          )}
          {saved && (
            <button
              onClick={() => { onComplete(); onClose(); }}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => {
              const isCurrent = s.key === step;
              const isComplete = i < stepIndex || saved;
              return (
                <div key={s.key} className="flex items-center flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        isComplete
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {isComplete ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={`text-xs font-medium hidden sm:inline ${isCurrent ? "text-blue-700" : "text-gray-500"}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-px mx-2 ${i < stepIndex ? "bg-emerald-400" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === "overview" && (
            <StepOverview
              state={state}
              tenantName={state.tenantName}
              propertyName={`${property.name} \u2013 ${property.address}`}
            />
          )}
          {step === "vpi" && <StepVpi state={state} onChange={updateState} />}
          {step === "parties" && <StepParties state={state} onChange={updateState} />}
          {step === "preview" && <StepPreview state={state} />}
          {step === "finalize" && (
            <StepFinalize
              state={state}
              saving={saving}
              saved={saved}
              pdfBlob={pdfBlob}
              onSave={handleFinalize}
            />
          )}
        </div>

        {!saved && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div>
              {stepIndex > 0 && step !== "finalize" && (
                <Button onClick={goBack} variant="secondary">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Zur\u00FCck
                </Button>
              )}
              {step === "finalize" && !saving && (
                <Button onClick={goBack} variant="secondary">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Zur\u00FCck
                </Button>
              )}
            </div>
            <div>
              {step !== "finalize" && (
                <Button onClick={goNext} disabled={!canGoNext()} variant="primary">
                  Weiter
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}

        {saved && (
          <div className="flex items-center justify-center px-6 py-4 border-t border-gray-200 bg-gray-50">
            <Button
              onClick={() => { onComplete(); onClose(); }}
              variant="primary"
            >
              Schlie\u00DFen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
