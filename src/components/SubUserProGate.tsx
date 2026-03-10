import { Users, Lock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { usePermissions } from "../hooks/usePermissions";
import { Button } from "./ui/Button";

export function SubUserProGate({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const permissions = usePermissions();
  const navigate = useNavigate();
  const de = language === "de";
  const canUpgrade = permissions.canManageBilling;

  return (
    <div className="flex items-center justify-center py-16 px-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-amber-600" />
        </div>

        <h1 className="text-2xl font-bold text-dark mb-3">
          {de ? "Pro-Tarif erforderlich" : "Pro Plan Required"}
        </h1>

        <p className="text-gray-500 leading-relaxed mb-6">
          {de
            ? "Die Nutzung von Benutzeraccounts erfordert den Pro-Tarif. Der Inhaber des Hauptaccounts hat derzeit keinen aktiven Pro-Tarif oder Trial-Zeitraum."
            : "Using team member accounts requires the Pro plan. The main account owner does not currently have an active Pro plan or trial period."}
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 text-left">
            <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-dark">
                {de ? "Was können Sie tun?" : "What can you do?"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {canUpgrade
                  ? de
                    ? "Sie haben die Berechtigung, den Tarif upzugraden. Alternativ kontaktieren Sie den Inhaber des Hauptaccounts."
                    : "You have permission to upgrade the plan. Alternatively, contact the main account owner."
                  : de
                    ? "Bitte wenden Sie sich an den Inhaber des Hauptaccounts, damit dieser den Pro-Tarif aktiviert."
                    : "Please contact the main account owner to activate the Pro plan."}
              </p>
            </div>
          </div>
        </div>

        {canUpgrade && (
          <Button
            onClick={() => navigate("/dashboard?view=settings-billing")}
            variant="pro"
            fullWidth
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            {de ? "Jetzt upgraden" : "Upgrade Now"}
          </Button>
        )}
      </div>
    </div>
  );
}
