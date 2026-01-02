import { Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
export default function Footer() {
  const { language, setLanguage, t } = useLanguage();
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-white border-t mt-auto">
      {" "}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {" "}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {" "}
          <div>
            {" "}
            <div className="flex items-center mb-4">
              {" "}
              <img
                src="/rentably-logo.svg"
                alt="Rentab.ly"
                className="h-6 w-auto"
              />{" "}
            </div>{" "}
            <p className="text-sm text-gray-400">
              {" "}
              {language === "de"
                ? "Moderne Immobilienverwaltung für Vermieter"
                : "Modern property management for landlords"}{" "}
            </p>{" "}
          </div>{" "}
          <div>
            {" "}
            <h3 className="font-semibold text-dark mb-3">
              {t("footer.product")}
            </h3>{" "}
            <ul className="space-y-2">
              {" "}
              <li>
                {" "}
                <Link
                  to="/features"
                  className="text-sm text-gray-400 hover:text-primary-blue transition-colors"
                >
                  {" "}
                  {t("footer.features")}{" "}
                </Link>{" "}
              </li>{" "}
              <li>
                {" "}
                <Link
                  to="/pricing"
                  className="text-sm text-gray-400 hover:text-primary-blue transition-colors"
                >
                  {" "}
                  {t("footer.pricing")}{" "}
                </Link>{" "}
              </li>{" "}
              <li>
                {" "}
                <Link
                  to="/support"
                  className="text-sm text-gray-400 hover:text-primary-blue transition-colors"
                >
                  {" "}
                  {t("footer.support")}{" "}
                </Link>{" "}
              </li>{" "}
            </ul>{" "}
          </div>{" "}
          <div>
            {" "}
            <h3 className="font-semibold text-dark mb-3">
              {t("footer.company")}
            </h3>{" "}
            <ul className="space-y-2">
              {" "}
              <li>
                {" "}
                <Link
                  to="/impressum"
                  className="text-sm text-gray-400 hover:text-primary-blue transition-colors"
                >
                  {" "}
                  {t("footer.about")}{" "}
                </Link>{" "}
              </li>{" "}
              <li>
                {" "}
                <Link
                  to="/contact"
                  className="text-sm text-gray-400 hover:text-primary-blue transition-colors"
                >
                  {" "}
                  {t("footer.contact")}{" "}
                </Link>{" "}
              </li>{" "}
            </ul>{" "}
          </div>{" "}
          <div>
            {" "}
            <h3 className="font-semibold text-dark mb-3">
              {t("footer.other_products")}
            </h3>{" "}
            <ul className="space-y-2">
              {" "}
              <li>
                {" "}
                <a
                  href="https://kmu-suite.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-primary-blue transition-colors block"
                >
                  {" "}
                  <div className="font-medium">
                    {t("footer.kmu_suite")}
                  </div>{" "}
                  <div className="text-xs text-gray-300">
                    {t("footer.kmu_description")}
                  </div>{" "}
                </a>{" "}
              </li>{" "}
            </ul>{" "}
          </div>{" "}
        </div>{" "}
        <div className="border-t pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          {" "}
          <div className="text-sm text-gray-400">
            {" "}
            © {currentYear} Rentab.ly. {t("footer.rights")}.{" "}
          </div>{" "}
          <div className="flex items-center gap-3">
            {" "}
            <span className="text-sm font-medium text-gray-400 flex items-center gap-2">
              {" "}
              <Globe className="w-4 h-4" /> {t("footer.language")}:{" "}
            </span>{" "}
            <div className="flex gap-2">
              {" "}
              <button
                onClick={() => setLanguage("de")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${language === "de" ? "bg-primary-blue text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
              >
                {" "}
                Deutsch{" "}
              </button>{" "}
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${language === "en" ? "bg-primary-blue text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
              >
                {" "}
                English{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </footer>
  );
}
