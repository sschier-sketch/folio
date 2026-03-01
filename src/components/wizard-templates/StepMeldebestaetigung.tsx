import { Plus, Trash2 } from 'lucide-react';
import type { MeldebestaetigungFormData, MeldepflichtigePerson } from './types';

interface Props {
  data: MeldebestaetigungFormData;
  onChange: (data: MeldebestaetigungFormData) => void;
}

const inputCls =
  'w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue';

export function isMeldebestaetigungValid(data: MeldebestaetigungFormData): boolean {
  const hasPersonen =
    data.meldepflichtigePersonen.length > 0 &&
    data.meldepflichtigePersonen.every((p) => p.name.trim());
  const hasObjekt = !!data.mietobjektStrasse.trim() && !!data.mietobjektPlz.trim() && !!data.mietobjektStadt.trim();
  const hasDatum = !!data.datum;
  const eigentuemerOk =
    data.selbstgenutzesWohneigentum || !!data.eigentuemerName.trim();

  return hasPersonen && hasObjekt && hasDatum && eigentuemerOk;
}

export default function StepMeldebestaetigung({ data, onChange }: Props) {
  const set = (partial: Partial<MeldebestaetigungFormData>) =>
    onChange({ ...data, ...partial });

  const updatePerson = (idx: number, partial: Partial<MeldepflichtigePerson>) => {
    const updated = [...data.meldepflichtigePersonen];
    updated[idx] = { ...updated[idx], ...partial };
    set({ meldepflichtigePersonen: updated });
  };

  const addPerson = () => {
    set({
      meldepflichtigePersonen: [
        ...data.meldepflichtigePersonen,
        { name: '', geburtsdatum: '' },
      ],
    });
  };

  const removePerson = (idx: number) => {
    if (data.meldepflichtigePersonen.length <= 1) return;
    set({
      meldepflichtigePersonen: data.meldepflichtigePersonen.filter((_, i) => i !== idx),
    });
  };

  return (
    <div>
      <h3 className="text-2xl font-bold text-dark mb-2">Meldebestätigung</h3>
      <p className="text-sm text-gray-500 mb-8">
        Füllen Sie die Angaben für die Wohnungsgeberbestätigung nach § 19 BMG aus.
      </p>

      <div className="space-y-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">
              Selbstgenutztes Wohneigentum? *
            </span>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="selbstgenutzt"
                  checked={!data.selbstgenutzesWohneigentum}
                  onChange={() => set({ selbstgenutzesWohneigentum: false })}
                  className="w-5 h-5 text-primary-blue focus:ring-primary-blue"
                />
                <span className="text-sm text-gray-700">Nein</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="selbstgenutzt"
                  checked={data.selbstgenutzesWohneigentum}
                  onChange={() => set({ selbstgenutzesWohneigentum: true })}
                  className="w-5 h-5 text-primary-blue focus:ring-primary-blue"
                />
                <span className="text-sm text-gray-700">Ja</span>
              </label>
            </div>
          </div>
        </div>

        {!data.selbstgenutzesWohneigentum && (
          <div className="border-l-2 border-gray-200 pl-5 space-y-5">
            <p className="text-sm font-medium text-gray-700">
              Informationen zum Eigentümer:zur Eigentümerin *
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vor- und Nachname *
              </label>
              <input
                type="text"
                value={data.eigentuemerName}
                onChange={(e) => set({ eigentuemerName: e.target.value })}
                className={inputCls}
              />
            </div>
            <hr className="border-gray-200" />
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Straße *</label>
                <input
                  type="text"
                  value={data.eigentuemerStrasse}
                  onChange={(e) => set({ eigentuemerStrasse: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nr *</label>
                <input
                  type="text"
                  value={data.eigentuemerNr}
                  onChange={(e) => set({ eigentuemerNr: e.target.value })}
                  placeholder="z.B. 123"
                  className={inputCls}
                />
              </div>
              <div />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PLZ *</label>
                <input
                  type="text"
                  value={data.eigentuemerPlz}
                  onChange={(e) => set({ eigentuemerPlz: e.target.value })}
                  placeholder="z.B. 10245"
                  className={inputCls}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Stadt *</label>
                <input
                  type="text"
                  value={data.eigentuemerStadt}
                  onChange={(e) => set({ eigentuemerStadt: e.target.value })}
                  placeholder="z.B. Berlin"
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        )}

        <hr className="border-gray-200" />

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Angaben zum Mietobjekt *
          </label>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PLZ *</label>
                <input
                  type="text"
                  value={data.mietobjektPlz}
                  onChange={(e) => set({ mietobjektPlz: e.target.value })}
                  placeholder="z.B. 10245"
                  className={inputCls}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Stadt *</label>
                <input
                  type="text"
                  value={data.mietobjektStadt}
                  onChange={(e) => set({ mietobjektStadt: e.target.value })}
                  placeholder="z.B. Berlin"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Straße *</label>
                <input
                  type="text"
                  value={data.mietobjektStrasse}
                  onChange={(e) => set({ mietobjektStrasse: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nr *</label>
                <input
                  type="text"
                  value={data.mietobjektNr}
                  onChange={(e) => set({ mietobjektNr: e.target.value })}
                  placeholder="z.B. 123"
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Präfix</label>
              <input
                type="text"
                value={data.mietobjektPraefix}
                onChange={(e) => set({ mietobjektPraefix: e.target.value })}
                placeholder="z.B. Links, 2,21"
                className={inputCls + ' max-w-sm'}
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />

        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">
              Ein- oder Auszug? *
            </span>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="einauszug"
                  checked={data.einOderAuszug === 'einzug'}
                  onChange={() => set({ einOderAuszug: 'einzug' })}
                  className="w-5 h-5 text-primary-blue focus:ring-primary-blue"
                />
                <span className="text-sm text-gray-700">Einzug</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="einauszug"
                  checked={data.einOderAuszug === 'auszug'}
                  onChange={() => set({ einOderAuszug: 'auszug' })}
                  className="w-5 h-5 text-primary-blue focus:ring-primary-blue"
                />
                <span className="text-sm text-gray-700">Auszug</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Datum {data.einOderAuszug === 'einzug' ? 'Einzug' : 'Auszug'}
            </label>
            <input
              type="date"
              value={data.datum}
              onChange={(e) => set({ datum: e.target.value })}
              className={inputCls + ' max-w-xs'}
            />
          </div>
        </div>

        <hr className="border-gray-200" />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Namen der meldepflichtigen Person(en) *
          </label>
          <div className="space-y-4">
            {data.meldepflichtigePersonen.map((person, idx) => (
              <div key={idx} className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Name {idx + 1}</label>
                  <input
                    type="text"
                    value={person.name}
                    onChange={(e) => updatePerson(idx, { name: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div className="w-48">
                  <label className="block text-xs text-gray-500 mb-1">Geburtsdatum</label>
                  <input
                    type="date"
                    value={person.geburtsdatum}
                    onChange={(e) => updatePerson(idx, { geburtsdatum: e.target.value })}
                    className={inputCls}
                  />
                </div>
                {data.meldepflichtigePersonen.length > 1 && (
                  <button
                    onClick={() => removePerson(idx)}
                    className="p-3 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addPerson}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Weitere hinzufügen
          </button>
        </div>

        <hr className="border-gray-200" />

        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">
            Angaben zu der vom Wohnungsgeber:von der Wohnungsgeberin (Vermieter:in) beauftragten Person
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vor- und Nachname
              </label>
              <input
                type="text"
                value={data.beauftragtePersonName}
                onChange={(e) => set({ beauftragtePersonName: e.target.value })}
                className={inputCls}
              />
            </div>
            {data.beauftragtePersonName.trim() && (
              <div className="space-y-4 border-l-2 border-gray-200 pl-5">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Straße</label>
                    <input
                      type="text"
                      value={data.beauftragtePersonStrasse}
                      onChange={(e) => set({ beauftragtePersonStrasse: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nr</label>
                    <input
                      type="text"
                      value={data.beauftragtePersonNr}
                      onChange={(e) => set({ beauftragtePersonNr: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">PLZ</label>
                    <input
                      type="text"
                      value={data.beauftragtePersonPlz}
                      onChange={(e) => set({ beauftragtePersonPlz: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stadt</label>
                    <input
                      type="text"
                      value={data.beauftragtePersonStadt}
                      onChange={(e) => set({ beauftragtePersonStadt: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
