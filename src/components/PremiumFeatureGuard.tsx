import { ReactNode } from "react";
import { Lock, Sparkles, Zap } from "lucide-react";
import { useSubscription } from "../hooks/useSubscription";
import { useNavigate } from "react-router-dom";
interface PremiumFeatureGuardProps {
  children: ReactNode;
  featureName: string;
  inline?: boolean;
}
export function PremiumFeatureGuard({
  children,
  featureName,
  inline = false,
}: PremiumFeatureGuardProps) {
  const { isPro, loading } = useSubscription();
  const navigate = useNavigate();
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        {" "}
        <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />{" "}
      </div>
    );
  }
  if (isPro) {
    return <>{children}</>;
  }
  if (inline) {
    return (
      <div className="relative group cursor-not-allowed">
        {" "}
        <div className="opacity-50 pointer-events-none blur-sm">
          {" "}
          {children}{" "}
        </div>{" "}
        <div className="absolute inset-0 flex items-center justify-center">
          {" "}
          <div className="bg-white/95 backdrop-blur border-2 border-amber-400 rounded p-4 transform group-transition-all">
            {" "}
            <div className="flex items-center gap-2 mb-2">
              {" "}
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center">
                {" "}
                <Lock className="w-4 h-4 text-white" />{" "}
              </div>{" "}
              <span className="font-bold text-dark">Pro Feature</span>{" "}
            </div>{" "}
            <p className="text-sm text-gray-400 mb-3">{featureName}</p>{" "}
            <button
              onClick={() => navigate("/subscription")}
              className="w-full px-4 py-2 bg-gradient-to-r from-primary-blue to-primary-blue text-white text-sm font-semibold rounded-full hover:from-primary-blue hover:to-primary-blue transition-all flex items-center justify-center gap-2"
            >
              {" "}
              <Sparkles className="w-4 h-4" /> Jetzt upgraden{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
      </div>
    );
  }
  return (
    <div className="bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-blue-200 rounded-lg p-8 text-center">
      {" "}
      <div className="inline-flex w-16 h-16 bg-gradient-to-br from-primary-blue to-primary-blue rounded-full items-center justify-center mb-4">
        {" "}
        <Lock className="w-8 h-8 text-white" />{" "}
      </div>{" "}
      <h3 className="text-2xl font-bold text-dark mb-2">{featureName}</h3>{" "}
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        {" "}
        Diese Funktion ist nur im Pro-Plan verfügbar. Upgraden Sie jetzt für
        nur 9 EUR/Monat und erhalten Sie Zugriff auf alle erweiterten
        Features.{" "}
      </p>{" "}
      <div className="bg-white rounded p-6 mb-6 max-w-md mx-auto">
        {" "}
        <h4 className="font-semibold text-dark mb-4 flex items-center justify-center gap-2">
          {" "}
          <Sparkles className="w-5 h-5 text-amber-500" /> Pro-Features{" "}
        </h4>{" "}
        <ul className="text-left space-y-2 text-sm text-gray-400">
          {" "}
          <li className="flex items-center gap-2">
            {" "}
            <Zap className="w-4 h-4 text-primary-blue flex-shrink-0" />{" "}
            Ticketsystem für Mieter-Kommunikation{" "}
          </li>{" "}
          <li className="flex items-center gap-2">
            {" "}
            <Zap className="w-4 h-4 text-primary-blue flex-shrink-0" />{" "}
            Automatische Mieterhöhungs-Erinnerungen{" "}
          </li>{" "}
          <li className="flex items-center gap-2">
            {" "}
            <Zap className="w-4 h-4 text-primary-blue flex-shrink-0" />{" "}
            Erweiterte Renditeberechnung{" "}
          </li>{" "}
          <li className="flex items-center gap-2">
            {" "}
            <Zap className="w-4 h-4 text-primary-blue flex-shrink-0" />{" "}
            Detaillierte Finanzanalysen{" "}
          </li>{" "}
        </ul>{" "}
      </div>{" "}
      <button
        onClick={() => navigate("/subscription")}
        className="px-8 py-3 bg-gradient-to-r from-primary-blue to-primary-blue text-white font-semibold rounded-full hover:from-primary-blue hover:to-primary-blue transition-all hover:inline-flex items-center gap-2"
      >
        {" "}
        <Sparkles className="w-5 h-5" /> Jetzt für 9 EUR/Monat upgraden{" "}
      </button>{" "}
    </div>
  );
}
