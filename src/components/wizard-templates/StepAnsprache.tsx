import type { GreetingData } from './types';

interface Props {
  data: GreetingData;
  onChange: (d: GreetingData) => void;
}

export default function StepAnsprache({ data, onChange }: Props) {
  return (
    <div>
      <div className="bg-blue-50 rounded-lg px-5 py-4 mb-6">
        <h4 className="font-semibold text-dark mb-1 text-sm">Hinweise & Tipps</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          Die formelle Anrede (z. B. &bdquo;Sehr geehrte/r ...&ldquo;) wird automatisch
          aus den Mieterdaten erzeugt. Die persönliche Begrüßung erscheint direkt darunter
          und kann einen freundlicheren Ton setzen.
        </p>
      </div>

      <h3 className="text-2xl font-bold text-dark mb-2">Ansprache</h3>
      <p className="text-sm text-gray-500 mb-8">
        Fügen Sie optional eine persönliche Begrüßung hinzu, die unterhalb der formellen Anrede erscheint.
      </p>

      <div className="mb-6">
        <p className="text-gray-700 mb-4 font-medium">
          Möchten Sie eine persönliche Begrüßung hinzufügen?
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => onChange({ ...data, hasPersonalGreeting: false })}
            className={`px-6 py-3 rounded-lg border-2 transition-colors text-sm font-medium ${
              !data.hasPersonalGreeting
                ? 'border-primary-blue bg-blue-50 text-primary-blue'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            Nein
          </button>
          <button
            onClick={() =>
              onChange({
                hasPersonalGreeting: true,
                greetingText: data.greetingText,
              })
            }
            className={`px-6 py-3 rounded-lg border-2 transition-colors text-sm font-medium ${
              data.hasPersonalGreeting
                ? 'border-primary-blue bg-blue-50 text-primary-blue'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            Ja
          </button>
        </div>
      </div>

      {data.hasPersonalGreeting && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Schreiben Sie Ihre Nachricht hier
          </label>
          <textarea
            value={data.greetingText}
            onChange={(e) => onChange({ ...data, greetingText: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
            placeholder="Ihre persönliche Begrüßung..."
          />
        </div>
      )}
    </div>
  );
}
