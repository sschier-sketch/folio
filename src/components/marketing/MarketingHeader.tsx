import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  ClipboardCheck,
  Building2,
  MessageSquare,
  Receipt,
  FolderOpen,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { RefLink } from '../common/RefLink';

const PLAIN_NAV = [
  { label: 'Über uns', path: '/ueber-uns' },
  { label: 'Preise', path: '/preise' },
  { label: 'Magazin', path: '/magazin' },
  { label: 'Kontakt', path: '/kontakt' },
];

const FEATURE_LINKS = [
  {
    icon: Building2,
    title: 'Immobilienmanagement',
    subtitle: 'Portfolio im Überblick',
    path: '/funktionen/immobilienmanagement',
  },
  {
    icon: MessageSquare,
    title: 'Mieterkommunikation',
    subtitle: 'E-Mails & Vorlagen',
    path: '/funktionen/kommunikation',
  },
  {
    icon: Receipt,
    title: 'Buchhaltung',
    subtitle: 'Finanzen & Steuern',
    path: '/funktionen/buchhaltung',
  },
  {
    icon: FolderOpen,
    title: 'Dokumente',
    subtitle: 'Digitales Archiv',
    path: '/funktionen/dokumente',
  },
  {
    icon: ClipboardCheck,
    title: 'Übergabeprotokoll',
    subtitle: 'Wohnungsübergaben dokumentieren',
    path: '/funktionen/uebergabeprotokoll',
  },
];

const HIGHLIGHT_CARDS = [
  {
    title: 'Nebenkosten',
    subtitle: 'Rechtssichere Abrechnungen',
    path: '/funktionen/nebenkostenabrechnung',
    visual: 'billing',
  },
  {
    title: 'Mieterportal',
    subtitle: 'Self-Service für Mieter',
    path: '/funktionen/mieterportal',
    visual: 'portal',
  },
  {
    title: 'Mietverwaltung',
    subtitle: 'Mieter & Verträge verwalten',
    path: '/funktionen/mietverwaltung',
    visual: 'tenants',
  },
];

function HighlightCardVisual({ type }: { type: string }) {
  if (type === 'billing') {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="h-1.5 bg-gray-200 rounded-full w-16" />
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
        </div>
        <div className="space-y-1.5">
          <div className="h-1.5 bg-gray-200 rounded-full w-full" />
          <div className="h-1.5 bg-gray-200 rounded-full w-3/4" />
          <div className="h-1.5 bg-gray-200 rounded-full w-5/6" />
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <div className="h-1.5 bg-emerald-200 rounded-full w-10" />
          <div className="h-1.5 bg-emerald-200 rounded-full w-6" />
        </div>
      </div>
    );
  }
  if (type === 'portal') {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="h-1.5 bg-gray-200 rounded-full w-14" />
        <div className="space-y-1.5">
          <div className="h-1.5 bg-gray-200 rounded-full w-full" />
          <div className="h-1.5 bg-gray-200 rounded-full w-4/5" />
        </div>
        <div className="flex gap-2 mt-0.5">
          <div className="h-4 rounded-md bg-[#3c8af7]/15 flex-1" />
          <div className="h-4 rounded-md bg-amber-100 flex-1" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-[#3c8af7]/10 flex-shrink-0" />
        <div className="flex-1 space-y-1">
          <div className="h-1.5 bg-gray-200 rounded-full w-full" />
          <div className="h-1.5 bg-gray-100 rounded-full w-3/5" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-emerald-50 flex-shrink-0" />
        <div className="flex-1 space-y-1">
          <div className="h-1.5 bg-gray-200 rounded-full w-4/5" />
          <div className="h-1.5 bg-gray-100 rounded-full w-2/5" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-amber-50 flex-shrink-0" />
        <div className="flex-1 space-y-1">
          <div className="h-1.5 bg-gray-200 rounded-full w-full" />
          <div className="h-1.5 bg-gray-100 rounded-full w-1/2" />
        </div>
      </div>
    </div>
  );
}

