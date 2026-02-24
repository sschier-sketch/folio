import type { ZulassungData } from './types';

interface Props {
  data: ZulassungData;
  onChange: (d: ZulassungData) => void;
}

const ITEMS: { key: keyof ZulassungData; text: string }[] = [
  {
    key: 'checkbox1',
    text: 'Über die Räumung meiner/unserer bisherigen Wohnräume war/ist in den letzten 5 Jahren kein Räumungsrechtsstreit anhängig',
  },
  {
    key: 'checkbox2',
    text: 'Gegen mich/uns läuft kein Mietforderungsverfahren.',
  },
  {
    key: 'checkbox3',
    text: 'Gegen mich/uns läuft keine Lohn- bzw. Gehaltspfändung.',
  },
  {
    key: 'checkbox4',
    text: 'Ich/Wir habe/n weder eine eidesstattliche Versicherung abgegeben, noch ist ein solches Verfahren anhängig.',
  },
  {
    key: 'checkbox5',
    text: 'Über mein/unser Vermögen wurde in den letzten 5 Jahren kein Konkurs- oder Vergleichsverfahren bzw. Insolvenzverfahren eröffnet und die Eröffnung eines solchen Verfahrens wurde auch nicht mangels Masse abgewiesen. Solche Verfahren sind derzeit auch nicht anhängig.',
  },
  {
    key: 'checkbox6',
    text: 'Ich erkläre/Wir erklären, alle mietvertraglich zu übernehmenden Verpflichtungen leisten zu können, insbesondere die Zahlung von Kaution, Miete und Betriebskosten.',
  },
  {
    key: 'checkbox7',
    text: 'Ich versichere/Wir versichern mit meiner/unserer Unterschrift, alle Fragen vollständig und wahrheitsgemäß beantwortet zu haben. Falsche Angaben stellen einen Vertrauensbruch dar und berechtigen den Vermieter, den Mietvertrag anzufechten und gegebenenfalls sofort fristlos zu kündigen.',
  },
];

export default function StepZulassung({ data, onChange }: Props) {
  const toggle = (key: keyof ZulassungData) => {
    onChange({ ...data, [key]: !data[key] });
  };

  return (
    <div>
      <h3 className="text-2xl font-bold text-dark mb-2">Zulassung</h3>
      <p className="text-sm text-gray-500 mb-8">
        Wählen Sie die Erklärungen aus, die der Mietinteressent bestätigt.
      </p>

      <div className="mb-6">
        <p className="font-semibold text-gray-800 text-sm">Ich versichere:</p>
      </div>

      <div className="space-y-3">
        {ITEMS.map((item) => (
          <label
            key={item.key}
            className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
              data[item.key]
                ? 'border-primary-blue bg-blue-50'
                : 'border-gray-100 bg-gray-50 hover:border-gray-200'
            }`}
            onClick={() => toggle(item.key)}
          >
            <div className="flex-shrink-0 mt-0.5">
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  data[item.key]
                    ? 'bg-primary-blue border-primary-blue'
                    : 'bg-white border-gray-300'
                }`}
              >
                {data[item.key] && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-gray-700 leading-relaxed">{item.text}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
