import { Lock, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PremiumUpgradePromptProps {
  title: string;
  description: string;
  features: string[];
}

export function PremiumUpgradePrompt({
  title,
  description,
  features,
}: PremiumUpgradePromptProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-blue-200 rounded-lg p-8 text-center">
      <div className="inline-flex w-16 h-16 bg-gradient-to-br from-primary-blue to-primary-blue rounded-full items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-dark mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>

      <div className="bg-white rounded-lg p-6 mb-6 max-w-md mx-auto shadow-sm">
        <h4 className="font-semibold text-dark mb-4 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Das erwartet Sie im Pro-Plan
        </h4>
        <ul className="text-left space-y-3 text-sm text-gray-700">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Zap className="w-4 h-4 text-primary-blue flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => navigate("/subscription")}
        className="px-8 py-3 bg-gradient-to-r from-primary-blue to-primary-blue text-white font-semibold rounded-full hover:shadow-lg transition-all inline-flex items-center gap-2"
      >
        <Sparkles className="w-5 h-5" />
        Jetzt für 9 EUR/Monat upgraden
      </button>
    </div>
  );
}
