import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  getGlobalHeadHtml,
  replaceHeadPlaceholders,
  HeadVariables,
} from "../lib/globalHead";
import { SITE_URL } from "../config/site";

const DEFAULT_OG_IMAGE = `${SITE_URL}/rentably-app.jpg`;

const MANAGED_SELECTORS = [
  'meta[property="og:site_name"]',
  'meta[property="og:type"]',
  'meta[property="og:title"]',
  'meta[property="og:description"]',
  'meta[property="og:url"]',
  'meta[property="og:image"]',
  'meta[name="twitter:card"]',
  'meta[name="twitter:title"]',
  'meta[name="twitter:description"]',
  'meta[name="twitter:image"]',
];

let injectedElements: Element[] = [];

function cleanupInjectedElements() {
  injectedElements.forEach((el) => el.remove());
  injectedElements = [];
}

function parseAndInjectHtml(html: string) {
  cleanupInjectedElements();

  MANAGED_SELECTORS.forEach((selector) => {
    const existing = document.querySelector(selector);
    if (existing) existing.remove();
  });

  const parser = new DOMParser();
  const doc = parser.parseFromString(
    `<head>${html}</head>`,
    "text/html"
  );

  const elements = doc.head.children;
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const cloned = document.importNode(el, true);

    const tagName = cloned.tagName.toLowerCase();
    if (tagName === "script") continue;

    if (tagName === "link" && cloned.getAttribute("rel") === "canonical") {
      const existing = document.querySelector('link[rel="canonical"]');
      if (existing) existing.remove();
    }

    document.head.appendChild(cloned);
    injectedElements.push(cloned);
  }
}

async function injectHead(pathname: string, seoDetail?: { title?: string; description?: string; ogTitle?: string; ogDescription?: string; ogImageUrl?: string }) {
  const template = await getGlobalHeadHtml();

  const cleanPath = pathname.split("?")[0].split("#")[0];
  const pageUrl = cleanPath === "/" ? `${SITE_URL}/` : `${SITE_URL}${cleanPath}`;

  const title = seoDetail?.ogTitle || seoDetail?.title || document.title || "rentably";
  const description = seoDetail?.ogDescription || seoDetail?.description || document.querySelector('meta[name="description"]')?.getAttribute("content") || "";

  const vars: HeadVariables = {
    siteUrl: SITE_URL,
    pageUrl,
    title,
    description,
    ogImage: seoDetail?.ogImageUrl || DEFAULT_OG_IMAGE,
  };

  const resolved = replaceHeadPlaceholders(template, vars);
  parseAndInjectHtml(resolved);
}

export default function GlobalHead() {
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    function handleSeoUpdated(e: Event) {
      if (cancelled) return;
      const detail = (e as CustomEvent).detail;
      injectHead(location.pathname, detail);
    }

    window.addEventListener('seo-head-updated', handleSeoUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener('seo-head-updated', handleSeoUpdated);
    };
  }, [location.pathname]);

  return null;
}
