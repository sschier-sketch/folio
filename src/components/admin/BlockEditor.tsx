import { useState, useRef, useCallback } from 'react';
import {
  Plus, ChevronUp, ChevronDown, Trash2, Type, AlignLeft,
  Image as ImageIcon, ListChecks, Upload, Bold, Italic,
  Link as LinkIcon, List, ListOrdered, Quote, TextQuote
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ContentBlock } from '../../lib/contentBlocks';

interface Props {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

const BLOCK_TYPES = [
  { type: 'heading' as const, label: 'Überschrift', icon: Type },
  { type: 'text' as const, label: 'Text', icon: AlignLeft },
  { type: 'image' as const, label: 'Bild', icon: ImageIcon },
  { type: 'usp_list' as const, label: 'Aufzählung', icon: ListChecks },
  { type: 'info_box' as const, label: 'Info-Box', icon: TextQuote },
];

const BLOCK_LABELS: Record<string, string> = {
  heading: 'Überschrift',
  text: 'Text',
  image: 'Bild',
  usp_list: 'Aufzählung',
  info_box: 'Info-Box',
};

export default function BlockEditor({ blocks, onChange }: Props) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  function addBlock(type: ContentBlock['type']) {
    let newBlock: ContentBlock;
    switch (type) {
      case 'heading':
        newBlock = { type: 'heading', level: 2, text: '' };
        break;
      case 'text':
        newBlock = { type: 'text', content: '' };
        break;
      case 'image':
        newBlock = { type: 'image', url: '', caption: '', alt: '' };
        break;
      case 'usp_list':
        newBlock = { type: 'usp_list', title: '', items: [''] };
        break;
      case 'info_box':
        newBlock = { type: 'info_box', title: '', items: [''] };
        break;
      default:
        return;
    }
    onChange([...blocks, newBlock]);
  }

  function updateBlock(index: number, updated: ContentBlock) {
    const newBlocks = [...blocks];
    newBlocks[index] = updated;
    onChange(newBlocks);
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    onChange(newBlocks);
  }

  async function handleImageUpload(index: number, file: File) {
    setUploadingIndex(index);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
      const filePath = `content/${fileName}`;

      const { error } = await supabase.storage
        .from('magazine-images')
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('magazine-images')
        .getPublicUrl(filePath);

      const block = blocks[index];
      if (block.type === 'image') {
        updateBlock(index, { ...block, url: publicUrl });
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Fehler beim Hochladen des Bildes');
    } finally {
      setUploadingIndex(null);
    }
  }

