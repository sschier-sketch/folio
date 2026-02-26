import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  getGlobalHeadHtml,
  resolveHeadVariables,
  replaceHeadPlaceholders,
} from "../lib/globalHead";

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

export default function GlobalHead() {
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    async function inject() {
      const template = await getGlobalHeadHtml();
      if (cancelled) return;

      const title = document.title || undefined;
      const descMeta = document.querySelector('meta[name="description"]');
      const description = descMeta?.getAttribute("content") || undefined;

      const vars = resolveHeadVariables(
        location.pathname,
        title,
        description
      );

      const resolved = replaceHeadPlaceholders(template, vars);
      parseAndInjectHtml(resolved);
    }

    const timer = setTimeout(inject, 50);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [location.pathname]);

  return null;
}
