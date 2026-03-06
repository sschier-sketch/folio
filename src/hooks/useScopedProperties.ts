import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import { usePermissions } from "./usePermissions";

interface PropertyOption {
  id: string;
  name: string;
  address?: string;
}

export function useScopedProperties(fields: string = "id, name") {
  const { user } = useAuth();
  const { dataOwnerId, filterPropertiesByScope, loading: permLoading } = usePermissions();
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user || !dataOwnerId) return;
    try {
      const { data } = await supabase
        .from("properties")
        .select(fields)
        .eq("user_id", dataOwnerId)
        .order("name");
      setProperties(filterPropertiesByScope(data || []));
    } catch (err) {
      console.error("Error loading scoped properties:", err);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [user, dataOwnerId, fields, filterPropertiesByScope]);

  useEffect(() => {
    if (!permLoading && dataOwnerId) load();
  }, [permLoading, dataOwnerId, load]);

  return { properties, loading: loading || permLoading, reload: load };
}
