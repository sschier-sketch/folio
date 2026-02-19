import { supabase } from "./supabase";

export interface SystemSettings {
  id: number;
  gtm_enabled: boolean;
  gtm_container_id: string | null;
  gtm_custom_head_html: string | null;
  default_affiliate_commission_rate: number;
  signup_custom_tracking_script: string | null;
  notify_on_new_registration: boolean;
  notification_email: string;
  updated_at: string;
}

let cachedSettings: SystemSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60000;

export async function getSystemSettings(
  forceRefresh = false
): Promise<SystemSettings | null> {
  const now = Date.now();

  if (!forceRefresh && cachedSettings && now - cacheTimestamp < CACHE_TTL) {
    if (import.meta.env.DEV) {
      console.log("[SystemSettings] Using cached settings");
    }
    return cachedSettings;
  }

  try {
    const { data, error } = await supabase.rpc("get_system_settings");

    if (error) {
      console.error("[SystemSettings] Error fetching settings:", error);
      return null;
    }

    if (data && data.length > 0) {
      cachedSettings = data[0] as SystemSettings;
      cacheTimestamp = now;

      if (import.meta.env.DEV) {
        console.log("[SystemSettings] Loaded from database:", {
          gtm_enabled: cachedSettings.gtm_enabled,
          gtm_container_id: cachedSettings.gtm_container_id,
          has_custom_html: !!cachedSettings.gtm_custom_head_html,
        });
      }

      return cachedSettings;
    }

    return null;
  } catch (error) {
    console.error("[SystemSettings] Unexpected error:", error);
    return null;
  }
}

export async function updateSystemSettings(
  settings: Partial<
    Omit<SystemSettings, "id" | "updated_at">
  >
): Promise<{ success: boolean; error?: string }> {
  try {
    if (settings.gtm_container_id) {
      const gtmRegex = /^GTM-[A-Z0-9]+$/i;
      if (!gtmRegex.test(settings.gtm_container_id)) {
        return {
          success: false,
          error: "GTM Container ID muss das Format GTM-XXXXXXX haben",
        };
      }
    }

    if (settings.gtm_custom_head_html) {
      const html = settings.gtm_custom_head_html.toLowerCase();
      if (
        html.includes("<script") &&
        !html.includes("googletagmanager.com")
      ) {
        return {
          success: false,
          error:
            "Custom Head HTML darf nur Scripts von googletagmanager.com enthalten",
        };
      }
    }

    const { error } = await supabase
      .from("system_settings")
      .update(settings)
      .eq("id", 1);

    if (error) {
      console.error("[SystemSettings] Update error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    await getSystemSettings(true);

    if (import.meta.env.DEV) {
      console.log("[SystemSettings] Settings updated and cache refreshed");
    }

    return { success: true };
  } catch (error) {
    console.error("[SystemSettings] Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function invalidateSettingsCache(): void {
  cachedSettings = null;
  cacheTimestamp = 0;
  if (import.meta.env.DEV) {
    console.log("[SystemSettings] Cache invalidated");
  }
}

export function getGTMContainerId(): string | null {
  const envId = import.meta.env.VITE_GTM_ID;
  const envEnabled = import.meta.env.VITE_GTM_ENABLED === "true";

  if (cachedSettings) {
    if (cachedSettings.gtm_enabled) {
      if (cachedSettings.gtm_custom_head_html) {
        return null;
      }
      return cachedSettings.gtm_container_id;
    }
    return null;
  }

  if (envEnabled && envId) {
    return envId;
  }

  return null;
}

export function shouldRenderGTM(): {
  enabled: boolean;
  containerId: string | null;
  customHtml: string | null;
  source: "database" | "env" | "disabled";
} {
  if (cachedSettings) {
    if (!cachedSettings.gtm_enabled) {
      return {
        enabled: false,
        containerId: null,
        customHtml: null,
        source: "disabled",
      };
    }

    if (cachedSettings.gtm_custom_head_html) {
      return {
        enabled: true,
        containerId: null,
        customHtml: cachedSettings.gtm_custom_head_html,
        source: "database",
      };
    }

    if (cachedSettings.gtm_container_id) {
      return {
        enabled: true,
        containerId: cachedSettings.gtm_container_id,
        customHtml: null,
        source: "database",
      };
    }

    return {
      enabled: false,
      containerId: null,
      customHtml: null,
      source: "disabled",
    };
  }

  const envEnabled = import.meta.env.VITE_GTM_ENABLED === "true";
  const envId = import.meta.env.VITE_GTM_ID;

  if (envEnabled && envId) {
    return {
      enabled: true,
      containerId: envId,
      customHtml: null,
      source: "env",
    };
  }

  return {
    enabled: false,
    containerId: null,
    customHtml: null,
    source: "disabled",
  };
}
