import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface ProfileWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface ProfileData {
  first_name: string;
  last_name: string;
  company_name: string;
  address_street: string;
  address_zip: string;
  address_city: string;
  address_country: string;
  phone: string;
  document_sender_name: string;
  document_signature: string;
}

export default function ProfileWizard({ isOpen, onClose, onComplete }: ProfileWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    company_name: "",
    address_street: "",
    address_zip: "",
    address_city: "",
    address_country: "Deutschland",
    phone: "",
    document_sender_name: "",
    document_signature: "",
  });
  const [errors, setErrors] = useState<Partial<ProfileData>>({});

  useEffect(() => {
    if (isOpen) {
      loadExistingProfile();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!formData.first_name || !formData.last_name) return;

    if (!formData.document_sender_name || formData.document_sender_name.trim() === "") {
      const defaultSender = formData.company_name || `${formData.first_name} ${formData.last_name}`;
      setFormData((prev) => ({ ...prev, document_sender_name: defaultSender }));
    }

    if (!formData.document_signature || formData.document_signature.trim() === "") {
      const defaultSignature = `Viele Grüße\n${formData.first_name} ${formData.last_name}`;
      setFormData((prev) => ({ ...prev, document_signature: defaultSignature }));
    }
  }, [formData.first_name, formData.last_name, formData.company_name]);

  const loadExistingProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
    }
  };

  const validateStep1 = () => {
    const newErrors: Partial<ProfileData> = {};

    if (!formData.first_name.trim()) newErrors.first_name = "Vorname erforderlich";
    if (!formData.last_name.trim()) newErrors.last_name = "Nachname erforderlich";
    if (!formData.address_street.trim()) newErrors.address_street = "Straße erforderlich";
    if (!formData.address_zip.trim()) newErrors.address_zip = "PLZ erforderlich";
    if (!formData.address_city.trim()) newErrors.address_city = "Ort erforderlich";
    if (!formData.address_country.trim()) newErrors.address_country = "Land erforderlich";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Partial<ProfileData> = {};

    if (!formData.document_sender_name.trim()) {
      newErrors.document_sender_name = "Absendername erforderlich";
    }
    if (!formData.document_signature.trim()) {
      newErrors.document_signature = "Signatur erforderlich";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      setErrors({});
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      const { data: existingProfile } = await supabase
        .from("account_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const profileData = {
        user_id: user.id,
        ...formData,
        reminder_dismissed_until: null,
      };

      if (existingProfile) {
        await supabase
          .from("account_profiles")
          .update(profileData)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("account_profiles")
          .insert(profileData);
      }

      onComplete();
      onClose();
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Fehler beim Speichern des Profils");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Profil vervollständigen</h2>
            <p className="text-sm text-gray-600 mt-1">
              Schritt {currentStep} von 2
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="flex mb-8">
            <div className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {currentStep > 1 ? <Check className="w-5 h-5" /> : "1"}
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">Kontaktdaten</div>
              </div>
            </div>
            <div className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= 2
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                2
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">Dokumente</div>
              </div>
            </div>
          </div>

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  Diese Angaben werden als Absender in Abrechnungen und Dokumenten verwendet.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vorname *
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleChange("first_name", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.first_name ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.first_name && (
                    <p className="text-sm text-red-600 mt-1">{errors.first_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nachname *
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => handleChange("last_name", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.last_name ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.last_name && (
                    <p className="text-sm text-red-600 mt-1">{errors.last_name}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firma / Organisation (optional)
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleChange("company_name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Straße + Hausnummer *
                </label>
                <input
                  type="text"
                  value={formData.address_street}
                  onChange={(e) => handleChange("address_street", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.address_street ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.address_street && (
                  <p className="text-sm text-red-600 mt-1">{errors.address_street}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PLZ *</label>
                  <input
                    type="text"
                    value={formData.address_zip}
                    onChange={(e) => handleChange("address_zip", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.address_zip ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.address_zip && (
                    <p className="text-sm text-red-600 mt-1">{errors.address_zip}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ort *</label>
                  <input
                    type="text"
                    value={formData.address_city}
                    onChange={(e) => handleChange("address_city", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.address_city ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.address_city && (
                    <p className="text-sm text-red-600 mt-1">{errors.address_city}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Land *</label>
                <input
                  type="text"
                  value={formData.address_country}
                  onChange={(e) => handleChange("address_country", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.address_country ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.address_country && (
                  <p className="text-sm text-red-600 mt-1">{errors.address_country}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefonnummer (empfohlen)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Absendername für Dokumente *
                </label>
                <input
                  type="text"
                  value={formData.document_sender_name}
                  onChange={(e) => handleChange("document_sender_name", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.document_sender_name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={formData.company_name || `${formData.first_name} ${formData.last_name}`.trim()}
                />
                {errors.document_sender_name && (
                  <p className="text-sm text-red-600 mt-1">{errors.document_sender_name}</p>
                )}
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.document_signature ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={`Viele Grüße\n${formData.first_name} ${formData.last_name}`}
                />
                {errors.document_signature && (
                  <p className="text-sm text-red-600 mt-1">{errors.document_signature}</p>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  Diese Signatur wird am Ende von Schreiben und Mitteilungen verwendet.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Vorschau Absenderblock</h4>
                <div className="text-sm text-gray-700 whitespace-pre-line">
                  {formData.document_sender_name || "Ihr Name"}
                  {"\n"}
                  {formData.address_street || "Straße"}
                  {"\n"}
                  {formData.address_zip || "PLZ"} {formData.address_city || "Ort"}
                  {formData.phone && `\nTel.: ${formData.phone}`}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
          <div>
            {currentStep === 2 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Zurück
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              style={{ backgroundColor: "#faf8f8", color: "#000000" }}
              className="px-4 py-2 rounded-lg hover:bg-[#bdbfcb] transition-colors"
            >
              Abbrechen
            </button>
            {currentStep === 1 && (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Weiter
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {currentStep === 2 && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? "Speichern..." : "Abschließen"}
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
