import { useState, useEffect } from "react";
import { User, Shield, Lock, CreditCard, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import ProfileManagement from "./profile/ProfileManagement";

interface UserSettings {
  role: string;
  can_invite_users: boolean;
  can_manage_properties: boolean;
  can_manage_tenants: boolean;
  can_manage_finances: boolean;
  can_view_analytics: boolean;
}

interface BankDetails {
  account_holder: string;
  iban: string;
  bic: string;
  bank_name: string;
}

export default function ProfileSettingsView() {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [bankDetails, setBankDetails] = useState<BankDetails>({
    account_holder: "",
    iban: "",
    bic: "",
    bank_name: "",
  });
  const [originalBankDetails, setOriginalBankDetails] = useState<BankDetails>({
    account_holder: "",
    iban: "",
    bic: "",
    bank_name: "",
  });
  const [savingBankDetails, setSavingBankDetails] = useState(false);

  useEffect(() => {
    loadUserSettings();
    loadBankDetails();
  }, [user]);

  const loadUserSettings = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select(
          "role, can_invite_users, can_manage_properties, can_manage_tenants, can_manage_finances, can_view_analytics",
        )
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      setUserSettings(data);
    } catch (error) {
      console.error("Error loading user settings:", error);
    }
  };

  const loadBankDetails = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("user_bank_details")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        const details = {
          account_holder: data.account_holder || "",
          iban: data.iban || "",
          bic: data.bic || "",
          bank_name: data.bank_name || "",
        };
        setBankDetails(details);
        setOriginalBankDetails(details);
      }
    } catch (error) {
      console.error("Error loading bank details:", error);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordData.newPassword) {
      setPasswordError(language === "de" ? "Bitte geben Sie ein neues Passwort ein" : "Please enter a new password");
      return;
    }

    if (passwordData.newPassword.length < 10) {
      setPasswordError(language === "de" ? "Das Passwort muss mindestens 10 Zeichen lang sein" : "Password must be at least 10 characters");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError(language === "de" ? "Die Passwörter stimmen nicht überein" : "Passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      setPasswordSuccess(language === "de" ? "Passwort erfolgreich geändert" : "Password changed successfully");
      setPasswordData({ newPassword: "", confirmPassword: "" });
      setShowPasswordSection(false);
    } catch (error: any) {
      console.error("Error changing password:", error);
      setPasswordError(error.message || (language === "de" ? "Fehler beim Ändern des Passworts" : "Error changing password"));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveBankDetails = async () => {
    if (!user) return;

    if (!bankDetails.account_holder || !bankDetails.iban) {
      alert(language === "de" ? "Bitte füllen Sie Kontoinhaber und IBAN aus" : "Please fill in account holder and IBAN");
      return;
    }

    setSavingBankDetails(true);
    try {
      const { error } = await supabase
        .from("user_bank_details")
        .upsert(
          {
            user_id: user.id,
            account_holder: bankDetails.account_holder,
            iban: bankDetails.iban.replace(/\s/g, ""),
            bic: bankDetails.bic || null,
            bank_name: bankDetails.bank_name || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;

      setOriginalBankDetails(bankDetails);
      alert(language === "de" ? "Bankverbindung erfolgreich gespeichert" : "Bank details saved successfully");
    } catch (error) {
      console.error("Error saving bank details:", error);
      alert(language === "de" ? "Fehler beim Speichern der Bankverbindung" : "Error saving bank details");
    } finally {
      setSavingBankDetails(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleMap = {
      owner: {
        label: t("settings.users.owner"),
        color: "bg-primary-blue/10 text-primary-blue",
      },
      admin: {
        label: t("settings.users.admin"),
        color: "bg-red-100 text-red-700",
      },
      member: {
        label: t("settings.users.member"),
        color: "bg-emerald-100 text-emerald-700",
      },
      viewer: {
        label: t("settings.users.viewer"),
        color: "bg-gray-50 text-gray-400",
      },
    };
    const roleInfo = roleMap[role as keyof typeof roleMap] || roleMap.owner;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 ${roleInfo.color} rounded text-xs font-medium`}
      >
        <Shield className="w-3 h-3" /> {roleInfo.label}
      </span>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-2">
          {t("settings.profile")}
        </h1>
        <p className="text-gray-400">
          {language === "de"
            ? "Verwalten Sie Ihre persönlichen Informationen."
            : "Manage your personal information."}
        </p>
      </div>

      <div className="bg-white rounded shadow-sm p-6">
        <h3 className="text-lg font-semibold text-dark mb-6">
          {t("settings.profile")}
        </h3>
        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t("settings.email")}
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-4 py-2 rounded-lg bg-gray-50 text-gray-300"
            />
            <p className="text-sm text-gray-300 mt-1">
              {language === "de"
                ? "Ihre E-Mail-Adresse kann derzeit nicht geändert werden."
                : "Your email address cannot be changed currently."}
            </p>
          </div>
          {userSettings && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {t("settings.users.role")}
              </label>
              <div>{getRoleBadge(userSettings.role)}</div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t("settings.language")}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "de" | "en")}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
            <p className="text-sm text-gray-300 mt-1">
              {language === "de"
                ? "Änderungen werden sofort wirksam und für alle E-Mails verwendet."
                : "Changes take effect immediately and are used for all emails."}
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t">
          <ProfileManagement />
        </div>
      </div>

      <div className="bg-white rounded shadow-sm p-6 mt-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-6 h-6 text-primary-blue" />
          <h3 className="text-lg font-semibold text-dark">
            {language === "de" ? "Passwort ändern" : "Change Password"}
          </h3>
        </div>

        {!showPasswordSection ? (
          <button
            onClick={() => setShowPasswordSection(true)}
            className="px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
          >
            {language === "de" ? "Passwort ändern" : "Change Password"}
          </button>
        ) : (
          <div className="space-y-4 max-w-2xl">
            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {passwordSuccess}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === "de" ? "Neues Passwort" : "New Password"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder={language === "de" ? "Mindestens 6 Zeichen" : "At least 6 characters"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === "de" ? "Passwort bestätigen" : "Confirm Password"}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder={language === "de" ? "Passwort wiederholen" : "Repeat password"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePasswordChange}
                disabled={changingPassword}
                className="px-6 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {changingPassword ? (language === "de" ? "Wird gespeichert..." : "Saving...") : (language === "de" ? "Speichern" : "Save")}
              </button>
              <button
                onClick={() => {
                  setShowPasswordSection(false);
                  setPasswordData({ newPassword: "", confirmPassword: "" });
                  setPasswordError("");
                  setPasswordSuccess("");
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-300 transition-colors"
              >
                {language === "de" ? "Abbrechen" : "Cancel"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded shadow-sm p-6 mt-6">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-6 h-6 text-primary-blue" />
          <h3 className="text-lg font-semibold text-dark">
            {language === "de" ? "Bankverbindung" : "Bank Details"}
          </h3>
        </div>

        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === "de" ? "Kontoinhaber" : "Account Holder"} *
            </label>
            <input
              type="text"
              value={bankDetails.account_holder}
              onChange={(e) => setBankDetails({ ...bankDetails, account_holder: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder={language === "de" ? "Max Mustermann" : "John Doe"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IBAN *
            </label>
            <input
              type="text"
              value={bankDetails.iban}
              onChange={(e) => setBankDetails({ ...bankDetails, iban: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder="DE89 3704 0044 0532 0130 00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              BIC ({language === "de" ? "optional" : "optional"})
            </label>
            <input
              type="text"
              value={bankDetails.bic}
              onChange={(e) => setBankDetails({ ...bankDetails, bic: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder="COBADEFFXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === "de" ? "Bank Name" : "Bank Name"} ({language === "de" ? "optional" : "optional"})
            </label>
            <input
              type="text"
              value={bankDetails.bank_name}
              onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder={language === "de" ? "Commerzbank AG" : "Your Bank"}
            />
          </div>

          <button
            onClick={handleSaveBankDetails}
            disabled={savingBankDetails}
            className="px-6 py-3 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {savingBankDetails ? (language === "de" ? "Wird gespeichert..." : "Saving...") : (language === "de" ? "Bankverbindung speichern" : "Save Bank Details")}
          </button>

          <p className="text-sm text-gray-500 mt-2">
            {language === "de"
              ? "Ihre Bankverbindung wird sicher gespeichert und kann für zukünftige Transaktionen verwendet werden."
              : "Your bank details are stored securely and can be used for future transactions."}
          </p>
        </div>
      </div>
    </div>
  );
}
