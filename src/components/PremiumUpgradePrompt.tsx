import { useState, useEffect } from "react";
import { Lock, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

interface PremiumUpgradePromptProps {
  featureKey: string;
  title?: string;
  description?: string;
  features?: string[];
}

interface ProFeatureText {
  title: string;
  description: string;
  features: string[];
}

export function PremiumUpgradePrompt({
  featureKey,
  title: fallbackTitle,
  description: fallbackDescription,
  features: fallbackFeatures,
}: PremiumUpgradePromptProps) {
  const navigate = useNavigate();
  const [content, setContent] = useState<ProFeatureText>({
    title: fallbackTitle || "Pro Feature",
    description: fallbackDescription || "Dieses Feature ist nur im Pro-Plan verfügbar.",
    features: fallbackFeatures || [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatureText();
  }, [featureKey]);

  async function loadFeatureText() {
    try {
      const { data, error } = await supabase
        .from("pro_feature_texts")
        .select("title, description, features")
        .eq("feature_key", featureKey)
        .eq("is_active", true)
        .maybeSingle();

      if (!error && data) {
        setContent({
          title: data.title,
          description: data.description,
          features: data.features,
        });
      }
    } catch (error) {
      console.error("Error loading feature text:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="rounded-lg p-8 text-center" style={{ backgroundColor: '#eff4fe' }}>
      <div className="inline-flex w-16 h-16 bg-primary-blue rounded-full items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-dark mb-2">{content.title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{content.description}</p>

      <div className="bg-white rounded-lg p-6 mb-6 max-w-md mx-auto">
        <h4 className="font-semibold text-dark mb-4 text-center">
          Das erwartet Sie im Pro-Plan
        </h4>
        <ul className="text-left space-y-3 text-sm text-gray-700">
          {content.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Zap className="w-4 h-4 text-primary-blue flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => navigate("/dashboard?view=settings-billing")}
        className="px-8 py-3 bg-primary-blue text-white font-semibold rounded-full hover:shadow-lg transition-all"
      >
        Jetzt upgraden
      </button>
    </div>
  );
}
