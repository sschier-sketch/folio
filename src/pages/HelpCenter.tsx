import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronRight,
  BookOpen,
  Info,
  Building2,
  Users,
  Wallet,
  Mail,
  Zap,
  BarChart3,
  Settings,
  HelpCircle,
  ArrowLeft,
  Clock,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

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
  sort_order: number;
  updated_at: string;
  category?: HelpCategory;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Info,
  'building-2': Building2,
  users: Users,
  wallet: Wallet,
  mail: Mail,
  zap: Zap,
  'bar-chart-3': BarChart3,
  settings: Settings,
  'help-circle': HelpCircle,
  folder: BookOpen,
};

function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ICON_MAP[icon] || BookOpen;
  return <Icon className={className} />;
}

function renderMarkdown(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-gray-700 mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-gray-800 mt-8 mb-3">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 mb-1 list-decimal">$2</li>');

  html = html.replace(/((?:<li class="ml-4 mb-1">.*<\/li>\n?)+)/g, '<ul class="list-disc mb-4">$1</ul>');
  html = html.replace(/((?:<li class="ml-4 mb-1 list-decimal">.*<\/li>\n?)+)/g, '<ol class="list-decimal mb-4">$1</ol>');

  html = html
    .split('\n')
    .map(line => {
      if (
        line.startsWith('<h') ||
        line.startsWith('<ul') ||
        line.startsWith('<ol') ||
        line.startsWith('<li') ||
        line.startsWith('</') ||
        line.trim() === ''
      ) return line;
      return `<p class="mb-3 text-gray-600 leading-relaxed">${line}</p>`;
    })
    .join('\n');

  return html;
}

export default function HelpCenter() {
  const { categorySlug, articleSlug } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [catRes, artRes] = await Promise.all([
      supabase.from('help_categories').select('*').order('sort_order'),
      supabase.from('help_articles').select('*, category:help_categories(*)').eq('status', 'published').order('sort_order'),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (artRes.data) setArticles(artRes.data as HelpArticle[]);
    setLoading(false);
  }

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return articles.filter(
      a =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q)
    );
  }, [search, articles]);

  const activeCategory = categorySlug
    ? categories.find(c => c.slug === categorySlug)
    : null;

  const activeArticle = articleSlug
    ? articles.find(a => a.slug === articleSlug)
    : null;

  const categoryArticles = activeCategory
    ? articles.filter(a => a.category_id === activeCategory.id)
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (activeArticle) {
    const cat = categories.find(c => c.id === activeArticle.category_id);
    return <ArticleView article={activeArticle} category={cat} navigate={navigate} />;
  }

  if (activeCategory) {
    return (
      <CategoryView
        category={activeCategory}
        articles={categoryArticles}
        navigate={navigate}
      />
    );
  }

  return (
    <HomeView
      categories={categories}
      articles={articles}
      search={search}
      setSearch={setSearch}
      searchResults={searchResults}
      navigate={navigate}
    />
  );
}

function HomeView({
  categories,
  articles,
  search,
  setSearch,
  searchResults,
  navigate,
}: {
  categories: HelpCategory[];
  articles: HelpArticle[];
  search: string;
  setSearch: (s: string) => void;
  searchResults: HelpArticle[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const popularArticles = articles.slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-b from-gray-700 to-gray-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 text-sm">
            <BookOpen className="w-4 h-4" />
            <span>Benutzerhandbuch</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
            Wie können wir helfen?
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
            Willkommen im Rentably Benutzerhandbuch. Hier finden Sie Schritt-für-Schritt-Anleitungen
            und Erklärungen zu allen Funktionen der Plattform.
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Suchen Sie nach Themen, Funktionen oder Fragen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-gray-800 placeholder-gray-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-6">
        {search.trim() ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {searchResults.length} Ergebnis{searchResults.length !== 1 ? 'se' : ''} für "{search}"
            </h2>
            {searchResults.length === 0 ? (
              <p className="text-gray-500">
                Keine Artikel gefunden. Versuchen Sie einen anderen Suchbegriff.
              </p>
            ) : (
              <div className="space-y-3">
                {searchResults.map(a => {
                  const cat = categories.find(c => c.id === a.category_id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => navigate(`/benutzerhandbuch/${cat?.slug}/${a.slug}`)}
                      className="w-full text-left p-4 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <BookOpen className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <h3 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                            {a.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{a.excerpt}</p>
                          {cat && (
                            <span className="inline-block text-xs text-gray-400 mt-1">{cat.name}</span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {categories.map(cat => {
                const count = articles.filter(a => a.category_id === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => navigate(`/benutzerhandbuch/${cat.slug}`)}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md hover:border-blue-200 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                        <CategoryIcon icon={cat.icon} className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                          {cat.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{cat.description}</p>
                        <span className="text-xs text-gray-400 mt-2 inline-block">
                          {count} Artikel
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mb-16">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Beliebte Artikel</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {popularArticles.map(a => {
                  const cat = categories.find(c => c.id === a.category_id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => navigate(`/benutzerhandbuch/${cat?.slug}/${a.slug}`)}
                      className="bg-white rounded-lg border border-gray-100 p-4 text-left hover:border-blue-200 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                            {a.title}
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{a.excerpt}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CategoryView({
  category,
  articles,
  navigate,
}: {
  category: HelpCategory;
  articles: HelpArticle[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/benutzerhandbuch')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Benutzerhandbuch
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <CategoryIcon icon={category.icon} className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{category.name}</h1>
              <p className="text-gray-500 text-sm mt-0.5">{category.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {articles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p>In dieser Kategorie gibt es noch keine Artikel.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map(a => (
              <button
                key={a.id}
                onClick={() => navigate(`/benutzerhandbuch/${category.slug}/${a.slug}`)}
                className="w-full bg-white rounded-lg border border-gray-100 p-5 text-left hover:border-blue-200 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-blue-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                      {a.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{a.excerpt}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleView({
  article,
  category,
  navigate,
}: {
  article: HelpArticle;
  category?: HelpCategory;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-4 flex-wrap">
            <button
              onClick={() => navigate('/benutzerhandbuch')}
              className="hover:text-blue-600 transition-colors"
            >
              Benutzerhandbuch
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            {category && (
              <>
                <button
                  onClick={() => navigate(`/benutzerhandbuch/${category.slug}`)}
                  className="hover:text-blue-600 transition-colors"
                >
                  {category.name}
                </button>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
            <span className="text-gray-800 font-medium">{article.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <article className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{article.title}</h1>
          <p className="text-gray-500 mb-6">{article.excerpt}</p>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-8 pb-6 border-b border-gray-100">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Aktualisiert am{' '}
              {new Date(article.updated_at).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
          <div
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
          />
        </article>

        <div className="mt-6">
          <button
            onClick={() => {
              if (category) navigate(`/benutzerhandbuch/${category.slug}`);
              else navigate('/benutzerhandbuch');
            }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {category ? `Zurück zu ${category.name}` : 'Zurück zum Benutzerhandbuch'}
          </button>
        </div>
      </div>
    </div>
  );
}
