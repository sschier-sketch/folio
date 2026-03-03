import { Lightbulb, CheckCircle, Plus, Trash2 } from 'lucide-react';
import type { MieterhoehungSachverhalt, VergleichswohnungEntry } from './types';

interface Props {
  data: MieterhoehungSachverhalt;
  onChange: (data: MieterhoehungSachverhalt) => void;
}

export function isMieterhoehungSachverhaltValid(d: MieterhoehungSachverhalt): boolean {
  if (!d.ortsueblicheVergleichsmiete) return false;
  if (d.ersteMieterhoehung === null) return false;
  if (!d.ersteMieterhoehung && !d.letzteMieterhoehungDatum) return false;
  if (!d.ruecksendeFrist) return false;

  const hasBegruendung =
    d.begruendungMietspiegel || d.begruendungVergleichswohnungen || d.begruendungGutachten;
  if (!hasBegruendung) return false;

  if (d.begruendungMietspiegel && !d.mietspiegelQualitaet) return false;
  if (d.begruendungVergleichswohnungen) {
    if (d.vergleichswohnungen.length < 3) return false;
    const allFilled = d.vergleichswohnungen.every(
      (w) => w.strasse.trim() && w.plz.trim() && w.stadt.trim() && w.mieteProQm,
    );
    if (!allFilled) return false;
  }
  if (d.begruendungGutachten && (!d.gutachterName.trim() || !d.gutachterBerichtsdatum)) return false;

  if (d.modernisierung === null) return false;
  if (d.modernisierung && !d.modernisierungDatum) return false;

  return true;
}

const inputCls =
  'w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue';

function RadioToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm font-medium text-gray-800 max-w-[60%]">{label}</span>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <span
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              value === false ? 'border-gray-800' : 'border-gray-300'
            }`}
          >
            {value === false && <span className="w-2.5 h-2.5 rounded-full bg-gray-800" />}
          </span>
          <span className="text-sm text-gray-700">Nein</span>
          <input
            type="radio"
            className="sr-only"
            checked={value === false}
            onChange={() => onChange(false)}
          />
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <span
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              value === true ? 'border-gray-800' : 'border-gray-300'
            }`}
          >
            {value === true && <span className="w-2.5 h-2.5 rounded-full bg-gray-800" />}
          </span>
          <span className="text-sm text-gray-700">Ja</span>
          <input
            type="radio"
            className="sr-only"
            checked={value === true}
            onChange={() => onChange(true)}
          />
        </label>
      </div>
    </div>
  );
}

