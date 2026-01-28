import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

interface ProfileCompletionCardProps {
  onStartWizard: () => void;
}

export default function ProfileCompletionCard({ onStartWizard }: ProfileCompletionCardProps) {
  const [completionData, setCompletionData] = useState<{
    isComplete: boolean;
    completedSteps: number;
    totalSteps: number;
  } | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkProfileCompletion();
  }, []);

  const checkProfileCompletion = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("account_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) {
        setCompletionData({ isComplete: false, completedSteps: 0, totalSteps: 2 });
        setLoading(false);
        return;
      }

      const now = new Date();
      if (profile.reminder_dismissed_until && new Date(profile.reminder_dismissed_until) > now) {
        setIsDismissed(true);
        setLoading(false);
        return;
      }

      const step1Complete = !!(
        profile.first_name &&
        profile.last_name &&
        profile.address_street &&
        profile.address_zip &&
        profile.address_city &&
        profile.address_country
      );

      const step2Complete = !!(
        profile.document_sender_name &&
        profile.document_signature
      );

      const completedSteps = (step1Complete ? 1 : 0) + (step2Complete ? 1 : 0);
      const isComplete = step1Complete && step2Complete;

      setCompletionData({
        isComplete,
        completedSteps,
        totalSteps: 2,
      });
    } catch (error) {
      console.error("Error checking profile completion:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissReminder = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dismissUntil = new Date();
      dismissUntil.setDate(dismissUntil.getDate() + 7);

      const { data: existingProfile } = await supabase
        .from("account_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingProfile) {
        await supabase
          .from("account_profiles")
          .update({ reminder_dismissed_until: dismissUntil.toISOString() })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("account_profiles")
          .insert({ user_id: user.id, reminder_dismissed_until: dismissUntil.toISOString() });
      }

      setIsDismissed(true);
    } catch (error) {
      console.error("Error dismissing reminder:", error);
    }
  };

  if (loading || !completionData || completionData.isComplete || isDismissed) {
    return null;
  }

  const progress = (completionData.completedSteps / completionData.totalSteps) * 100;

  return (
    <div style={{ backgroundColor: '#EEF4FF' }} className="border border-blue-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EEF4FF', border: '1px solid #DDE7FF' }}>
            <AlertCircle className="w-5 h-5" style={{ color: '#1E1E24' }} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Profil vervollständigen</h3>
            <p className="text-sm text-gray-600">
              Für Abrechnungen, Schreiben und PDF-Exporte benötigen wir noch ein paar Angaben.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismissReminder}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="7 Tage nicht mehr anzeigen"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {completionData.completedSteps} von {completionData.totalSteps} erledigt
          </span>
          <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onStartWizard}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Jetzt ergänzen
        </button>
        <button
          onClick={handleDismissReminder}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
        >
          Später erinnern
        </button>
      </div>
    </div>
  );
}
