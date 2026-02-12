import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { RefLink } from '../common/RefLink';

const NAV_ITEMS = [
  { label: 'Über uns', path: '/ueber-uns' },
  { label: 'Funktionen', path: '/funktionen' },
  { label: 'Preise', path: '/preise' },
  { label: 'Kontakt', path: '/kontakt' },
];

export default function MarketingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-shadow duration-200 bg-white ${
        scrolled ? 'shadow-sm' : ''
      }`}
    >
      <nav className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <RefLink to="/" className="flex-shrink-0">
            <img
              src="/rentably-logo.svg"
              alt="Rentably"
              className="h-8 w-auto"
            />
          </RefLink>

          <div className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
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
              Registrierung
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
              {NAV_ITEMS.map((item) => (
                <RefLink
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-[#3c8af7] bg-blue-50/60'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </RefLink>
              ))}

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
                Registrierung
              </RefLink>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
