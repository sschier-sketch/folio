import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { parseNumberInput } from "../lib/utils";

interface Loan {
  id: string;
  lender_name: string;
  loan_amount: number;
  remaining_balance: number;
  interest_rate: number;
  monthly_payment: number;
  monthly_principal: number;
  start_date: string;
  end_date: string;
  loan_type: string;
  notes: string;
  contact_person_name?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
  fixed_interest_start_date?: string;
  fixed_interest_end_date?: string;
  fixed_interest_equals_loan_end?: boolean;
  special_repayment_allowed?: boolean;
  special_repayment_max_amount?: number;
  special_repayment_max_percent?: number;
  special_repayment_due_date?: string;
  special_repayment_annual_end?: boolean;
  special_repayment_used_amount?: number;
  loan_status?: string;
  responsible_person?: string;
  email_notification_enabled?: boolean;
  notification_days_before?: number;
}

interface LoanModalProps {
  propertyId: string;
  loan: Loan | null;
  onClose: () => void;
  onSave: () => void;
}

export default function LoanModal({
  propertyId,
  loan,
  onClose,
  onSave,
}: LoanModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [principalType, setPrincipalType] = useState<"euro" | "percent">("euro");
  const [principalInput, setPrincipalInput] = useState(0);

  const [formData, setFormData] = useState({
    lender_name: "",
    loan_amount: 0,
    remaining_balance: 0,
    interest_rate: 0,
    monthly_payment: 0,
    monthly_principal: 0,
    start_date: "",
    end_date: "",
    loan_type: "mortgage",
    notes: "",
    contact_person_name: "",
    contact_person_email: "",
    contact_person_phone: "",
    fixed_interest_start_date: "",
    fixed_interest_end_date: "",
    fixed_interest_equals_loan_end: false,
    special_repayment_allowed: false,
    special_repayment_max_amount: 0,
    special_repayment_max_percent: 0,
    special_repayment_due_date: "",
    special_repayment_annual_end: false,
    special_repayment_used_amount: 0,
    loan_status: "active",
    responsible_person: "",
    email_notification_enabled: true,
    notification_days_before: 90,
  });

  useEffect(() => {
    if (loan) {
      setFormData({
        lender_name: loan.lender_name,
        loan_amount: loan.loan_amount,
        remaining_balance: loan.remaining_balance,
        interest_rate: loan.interest_rate,
        monthly_payment: loan.monthly_payment,
        monthly_principal: loan.monthly_principal || 0,
        start_date: loan.start_date,
        end_date: loan.end_date,
        loan_type: loan.loan_type,
        notes: loan.notes,
        contact_person_name: loan.contact_person_name || "",
        contact_person_email: loan.contact_person_email || "",
        contact_person_phone: loan.contact_person_phone || "",
        fixed_interest_start_date: loan.fixed_interest_start_date || "",
        fixed_interest_end_date: loan.fixed_interest_end_date || "",
        fixed_interest_equals_loan_end: loan.fixed_interest_equals_loan_end || false,
        special_repayment_allowed: loan.special_repayment_allowed || false,
        special_repayment_max_amount: loan.special_repayment_max_amount || 0,
        special_repayment_max_percent: loan.special_repayment_max_percent || 0,
        special_repayment_due_date: loan.special_repayment_due_date || "",
        special_repayment_annual_end: loan.special_repayment_annual_end || false,
        special_repayment_used_amount: loan.special_repayment_used_amount || 0,
        loan_status: loan.loan_status || "active",
        responsible_person: loan.responsible_person || "",
        email_notification_enabled: loan.email_notification_enabled !== false,
        notification_days_before: loan.notification_days_before || 90,
      });
      setPrincipalInput(loan.monthly_principal || 0);
    }
  }, [loan]);

  useEffect(() => {
    if (principalType === "percent" && formData.loan_amount > 0) {
      const annualPrincipal = (formData.loan_amount * principalInput) / 100;
      const monthlyPrincipal = Math.round((annualPrincipal / 12) * 100) / 100;

      if (formData.monthly_principal !== monthlyPrincipal) {
        setFormData((prev) => ({
          ...prev,
          monthly_principal: monthlyPrincipal,
        }));
      }
    } else if (principalType === "euro") {
      if (formData.monthly_principal !== principalInput) {
        setFormData((prev) => ({
          ...prev,
          monthly_principal: principalInput,
        }));
      }
    }
  }, [principalInput, principalType, formData.loan_amount, formData.monthly_principal]);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const data: any = {
        lender_name: formData.lender_name,
        loan_amount: formData.loan_amount,
        remaining_balance: formData.remaining_balance,
        interest_rate: formData.interest_rate,
        monthly_payment: formData.monthly_payment,
        monthly_principal: formData.monthly_principal,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        loan_type: formData.loan_type,
        notes: formData.notes || null,
        contact_person_name: formData.contact_person_name || null,
        contact_person_email: formData.contact_person_email || null,
        contact_person_phone: formData.contact_person_phone || null,
        fixed_interest_start_date: formData.fixed_interest_start_date || null,
        fixed_interest_end_date: formData.fixed_interest_end_date || null,
        fixed_interest_equals_loan_end: formData.fixed_interest_equals_loan_end,
        special_repayment_allowed: formData.special_repayment_allowed,
        special_repayment_max_amount: formData.special_repayment_max_amount || null,
        special_repayment_max_percent: formData.special_repayment_max_percent || null,
        special_repayment_due_date: formData.special_repayment_due_date || null,
        special_repayment_annual_end: formData.special_repayment_annual_end,
        special_repayment_used_amount: formData.special_repayment_used_amount || null,
        loan_status: formData.loan_status,
        responsible_person: formData.responsible_person || null,
        email_notification_enabled: formData.email_notification_enabled,
        notification_days_before: formData.notification_days_before,
        property_id: propertyId,
        user_id: user.id,
      };

      if (loan) {
        const { error } = await supabase
          .from("loans")
          .update(data)
          .eq("id", loan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("loans").insert([data]);
        if (error) throw error;
      }
      onSave();
    } catch (error) {
      console.error("Error saving loan:", error);
      alert("Fehler beim Speichern des Kredits");
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3, 4].map((step) => (
        <div
          key={step}
          className={`h-2 rounded-full transition-all ${
            step === currentStep
              ? "w-8 bg-primary-blue"
              : step < currentStep
              ? "w-2 bg-primary-blue"
              : "w-2 bg-gray-200"
          }`}
        />
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Kreditgeber *
        </label>
        <input
          type="text"
          value={formData.lender_name}
          onChange={(e) =>
            setFormData({ ...formData, lender_name: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          placeholder="z.B. Sparkasse"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Kreditsumme (€) *
          </label>
          <input
            type="text"
            value={formData.loan_amount}
            onChange={(e) =>
              setFormData({
                ...formData,
                loan_amount: parseNumberInput(e.target.value),
              })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            placeholder="z.B. 200000 oder 200.000,00"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Restschuld (€) *
          </label>
          <input
            type="text"
            value={formData.remaining_balance}
            onChange={(e) =>
              setFormData({
                ...formData,
                remaining_balance: parseNumberInput(e.target.value),
              })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            placeholder="z.B. 185000 oder 185.000,00"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Zinssatz (%) *
          </label>
          <input
            type="text"
            value={formData.interest_rate}
            onChange={(e) =>
              setFormData({
                ...formData,
                interest_rate: parseNumberInput(e.target.value),
              })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            placeholder="z.B. 1,62 oder 2,5"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Monatliche Rate (€) *
          </label>
          <input
            type="text"
            value={formData.monthly_payment}
            onChange={(e) =>
              setFormData({
                ...formData,
                monthly_payment: parseNumberInput(e.target.value),
              })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            placeholder="z.B. 306,28 oder 1200,50"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Monatliche Tilgung *
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={principalInput}
            onChange={(e) =>
              setPrincipalInput(parseNumberInput(e.target.value))
            }
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            placeholder={
              principalType === "euro" ? "z.B. 800" : "z.B. 1,5 oder 2"
            }
            required
          />
          <select
            value={principalType}
            onChange={(e) =>
              setPrincipalType(e.target.value as "euro" | "percent")
            }
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue bg-white"
          >
            <option value="euro">€</option>
            <option value="percent">%</option>
          </select>
        </div>
        <p className="mt-1 text-xs text-gray-300">
          {principalType === "euro"
            ? "Tilgungsanteil der monatlichen Rate (Rate - Zinsen)"
            : `Jährliche Tilgung in % (${formData.monthly_principal.toFixed(2)}€ pro Monat)`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Kreditbeginn *
          </label>
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) =>
              setFormData({ ...formData, start_date: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Kreditende *
          </label>
          <input
            type="date"
            value={formData.end_date}
            onChange={(e) =>
              setFormData({ ...formData, end_date: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Kreditart
        </label>
        <select
          value={formData.loan_type}
          onChange={(e) =>
            setFormData({ ...formData, loan_type: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
        >
          <option value="mortgage">Hypothek</option>
          <option value="renovation">Renovierungskredit</option>
          <option value="other">Sonstiges</option>
        </select>
      </div>

      {formData.interest_rate > 0 &&
        formData.monthly_payment > 0 &&
        formData.monthly_principal > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              Tilgungs-Transparenz
            </h4>
            <div className="flex justify-between text-sm">
              <span className="text-blue-800">Monatliche Rate:</span>
              <span className="font-semibold text-blue-900">
                {formData.monthly_payment.toFixed(2)} €
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-blue-700">davon ca. Zinsen:</span>
              <span className="text-blue-800">
                {(formData.monthly_payment - formData.monthly_principal).toFixed(2)} €
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-blue-700">davon ca. Tilgung:</span>
              <span className="text-blue-800">
                {formData.monthly_principal.toFixed(2)} €
              </span>
            </div>
          </div>
        )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-dark mb-3">Zinsbindung</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Beginn der Zinsbindung
          </label>
          <input
            type="date"
            value={formData.fixed_interest_start_date}
            onChange={(e) =>
              setFormData({
                ...formData,
                fixed_interest_start_date: e.target.value,
              })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Ende der Zinsbindung
          </label>
          <input
            type="date"
            value={formData.fixed_interest_end_date}
            onChange={(e) =>
              setFormData({
                ...formData,
                fixed_interest_end_date: e.target.value,
              })
            }
            disabled={formData.fixed_interest_equals_loan_end}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.fixed_interest_equals_loan_end}
            onChange={(e) => {
              const checked = e.target.checked;
              setFormData({
                ...formData,
                fixed_interest_equals_loan_end: checked,
                fixed_interest_end_date: checked
                  ? formData.end_date
                  : formData.fixed_interest_end_date,
              });
            }}
            className="w-4 h-4 text-[#008CFF] border-gray-300 rounded focus:ring-2 focus:ring-[#008CFF]"
          />
          <span className="text-sm font-medium text-gray-700">
            Zinsbindung entspricht Kreditende
          </span>
        </label>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-dark mb-3">
          E-Mail Erinnerung
        </h3>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.email_notification_enabled}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  email_notification_enabled: e.target.checked,
                })
              }
              className="w-4 h-4 text-[#008CFF] border-gray-300 rounded focus:ring-2 focus:ring-[#008CFF]"
            />
            <span className="text-sm font-medium text-blue-900">
              E-Mail-Erinnerung aktivieren
            </span>
          </label>
          <p className="text-xs text-blue-700 mt-2 ml-6">
            Erhalte rechtzeitig eine Benachrichtigung vor Ablauf der Zinsbindung
          </p>
        </div>

        {formData.email_notification_enabled && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Erinnerung wie viele Tage vorher?
            </label>
            <select
              value={formData.notification_days_before}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  notification_days_before: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="30">30 Tage vorher</option>
              <option value="60">60 Tage vorher</option>
              <option value="90">90 Tage vorher (empfohlen)</option>
              <option value="120">120 Tage vorher</option>
              <option value="180">180 Tage vorher</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-dark mb-3">Sondertilgung</h3>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.special_repayment_allowed}
            onChange={(e) =>
              setFormData({
                ...formData,
                special_repayment_allowed: e.target.checked,
              })
            }
            className="w-4 h-4 text-[#008CFF] border-gray-300 rounded focus:ring-2 focus:ring-[#008CFF]"
          />
          <span className="text-sm font-medium text-gray-700">
            Sondertilgung erlaubt
          </span>
        </label>
      </div>

      {formData.special_repayment_allowed && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Max. Sondertilgung pro Jahr (€)
              </label>
              <input
                type="text"
                value={formData.special_repayment_max_amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    special_repayment_max_amount: parseNumberInput(
                      e.target.value
                    ),
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="z.B. 10000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                oder in Prozent (%)
              </label>
              <input
                type="text"
                value={formData.special_repayment_max_percent}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    special_repayment_max_percent: parseNumberInput(
                      e.target.value
                    ),
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="z.B. 5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Stichtag für Sondertilgung
              </label>
              <input
                type="date"
                value={formData.special_repayment_due_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    special_repayment_due_date: e.target.value,
                  })
                }
                disabled={formData.special_repayment_annual_end}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue disabled:bg-gray-50"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.special_repayment_annual_end}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      special_repayment_annual_end: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-[#008CFF] border-gray-300 rounded focus:ring-2 focus:ring-[#008CFF]"
                />
                <span className="text-sm font-medium text-gray-700">
                  Jährlich zum Jahresende
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Bereits geleistete Sondertilgung (€)
            </label>
            <input
              type="text"
              value={formData.special_repayment_used_amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  special_repayment_used_amount: parseNumberInput(
                    e.target.value
                  ),
                })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder="0"
            />
          </div>
        </>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-dark mb-3">Status & Kontakte</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Kreditstatus
          </label>
          <select
            value={formData.loan_status}
            onChange={(e) =>
              setFormData({ ...formData, loan_status: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            <option value="active">Aktiv</option>
            <option value="ended">Beendet</option>
            <option value="refinancing">In Umschuldung</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Verantwortlich
          </label>
          <input
            type="text"
            value={formData.responsible_person}
            onChange={(e) =>
              setFormData({ ...formData, responsible_person: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            placeholder="z.B. Max Mustermann"
          />
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Ansprechpartner beim Kreditgeber
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Name
          </label>
          <input
            type="text"
            value={formData.contact_person_name}
            onChange={(e) =>
              setFormData({ ...formData, contact_person_name: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            placeholder="z.B. Max Mustermann"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            E-Mail
          </label>
          <input
            type="email"
            value={formData.contact_person_email}
            onChange={(e) =>
              setFormData({
                ...formData,
                contact_person_email: e.target.value,
              })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            placeholder="z.B. max@bank.de"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Telefon
        </label>
        <input
          type="tel"
          value={formData.contact_person_phone}
          onChange={(e) =>
            setFormData({ ...formData, contact_person_phone: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          placeholder="z.B. +49 123 456789"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Notizen
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) =>
            setFormData({ ...formData, notes: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          rows={3}
          placeholder="Zusätzliche Informationen..."
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-md w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-dark">
            {loan ? "Kredit bearbeiten" : "Neuer Kredit"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {renderStepIndicator()}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Zurück
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
            >
              Abbrechen
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-600 transition-colors"
              >
                Weiter
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {loading ? "Speichern..." : "Speichern"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
