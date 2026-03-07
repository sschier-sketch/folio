import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export interface AdminPermissions {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canManageTemplates: boolean;
  canViewAllUsers: boolean;
  canImpersonate: boolean;
  canManageSubscriptions: boolean;
}

export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState<AdminPermissions>({
    isAdmin: false,
    isSuperAdmin: false,
    canManageTemplates: false,
    canViewAllUsers: false,
    canImpersonate: false,
    canManageSubscriptions: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setPermissions({
        isAdmin: false,
        isSuperAdmin: false,
        canManageTemplates: false,
        canViewAllUsers: false,
        canImpersonate: false,
        canManageSubscriptions: false,
      });
      setLoading(false);
      return;
    }

    async function loadAdminStatus() {
      try {
        const { data, error } = await supabase
          .from("admin_users")
          .select("*")
          .eq("user_id", user!.id)
          .maybeSingle();

        if (error) {
          console.error("Error loading admin status:", error);
        } else if (data) {
          setPermissions({
            isAdmin: true,
            isSuperAdmin: data.is_super_admin || false,
            canManageTemplates: data.can_manage_templates || false,
            canViewAllUsers: data.can_view_all_users || false,
            canImpersonate: data.can_impersonate || false,
            canManageSubscriptions: data.can_manage_subscriptions || false,
          });
        }
      } catch (err) {
        console.error("Error loading admin status:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAdminStatus();
  }, [user?.id, authLoading]);

  return { ...permissions, loading };
}
