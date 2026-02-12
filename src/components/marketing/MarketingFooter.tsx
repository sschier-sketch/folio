import { RefLink } from '../common/RefLink';

const LEGAL_LINKS = [
  { label: 'Impressum', path: '/impressum' },
  { label: 'AGB', path: '/agb' },
  { label: 'Datenschutz', path: '/datenschutz' },
  { label: 'AVV', path: '/avv' },
];

export default function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-100 bg-white mt-auto">
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <RefLink
                key={link.path}
                to={link.path}
                className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                {link.label}
              </RefLink>
            ))}
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-400">
              Moderne Immobilienverwaltung
            </p>
            <p className="text-xs text-gray-300 mt-1">
              &copy; {currentYear} rentably. Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
