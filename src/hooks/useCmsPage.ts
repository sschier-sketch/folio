import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useCmsPage(slug: string) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    supabase
      .from("cms_pages")
      .select("content")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          const html = data?.content?.trim() || null;
          setContent(html || null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { content, loading };
}
