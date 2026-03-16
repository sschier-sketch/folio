import { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Save,
  X,
  BookOpen,
  FolderOpen,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface HelpCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sort_order: number;
}

interface HelpArticle {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

type EditorMode =
  | { type: 'list' }
  | { type: 'edit-category'; category: Partial<HelpCategory> & { id?: string } }
  | { type: 'edit-article'; article: Partial<HelpArticle> & { id?: string } };

export default function AdminHelpCenterView() {
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [mode, setMode] = useState<EditorMode>({ type: 'list' });
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [catRes, artRes] = await Promise.all([
      supabase.from('help_categories').select('*').order('sort_order'),
      supabase.from('help_articles').select('*').order('sort_order'),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (artRes.data) setArticles(artRes.data);
    setLoading(false);
  }

  async function saveCategory(cat: Partial<HelpCategory> & { id?: string }) {
    setSaving(true);
    const slug = cat.slug || cat.name!.toLowerCase().replace(/[^a-z0-9äöüß]+/g, '-').replace(/(^-|-$)/g, '');
    const data = { name: cat.name!, slug, description: cat.description || '', icon: cat.icon || 'folder', sort_order: cat.sort_order || categories.length + 1, updated_at: new Date().toISOString() };

    if (cat.id) {
      await supabase.from('help_categories').update(data).eq('id', cat.id);
    } else {
      await supabase.from('help_categories').insert({ ...data, created_at: new Date().toISOString() });
    }
    await loadData();
    setMode({ type: 'list' });
    setSaving(false);
  }

  async function deleteCategory(id: string) {
    if (!confirm('Kategorie und alle zugehörigen Artikel löschen?')) return;
    await supabase.from('help_categories').delete().eq('id', id);
    await loadData();
  }

  async function saveArticle(art: Partial<HelpArticle> & { id?: string }) {
    setSaving(true);
    const slug = art.slug || art.title!.toLowerCase().replace(/[^a-z0-9äöüß]+/g, '-').replace(/(^-|-$)/g, '');
    const data = {
      category_id: art.category_id!,
      title: art.title!,
      slug,
      excerpt: art.excerpt || '',
      content: art.content || '',
      status: art.status || 'published',
      sort_order: art.sort_order || 0,
      updated_at: new Date().toISOString(),
    };

    if (art.id) {
      await supabase.from('help_articles').update(data).eq('id', art.id);
    } else {
      await supabase.from('help_articles').insert({ ...data, created_at: new Date().toISOString() });
    }
    await loadData();
    setMode({ type: 'list' });
    setSaving(false);
  }

  async function deleteArticle(id: string) {
    if (!confirm('Artikel wirklich löschen?')) return;
    await supabase.from('help_articles').delete().eq('id', id);
    await loadData();
  }

  async function toggleArticleStatus(art: HelpArticle) {
    const newStatus = art.status === 'published' ? 'draft' : 'published';
    await supabase.from('help_articles').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', art.id);
    await loadData();
  }

  function toggleExpand(catId: string) {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (mode.type === 'edit-category') {
    return <CategoryEditor category={mode.category} onSave={saveCategory} onCancel={() => setMode({ type: 'list' })} saving={saving} />;
  }

  if (mode.type === 'edit-article') {
    return <ArticleEditor article={mode.article} categories={categories} onSave={saveArticle} onCancel={() => setMode({ type: 'list' })} saving={saving} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Benutzerhandbuch</h2>
          <p className="text-sm text-gray-500 mt-1">
            {categories.length} Kategorien, {articles.length} Artikel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/benutzerhandbuch"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Vorschau
          </a>
          <button
            onClick={() => setMode({ type: 'edit-category', category: {} })}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            Neue Kategorie
          </button>
          <button
            onClick={() => setMode({ type: 'edit-article', article: { category_id: categories[0]?.id } })}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Neuer Artikel
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {categories.map(cat => {
          const catArticles = articles.filter(a => a.category_id === cat.id);
          const isExpanded = expandedCats.has(cat.id);
          return (
            <div key={cat.id} className="bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => toggleExpand(cat.id)} className="text-gray-400 hover:text-gray-600">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <GripVertical className="w-4 h-4 text-gray-300" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{cat.name}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{catArticles.length}</span>
                  </div>
                  {cat.description && <p className="text-xs text-gray-500 truncate">{cat.description}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setMode({ type: 'edit-article', article: { category_id: cat.id } })}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Artikel hinzufügen"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setMode({ type: 'edit-category', category: cat })}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Bearbeiten"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {isExpanded && catArticles.length > 0 && (
                <div className="border-t border-gray-100">
                  {catArticles.map(art => (
                    <div
                      key={art.id}
                      className="flex items-center gap-3 px-4 py-2.5 pl-12 hover:bg-gray-50 transition-colors"
                    >
                      <GripVertical className="w-3.5 h-3.5 text-gray-300" />
                      <BookOpen className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-800">{art.title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleArticleStatus(art)}
                          className={`p-1.5 rounded transition-colors ${art.status === 'published' ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                          title={art.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                        >
                          {art.status === 'published' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setMode({ type: 'edit-article', article: art })}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteArticle(art.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isExpanded && catArticles.length === 0 && (
                <div className="border-t border-gray-100 px-4 py-4 pl-12 text-sm text-gray-400">
                  Keine Artikel in dieser Kategorie.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryEditor({
  category,
  onSave,
  onCancel,
  saving,
}: {
  category: Partial<HelpCategory> & { id?: string };
  onSave: (cat: Partial<HelpCategory> & { id?: string }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(category.name || '');
  const [slug, setSlug] = useState(category.slug || '');
  const [description, setDescription] = useState(category.description || '');
  const [icon, setIcon] = useState(category.icon || 'folder');
  const [sortOrder, setSortOrder] = useState(category.sort_order || 0);

  const isEdit = !!category.id;

  return (
    <div>
      <button onClick={onCancel} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Zurück
      </button>
      <h2 className="text-xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
      </h2>
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            value={name}
            onChange={e => {
              setName(e.target.value);
              if (!isEdit) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9äöüß]+/g, '-').replace(/(^-|-$)/g, ''));
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="z.B. Immobilienverwaltung"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input
            value={slug}
            onChange={e => setSlug(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="Kurzbeschreibung der Kategorie"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Lucide Name)</label>
            <input
              value={icon}
              onChange={e => setIcon(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
              placeholder="z.B. building-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sortierung</label>
            <input
              type="number"
              value={sortOrder}
              onChange={e => setSortOrder(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => onSave({ ...category, name, slug, description, icon, sort_order: sortOrder })}
            disabled={!name.trim() || saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Wird gespeichert...' : 'Speichern'}
          </button>
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}

function ArticleEditor({
  article,
  categories,
  onSave,
  onCancel,
  saving,
}: {
  article: Partial<HelpArticle> & { id?: string };
  categories: HelpCategory[];
  onSave: (art: Partial<HelpArticle> & { id?: string }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(article.title || '');
  const [slug, setSlug] = useState(article.slug || '');
  const [categoryId, setCategoryId] = useState(article.category_id || categories[0]?.id || '');
  const [excerpt, setExcerpt] = useState(article.excerpt || '');
  const [content, setContent] = useState(article.content || '');
  const [status, setStatus] = useState(article.status || 'published');
  const [sortOrder, setSortOrder] = useState(article.sort_order || 0);
  const [showPreview, setShowPreview] = useState(false);

  const isEdit = !!article.id;

  return (
    <div>
      <button onClick={onCancel} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Zurück
      </button>
      <h2 className="text-xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Artikel bearbeiten' : 'Neuer Artikel'}
      </h2>
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
            <input
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (!isEdit) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9äöüß]+/g, '-').replace(/(^-|-$)/g, ''));
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Artikeltitel"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              value={slug}
              onChange={e => setSlug(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="published">Veröffentlicht</option>
              <option value="draft">Entwurf</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sortierung</label>
            <input
              type="number"
              value={sortOrder}
              onChange={e => setSortOrder(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kurzbeschreibung</label>
          <input
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="Kurzer Teaser-Text"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Inhalt (Markdown)</label>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              {showPreview ? 'Editor' : 'Vorschau'}
            </button>
          </div>
          {showPreview ? (
            <div className="w-full min-h-[300px] px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 prose prose-sm max-w-none overflow-auto">
              <div dangerouslySetInnerHTML={{ __html: simpleMarkdown(content) }} />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={16}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono leading-relaxed resize-y"
              placeholder="## Überschrift&#10;&#10;Text hier..."
            />
          )}
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => onSave({ ...article, title, slug, category_id: categoryId, excerpt, content, status, sort_order: sortOrder })}
            disabled={!title.trim() || !categoryId || saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Wird gespeichert...' : 'Speichern'}
          </button>
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}

function simpleMarkdown(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
  html = html.split('\n').map(l => {
    if (l.startsWith('<') || l.trim() === '') return l;
    return `<p>${l}</p>`;
  }).join('\n');
  return html;
}
