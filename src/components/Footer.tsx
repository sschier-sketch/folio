import { Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function Footer() {
  const { language, setLanguage, t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo_1.svg" alt="Rentab.ly" className="h-6 w-auto" />
              <span className="text-xl font-bold text-slate-800">Rentab.ly</span>
            </div>
            <p className="text-sm text-slate-600">
              {language === 'de'
                ? 'Moderne Immobilienverwaltung für Vermieter'
                : 'Modern property management for landlords'}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-3">{t('footer.product')}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/features"
                  className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
                >
                  {t('footer.features')}
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
                >
                  {t('footer.pricing')}
                </Link>
              </li>
              <li>
                <Link
                  to="/support"
                  className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
                >
                  {t('footer.support')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-3">{t('footer.company')}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/impressum"
                  className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
                >
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
                >
                  {t('footer.contact')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-3">{t('footer.other_products')}</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://kmu-suite.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-600 hover:text-blue-600 transition-colors block"
                >
                  <div className="font-medium">{t('footer.kmu_suite')}</div>
                  <div className="text-xs text-slate-500">{t('footer.kmu_description')}</div>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-slate-600">
            © {currentYear} Rentab.ly. {t('footer.rights')}.
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {t('footer.language')}:
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage('de')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  language === 'de'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Deutsch
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
