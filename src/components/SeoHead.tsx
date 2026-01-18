import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { resolveSeoMetadata, SeoMetadata } from "../lib/seoResolver";

export default function SeoHead() {
  const location = useLocation();
  const [metadata, setMetadata] = useState<SeoMetadata | null>(null);

  useEffect(() => {
    async function loadMetadata() {
      const meta = await resolveSeoMetadata(location.pathname);
      setMetadata(meta);

      if (meta.title) {
        document.title = meta.title;
      }

      updateMetaTag('name', 'description', meta.description);
      updateMetaTag('name', 'robots', meta.robots);

      if (meta.canonical) {
        updateLinkTag('canonical', meta.canonical);
      }

      updateMetaTag('property', 'og:title', meta.ogTitle);
      updateMetaTag('property', 'og:description', meta.ogDescription);
      updateMetaTag('property', 'og:type', 'website');
      updateMetaTag('property', 'og:url', window.location.href);

      if (meta.ogImageUrl) {
        updateMetaTag('property', 'og:image', meta.ogImageUrl);
      }

      updateMetaTag('name', 'twitter:card', 'summary_large_image');
      updateMetaTag('name', 'twitter:title', meta.ogTitle);
      updateMetaTag('name', 'twitter:description', meta.ogDescription);

      if (meta.ogImageUrl) {
        updateMetaTag('name', 'twitter:image', meta.ogImageUrl);
      }
    }

    loadMetadata();
  }, [location.pathname]);

  return null;
}

function updateMetaTag(attribute: string, key: string, content: string) {
  if (!content) return;

  let element = document.querySelector(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

function updateLinkTag(rel: string, href: string) {
  if (!href) return;

  let element = document.querySelector(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }

  element.setAttribute('href', href);
}
