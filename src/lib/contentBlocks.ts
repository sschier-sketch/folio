export interface HeadingBlock {
  type: 'heading';
  level: 2 | 3;
  text: string;
}

export interface TextBlock {
  type: 'text';
  content: string;
}

export interface ImageBlock {
  type: 'image';
  url: string;
  caption?: string;
  alt?: string;
}

export interface UspListBlock {
  type: 'usp_list';
  title?: string;
  items: string[];
}

export interface InfoBoxBlock {
  type: 'info_box';
  title?: string;
  items: string[];
}

export type ContentBlock = HeadingBlock | TextBlock | ImageBlock | UspListBlock | InfoBoxBlock;

export interface HeadingEntry {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatInline(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*(.+?)\*/g, '<em>$1</em>');
  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  return out;
}

export function isBlockContent(content: string): boolean {
  if (!content || !content.trim().startsWith('[')) return false;
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) && (parsed.length === 0 || parsed[0]?.type !== undefined);
  } catch {
    return false;
  }
}

export function parseContentBlocks(content: string): ContentBlock[] {
  if (!content) return [];
  if (isBlockContent(content)) {
    return JSON.parse(content);
  }
  return [{ type: 'text', content }];
}

export function serializeBlocks(blocks: ContentBlock[]): string {
  return JSON.stringify(blocks);
}

export function extractHeadingsFromBlocks(blocks: ContentBlock[]): HeadingEntry[] {
  return blocks
    .filter((b): b is HeadingBlock => b.type === 'heading')
    .map(b => ({
      id: slugify(b.text),
      text: b.text,
      level: b.level,
    }));
}

export function calculateReadingTimeFromBlocks(blocks: ContentBlock[]): number {
  let text = '';
  for (const block of blocks) {
    if (block.type === 'text') text += ' ' + block.content;
    if (block.type === 'heading') text += ' ' + block.text;
    if (block.type === 'usp_list' || block.type === 'info_box') {
      if (block.title) text += ' ' + block.title;
      text += ' ' + block.items.join(' ');
    }
  }
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / 200));
}

function renderTextContent(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let paragraphBuffer: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;

  function flushParagraph() {
    if (paragraphBuffer.length > 0) {
      const text = paragraphBuffer.join(' ');
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

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '') {
      flushParagraph();
      closeList();
      continue;
    }

    const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      flushParagraph();
      if (!inList || listType !== 'ul') {
        closeList();
        result.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      result.push(`<li>${formatInline(ulMatch[1])}</li>`);
      continue;
    }

    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      flushParagraph();
      if (!inList || listType !== 'ol') {
        closeList();
        result.push('<ol>');
        inList = true;
        listType = 'ol';
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
  return result.join('\n');
}

export function renderBlocksToHtml(blocks: ContentBlock[]): string {
  return blocks.map(block => {
    switch (block.type) {
      case 'heading': {
        const id = slugify(block.text);
        const tag = `h${block.level}`;
        return `<${tag} id="${id}">${formatInline(block.text)}</${tag}>`;
      }
      case 'text':
        return renderTextContent(block.content);
      case 'image': {
        let html = '<figure class="article-image">';
        html += `<img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt || '')}" loading="lazy" />`;
        if (block.caption) {
          html += `<figcaption>${formatInline(block.caption)}</figcaption>`;
        }
        html += '</figure>';
        return html;
      }
      case 'usp_list': {
        let html = '<div class="usp-list-block">';
        if (block.title) {
          html += `<h3>${formatInline(block.title)}</h3>`;
        }
        html += '<ul>';
        html += block.items.filter(i => i.trim()).map(item => `<li>${formatInline(item)}</li>`).join('');
        html += '</ul></div>';
        return html;
      }
      case 'info_box': {
        let html = '<div class="info-box-block">';
        if (block.title) {
          html += `<h3>${formatInline(block.title)}</h3>`;
        }
        html += '<ul>';
        html += block.items.filter(i => i.trim()).map(item => `<li>${formatInline(item)}</li>`).join('');
        html += '</ul></div>';
        return html;
      }
      default:
        return '';
    }
  }).join('\n');
}
