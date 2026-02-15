import { RefLink } from "../common/RefLink";

interface Props {
  headline?: string;
  subline?: string;
  primaryLabel?: string;
  primaryTo?: string;
  secondaryLabel?: string;
  secondaryTo?: string;
}

export default function MagazineCta({
  headline = "Bereit, Ihre Immobilien digital zu verwalten?",
  subline = "Verwalten Sie Ihre Immobilien, Mieter, Finanzen und Dokumente an einem Ort. Einfach, sicher und effizient.",
  primaryLabel = "Kostenlos testen",
  primaryTo = "/registrieren",
  secondaryLabel = "Preise ansehen",
  secondaryTo = "/preise",
}: Props) {
  return (
    <section className="py-20 md:py-24">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="bg-gray-50 rounded-3xl px-8 py-16 md:px-16 md:py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 max-w-2xl mx-auto leading-tight">
            {headline}
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
            {subline}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <RefLink
              to={primaryTo}
              className="px-8 py-3.5 bg-[#3c8af7] text-white text-sm font-semibold rounded-lg hover:bg-[#2b7ae6] transition-colors"
            >
              {primaryLabel}
            </RefLink>
            <RefLink
              to={secondaryTo}
              className="px-8 py-3.5 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              {secondaryLabel}
            </RefLink>
          </div>
        </div>
      </div>
    </section>
  );
}
