import { useState } from 'react';
import { Button } from '../ui/Button';
import type { TenantEntry } from './types';

interface Props {
  tenants: TenantEntry[];
  sending: boolean;
  sent: boolean;
  portalEnabled: boolean;
  onSend: (betreff: string, nachricht: string, sharePortal: boolean) => void;
}

const inputCls =
  'w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue';

export default function StepVersand({ tenants, sending, sent, portalEnabled, onSend }: Props) {
  const tenantNames = tenants
    .map((t) => `${t.firstName} ${t.lastName}`.trim())
    .filter(Boolean)
    .join(', ');
  const tenantEmails = tenants
    .map((t) => {
      const dbTenantHasEmail = (t as any).email;
      return dbTenantHasEmail || '';
    })
    .filter(Boolean);

  const [betreff, setBetreff] = useState('Kündigungsbestätigung');
  const [nachricht, setNachricht] = useState(
    `Sehr geehrte/r ${tenantNames},\n\nanbei erhalten Sie die Kündigungsbestätigung für Ihr Mietverhältnis.\n\nMit freundlichen Grüßen`,
  );
  const [sharePortal, setSharePortal] = useState(false);

  if (sent) {
    return (
      <div className="flex gap-8">
        <div className="flex-1 min-w-0">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-dark mb-2">Erfolgreich versendet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Die Kündigungsbestätigung wurde per E-Mail versendet und im Dokumentenbereich gespeichert.
              {sharePortal && portalEnabled && (
                <> Das Dokument wurde zusätzlich im Mieterportal bereitgestellt.</>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-8">
      <div className="flex-1 min-w-0">
        <h3 className="text-2xl font-bold text-dark mb-2">Digital versenden</h3>
        <p className="text-sm text-gray-500 mb-8">
          Versenden Sie die Kündigungsbestätigung per E-Mail. Das PDF wird automatisch als Anhang beigefügt.
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Empfänger
            </label>
            <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
              {tenantNames || 'Keine Empfänger ausgewählt'}
              {tenantEmails.length > 0 && (
                <span className="text-gray-400 ml-2">({tenantEmails.join(', ')})</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Betreff
            </label>
            <input
              type="text"
              value={betreff}
              onChange={(e) => setBetreff(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nachricht
            </label>
            <textarea
              value={nachricht}
              onChange={(e) => setNachricht(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
            />
          </div>

          <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
            Anhang: Kündigungsbestätigung.pdf (wird automatisch beigefügt)
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sharePortal}
              onChange={(e) => setSharePortal(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary-blue focus:ring-primary-blue"
            />
            <span className="text-sm text-gray-700">
              Zusätzlich im Mieterportal bereitstellen
            </span>
          </label>

          <Button
            onClick={() => onSend(betreff, nachricht, sharePortal)}
            disabled={sending || !betreff.trim()}
            variant="primary"
          >
            {sending ? 'Wird gesendet...' : 'Senden'}
          </Button>
        </div>
      </div>

      <div className="hidden lg:block w-72 flex-shrink-0">
        <div className="bg-blue-50 rounded-lg p-5 sticky top-4">
          <h4 className="font-semibold text-dark mb-2">Hinweise & Tipps</h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            Die E-Mail wird an die hinterlegte Adresse des Mieters gesendet.
            Wenn Sie die Option &bdquo;Im Mieterportal bereitstellen&ldquo; aktivieren,
            kann der Mieter das Dokument auch dort einsehen.
          </p>
        </div>
      </div>
    </div>
  );
}
