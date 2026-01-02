import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

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
    // Wait for auth to finish loading
    if (authLoading) {
      console.log("useAdmin: Waiting for auth to finish loading");
      return;
    }

    if (!user) {
      console.log("useAdmin: No user found, setting admin to false");
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
        console.log("Loading admin status for user:", user.id);
        const { data, error } = await supabase
          .from("admin_users")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        console.log("Admin status response:", { data, error });

        if (error) {
          console.error("Error loading admin status:", error);
          setPermissions({
            isAdmin: false,
            isSuperAdmin: false,
            canManageTemplates: false,
            canViewAllUsers: false,
            canImpersonate: false,
            canManageSubscriptions: false,
          });
        } else if (data) {
          console.log("User is admin, setting permissions:", data);
          setPermissions({
            isAdmin: true,
            isSuperAdmin: data.is_super_admin || false,
            canManageTemplates: data.can_manage_templates || false,
            canViewAllUsers: data.can_view_all_users || false,
            canImpersonate: data.can_impersonate || false,
            canManageSubscriptions: data.can_manage_subscriptions || false,
          });
        } else {
          console.log("No admin record found for user");
          setPermissions({
            isAdmin: false,
            isSuperAdmin: false,
            canManageTemplates: false,
            canViewAllUsers: false,
            canImpersonate: false,
            canManageSubscriptions: false,
          });
        }
      } catch (err) {
        console.error("Unexpected error loading admin status:", err);
        setPermissions({
          isAdmin: false,
          isSuperAdmin: false,
          canManageTemplates: false,
          canViewAllUsers: false,
          canImpersonate: false,
          canManageSubscriptions: false,
        });
      } finally {
        setLoading(false);
      }
    }

    loadAdminStatus();
  }, [user, authLoading]);

  return { ...permissions, loading };
}
