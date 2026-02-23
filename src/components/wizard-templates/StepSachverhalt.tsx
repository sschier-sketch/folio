import { Button } from '../ui/Button';
import type { KuendigungSachverhalt, AppointmentSlot } from './types';

interface Props {
  data: KuendigungSachverhalt;
  onChange: (d: KuendigungSachverhalt) => void;
}

const inputCls =
  'w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue';

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function StepSachverhalt({ data, onChange }: Props) {
  const set = (field: keyof Omit<KuendigungSachverhalt, 'appointments'>, value: string) =>
    onChange({ ...data, [field]: value });

  function updateAppointment(id: string, partial: Partial<AppointmentSlot>) {
    onChange({
      ...data,
      appointments: data.appointments.map((a) => (a.id === id ? { ...a, ...partial } : a)),
    });
  }

  function addAppointment() {
    onChange({
      ...data,
      appointments: [
        ...data.appointments,
        { id: uid(), date: '', timeFrom: '10:00', timeTo: '12:00' },
      ],
    });
  }

  function removeAppointment(id: string) {
    if (data.appointments.length <= 1) return;
    const filtered = data.appointments.filter((a) => a.id !== id);
    onChange({ ...data, appointments: filtered });
  }

  return (
    <div>
      <div className="bg-blue-50 rounded-lg px-5 py-4 mb-6">
        <h4 className="font-semibold text-dark mb-1 text-sm">Hinweise & Tipps</h4>
        <ul className="text-sm text-gray-600 leading-relaxed space-y-1.5 list-disc list-inside">
          <li>
            Geben Sie mindestens einen Abnahmetermin-Vorschlag an. Sie können mehrere Termine
            zur Auswahl anbieten.
          </li>
          <li>
            Das Kündigungsdatum ist das Datum, zu dem das Mietverhältnis endet.
          </li>
        </ul>
      </div>

      <h3 className="text-2xl font-bold text-dark mb-2">Sachverhalt</h3>
      <p className="text-sm text-gray-500 mb-8">
        Geben Sie die relevanten Daten zur Kündigung und zum Abnahmetermin ein.
      </p>

      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Versanddatum *
            </label>
            <input
              type="date"
              value={data.versanddatum}
              onChange={(e) => set('versanddatum', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Eingangsdatum *
            </label>
            <input
              type="date"
              value={data.eingangsdatum}
              onChange={(e) => set('eingangsdatum', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Kündigung zum *
            </label>
            <input
              type="date"
              value={data.kuendigungsdatum}
              onChange={(e) => set('kuendigungsdatum', e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h4 className="font-semibold text-dark mb-4">Vorschlag Abnahmetermin</h4>

          {data.appointments.map((apt, idx) => (
            <div key={apt.id} className="flex items-end gap-3 mb-3">
              <div className="flex-1">
                {idx === 0 && (
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Datum *
                  </label>
                )}
                <input
                  type="date"
                  value={apt.date}
                  onChange={(e) => updateAppointment(apt.id, { date: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="w-28">
                {idx === 0 && (
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Von *
                  </label>
                )}
                <input
                  type="time"
                  value={apt.timeFrom}
                  onChange={(e) => updateAppointment(apt.id, { timeFrom: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="w-28">
                {idx === 0 && (
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Bis *
                  </label>
                )}
                <input
                  type="time"
                  value={apt.timeTo}
                  onChange={(e) => updateAppointment(apt.id, { timeTo: e.target.value })}
                  className={inputCls}
                />
              </div>
              {data.appointments.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAppointment(apt.id)}
                  className="pb-3 text-sm text-red-500 hover:text-red-700 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Entfernen
                </button>
              )}
            </div>
          ))}

          <div className="mt-3">
            <Button onClick={addAppointment} variant="dashed" fullWidth>
              Neuen Terminvorschlag hinzufügen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function isSachverhaltValid(d: KuendigungSachverhalt): boolean {
  if (!d.versanddatum || !d.eingangsdatum || !d.kuendigungsdatum) return false;
  if (d.appointments.length === 0) return false;
  return d.appointments.every((a) => a.date && a.timeFrom && a.timeTo);
}
