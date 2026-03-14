import { useLanguage } from "../contexts/LanguageContext";

const LEGAL_LINKS = [
  { labelDe: 'Impressum', labelEn: 'Imprint', path: '/impressum' },
  { labelDe: 'AGB', labelEn: 'Terms & Conditions', path: '/agb' },
  { labelDe: 'Datenschutz', labelEn: 'Privacy Policy', path: '/datenschutz' },
  { labelDe: 'AVV', labelEn: 'DPA', path: '/avv' },
];

export default function Footer() {
  const { language } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
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
      </div>
    </footer>
  );
}