  function renderBlockContent(block: ContentBlock, index: number) {
    switch (block.type) {
      case 'heading':
        return (
          <div className="flex gap-3 items-start">
            <select
              value={block.level}
              onChange={(e) => updateBlock(index, { ...block, level: Number(e.target.value) as 2 | 3 })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
            <input
              type="text"
              value={block.text}
              onChange={(e) => updateBlock(index, { ...block, text: e.target.value })}
              className={`flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue ${
                block.level === 2 ? 'text-lg font-bold' : 'text-base font-semibold'
              }`}
              placeholder="Überschrift eingeben..."
            />
          </div>
        );

      case 'text':
        return (
          <RichTextArea
            value={block.content}
            onChange={(val) => updateBlock(index, { ...block, content: val })}
          />
        );

      case 'image':
        return (
          <div className="space-y-3">
            {block.url ? (
              <div className="relative group">
                <img src={block.url} alt={block.alt || ''} className="w-full max-h-64 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => updateBlock(index, { ...block, url: '' })}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(index, file);
                  }}
                />
                <div className="text-center">
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <span className="text-sm text-gray-500">
                    {uploadingIndex === index ? 'Wird hochgeladen...' : 'Bild hochladen'}
                  </span>
                </div>
              </label>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Alt-Text</label>
                <input
                  type="text"
                  value={block.alt || ''}
                  onChange={(e) => updateBlock(index, { ...block, alt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="Bildbeschreibung..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Bildunterschrift</label>
                <input
                  type="text"
                  value={block.caption || ''}
                  onChange={(e) => updateBlock(index, { ...block, caption: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="Optional..."
                />
              </div>
            </div>
          </div>
        );

      case 'usp_list':
        return (
          <div className="space-y-3">
            <input
              type="text"
              value={block.title || ''}
              onChange={(e) => updateBlock(index, { ...block, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm font-medium"
              placeholder="Titel der Aufzählung (optional)"
            />
            <div className="space-y-2">
              {block.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex gap-2 items-center">
                  <span className="w-6 h-6 bg-[#3c8af7]/10 text-[#3c8af7] rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {itemIndex + 1}
                  </span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newItems = [...block.items];
                      newItems[itemIndex] = e.target.value;
                      updateBlock(index, { ...block, items: newItems });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="Punkt eingeben..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newItems = block.items.filter((_, i) => i !== itemIndex);
                      updateBlock(index, { ...block, items: newItems.length > 0 ? newItems : [''] });
                    }}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => updateBlock(index, { ...block, items: [...block.items, ''] })}
              className="flex items-center gap-1.5 text-sm font-medium text-[#3c8af7] hover:text-[#2b7ae6] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Punkt hinzufügen
            </button>
          </div>
        );

      case 'info_box':
        return (
          <div className="space-y-3">
            <input
              type="text"
              value={block.title || ''}
              onChange={(e) => updateBlock(index, { ...block, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm font-medium"
              placeholder="Titel der Info-Box (optional)"
            />
            <div className="space-y-2">
              {block.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex gap-2 items-center">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newItems = [...block.items];
                      newItems[itemIndex] = e.target.value;
                      updateBlock(index, { ...block, items: newItems });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="Punkt eingeben..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newItems = block.items.filter((_, i) => i !== itemIndex);
                      updateBlock(index, { ...block, items: newItems.length > 0 ? newItems : [''] });
                    }}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => updateBlock(index, { ...block, items: [...block.items, ''] })}
              className="flex items-center gap-1.5 text-sm font-medium text-[#3c8af7] hover:text-[#2b7ae6] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Punkt hinzufügen
            </button>
          </div>
        );
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => addBlock(type)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {blocks.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
          Noch keine Inhaltsblöcke. Fügen Sie oben einen Block hinzu.
        </div>
      )}

      {blocks.map((block, index) => (
        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50/80 border-b border-gray-100">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
              block.type === 'heading' ? 'bg-amber-50 text-amber-600' :
              block.type === 'text' ? 'bg-blue-50 text-blue-600' :
              block.type === 'image' ? 'bg-emerald-50 text-emerald-600' :
              block.type === 'info_box' ? 'bg-stone-100 text-stone-600' :
              'bg-violet-50 text-violet-600'
            }`}>
              {block.type === 'heading' ? `H${(block as any).level}` : BLOCK_LABELS[block.type]}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => moveBlock(index, -1)}
                disabled={index === 0}
                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors rounded"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => moveBlock(index, 1)}
                disabled={index === blocks.length - 1}
                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors rounded"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => removeBlock(index)}
                className="p-1 text-gray-300 hover:text-red-500 transition-colors rounded ml-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-4">
            {renderBlockContent(block, index)}
          </div>
        </div>
      ))}

      {blocks.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed border-gray-200">
          {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => addBlock(type)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Plus className="w-3 h-3" />
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface RichTextAreaProps {
  value: string;
  onChange: (val: string) => void;
}

function RichTextArea({ value, onChange }: RichTextAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = useCallback((prefix: string, suffix: string, placeholder: string) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = ta.value;
    const selected = text.substring(start, end);

    const before = text.substring(0, start);
    const after = text.substring(end);

    if (selected) {
      const newText = before + prefix + selected + suffix + after;
      onChange(newText);
      requestAnimationFrame(() => {
        ta.focus();
        ta.selectionStart = start + prefix.length;
        ta.selectionEnd = end + prefix.length;
      });
    } else {
      const newText = before + prefix + placeholder + suffix + after;
      onChange(newText);
      requestAnimationFrame(() => {
        ta.focus();
        ta.selectionStart = start + prefix.length;
        ta.selectionEnd = start + prefix.length + placeholder.length;
      });
    }
  }, [onChange]);

  const handleBold = useCallback(() => applyFormat('**', '**', 'fetter Text'), [applyFormat]);
  const handleItalic = useCallback(() => applyFormat('*', '*', 'kursiver Text'), [applyFormat]);

  const handleLink = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = ta.value;
    const selected = text.substring(start, end);

    const before = text.substring(0, start);
    const after = text.substring(end);

    const linkText = selected || 'Linktext';
    const newText = before + `[${linkText}](https://)` + after;
    onChange(newText);

    requestAnimationFrame(() => {
      ta.focus();
      const urlStart = start + linkText.length + 3;
      ta.selectionStart = urlStart;
      ta.selectionEnd = urlStart + 8;
    });
  }, [onChange]);

  const handleLinePrefix = useCallback((prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = ta.value;

    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = text.indexOf('\n', end);
    const actualEnd = lineEnd === -1 ? text.length : lineEnd;

    const selectedLines = text.substring(lineStart, actualEnd);
    const lines = selectedLines.split('\n');

    const transformed = lines.map((line) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith(prefix)) {
        return line;
      }
      return prefix + trimmed;
    }).join('\n');

    const newText = text.substring(0, lineStart) + transformed + text.substring(actualEnd);
    onChange(newText);

    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = lineStart;
      ta.selectionEnd = lineStart + transformed.length;
    });
  }, [onChange]);

  const handleBulletList = useCallback(() => handleLinePrefix('- '), [handleLinePrefix]);
  const handleNumberedList = useCallback(() => handleLinePrefix('1. '), [handleLinePrefix]);
  const handleBlockquote = useCallback(() => handleLinePrefix('> '), [handleLinePrefix]);

  const TOOLBAR_BUTTONS = [
    { action: handleBold, icon: Bold, label: 'Fett', shortcut: 'Strg+B' },
    { action: handleItalic, icon: Italic, label: 'Kursiv', shortcut: 'Strg+I' },
    { action: handleLink, icon: LinkIcon, label: 'Link', shortcut: 'Strg+K' },
    { divider: true },
    { action: handleBulletList, icon: List, label: 'Aufzählung' },
    { action: handleNumberedList, icon: ListOrdered, label: 'Nummerierung' },
    { action: handleBlockquote, icon: Quote, label: 'Zitat' },
  ] as const;

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        handleBold();
      } else if (e.key === 'i') {
        e.preventDefault();
        handleItalic();
      } else if (e.key === 'k') {
        e.preventDefault();
        handleLink();
      }
    }
  }, [handleBold, handleItalic, handleLink]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-blue focus-within:border-transparent">
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        {TOOLBAR_BUTTONS.map((btn, i) => {
          if ('divider' in btn) {
            return <div key={i} className="w-px h-5 bg-gray-200 mx-1" />;
          }
          return (
            <button
              key={i}
              type="button"
              onClick={btn.action}
              title={`${btn.label}${'shortcut' in btn ? ` (${btn.shortcut})` : ''}`}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-white rounded transition-colors"
            >
              <btn.icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={8}
        className="w-full px-4 py-3 focus:outline-none text-sm leading-relaxed resize-y"
        placeholder="Text eingeben..."
      />
    </div>
  );
}
