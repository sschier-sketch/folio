import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from '../ui/Button';

interface ProfileData {
  first_name: string;
  last_name: string;
  company_name: string;
  address_street: string;
  address_house_number: string;
  address_zip: string;
  address_city: string;
  address_country: string;
  phone: string;
  document_sender_name: string;
  document_signature: string;
}

export default function ProfileManagement() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    company_name: "",
    address_street: "",
    address_house_number: "",
    address_zip: "",
    address_city: "",
    address_country: "Deutschland",
    phone: "",
    document_sender_name: "",
    document_signature: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [completionStatus, setCompletionStatus] = useState({
    isComplete: false,
    completedSteps: 0,
    totalSteps: 2,
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  useEffect(() => {
    checkCompletion();
  }, [formData]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from("account_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        setFormData({
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          company_name: profile.company_name || "",
          address_street: profile.address_street || "",
          address_house_number: profile.address_house_number || "",
          address_zip: profile.address_zip || "",
          address_city: profile.address_city || "",
          address_country: profile.address_country || "Deutschland",
          phone: profile.phone || "",
          document_sender_name: profile.document_sender_name || "",
          document_signature: profile.document_signature || "",
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkCompletion = () => {
    const step1Complete = !!(
      formData.first_name &&
      formData.last_name &&
      formData.address_street &&
      formData.address_zip &&
      formData.address_city &&
      formData.address_country
    );

    const step2Complete = !!(
      formData.document_sender_name &&
      formData.document_signature
    );

    const completedSteps = (step1Complete ? 1 : 0) + (step2Complete ? 1 : 0);
    const isComplete = step1Complete && step2Complete;

    setCompletionStatus({
      isComplete,
      completedSteps,
      totalSteps: 2,
    });
  };

  const handleChange = (field: keyof ProfileData, value: string) => {
    if (field === "address_city") {
      if (value === "" || /^[a-zA-ZäöüÄÖÜß\s\-]+$/.test(value)) {
        setFormData((prev) => ({ ...prev, [field]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (!user) throw new Error("Nicht angemeldet");

      const { data: existingProfile } = await supabase
        .from("account_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const profileData = {
        user_id: user.id,
        ...formData,
      };

      if (existingProfile) {
        const { error } = await supabase
          .from("account_profiles")
          .update(profileData)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("account_profiles")
          .insert(profileData);

        if (error) throw error;
      }

      setMessage({ type: "success", text: "Profil erfolgreich gespeichert" });
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage({ type: "error", text: "Fehler beim Speichern des Profils" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const progress = (completionStatus.completedSteps / completionStatus.totalSteps) * 100;

  return (
    <div>
      {!completionStatus.isComplete && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-900 mb-1">Profil unvollständig</h4>
              <p className="text-sm text-amber-800 mb-3">
                Für die volle Nutzung aller Funktionen vervollständigen Sie bitte Ihr Profil.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-amber-200 rounded-full h-2">
                  <div
                    className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-amber-900">
                  {completionStatus.completedSteps} von {completionStatus.totalSteps}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Persönliche Daten</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vorname *
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleChange("first_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nachname *
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleChange("last_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Firma / Organisation
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => handleChange("company_name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Adresse</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Straße *
                </label>
                <input
                  type="text"
                  value={formData.address_street}
                  onChange={(e) => handleChange("address_street", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hausnummer
                </label>
                <input
                  type="text"
                  value={formData.address_house_number}
                  onChange={(e) => handleChange("address_house_number", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PLZ *</label>
                <input
                  type="text"
                  value={formData.address_zip}
                  onChange={(e) => handleChange("address_zip", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Ort *</label>
                <input
                  type="text"
                  value={formData.address_city}
                  onChange={(e) => handleChange("address_city", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Land *</label>
              <input
                type="text"
                value={formData.address_country}
                onChange={(e) => handleChange("address_country", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dokumente & Kommunikation</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Absendername für Dokumente *
              </label>
              <input
                type="text"
                value={formData.document_sender_name}
                onChange={(e) => handleChange("document_sender_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-sm text-gray-600 mt-1">
                Dieser Name erscheint als Absender auf Abrechnungen und Schreiben.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Signatur für Schreiben *
              </label>
              <textarea
                value={formData.document_signature}
                onChange={(e) => handleChange("document_signature", e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-sm text-gray-600 mt-1">
                Diese Signatur wird am Ende von Schreiben und Mitteilungen verwendet.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Vorschau Absenderblock</h4>
          <div className="text-sm text-gray-700 whitespace-pre-line bg-white p-4 rounded border border-gray-200">
            {formData.document_sender_name || "Ihr Name"}
            {"\n"}
            {formData.address_street || "Straße"}{formData.address_house_number ? ` ${formData.address_house_number}` : ""}
            {"\n"}
            {formData.address_zip || "PLZ"} {formData.address_city || "Ort"}
            {formData.phone && `\nTel.: ${formData.phone}`}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            variant="primary"
          >
            {saving ? "Speichern..." : "Änderungen speichern"}
          </Button>
        </div>
      </form>
    </div>
  );
}
