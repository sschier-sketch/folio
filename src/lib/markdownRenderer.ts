export interface HeadingEntry {
  id: string;
  text: string;
  level: number;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractHeadings(markdown: string): HeadingEntry[] {
  const headings: HeadingEntry[] = [];
  const lines = markdown.split("\n");

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      const text = h2[1].replace(/\*\*/g, "").replace(/\*/g, "").trim();
      headings.push({ id: slugify(text), text, level: 2 });
      continue;
    }
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      const text = h3[1].replace(/\*\*/g, "").replace(/\*/g, "").trim();
      headings.push({ id: slugify(text), text, level: 3 });
    }
  }

  return headings;
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let inList = false;
  let listType: "ul" | "ol" | null = null;
  let paragraphBuffer: string[] = [];

  function flushParagraph() {
    if (paragraphBuffer.length > 0) {
      const text = paragraphBuffer.join(" ");
      if (text.trim()) {
        result.push(`<p>${formatInline(text)}</p>`);
      }
      paragraphBuffer = [];
    }
  }

  function closeList() {
    if (inList && listType) {
      result.push(`</${listType}>`);
      inList = false;
      listType = null;
    }
  }

  function formatInline(text: string): string {
    let out = escapeHtml(text);
    out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/\*(.+?)\*/g, "<em>$1</em>");
    out = out.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    return out;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      flushParagraph();
      closeList();
      continue;
    }

    const h2Match = trimmed.match(/^##\s+(.+)$/);
    if (h2Match) {
      flushParagraph();
      closeList();
      const text = h2Match[1].replace(/\*\*/g, "").replace(/\*/g, "").trim();
      const id = slugify(text);
      result.push(`<h2 id="${id}">${formatInline(h2Match[1])}</h2>`);
      continue;
    }

    const h3Match = trimmed.match(/^###\s+(.+)$/);
    if (h3Match) {
      flushParagraph();
      closeList();
      const h3Text = h3Match[1].replace(/\*\*/g, "").replace(/\*/g, "").trim();
      const h3Id = slugify(h3Text);
      result.push(`<h3 id="${h3Id}">${formatInline(h3Match[1])}</h3>`);
      continue;
    }

    const h1Match = trimmed.match(/^#\s+(.+)$/);
    if (h1Match) {
      flushParagraph();
      closeList();
      result.push(`<h2>${formatInline(h1Match[1])}</h2>`);
      continue;
    }

    const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      flushParagraph();
      if (!inList || listType !== "ul") {
        closeList();
        result.push("<ul>");
        inList = true;
        listType = "ul";
      }
      result.push(`<li>${formatInline(ulMatch[1])}</li>`);
      continue;
    }

    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      flushParagraph();
      if (!inList || listType !== "ol") {
        closeList();
        result.push("<ol>");
        inList = true;
        listType = "ol";
      }
      result.push(`<li>${formatInline(olMatch[1])}</li>`);
      continue;
    }

    const blockquoteMatch = trimmed.match(/^>\s+(.+)$/);
    if (blockquoteMatch) {
      flushParagraph();
      closeList();
      result.push(`<blockquote><p>${formatInline(blockquoteMatch[1])}</p></blockquote>`);
      continue;
    }

    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  closeList();

  return result.join("\n");
}

export function calculateReadingTime(text: string): number {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / 200));
}
