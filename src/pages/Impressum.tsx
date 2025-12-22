import { Building2, Mail, Scale } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Footer from '../components/Footer';
import { Header } from '../components/Header';

export default function Impressum() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      <Header />
      <div className="flex-1 py-16 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              {language === 'de' ? 'Impressum' : 'Legal Notice'}
            </h1>
            <p className="text-lg text-slate-600">
              {language === 'de'
                ? 'Angaben gemäß § 5 TMG'
                : 'Information according to § 5 TMG'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {language === 'de' ? 'Unternehmen' : 'Company'}
                </h2>
              </div>
              <div className="pl-15 space-y-2 text-slate-700">
                <p className="font-semibold text-lg">sober care GmbH</p>
                <p>Pappelallee 78/79</p>
                <p>10437 Berlin</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {language === 'de' ? 'Kontakt' : 'Contact'}
                </h2>
              </div>
              <div className="pl-15 space-y-2 text-slate-700">
                <p>
                  <span className="font-medium">E-Mail:</span>{' '}
                  <a href="mailto:hallo@folio.io" className="text-blue-600 hover:text-blue-700">
                    hallo@folio.io
                  </a>
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Scale className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {language === 'de' ? 'Rechtliche Angaben' : 'Legal Information'}
                </h2>
              </div>
              <div className="pl-15 space-y-3 text-slate-700">
                <p>
                  <span className="font-medium">
                    {language === 'de' ? 'Geschäftsführer:' : 'Managing Directors:'}
                  </span>{' '}
                  Simon Schier, Philipp Roth
                </p>
                <p>
                  <span className="font-medium">
                    {language === 'de' ? 'Sitz der Gesellschaft:' : 'Registered Office:'}
                  </span>{' '}
                  Berlin
                </p>
                <p>
                  <span className="font-medium">
                    {language === 'de' ? 'Registereintrag:' : 'Register Entry:'}
                  </span>{' '}
                  Amtsgericht Berlin, HRB 186868 B
                </p>
                <p>
                  <span className="font-medium">
                    {language === 'de'
                      ? 'Umsatzsteuer-Identifikationsnummer:'
                      : 'VAT Identification Number:'}
                  </span>{' '}
                  DE 815698820
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                {language === 'de'
                  ? 'Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:'
                  : 'Responsible for content according to § 55 Abs. 2 RStV:'}
              </h3>
              <p className="text-slate-700">Simon Schier, Philipp Roth</p>
              <p className="text-slate-700 mt-1">Pappelallee 78/79, 10437 Berlin</p>
            </div>

            <div className="border-t border-slate-200 pt-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                {language === 'de' ? 'Haftungsausschluss' : 'Disclaimer'}
              </h3>
              <div className="space-y-4 text-sm text-slate-600">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">
                    {language === 'de' ? 'Haftung für Inhalte' : 'Liability for Content'}
                  </h4>
                  <p>
                    {language === 'de'
                      ? 'Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.'
                      : 'The content of our pages has been created with the utmost care. However, we cannot guarantee the accuracy, completeness and timeliness of the content.'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">
                    {language === 'de' ? 'Haftung für Links' : 'Liability for Links'}
                  </h4>
                  <p>
                    {language === 'de'
                      ? 'Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.'
                      : 'Our website contains links to external websites of third parties, on whose contents we have no influence. Therefore, we cannot assume any liability for these external contents.'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">
                    {language === 'de' ? 'Urheberrecht' : 'Copyright'}
                  </h4>
                  <p>
                    {language === 'de'
                      ? 'Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.'
                      : 'The content and works created by the site operators on these pages are subject to German copyright law. Duplication, processing, distribution and any kind of exploitation outside the limits of copyright require the written consent of the respective author or creator.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
