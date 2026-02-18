import { Link } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import SeoHead from "../components/SeoHead";
import CmsPageWrapper from "../components/CmsPageWrapper";

export default function Impressum() {
  const { language } = useLanguage();
  const de = language === "de";

  return (
    <>
      <SeoHead />
      <div>
        <section className="pt-24 pb-16 sm:pt-32 sm:pb-20 px-6">
          <div className="max-w-[800px] mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3c8af7]/5 border border-[#3c8af7]/15 mb-6">
              <FileText className="w-3.5 h-3.5 text-[#3c8af7]" />
              <span className="text-sm font-medium text-[#3c8af7]">
                {de ? "Rechtliches" : "Legal"}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
              {de ? "Impressum" : "Legal Notice"}
            </h1>
            <p className="mt-4 text-gray-500 text-lg">
              {de
                ? "Angaben gemäß § 5 TMG"
                : "Information according to § 5 TMG"}
            </p>
          </div>
        </section>

        <section className="pb-24 px-6">
          <div className="max-w-[800px] mx-auto">
            <CmsPageWrapper
              slug="impressum"
              fallback={<ImpressumFallbackContent language={language} />}
            />

            <div className="mt-16 pt-8 border-t border-gray-200">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#3c8af7] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {de ? "Zurück zur Startseite" : "Back to homepage"}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function ImpressumFallbackContent({ language }: { language: string }) {
  const de = language === "de";

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
          {de ? "Unternehmen" : "Company"}
        </h2>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-1">
          <p className="font-semibold text-gray-900 text-lg">sober care GmbH</p>
          <p className="text-gray-600">Pappelallee 78/79</p>
          <p className="text-gray-600">10437 Berlin</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
          {de ? "Kontakt" : "Contact"}
        </h2>
        <p className="text-gray-600 leading-relaxed">
          <span className="font-medium text-gray-900">E-Mail:</span>{" "}
          <a
            href="mailto:hallo@rentab.ly"
            className="text-[#3c8af7] hover:text-[#3579de] transition-colors"
          >
            hallo@rentab.ly
          </a>
        </p>
      </div>

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
          {de ? "Rechtliche Angaben" : "Legal Information"}
        </h2>
        <div className="space-y-3 text-gray-600 leading-relaxed">
          <p>
            <span className="font-medium text-gray-900">
              {de ? "Geschäftsführer:" : "Managing Directors:"}
            </span>{" "}
            Simon Schier, Philipp Roth
          </p>
          <p>
            <span className="font-medium text-gray-900">
              {de ? "Sitz der Gesellschaft:" : "Registered Office:"}
            </span>{" "}
            Berlin
          </p>
          <p>
            <span className="font-medium text-gray-900">
              {de ? "Registereintrag:" : "Register Entry:"}
            </span>{" "}
            Amtsgericht Berlin, HRB 186868 B
          </p>
          <p>
            <span className="font-medium text-gray-900">
              {de ? "Umsatzsteuer-Identifikationsnummer:" : "VAT Identification Number:"}
            </span>{" "}
            DE 815698820
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
          {de
            ? "Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:"
            : "Responsible for content according to § 55 Abs. 2 RStV:"}
        </h2>
        <div className="text-gray-600 leading-relaxed">
          <p>Simon Schier, Philipp Roth</p>
          <p>Pappelallee 78/79, 10437 Berlin</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
          {de ? "Haftungsausschluss" : "Disclaimer"}
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {de ? "Haftung für Inhalte" : "Liability for Content"}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {de
                ? "Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen."
                : "The content of our pages has been created with the utmost care. However, we cannot guarantee the accuracy, completeness and timeliness of the content."}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {de ? "Haftung für Links" : "Liability for Links"}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {de
                ? "Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich."
                : "Our website contains links to external websites of third parties, on whose contents we have no influence. Therefore, we cannot assume any liability for these external contents."}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {de ? "Urheberrecht" : "Copyright"}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {de
                ? "Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers."
                : "The content and works created by the site operators on these pages are subject to German copyright law. Duplication, processing, distribution and any kind of exploitation outside the limits of copyright require the written consent of the respective author or creator."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
