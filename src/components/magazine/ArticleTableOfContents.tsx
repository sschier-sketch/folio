import { useState, useEffect } from "react";
import type { HeadingEntry } from "../../lib/markdownRenderer";

interface Props {
  headings: HeadingEntry[];
}

export default function ArticleTableOfContents({ headings }: Props) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      const offset = 96;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }

  return (
    <nav className="sticky top-24">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
        Inhalt
      </p>
      <ul className="space-y-1">
        {headings.map((h) => (
          <li key={h.id}>
            <button
              onClick={() => scrollTo(h.id)}
              className={`block w-full text-left text-sm py-1.5 pl-3 border-l-2 transition-colors ${
                activeId === h.id
                  ? "border-[#3c8af7] text-[#3c8af7] font-medium"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
              }`}
            >
              {h.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