export default function MarketingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubOpen, setMobileSubOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const location = useLocation();
  const megaTimeout = useRef<ReturnType<typeof setTimeout>>();
  const megaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSubOpen(false);
    setMegaOpen(false);
  }, [location.pathname]);

  const openMega = useCallback(() => {
    clearTimeout(megaTimeout.current);
    setMegaOpen(true);
  }, []);

  const closeMega = useCallback(() => {
    megaTimeout.current = setTimeout(() => setMegaOpen(false), 150);
  }, []);

  const isActive = (path: string) => location.pathname === path;
  const isFunktionenActive = location.pathname.startsWith('/funktionen');

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-shadow duration-200 bg-white ${
        scrolled ? 'shadow-sm' : ''
      }`}
    >
      <nav className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <RefLink to="/" className="flex-shrink-0 -ml-2">
            <img
              src="/rentably-logo.svg"
              alt="rentably"
              className="h-5 w-auto"
            />
          </RefLink>

          <div className="hidden md:flex items-center gap-8">
            <RefLink
              to="/ueber-uns"
              className={`text-sm font-medium transition-colors ${
                isActive('/ueber-uns')
                  ? 'text-[#3c8af7]'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Über uns
            </RefLink>

            <div
              ref={megaRef}
              className="relative"
              onMouseEnter={openMega}
              onMouseLeave={closeMega}
            >
              <RefLink
                to="/funktionen"
                className={`text-sm font-medium transition-colors inline-flex items-center gap-1 ${
                  isFunktionenActive
                    ? 'text-[#3c8af7]'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Funktionen
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    megaOpen ? 'rotate-180' : ''
                  }`}
                />
              </RefLink>

              <div
                className={`absolute top-full left-1/2 pt-3 transition-all duration-200 ${
                  megaOpen
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 -translate-y-1 pointer-events-none'
                }`}
                style={{ width: '720px', marginLeft: '-360px' }}
              >
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-900/[0.08] border border-gray-200/80 overflow-hidden">
                  <div className="grid grid-cols-[1fr_280px]">
                    <div className="p-6 border-r border-gray-100">
                      <p className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase mb-4">
                        Highlights
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {HIGHLIGHT_CARDS.map((card) => (
                          <RefLink
                            key={card.title}
                            to={card.path}
                            className="group block rounded-xl border border-gray-150 bg-gray-50/60 p-3.5 hover:border-gray-300 hover:shadow-sm transition-all"
                          >
                            <div className="bg-white rounded-lg border border-gray-100 p-3 mb-3 h-[88px] flex flex-col justify-center">
                              <HighlightCardVisual type={card.visual} />
                            </div>
                            <p className="text-[13px] font-semibold text-gray-900 mb-0.5">
                              {card.title}
                            </p>
                            <p className="text-[11px] text-gray-400 leading-snug">
                              {card.subtitle}
                            </p>
                          </RefLink>
                        ))}
                      </div>
                    </div>

                    <div className="p-6">
                      <p className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase mb-4">
                        Weitere Funktionen
                      </p>
                      <div className="space-y-0.5">
                        {FEATURE_LINKS.map((item) => (
                          <RefLink
                            key={item.path}
                            to={item.path}
                            className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 -mx-2.5 hover:bg-gray-50 transition-colors group"
                          >
                            <div className="w-9 h-9 rounded-full bg-gray-100 group-hover:bg-white group-hover:shadow-sm flex items-center justify-center flex-shrink-0 transition-all border border-transparent group-hover:border-gray-200">
                              <item.icon className="w-[18px] h-[18px] text-gray-500" strokeWidth={1.5} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-gray-900 leading-tight">
                                {item.title}
                              </p>
                              <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
                                {item.subtitle}
                              </p>
                            </div>
                          </RefLink>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 px-6 py-3 bg-gray-50/50 flex items-center justify-between">
                    <span className="text-[12px] text-gray-400">
                      Alle Funktionen auf einen Blick
                    </span>
                    <RefLink
                      to="/funktionen"
                      className="text-[12px] font-semibold text-[#3c8af7] hover:text-[#3579de] transition-colors inline-flex items-center gap-1"
                    >
                      Übersicht
                      <ChevronRight className="w-3 h-3" />
                    </RefLink>
                  </div>
                </div>
              </div>
            </div>

            {PLAIN_NAV.filter(i => i.path !== '/ueber-uns').map((item) => (
              <RefLink
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'text-[#3c8af7]'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {item.label}
              </RefLink>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-5">
            <RefLink
              to="/login"
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Anmelden
            </RefLink>
            <RefLink
              to="/signup"
              className="h-[38px] px-5 rounded-lg text-sm font-semibold inline-flex items-center justify-center bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors"
            >
              Kostenlos testen
            </RefLink>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="Menü"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100">
            <div className="flex flex-col pt-3 gap-1">
              <RefLink
                to="/ueber-uns"
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/ueber-uns')
                    ? 'text-[#3c8af7] bg-blue-50/60'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Über uns
              </RefLink>

              <button
                onClick={() => setMobileSubOpen(!mobileSubOpen)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between w-full text-left ${
                  isFunktionenActive
                    ? 'text-[#3c8af7] bg-blue-50/60'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Funktionen
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    mobileSubOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {mobileSubOpen && (
                <div className="ml-3 pl-3 border-l-2 border-gray-100 space-y-0.5">
                  <RefLink
                    to="/funktionen"
                    className="px-3 py-2 rounded-lg text-sm font-medium text-[#3c8af7] hover:bg-gray-50 block"
                  >
                    Alle Funktionen
                  </RefLink>
                  {FEATURE_LINKS.map((item) => (
                    <RefLink
                      key={item.path}
                      to={item.path}
                      className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 block"
                    >
                      {item.title}
                    </RefLink>
                  ))}
                </div>
              )}

              <RefLink
                to="/preise"
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/preise')
                    ? 'text-[#3c8af7] bg-blue-50/60'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Preise
              </RefLink>
              <RefLink
                to="/magazin"
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/magazin') || location.pathname.startsWith('/magazin')
                    ? 'text-[#3c8af7] bg-blue-50/60'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Magazin
              </RefLink>
              <RefLink
                to="/kontakt"
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/kontakt')
                    ? 'text-[#3c8af7] bg-blue-50/60'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Kontakt
              </RefLink>

              <div className="border-t border-gray-100 my-2" />

              <RefLink
                to="/login"
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Anmelden
              </RefLink>
              <RefLink
                to="/signup"
                className="mx-3 mt-1 h-[38px] px-5 rounded-lg text-sm font-semibold inline-flex items-center justify-center bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors"
              >
                Kostenlos testen
              </RefLink>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
