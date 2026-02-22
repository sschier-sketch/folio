import { AlertCircle, TrendingUp, ArrowRight, Calendar } from "lucide-react";
import type { WizardState } from "./types";

const formatCurrency = (v: number) =>
  v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

const MONTHS = [
  { value: "01", label: "Januar" },
  { value: "02", label: "Februar" },
  { value: "03", label: "März" },
  { value: "04", label: "April" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Dezember" },
];

function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 2015; y--) {
    years.push(y);
  }
  return years;
}

function parseMonthValue(value: string): { month: string; year: string } {
  if (!value) return { month: "", year: "" };
  const clean = value.substring(0, 7);
  const [y, m] = clean.split("-");
  return { month: m || "", year: y || "" };
}

function buildMonthValue(year: string, month: string): string {
  if (!year || !month) return "";
  return `${year}-${month}-01`;
}

interface Props {
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
}

function MonthYearPicker({
  value,
  onChangeValue,
}: {
  value: string;
  onChangeValue: (val: string) => void;
}) {
  const { month, year } = parseMonthValue(value);
  const years = getYearOptions();

  const handleMonthChange = (m: string) => {
    onChangeValue(buildMonthValue(year || String(new Date().getFullYear()), m));
  };

  const handleYearChange = (y: string) => {
    onChangeValue(buildMonthValue(y, month || "01"));
  };

  return (
    <div className="flex gap-2">
      <select
        value={month}
        onChange={(e) => handleMonthChange(e.target.value)}
        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="">Monat</option>
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => handleYearChange(e.target.value)}
        className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="">Jahr</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>{y}</option>
        ))}
      </select>
    </div>
  );
}

export default function StepVpi({ state, onChange }: Props) {
  const oldVal = parseFloat(state.vpiOldValue) || 0;
  const newVal = parseFloat(state.vpiNewValue) || 0;
  const canCalc = oldVal > 0 && newVal > 0;
  const pctChange = canCalc ? ((newVal / oldVal - 1) * 100) : 0;
  const newRent = canCalc ? Math.round(state.currentRent * (newVal / oldVal) * 100) / 100 : 0;
  const delta = canCalc ? newRent - state.currentRent : 0;

  const errors: string[] = [];
  if (state.vpiOldMonth && state.vpiNewMonth && state.vpiNewMonth <= state.vpiOldMonth) {
    errors.push("Der aktuelle VPI-Monat muss nach dem alten VPI-Monat liegen.");
  }
  if (canCalc && newVal <= oldVal) {
    errors.push("Der aktuelle VPI-Wert muss höher sein als der alte VPI-Wert (sonst keine Erhöhung möglich).");
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-dark mb-1">VPI-Eingabe</h3>
        <p className="text-sm text-gray-500">
          Geben Sie die Verbraucherpreisindex-Werte ein (Quelle: Statistisches Bundesamt, Basis 2020 = 100).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">VPI damals (Basis)</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Monat / Jahr</label>
              <MonthYearPicker
                value={state.vpiOldMonth}
                onChangeValue={(val) => onChange({ vpiOldMonth: val })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">VPI-Wert</label>
              <input
                type="number"
                step="0.1"
                value={state.vpiOldValue}
                onChange={(e) => onChange({ vpiOldValue: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="z.B. 118.3"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">VPI Vergleich</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Monat / Jahr</label>
              <MonthYearPicker
                value={state.vpiNewMonth}
                onChangeValue={(val) => onChange({ vpiNewMonth: val })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">VPI-Wert</label>
              <input
                type="number"
                step="0.1"
                value={state.vpiNewValue}
                onChange={(e) => onChange({ vpiNewValue: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="z.B. 121.5"
              />
            </div>
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-red-700">{err}</span>
            </div>
          ))}
        </div>
      )}

      {canCalc && newVal > oldVal && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-emerald-800 mb-4">Berechnungsergebnis</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-emerald-600 mb-1">Indexänderung</p>
              <p className="text-xl font-bold text-emerald-800">+{pctChange.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-xs text-emerald-600 mb-1">Neue Nettokaltmiete</p>
              <p className="text-xl font-bold text-emerald-800">{formatCurrency(newRent)}</p>
            </div>
            <div>
              <p className="text-xs text-emerald-600 mb-1">Erhöhung / Monat</p>
              <p className="text-xl font-bold text-emerald-800">+{formatCurrency(delta)}</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-emerald-200 flex items-center gap-2 text-xs text-emerald-700">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>
              {formatCurrency(state.currentRent)} <ArrowRight className="w-3 h-3 inline" /> {formatCurrency(newRent)} (kaufmännisch auf Cent gerundet)
            </span>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Wirksamkeitsdatum</label>
        <div className="relative max-w-xs">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="date"
            value={state.effectiveDate}
            onChange={(e) => onChange({ effectiveDate: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Vorausgefüllt mit dem frühesten zulässigen Datum. Sie können ein späteres Datum wählen.
        </p>
      </div>
    </div>
  );
}

export function isVpiStepValid(state: WizardState): boolean {
  const oldVal = parseFloat(state.vpiOldValue) || 0;
  const newVal = parseFloat(state.vpiNewValue) || 0;
  if (oldVal <= 0 || newVal <= 0) return false;
  if (newVal <= oldVal) return false;
  if (!state.vpiOldMonth || !state.vpiNewMonth) return false;
  if (state.vpiNewMonth <= state.vpiOldMonth) return false;
  if (!state.effectiveDate) return false;
  return true;
}
