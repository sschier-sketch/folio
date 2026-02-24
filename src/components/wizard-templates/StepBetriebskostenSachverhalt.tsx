import type { BetriebskostenSachverhalt } from './types';

interface Props {
  data: BetriebskostenSachverhalt;
  onChange: (d: BetriebskostenSachverhalt) => void;
}

const inputCls =
  'w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue';

const euroInputCls =
  'w-full pl-4 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-right';

function EuroInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? '0'}
        className={euroInputCls}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        €
      </span>
    </div>
  );
}

export default function StepBetriebskostenSachverhalt({ data, onChange }: Props) {
  const set = <K extends keyof BetriebskostenSachverhalt>(
    field: K,
    value: BetriebskostenSachverhalt[K],
  ) => onChange({ ...data, [field]: value });

  return (
    <div>
      <div className="bg-blue-50 rounded-lg px-5 py-4 mb-6">
        <h4 className="font-semibold text-dark mb-1 text-sm">Hinweise & Tipps</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          Wählen Sie, ob die Betriebskostenvorauszahlungen erhöht oder gesenkt werden sollen.
          Die Gesamtsumme ergibt sich aus dem bisherigen Betrag plus dem monatlichen Aufschlag
          (Erhöhung) bzw. minus dem Abzug (Senkung).
        </p>
      </div>

      <h3 className="text-2xl font-bold text-dark mb-2">Sachverhalt</h3>
      <p className="text-sm text-gray-500 mb-8">
        Geben Sie die Details zur Anpassung der Betriebskostenvorauszahlungen ein.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Möchtest du die Beträge deiner Betriebskostenvorauszahlungen senken oder erhöhen? *
          </label>
          <div className="flex items-center gap-8">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="modus"
                value="senken"
                checked={data.modus === 'senken'}
                onChange={() => set('modus', 'senken')}
                className="w-5 h-5 accent-primary-blue"
              />
              <span className="text-sm font-medium text-gray-700">senken</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="modus"
                value="erhoehen"
                checked={data.modus === 'erhoehen'}
                onChange={() => set('modus', 'erhoehen')}
                className="w-5 h-5 accent-primary-blue"
              />
              <span className="text-sm font-medium text-gray-700">erhöhen</span>
            </label>
          </div>
        </div>

        {data.modus === 'erhoehen' && (
          <div className="max-w-xs">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Jahr *
            </label>
            <input
              type="text"
              value={data.jahr}
              onChange={(e) => set('jahr', e.target.value)}
              placeholder="z.B. 2025"
              className={inputCls}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 max-w-lg">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Wirtschaftsjahr Vorauszahlungen pro Monat *
            </label>
            <EuroInput
              value={data.vorauszahlungProMonat}
              onChange={(v) => set('vorauszahlungProMonat', v)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Bezahlte Monate *
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={data.bezahlteMonate}
              onChange={(e) => set('bezahlteMonate', e.target.value)}
              placeholder="12"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Abrechnungszeitraum *
          </label>
          <div className="flex items-center gap-3 max-w-lg">
            <input
              type="date"
              value={data.abrechnungVon}
              onChange={(e) => set('abrechnungVon', e.target.value)}
              className={inputCls}
            />
            <span className="text-gray-500 flex-shrink-0 text-sm">bis</span>
            <input
              type="date"
              value={data.abrechnungBis}
              onChange={(e) => set('abrechnungBis', e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div className="max-w-xs">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {data.modus === 'erhoehen' ? 'Nachzahlungsanspruch' : 'Nachzahlungsanspruch (Guthaben)'} *
          </label>
          <EuroInput
            value={data.nachzahlungsanspruch}
            onChange={(v) => set('nachzahlungsanspruch', v)}
          />
        </div>

        <div className="max-w-xs">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Die monatlichen Überweisungen {data.modus === 'erhoehen' ? 'erhöhen' : 'senken'} ab *
          </label>
          <input
            type="date"
            value={data.ueberweisungenAb}
            onChange={(e) => set('ueberweisungenAb', e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-lg">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Monatliche{data.modus === 'erhoehen' ? 'r Aufschlag' : 'r Abzug'} *
            </label>
            <EuroInput
              value={data.monatlicheAnpassung}
              onChange={(v) => set('monatlicheAnpassung', v)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Gesamtsumme pro Monat *
            </label>
            <EuroInput
              value={data.gesamtsumme}
              onChange={(v) => set('gesamtsumme', v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function isBetriebskostenSachverhaltValid(d: BetriebskostenSachverhalt): boolean {
  const baseValid =
    d.vorauszahlungProMonat.trim().length > 0 &&
    d.bezahlteMonate.trim().length > 0 &&
    !!d.abrechnungVon &&
    !!d.abrechnungBis &&
    d.nachzahlungsanspruch.trim().length > 0 &&
    !!d.ueberweisungenAb &&
    d.monatlicheAnpassung.trim().length > 0 &&
    d.gesamtsumme.trim().length > 0;

  if (d.modus === 'erhoehen') {
    return baseValid && d.jahr.trim().length > 0;
  }
  return baseValid;
}
