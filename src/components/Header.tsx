import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Mail, FileText, LogIn, UserPlus } from 'lucide-react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center group">
            <img
              src="/rentably-logo.svg"
              alt="Rentab.ly"
              className="h-10 w-auto transform group-hover:scale-105 transition-transform"
            />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'text-primary-blue'
                  : 'text-gray-400 hover:text-dark'
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link
              to="/contact"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive('/contact')
                  ? 'text-primary-blue'
                  : 'text-gray-400 hover:text-dark'
              }`}
            >
              <Mail className="w-4 h-4" />
              Kontakt
            </Link>
            <Link
              to="/impressum"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive('/impressum')
                  ? 'text-primary-blue'
                  : 'text-gray-400 hover:text-dark'
              }`}
            >
              <FileText className="w-4 h-4" />
              Impressum
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 hover:text-dark transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Anmelden
            </Link>
            <Link
              to="/signup"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-blue to-primary-blue text-white text-sm font-medium rounded-lg hover:from-primary-blue hover:to-primary-blue transition-all shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <UserPlus className="w-4 h-4" />
              Kostenlos starten
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-dark transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-fade-in">
            <div className="flex flex-col gap-3">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-primary-blue/5 text-primary-blue'
                    : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                <Home className="w-4 h-4" />
                Home
              </Link>
              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/contact')
                    ? 'bg-primary-blue/5 text-primary-blue'
                    : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                <Mail className="w-4 h-4" />
                Kontakt
              </Link>
              <Link
                to="/impressum"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/impressum')
                    ? 'bg-primary-blue/5 text-primary-blue'
                    : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                Impressum
              </Link>
              <div className="border-t border-gray-100 my-2"></div>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-50 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Anmelden
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-blue to-primary-blue text-white text-sm font-medium rounded-lg hover:from-primary-blue hover:to-primary-blue transition-all shadow-md"
              >
                <UserPlus className="w-4 h-4" />
                Kostenlos starten
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
