import { RefLink } from '../common/RefLink';

const FUNKTIONEN_LINKS = [
  { label: 'Nebenkosten', path: '/funktionen/buchhaltung' },
  { label: 'Mieterportal', path: '/funktionen/kommunikation' },
  { label: 'Mietverwaltung', path: '/funktionen/mietverwaltung' },
  { label: 'Immobilienmanagement', path: '/funktionen/immobilienmanagement' },
  { label: 'Mieterkommunikation', path: '/funktionen/kommunikation' },
  { label: 'Buchhaltung', path: '/funktionen/buchhaltung' },
  { label: 'Dokumente', path: '/funktionen/dokumente' },
  { label: 'Übergabeprotokoll', path: '/funktionen/uebergabeprotokoll' },
];

const UNTERNEHMEN_LINKS = [
  { label: 'Über uns', path: '/ueber-uns' },
  { label: 'Blog', path: '/magazin' },
  { label: 'Kontakt', path: '/kontakt' },
];

const LEGAL_LINKS = [
  { label: 'Impressum', path: '/impressum' },
  { label: 'AGB', path: '/agb' },
  { label: 'Datenschutz', path: '/datenschutz' },
  { label: 'AVV', path: '/avv' },
];

export default function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 mt-auto">
      <div className="max-w-[1200px] mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10 md:gap-8">

          <div className="col-span-2 md:col-span-4">
            <RefLink to="/" className="inline-block mb-4">
              <img
                src="/rentably-logo.svg"
                alt="rentably"
                className="h-7 w-auto brightness-0 invert"
              />
            </RefLink>
            <p className="text-sm text-gray-400 leading-relaxed max-w-[280px] mb-6">
              Die moderne Software f&uuml;r private Vermieter. Immobilien einfach, sicher und effizient verwalten.
            </p>
            <div className="flex items-center gap-4">
              <img
                src="/dsvgo.png"
                alt="DSGVO-konform"
                className="h-12 w-auto object-contain rounded"
              />
              <img
                src="/entwickelt-in-deutschland.png"
                alt="Entwickelt in Deutschland"
                className="h-12 w-auto object-contain rounded"
              />
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-gray-400 mb-4">
              Ressourcen
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Startseite', path: '/' },
                { label: 'Funktionen', path: '/funktionen' },
                { label: 'Preise', path: '/preise' },
              ].map((item) => (
                <li key={item.label}>
                  <RefLink
                    to={item.path}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </RefLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1 md:col-span-3">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-gray-400 mb-4">
              Funktionen
            </h4>
            <ul className="space-y-2.5">
              {FUNKTIONEN_LINKS.map((item, i) => (
                <li key={`${item.label}-${i}`}>
                  <RefLink
                    to={item.path}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </RefLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1 md:col-span-3">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-gray-400 mb-4">
              Unternehmen
            </h4>
            <ul className="space-y-2.5">
              {UNTERNEHMEN_LINKS.map((item) => (
                <li key={item.path}>
                  <RefLink
                    to={item.path}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </RefLink>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <h4 className="text-xs font-semibold tracking-wider uppercase text-gray-400 mb-4">
                Konto
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <RefLink
                    to="/login"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Anmelden
                  </RefLink>
                </li>
                <li>
                  <RefLink
                    to="/signup"
                    className="inline-flex items-center justify-center h-9 px-5 rounded-lg text-sm font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors mt-1"
                  >
                    Kostenlos testen
                  </RefLink>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <RefLink
                key={link.path}
                to={link.path}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                {link.label}
              </RefLink>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            &copy; {currentYear} rentably. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  );
}
