import { ReactNode } from 'react';
import { Lock, Sparkles, Zap } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

interface PremiumFeatureGuardProps {
  children: ReactNode;
  featureName: string;
  inline?: boolean;
}

export function PremiumFeatureGuard({ children, featureName, inline = false }: PremiumFeatureGuardProps) {
  const { hasPremium, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (hasPremium) {
    return <>{children}</>;
  }

  if (inline) {
    return (
      <div className="relative group cursor-not-allowed">
        <div className="opacity-50 pointer-events-none blur-sm">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur border-2 border-amber-400 rounded-xl p-4 shadow-xl transform group-hover:scale-105 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">Premium Feature</span>
            </div>
            <p className="text-sm text-slate-600 mb-3">{featureName}</p>
            <button
              onClick={() => navigate('/subscription')}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Jetzt upgraden
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-blue-200 rounded-2xl p-8 text-center">
      <div className="inline-flex w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-white" />
      </div>

      <h3 className="text-2xl font-bold text-slate-900 mb-2">{featureName}</h3>
      <p className="text-slate-600 mb-6 max-w-md mx-auto">
        Diese Funktion ist nur im Premium-Plan verfügbar. Upgraden Sie jetzt für nur 9 EUR/Monat und erhalten Sie Zugriff auf alle erweiterten Features.
      </p>

      <div className="bg-white rounded-xl p-6 mb-6 border border-slate-200 max-w-md mx-auto">
        <h4 className="font-semibold text-slate-900 mb-4 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Premium-Features
        </h4>
        <ul className="text-left space-y-2 text-sm text-slate-700">
          <li className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600 flex-shrink-0" />
            Ticketsystem für Mieter-Kommunikation
          </li>
          <li className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600 flex-shrink-0" />
            Automatische Mieterhöhungs-Erinnerungen
          </li>
          <li className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600 flex-shrink-0" />
            Erweiterte Renditeberechnung
          </li>
          <li className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600 flex-shrink-0" />
            Detaillierte Finanzanalysen
          </li>
        </ul>
      </div>

      <button
        onClick={() => navigate('/subscription')}
        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center gap-2"
      >
        <Sparkles className="w-5 h-5" />
        Jetzt für 9 EUR/Monat upgraden
      </button>
    </div>
  );
}
