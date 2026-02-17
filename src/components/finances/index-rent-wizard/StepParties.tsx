import type { WizardState } from "./types";

interface Props {
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
}

export default function StepParties({ state, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-dark mb-1">Parteien & Adressen</h3>
        <p className="text-sm text-gray-500">
          Pr\u00FCfen und korrigieren Sie die Angaben f\u00FCr das Erh\u00F6hungsschreiben. \u00C4nderungen hier betreffen nur dieses Dokument.
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Vermieter</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name / Firma *</label>
            <input
              type="text"
              value={state.landlordName}
              onChange={(e) => onChange({ landlordName: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Max Mustermann"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Adresse *</label>
            <input
              type="text"
              value={state.landlordAddress}
              onChange={(e) => onChange({ landlordAddress: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Musterstra\u00DFe 1, 12345 Berlin"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Mieter</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Anrede</label>
            <select
              value={state.tenantSalutation}
              onChange={(e) => onChange({ tenantSalutation: e.target.value as WizardState["tenantSalutation"] })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="male">Herr</option>
              <option value="female">Frau</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
            <input
              type="text"
              value={state.tenantName}
              onChange={(e) => onChange({ tenantName: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Anschrift *</label>
            <textarea
              value={state.tenantAddress}
              onChange={(e) => onChange({ tenantAddress: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Mietobjekt</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Adresse *</label>
            <input
              type="text"
              value={state.propertyAddress}
              onChange={(e) => onChange({ propertyAddress: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Einheit</label>
            <input
              type="text"
              value={state.unitNumber}
              onChange={(e) => onChange({ unitNumber: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="z.B. Wohnung 3"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mietvertrag vom</label>
            <input
              type="date"
              value={state.contractDate}
              onChange={(e) => onChange({ contractDate: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function isPartiesStepValid(state: WizardState): boolean {
  return !!(state.landlordName.trim() && state.landlordAddress.trim() && state.tenantName.trim() && state.tenantAddress.trim() && state.propertyAddress.trim());
}
