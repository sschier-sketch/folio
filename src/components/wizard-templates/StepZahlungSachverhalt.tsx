import type { ZahlungserinnerungSachverhalt } from './types';

interface Props {
  data: ZahlungserinnerungSachverhalt;
  onChange: (d: ZahlungserinnerungSachverhalt) => void;
}

const inputCls =
  'w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue';

export default function StepZahlungSachverhalt({ data, onChange }: Props) {
  const set = (field: keyof ZahlungserinnerungSachverhalt, value: string) =>
    onChange({ ...data, [field]: value });

  return (
    <div>
      <div className="bg-blue-50 rounded-lg px-5 py-4 mb-6">
        <h4 className="font-semibold text-dark mb-1 text-sm">Hinweise & Tipps</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          Geben Sie das Datum an, bis zu dem die Zahlung erwartet wurde, den offenen Betrag
          und eine angemessene Frist zur Nachzahlung. Eine Frist von 7-14 Tagen ist üblich.
        </p>
      </div>

      <h3 className="text-2xl font-bold text-dark mb-2">Sachverhalt</h3>
      <p className="text-sm text-gray-500 mb-8">
        Geben Sie die relevanten Zahlungsdetails ein.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Zahlungseingang war erwartet bis zum:
          </label>
          <input
            type="date"
            value={data.zahlungErwartetBis}
            onChange={(e) => set('zahlungErwartetBis', e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Offener Betrag *
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={data.offenerBetrag}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.,]/g, '');
                set('offenerBetrag', val);
              }}
              className={inputCls}
              placeholder="0,00"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">
              &euro;
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Bitte überweisen Sie den Betrag bis: *
          </label>
          <input
            type="date"
            value={data.zahlungsfrist}
            onChange={(e) => set('zahlungsfrist', e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
    </div>
  );
}

export function isZahlungSachverhaltValid(d: ZahlungserinnerungSachverhalt): boolean {
  return !!(d.offenerBetrag.trim() && d.zahlungsfrist);
}
