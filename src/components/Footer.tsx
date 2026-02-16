import { Globe } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

const LEGAL_LINKS = [
  { labelDe: 'Impressum', labelEn: 'Imprint', path: '/impressum' },
  { labelDe: 'AGB', labelEn: 'Terms & Conditions', path: '/agb' },
  { labelDe: 'Datenschutz', labelEn: 'Privacy Policy', path: '/datenschutz' },
  { labelDe: 'AVV', labelEn: 'DPA', path: '/avv' },
];

export default function Footer() {
  const { language, setLanguage } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <a
                key={link.path}
                href={link.path}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {language === 'de' ? link.labelDe : link.labelEn}
              </a>
            ))}
            <span className="text-xs text-gray-300">
              &copy; {currentYear} rentably
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-gray-400" />
            <button
              onClick={() => setLanguage("de")}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                language === "de"
                  ? "text-gray-900 font-medium bg-gray-100"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              DE
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                language === "en"
                  ? "text-gray-900 font-medium bg-gray-100"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
