import { useState, useEffect } from "react";
import { Shield, Lock, CreditCard, Eye, EyeOff, Hash, AtSign, AlertCircle, Check, Info } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import ProfileManagement from "./profile/ProfileManagement";
import { Button } from './ui/Button';

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

  const [customerNumber, setCustomerNumber] = useState<string | null>(null);

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

  const [emailAlias, setEmailAlias] = useState('');
  const [currentEmailAlias, setCurrentEmailAlias] = useState('');
  const [savingAlias, setSavingAlias] = useState(false);
  const [aliasError, setAliasError] = useState('');
  const [aliasSuccess, setAliasSuccess] = useState(false);

  useEffect(() => {
    loadUserSettings();
    loadBankDetails();
    loadCustomerNumber();
    loadEmailAlias();
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

  const loadCustomerNumber = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("account_profiles")
        .select("customer_number")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) setCustomerNumber(data.customer_number);
    } catch (error) {
      console.error("Error loading customer number:", error);
    }
  };

  const loadEmailAlias = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('user_mailboxes')
        .select('alias_localpart')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.alias_localpart) {
        setEmailAlias(data.alias_localpart);
        setCurrentEmailAlias(data.alias_localpart);
      }
    } catch (error) {
      console.error('Error loading email alias:', error);
    }
  };

  const validateAlias = (val: string): string | null => {
    const v = val.toLowerCase().trim();
    if (v.length < 3) return language === 'de' ? 'Mindestens 3 Zeichen erforderlich.' : 'Minimum 3 characters required.';
    if (v.length > 64) return language === 'de' ? 'Maximal 64 Zeichen erlaubt.' : 'Maximum 64 characters allowed.';
    if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(v)) {
      return language === 'de'
        ? 'Erlaubt: a-z, 0-9, Punkt, Minus, Unterstrich. Muss mit Buchstabe/Zahl beginnen und enden.'
        : 'Allowed: a-z, 0-9, dot, hyphen, underscore. Must start and end with letter/number.';
    }
    if (v.includes('..')) return language === 'de' ? 'Keine aufeinanderfolgenden Punkte erlaubt.' : 'No consecutive dots allowed.';
    return null;
  };

  const handleSaveAlias = async () => {
    const cleaned = emailAlias.toLowerCase().trim();
    const validationError = validateAlias(cleaned);
    if (validationError) {
      setAliasError(validationError);
      return;
    }
    if (cleaned === currentEmailAlias) {
      setAliasSuccess(true);
      setTimeout(() => setAliasSuccess(false), 2500);
      return;
    }

    setSavingAlias(true);
    setAliasError('');
    setAliasSuccess(false);

    const { data: reserved } = await supabase
      .from('reserved_email_aliases')
      .select('alias_localpart')
      .eq('alias_localpart', cleaned)
      .maybeSingle();

    if (reserved) {
      setAliasError(language === 'de' ? 'Dieser Alias ist reserviert und kann nicht verwendet werden.' : 'This alias is reserved.');
      setSavingAlias(false);
      return;
    }

    const { error: rpcError } = await supabase.rpc('update_user_mailbox_alias', {
      new_alias: cleaned,
    });

    if (rpcError) {
      setAliasError(rpcError.message || (language === 'de' ? 'Fehler beim Speichern der Adresse.' : 'Error saving address.'));
      setSavingAlias(false);
      return;
    }

    setSavingAlias(false);
    setCurrentEmailAlias(cleaned);
    setAliasSuccess(true);
    setTimeout(() => setAliasSuccess(false), 2500);
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
          {customerNumber && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {language === "de" ? "Kundennummer" : "Customer Number"}
              </label>
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-300" />
                <span className="font-mono text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">{customerNumber}</span>
              </div>
            </div>
          )}
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
          <Button
            onClick={() => setShowPasswordSection(true)}
            variant="primary"
          >
            {language === "de" ? "Passwort ändern" : "Change Password"}
          </Button>
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
              <Button
                onClick={handlePasswordChange}
                disabled={changingPassword}
                variant="primary"
              >
                {changingPassword ? (language === "de" ? "Wird gespeichert..." : "Saving...") : (language === "de" ? "Speichern" : "Save")}
              </Button>
              <Button
                onClick={() => {
                  setShowPasswordSection(false);
                  setPasswordData({ newPassword: "", confirmPassword: "" });
                  setPasswordError("");
                  setPasswordSuccess("");
                }}
                variant="cancel"
              >
                {language === "de" ? "Abbrechen" : "Cancel"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded shadow-sm p-6 mt-6">
        <div className="flex items-center gap-3 mb-6">
          <AtSign className="w-6 h-6 text-primary-blue" />
          <h3 className="text-lg font-semibold text-dark">
            {language === "de" ? "Dokumente & Kommunikation" : "Documents & Communication"}
          </h3>
        </div>

        <div className="space-y-4 max-w-2xl">
          {aliasError && (
            <div className="flex items-start gap-2 px-4 py-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{aliasError}</span>
            </div>
          )}
          {aliasSuccess && (
            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
              <Check className="w-4 h-4" />
              <span>{language === "de" ? "E-Mail-Adresse erfolgreich gespeichert!" : "Email address saved successfully!"}</span>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700">
                {language === "de" ? "Ihre Rentably E-Mail" : "Your Rentably Email"}
              </span>
              <div className="relative group">
                <button type="button" className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <Info className="w-3.5 h-3.5 text-gray-500" />
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <p className="font-semibold mb-1.5">
                    {language === "de" ? "Ihre persönliche Rentably E-Mail-Adresse" : "Your personal Rentably email address"}
                  </p>
                  <ul className="space-y-1 text-gray-300 leading-relaxed">
                    <li>{language === "de" ? "Wird als Absender für Ihre E-Mails verwendet" : "Used as sender for your emails"}</li>
                    <li>{language === "de" ? "Antworten werden automatisch im Posteingang angezeigt" : "Replies are shown automatically in your inbox"}</li>
                  </ul>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0">
              <input
                type="text"
                value={emailAlias}
                onChange={(e) => { setEmailAlias(e.target.value.toLowerCase()); setAliasError(''); }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="mein-alias"
              />
              <span className="px-4 py-2.5 bg-gray-50 border border-l-0 border-gray-200 rounded-r-lg text-sm text-gray-500 font-medium whitespace-nowrap">
                @rentab.ly
              </span>
            </div>
            <p className="mt-1.5 text-xs text-gray-400">
              {language === "de"
                ? "Unter dieser Adresse empfangen und senden Sie E-Mails. Diese Einstellung gilt auch für Nachrichten."
                : "You send and receive emails under this address. This setting also applies to Messages."}
            </p>
          </div>
          {emailAlias.trim() !== currentEmailAlias && emailAlias.trim().length >= 3 && (
            <Button variant="primary" onClick={handleSaveAlias} disabled={savingAlias}>
              {savingAlias
                ? (language === "de" ? "Speichern..." : "Saving...")
                : (language === "de" ? "Adresse speichern" : "Save Address")}
            </Button>
          )}
        </div>
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

          <Button
            onClick={handleSaveBankDetails}
            disabled={savingBankDetails}
            variant="primary"
          >
            {savingBankDetails ? (language === "de" ? "Wird gespeichert..." : "Saving...") : (language === "de" ? "Bankverbindung speichern" : "Save Bank Details")}
          </Button>

          <p className="text-sm text-gray-500 mt-2">
            {language === "de"
              ? "Diese Bankverbindung wird ausschließlich für Nachzahlungen bei Betriebskostenabrechnungen verwendet, nicht für Ihr rentably-Abo."
              : "These bank details are used exclusively for operating cost settlement payments, not for your rentably subscription."}
          </p>
        </div>
      </div>
    </div>
  );
}
