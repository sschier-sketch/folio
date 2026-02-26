import { useEffect } from 'react';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { RefLink } from '../components/common/RefLink';

export default function NotFound() {
  useEffect(() => {
    document.title = 'Seite nicht gefunden – rentably';
    const meta = document.querySelector('meta[name="robots"]');
    if (meta) {
      meta.setAttribute('content', 'noindex, nofollow');
    } else {
      const newMeta = document.createElement('meta');
      newMeta.name = 'robots';
      newMeta.content = 'noindex, nofollow';
      document.head.appendChild(newMeta);
    }
  }, []);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-24">
      <div className="max-w-lg w-full text-center">
        <div className="relative mb-8">
          <div className="text-[160px] sm:text-[200px] font-bold text-gray-100 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-[#3c8af7]/10 border border-[#3c8af7]/20 flex items-center justify-center">
              <Search className="w-10 h-10 text-[#3c8af7]" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Seite nicht gefunden
        </h1>
        <p className="text-base sm:text-lg text-gray-500 leading-relaxed mb-10 max-w-md mx-auto">
          Die angeforderte Seite existiert nicht oder wurde verschoben.
          Bitte überprüfen Sie die URL oder kehren Sie zur Startseite zurück.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <RefLink
            to="/"
            className="inline-flex items-center justify-center gap-2 h-[42px] px-6 rounded-xl text-sm font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] active:bg-[#2d6bc8] transition-all duration-150"
          >
            <Home className="w-4 h-4" />
            Zur Startseite
          </RefLink>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 h-[42px] px-6 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-all duration-150"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </button>
        </div>
      </div>
    </div>
  );
}
