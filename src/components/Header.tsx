import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { RefLink } from "./common/RefLink";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { language } = useLanguage();
  const isActive = (path: string) => location.pathname === path;
  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b z-50">
      {" "}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {" "}
        <div className="flex items-center justify-between h-16">
          {" "}
          <RefLink to="/" className="flex items-center group">
            {" "}
            <img
              src="/rentably-logo.svg"
              alt="Rentably"
              className="h-10 w-auto transition-transform"
            />{" "}
          </RefLink>{" "}
          <div className="hidden md:flex items-center gap-8">
            {" "}
            <RefLink
              to="/"
              className={`text-sm font-medium transition-colors ${isActive("/") ? "text-primary-blue" : "text-gray-400 hover:text-dark"}`}
            >
              {" "}
              Home{" "}
            </RefLink>{" "}
            <RefLink
              to={language === "de" ? "/magazin" : "/magazine"}
              className={`text-sm font-medium transition-colors ${isActive("/magazin") || isActive("/magazine") ? "text-primary-blue" : "text-gray-400 hover:text-dark"}`}
            >
              {" "}
              {language === "de" ? "Magazin" : "Magazine"}{" "}
            </RefLink>{" "}
            <RefLink
              to="/contact"
              className={`text-sm font-medium transition-colors ${isActive("/contact") ? "text-primary-blue" : "text-gray-400 hover:text-dark"}`}
            >
              {" "}
              Kontakt{" "}
            </RefLink>{" "}
            <RefLink
              to="/impressum"
              className={`text-sm font-medium transition-colors ${isActive("/impressum") ? "text-primary-blue" : "text-gray-400 hover:text-dark"}`}
            >
              {" "}
              Impressum{" "}
            </RefLink>{" "}
          </div>{" "}
          <div className="hidden md:flex items-center gap-3">
            {" "}
            <RefLink
              to="/login"
              className="px-6 py-2 text-sm font-medium text-gray-400 hover:text-dark transition-colors"
            >
              {" "}
              Anmelden{" "}
            </RefLink>{" "}
            <RefLink
              to="/signup"
              className="px-6 py-2 bg-dark text-white text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
            >
              {" "}
              Kostenlos starten{" "}
            </RefLink>{" "}
          </div>{" "}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-dark transition-colors"
          >
            {" "}
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}{" "}
          </button>{" "}
        </div>{" "}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t animate-fade-in">
            {" "}
            <div className="flex flex-col gap-3">
              {" "}
              <RefLink
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${isActive("/") ? "bg-primary-blue/5 text-primary-blue" : "text-gray-400 hover:bg-gray-50"}`}
              >
                {" "}
                Home{" "}
              </RefLink>{" "}
              <RefLink
                to={language === "de" ? "/magazin" : "/magazine"}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${isActive("/magazin") || isActive("/magazine") ? "bg-primary-blue/5 text-primary-blue" : "text-gray-400 hover:bg-gray-50"}`}
              >
                {" "}
                {language === "de" ? "Magazin" : "Magazine"}{" "}
              </RefLink>{" "}
              <RefLink
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${isActive("/contact") ? "bg-primary-blue/5 text-primary-blue" : "text-gray-400 hover:bg-gray-50"}`}
              >
                {" "}
                Kontakt{" "}
              </RefLink>{" "}
              <RefLink
                to="/impressum"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${isActive("/impressum") ? "bg-primary-blue/5 text-primary-blue" : "text-gray-400 hover:bg-gray-50"}`}
              >
                {" "}
                Impressum{" "}
              </RefLink>{" "}
              <div className="border-t my-2"></div>{" "}
              <RefLink
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded text-sm font-medium text-gray-400 hover:bg-gray-50 transition-colors"
              >
                {" "}
                Anmelden{" "}
              </RefLink>{" "}
              <RefLink
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 bg-dark text-white text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
              >
                {" "}
                Kostenlos starten{" "}
              </RefLink>{" "}
            </div>{" "}
          </div>
        )}{" "}
      </nav>{" "}
    </header>
  );
}
