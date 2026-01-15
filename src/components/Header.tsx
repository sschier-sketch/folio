import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-divider z-50">
      <nav className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center group">
            <img
              src="/rentably-logo.svg"
              alt="Rentably"
              className="h-8 w-auto transition-transform"
            />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className={`text-sm font-normal transition-all ${
                isActive("/")
                  ? "text-primary-500"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Home
            </Link>
            <Link
              to="/contact"
              className={`text-sm font-normal transition-all ${
                isActive("/contact")
                  ? "text-primary-500"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Kontakt
            </Link>
            <Link
              to="/impressum"
              className={`text-sm font-normal transition-all ${
                isActive("/impressum")
                  ? "text-primary-500"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Impressum
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-normal text-text-secondary hover:text-text-primary transition-all rounded-lg hover:bg-bg-subtle"
            >
              Anmelden
            </Link>
            <Link
              to="/signup"
              className="btn-primary"
            >
              Kostenlos starten
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-text-secondary hover:text-text-primary transition-all rounded-lg hover:bg-bg-subtle"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" strokeWidth={1.75} />
            ) : (
              <Menu className="w-5 h-5" strokeWidth={1.75} />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-divider animate-fade-in">
            <div className="flex flex-col gap-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-lg text-sm font-normal transition-all ${
                  isActive("/")
                    ? "bg-primary-100/30 text-primary-500"
                    : "text-text-secondary hover:bg-bg-subtle hover:text-text-primary"
                }`}
              >
                Home
              </Link>
              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-lg text-sm font-normal transition-all ${
                  isActive("/contact")
                    ? "bg-primary-100/30 text-primary-500"
                    : "text-text-secondary hover:bg-bg-subtle hover:text-text-primary"
                }`}
              >
                Kontakt
              </Link>
              <Link
                to="/impressum"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-lg text-sm font-normal transition-all ${
                  isActive("/impressum")
                    ? "bg-primary-100/30 text-primary-500"
                    : "text-text-secondary hover:bg-bg-subtle hover:text-text-primary"
                }`}
              >
                Impressum
              </Link>

              <div className="border-t border-divider my-2" />

              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-normal text-text-secondary hover:bg-bg-subtle hover:text-text-primary transition-all"
              >
                Anmelden
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary mx-4"
              >
                Kostenlos starten
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
