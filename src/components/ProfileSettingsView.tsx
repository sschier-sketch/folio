import { useState, useEffect } from "react";
import { User, Shield } from "lucide-react";
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

export default function ProfileSettingsView() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    loadUserSettings();
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
        </div>

        <div className="mt-8 pt-8 border-t">
          <ProfileManagement />
        </div>
      </div>
    </div>
  );
}