export default function StepMieterhoehungSachverhalt({ data, onChange }: Props) {
  const set = (partial: Partial<MieterhoehungSachverhalt>) => onChange({ ...data, ...partial });

  function updateVergleichswohnung(idx: number, partial: Partial<VergleichswohnungEntry>) {
    const updated = data.vergleichswohnungen.map((w, i) =>
      i === idx ? { ...w, ...partial } : w,
    );
    set({ vergleichswohnungen: updated });
  }

  function addVergleichswohnung() {
    set({
      vergleichswohnungen: [
        ...data.vergleichswohnungen,
        { strasse: '', hausnummer: '', plz: '', stadt: '', mieteProQm: '', wohnflaeche: '' },
      ],
    });
  }

  function removeVergleichswohnung(idx: number) {
    set({ vergleichswohnungen: data.vergleichswohnungen.filter((_, i) => i !== idx) });
  }

  return (
    <div>
      <div className="flex gap-8">
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-bold text-dark mb-2">Begründung</h3>
          <p className="text-sm text-gray-500 mb-8">
            Begründen Sie Ihr Mieterhöhungsverlangen nach § 558 BGB.
          </p>

          <div className="space-y-8">
            <div>
              <h4 className="text-lg font-semibold text-dark mb-4">Aktuelle Mieterhöhung</h4>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ortsübliche Vergleichsmiete
                  </label>
                  <div className="relative max-w-xs">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={data.ortsueblicheVergleichsmiete}
                      onChange={(e) => set({ ortsueblicheVergleichsmiete: e.target.value })}
                      className={inputCls}
                      placeholder=""
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                      &euro;
                    </span>
                  </div>
                </div>

                <RadioToggle
                  label="Wird die ortsübliche Vergleichsmiete anhand eines Mietspiegels ermittelt?"
                  value={data.begruendungMietspiegel}
                  onChange={(v) => set({ begruendungMietspiegel: v })}
                />

                {data.begruendungMietspiegel && (
                  <div className="pl-0 space-y-4 pb-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mietspiegel-Wohnqualität
                      </label>
                      <select
                        value={data.mietspiegelQualitaet}
                        onChange={(e) =>
                          set({
                            mietspiegelQualitaet: e.target.value as '' | 'einfach' | 'mittel' | 'gut',
                          })
                        }
                        className={inputCls + ' max-w-xs'}
                      >
                        <option value="">--</option>
                        <option value="einfach">einfach</option>
                        <option value="mittel">mittel</option>
                        <option value="gut">gut</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        neuer Betrag pro m&sup2;
                      </label>
                      <div className="relative max-w-xs">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={data.mietspiegelNeuerBetragProQm}
                          onChange={(e) => set({ mietspiegelNeuerBetragProQm: e.target.value })}
                          className={inputCls}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                          &euro;
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <RadioToggle
                  label="Wird die ortsübliche Vergleichsmiete anhand der Mieten von drei vergleichbaren Mietwohnungen ermittelt?"
                  value={data.begruendungVergleichswohnungen}
                  onChange={(v) => {
                    const updates: Partial<MieterhoehungSachverhalt> = {
                      begruendungVergleichswohnungen: v,
                    };
                    if (v && data.vergleichswohnungen.length < 3) {
                      const missing = 3 - data.vergleichswohnungen.length;
                      const newEntries: VergleichswohnungEntry[] = Array.from(
                        { length: missing },
                        () => ({
                          strasse: '',
                          hausnummer: '',
                          plz: '',
                          stadt: '',
                          mieteProQm: '',
                          wohnflaeche: '',
                        }),
                      );
                      updates.vergleichswohnungen = [...data.vergleichswohnungen, ...newEntries];
                    }
                    set(updates);
                  }}
                />

                {data.begruendungVergleichswohnungen && (
                  <div className="space-y-4 pb-2">
                    {data.vergleichswohnungen.map((w, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            Vergleichswohnung {idx + 1}
                          </span>
                          {data.vergleichswohnungen.length > 3 && (
                            <button
                              onClick={() => removeVergleichswohnung(idx)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="col-span-2">
                            <input
                              type="text"
                              value={w.strasse}
                              onChange={(e) => updateVergleichswohnung(idx, { strasse: e.target.value })}
                              className={inputCls}
                              placeholder="Straße"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={w.hausnummer}
                              onChange={(e) =>
                                updateVergleichswohnung(idx, { hausnummer: e.target.value })
                              }
                              className={inputCls}
                              placeholder="Nr."
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div>
                            <input
                              type="text"
                              value={w.plz}
                              onChange={(e) => updateVergleichswohnung(idx, { plz: e.target.value })}
                              className={inputCls}
                              placeholder="PLZ"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="text"
                              value={w.stadt}
                              onChange={(e) => updateVergleichswohnung(idx, { stadt: e.target.value })}
                              className={inputCls}
                              placeholder="Stadt"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={w.mieteProQm}
                              onChange={(e) =>
                                updateVergleichswohnung(idx, { mieteProQm: e.target.value })
                              }
                              className={inputCls}
                              placeholder="Miete/m²"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                              &euro;/m&sup2;
                            </span>
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={w.wohnflaeche}
                              onChange={(e) =>
                                updateVergleichswohnung(idx, { wohnflaeche: e.target.value })
                              }
                              className={inputCls}
                              placeholder="Wohnfläche"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                              m&sup2;
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={addVergleichswohnung}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-dark transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Weitere Vergleichswohnung
                    </button>
                  </div>
                )}

                <RadioToggle
                  label="Wird die ortsübliche Vergleichsmiete anhand eines Sachverständigengutachtens ermittelt?"
                  value={data.begruendungGutachten}
                  onChange={(v) => set({ begruendungGutachten: v })}
                />

                {data.begruendungGutachten && (
                  <div className="space-y-4 pb-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Herr/Frau *
                      </label>
                      <select
                        value={data.gutachterAnrede}
                        onChange={(e) =>
                          set({ gutachterAnrede: e.target.value as '' | 'Herr' | 'Frau' })
                        }
                        className={inputCls + ' max-w-xs'}
                      >
                        <option value="">--</option>
                        <option value="Herr">Herr</option>
                        <option value="Frau">Frau</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vor- und Nachname des Sachverständigen *
                      </label>
                      <input
                        type="text"
                        value={data.gutachterName}
                        onChange={(e) => set({ gutachterName: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Berichtsdatum *
                      </label>
                      <input
                        type="date"
                        value={data.gutachterBerichtsdatum}
                        onChange={(e) => set({ gutachterBerichtsdatum: e.target.value })}
                        className={inputCls + ' max-w-xs'}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-gray-200" />

            <div>
              <h4 className="text-lg font-semibold text-dark mb-4">Aktuelle Mieterhöhung</h4>

              <div className="space-y-5">
                <RadioToggle
                  label="Ist dies die erste Mieterhöhung?"
                  value={data.ersteMieterhoehung}
                  onChange={(v) =>
                    set({ ersteMieterhoehung: v, letzteMieterhoehungDatum: v ? '' : data.letzteMieterhoehungDatum })
                  }
                />

                {data.ersteMieterhoehung === false && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Letzte Mietererhöhung *
                    </label>
                    <input
                      type="date"
                      value={data.letzteMieterhoehungDatum}
                      onChange={(e) => set({ letzteMieterhoehungDatum: e.target.value })}
                      className={inputCls + ' max-w-xs'}
                    />
                  </div>
                )}

                <RadioToggle
                  label="Wurde die Miete innerhalb der letzten 6 Monate aufgrund von Modernisierungen erhöht?"
                  value={data.modernisierung}
                  onChange={(v) =>
                    set({ modernisierung: v, modernisierungDatum: v ? data.modernisierungDatum : '' })
                  }
                />

                {data.modernisierung && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modernisierungsdatum *
                    </label>
                    <input
                      type="date"
                      value={data.modernisierungDatum}
                      onChange={(e) => set({ modernisierungDatum: e.target.value })}
                      className={inputCls + ' max-w-xs'}
                    />
                  </div>
                )}

                <hr className="border-gray-200" />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dokument muss unterschrieben zurückgesendet werden bis: *
                  </label>
                  <input
                    type="date"
                    value={data.ruecksendeFrist}
                    onChange={(e) => set({ ruecksendeFrist: e.target.value })}
                    className={inputCls + ' max-w-xs'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-72 flex-shrink-0 hidden lg:block">
          <div className="bg-gray-50 rounded-lg p-5 sticky top-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Hinweise und Tipps</span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>
                  Zur Begründung kann insbesondere Bezug genommen werden auf 1. einen Mietspiegel
                  (§§ 558c, 558d), 2. eine Auskunft aus einer Mietdatenbank (§ 558e),
                  3. ein mit Gründen versehenes Gutachten eines öffentlich bestellten und
                  vereidigten Sachverständigen, 4. entsprechende Entgelte für einzelne
                  vergleichbare Wohnungen; hierbei genügt die Benennung von drei Wohnungen.
                  Die Angabe eines Mietspiegels ist der rechtsicherste Weg und daher zu empfehlen.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
