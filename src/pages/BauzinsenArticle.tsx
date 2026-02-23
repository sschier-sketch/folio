import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { ArrowLeft, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { RefLink } from "../components/common/RefLink";
import { CATEGORY_LABELS } from "../components/magazine/magazineConstants";
import ArticleTableOfContents from "../components/magazine/ArticleTableOfContents";
import ArticleFaq from "../components/magazine/ArticleFaq";
import ArticleShareButtons from "../components/magazine/ArticleShareButtons";
import MagazineCta from "../components/magazine/MagazineCta";
import InterestRateChart from "../components/magazine/InterestRateChart";
import InterestRateTable from "../components/magazine/InterestRateTable";
import { useInterestRates } from "../hooks/useInterestRates";
import type { HeadingEntry } from "../lib/markdownRenderer";

const ARTICLE_SLUG = "bauzinsen-entwicklung-aktuell-historie";
const MAGAZINE_BASE = "/magazin";

interface PostMeta {
  id: string;
  title: string;
  excerpt: string;
  summaryPoints: string[];
  heroImageUrl: string | null;
  heroImageAlt: string | null;
  authorName: string;
  publishedAt: string;
  category: string;
  readingTimeMinutes: number;
  seoTitle: string | null;
  seoDescription: string | null;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface RelatedPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  publishedAt: string;
  category: string;
  readingTimeMinutes: number;
}

const HEADINGS: HeadingEntry[] = [
  { id: "aktuelle-bauzinsen", text: "Aktuelle Bauzinsen", level: 2 },
  { id: "was-bedeutet-zinsbindung", text: "Was bedeutet Zinsbindung?", level: 2 },
  { id: "faktoren-die-bauzinsen-beeinflussen", text: "Faktoren die Bauzinsen beeinflussen", level: 2 },
  { id: "ezb-leitzins", text: "EZB-Leitzins", level: 3 },
  { id: "kapitalmarkt-und-pfandbriefe", text: "Kapitalmarkt und Pfandbriefe", level: 3 },
  { id: "bonität-und-beleihungsauslauf", text: "Bonitaet und Beleihungsauslauf", level: 3 },
  { id: "tipps-fuer-vermieter-und-investoren", text: "Tipps fuer Vermieter und Investoren", level: 2 },
  { id: "haeufig-gestellte-fragen", text: "Haeufig gestellte Fragen", level: 2 },
];

export default function BauzinsenArticle() {
  const navigate = useNavigate();
  const [post, setPost] = useState<PostMeta | null>(null);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const { data: rateData, loading: ratesLoading, error: ratesError, range, changeRange } = useInterestRates("5y");

  useEffect(() => {
    loadArticle();
  }, []);

  async function loadArticle() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("mag_posts")
        .select(`
          id, hero_image_url, hero_image_alt, author_name, published_at, category,
          translations:mag_post_translations!inner(
            title, slug, excerpt, summary_points, reading_time_minutes,
            seo_title, seo_description
          )
        `)
        .eq("status", "PUBLISHED")
        .eq("translations.locale", "de")
        .eq("translations.slug", ARTICLE_SLUG)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setNotFound(true);
        return;
      }

      const t = data.translations?.[0];
      setPost({
        id: data.id,
        title: t.title,
        excerpt: t.excerpt || "",
        summaryPoints: Array.isArray(t.summary_points) ? t.summary_points : [],
        heroImageUrl: data.hero_image_url,
        heroImageAlt: data.hero_image_alt,
        authorName: data.author_name,
        publishedAt: data.published_at,
        category: data.category,
        readingTimeMinutes: t.reading_time_minutes || 8,
        seoTitle: t.seo_title,
        seoDescription: t.seo_description,
      });

      document.title = t.seo_title || `${t.title} – rentably`;

      if (t.seo_description) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement("meta");
          metaDesc.setAttribute("name", "description");
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute("content", t.seo_description);
      }

      loadFaqs(data.id);
      loadRelated(data.id);
    } catch (err) {
      console.error("Error loading bauzinsen article:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  async function loadFaqs(postId: string) {
    try {
      const { data } = await supabase
        .from("mag_post_faqs")
        .select("id, question, answer")
        .eq("post_id", postId)
        .order("sort_order", { ascending: true });
      setFaqs(data || []);
    } catch (err) {
      console.error("Error loading FAQs:", err);
    }
  }

  async function loadRelated(postId: string) {
    try {
      const { data } = await supabase
        .from("mag_posts")
        .select(`
          id, hero_image_url, hero_image_alt, author_name, published_at, category,
          translations:mag_post_translations!inner(title, slug, excerpt, reading_time_minutes)
        `)
        .eq("status", "PUBLISHED")
        .eq("translations.locale", "de")
        .neq("id", postId)
        .not("published_at", "is", null)
        .order("published_at", { ascending: false })
        .limit(3);

      if (data) {
        setRelatedPosts(
          data.map((p: any) => ({
            id: p.id,
            slug: p.translations[0]?.slug || "",
            title: p.translations[0]?.title || "",
            excerpt: p.translations[0]?.excerpt,
            heroImageUrl: p.hero_image_url,
            heroImageAlt: p.hero_image_alt,
            publishedAt: p.published_at,
            category: p.category,
            readingTimeMinutes: p.translations[0]?.reading_time_minutes || 1,
          }))
        );
      }
    } catch (err) {
      console.error("Error loading related posts:", err);
    }
  }

  const faqSchema = useMemo(() => {
    if (faqs.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    };
  }, [faqs]);

  const articleSchema = useMemo(() => {
    if (!post) return null;
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.excerpt,
      author: { "@type": "Organization", name: post.authorName },
      publisher: { "@type": "Organization", name: "rentably", url: "https://rentab.ly" },
      datePublished: post.publishedAt,
      image: post.heroImageUrl || undefined,
      mainEntityOfPage: `https://rentab.ly/magazin/${ARTICLE_SLUG}`,
    };
  }, [post]);

  const activeHeadings = useMemo(() => {
    if (faqs.length === 0) {
      return HEADINGS.filter((h) => h.id !== "haeufig-gestellte-fragen");
    }
    return HEADINGS;
  }, [faqs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#3c8af7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Artikel nicht gefunden</h1>
          <p className="text-gray-500 mb-8">Der gesuchte Artikel existiert nicht oder wurde entfernt.</p>
          <RefLink
            to={MAGAZINE_BASE}
            className="inline-block px-6 py-3 bg-[#3c8af7] text-white text-sm font-semibold rounded-lg hover:bg-[#2b7ae6] transition-colors"
          >
            Zurueck zum Magazin
          </RefLink>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(post.publishedAt).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const summaryPoints = post.summaryPoints.filter((p) => p.trim());

  return (
    <div className="bg-white">
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      {articleSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      )}

      {post.heroImageUrl && (
        <div className="w-full max-w-[1200px] mx-auto px-4 pt-8">
          <img
            src={post.heroImageUrl}
            alt={post.heroImageAlt || post.title}
            className="w-full h-48 sm:h-64 md:h-[420px] object-cover rounded-2xl"
          />
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-4 pt-10 pb-4">
        <RefLink
          to={MAGAZINE_BASE}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Alle Artikel
        </RefLink>
      </div>

      <article className="max-w-[1200px] mx-auto px-4 pb-16">
        <div className="flex gap-16">
          <div className="max-w-[760px] flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-5">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#3c8af7]/10 text-[#3c8af7]">
                {CATEGORY_LABELS[post.category] || post.category}
              </span>
              <span className="text-sm text-gray-400">{post.readingTimeMinutes} Min. Lesezeit</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-gray-900 leading-tight mb-6">
              {post.title}
            </h1>

            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{post.authorName}</span>
                <span className="text-gray-200">|</span>
                <span>{formattedDate}</span>
              </div>
              <ArticleShareButtons url={window.location.href} title={post.title} />
            </div>

            {post.excerpt && (
              <div className="mb-8 text-lg text-gray-600 leading-relaxed font-medium">
                {post.excerpt}
              </div>
            )}

            {summaryPoints.length > 0 && (
              <div className="mb-12 bg-gradient-to-br from-blue-50 to-sky-50/50 rounded-2xl p-6 md:p-8 border border-blue-100/60">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#3c8af7] mb-4">
                  Das Wichtigste in Kuerze
                </h3>
                <ul className="space-y-3">
                  {summaryPoints.map((point, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <CheckCircle2 className="w-5 h-5 text-[#3c8af7] flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 leading-relaxed text-[15px]">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="magazine-article-content">
              <h2 id="aktuelle-bauzinsen" style={{ scrollMarginTop: "6rem" }}>
                Aktuelle Bauzinsen (Deutschland)
              </h2>
              <p>
                Der folgende Chart zeigt die monatlichen <strong>Effektivzinssaetze fuer Wohnungsbaukredite</strong> an
                private Haushalte in Deutschland. Es handelt sich um volumengewichtete Durchschnittswerte
                fuer Neugeschaeft, erhoben im Rahmen der MFI-Zinsstatistik der Deutschen Bundesbank.
              </p>
              <p>
                Dargestellt sind vier Zinsbindungsfristen: variabel bzw. bis 1 Jahr, 1 bis 5 Jahre,
                5 bis 10 Jahre und ueber 10 Jahre. Sie koennen einzelne Linien ueber die Legende ein- und
                ausblenden und den Betrachtungszeitraum ueber die Buttons anpassen.
              </p>
            </div>

            {ratesLoading && (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-6 h-6 text-gray-300 animate-spin" />
              </div>
            )}

            {ratesError === "not_found" && !ratesLoading && (
              <div className="my-8 flex items-start gap-3 p-5 bg-amber-50 border border-amber-100 rounded-xl">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Zinsdaten aktuell nicht verfuegbar</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Der woechentliche Datenimport von der Bundesbank wurde noch nicht ausgefuehrt.
                    Die Daten werden automatisch nachgeladen, sobald sie verfuegbar sind.
                  </p>
                </div>
              </div>
            )}

            {ratesError && ratesError !== "not_found" && !ratesLoading && (
              <div className="my-8 flex items-start gap-3 p-5 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">Fehler beim Laden der Zinsdaten: {ratesError}</p>
              </div>
            )}

            {rateData && !ratesLoading && (
              <>
                <InterestRateChart
                  series={rateData.series.series}
                  endPeriod={rateData.end_period}
                  fetchedAt={rateData.fetched_at}
                  range={range}
                  onRangeChange={changeRange}
                />
                <InterestRateTable series={rateData.series.series} />
              </>
            )}

            <div className="magazine-article-content">
              <h2 id="was-bedeutet-zinsbindung" style={{ scrollMarginTop: "6rem" }}>
                Was bedeutet Zinsbindung / anfaengliche Zinsfestschreibung?
              </h2>
              <p>
                Die <strong>anfaengliche Zinsbindung</strong> (auch Zinsfestschreibung) legt fest, wie lange
                der bei Vertragsabschluss vereinbarte Zinssatz unveraendert bleibt. Waehrend dieser
                Phase sind Ihre monatlichen Raten fix kalkulierbar -- unabhaengig davon, wie sich der
                allgemeine Zinssatz am Markt entwickelt.
              </p>
              <p>
                Nach Ablauf der Zinsbindung wird der Zinssatz in der Regel neu verhandelt
                (Anschlussfinanzierung). Die Wahl der Zinsbindungsdauer ist daher eine strategische
                Entscheidung:
              </p>
              <ul>
                <li>
                  <strong>Kurze Zinsbindung (variabel bis 5 Jahre):</strong> Haeufig guenstigerer
                  Anfangszins, dafuer hoehere Unsicherheit bei der Anschlussfinanzierung.
                  Sinnvoll, wenn Sie einen baldigen Verkauf oder Sondertilgung planen.
                </li>
                <li>
                  <strong>Mittlere Zinsbindung (5 bis 10 Jahre):</strong> Der Klassiker fuer viele
                  Immobilienkaeufer. Guter Kompromiss zwischen Zinssicherheit und moderatem
                  Zinsaufschlag.
                </li>
                <li>
                  <strong>Lange Zinsbindung (ueber 10 Jahre):</strong> Maximale Planungssicherheit,
                  dafuer etwas hoeherer Zinssatz. Besonders geeignet fuer Vermieter, die eine
                  langfristige Mietrendite kalkulieren moechten.
                </li>
              </ul>

              <h2 id="faktoren-die-bauzinsen-beeinflussen" style={{ scrollMarginTop: "6rem" }}>
                Welche Faktoren beeinflussen Bauzinsen?
              </h2>
              <p>
                Die Hoehe der Bauzinsen haengt von mehreren Faktoren ab, die sich grob in
                makrooekonomische und individuelle Einflussfaktoren gliedern lassen.
              </p>

              <h3 id="ezb-leitzins">EZB-Leitzins</h3>
              <p>
                Der <strong>Leitzins der Europaeischen Zentralbank</strong> beeinflusst die
                Refinanzierungskosten der Banken. Senkt die EZB den Leitzins, koennen Banken
                guenstiger Geld leihen und geben dies tendenziell an Kreditnehmer weiter.
                Der sprunghafte Anstieg der Bauzinsen ab Mitte 2022 ist direkt auf die
                aggressive Leitzins-Erhoehung der EZB zurueckzufuehren.
              </p>

              <h3 id="kapitalmarkt-und-pfandbriefe">Kapitalmarkt und Pfandbriefe</h3>
              <p>
                Langfristige Bauzinsen orientieren sich stark an den Renditen von
                Pfandbriefen und Bundesanleihen. Steigen die Renditen am Kapitalmarkt
                (etwa wegen Inflationserwartungen oder geopolitischer Unsicherheit),
                ziehen die Bauzinsen nach.
              </p>

              <h3 id="bonität-und-beleihungsauslauf">Bonitaet und Beleihungsauslauf</h3>
              <p>
                Neben den Marktfaktoren spielt Ihre individuelle <strong>Bonitaet</strong> eine
                entscheidende Rolle. Ein niedriger Beleihungsauslauf (hoher Eigenkapitalanteil)
                fuehrt in der Regel zu besseren Konditionen. Als Faustregel gilt: Mindestens
                20 % Eigenkapital sollten Sie mitbringen, um guenstige Zinsen zu erhalten.
              </p>

              <h2 id="tipps-fuer-vermieter-und-investoren" style={{ scrollMarginTop: "6rem" }}>
                Tipps fuer Vermieter und Investoren
              </h2>
              <p>
                Fuer Vermieter und Immobilieninvestoren gelten bei der Baufinanzierung einige
                besondere Ueberlegungen:
              </p>
              <ul>
                <li>
                  <strong>Kalkulieren Sie konservativ:</strong> Rechnen Sie Ihre Mietrendite
                  mit dem aktuellen Zinssatz und einem Puffer fuer die Anschlussfinanzierung.
                  Als Faustregel: Planen Sie mit mindestens 1-2 Prozentpunkten Zinsaufschlag
                  fuer die Zeit nach der Zinsbindung.
                </li>
                <li>
                  <strong>Laengere Zinsbindung bevorzugen:</strong> Bei Vermietungsobjekten
                  lohnt sich oft eine Zinsbindung von 10 Jahren oder mehr. Die hoehere
                  Planungssicherheit ueberwiegt den geringen Zinsaufschlag, da sich Ihre
                  Mieteinnahmen zuverlaessig kalkulieren lassen.
                </li>
                <li>
                  <strong>Sondertilgungsrecht sichern:</strong> Vereinbaren Sie mindestens
                  5 % jaehrliche Sondertilgung. So koennen Sie bei guter Liquiditaet schneller
                  tilgen und Zinskosten sparen.
                </li>
                <li>
                  <strong>Zinsen steuerlich absetzen:</strong> Die Darlehenszinsen fuer
                  vermietete Immobilien sind als Werbungskosten steuerlich absetzbar. Eine
                  hoehere Anfangstilgung reduziert zwar die Zinskosten, aber auch die
                  steuerliche Abzugsfaehigkeit.
                </li>
                <li>
                  <strong>Gesamtrendite im Blick behalten:</strong> Nutzen Sie die{" "}
                  <RefLink to="/registrieren" className="text-[#3c8af7] underline underline-offset-2 hover:text-[#2b7ae6]">
                    Finanzanalyse-Tools von rentably
                  </RefLink>
                  , um Mietrendite, Cashflow und Wertentwicklung Ihrer Immobilien im Kontext
                  der aktuellen Zinsentwicklung zu bewerten.
                </li>
              </ul>
            </div>

            <ArticleFaq faqs={faqs} />
          </div>

          {activeHeadings.length > 0 && (
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <ArticleTableOfContents headings={activeHeadings} />
            </aside>
          )}
        </div>
      </article>

      {relatedPosts.length > 0 && (
        <section className="bg-gray-50 py-20">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Neueste Artikel</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((rp) => (
                <RefLink
                  key={rp.id}
                  to={`${MAGAZINE_BASE}/${rp.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  {rp.heroImageUrl && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={rp.heroImageUrl}
                        alt={rp.heroImageAlt || rp.title}
                        className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                      <span className="text-[#3c8af7] font-semibold">
                        {CATEGORY_LABELS[rp.category] || rp.category}
                      </span>
                      <span>|</span>
                      <span>{rp.readingTimeMinutes} Min.</span>
                    </div>
                    <h3 className="font-bold text-gray-900 group-hover:text-[#3c8af7] transition-colors line-clamp-2 mb-2">
                      {rp.title}
                    </h3>
                    {rp.excerpt && (
                      <p className="text-sm text-gray-500 line-clamp-2">{rp.excerpt}</p>
                    )}
                  </div>
                </RefLink>
              ))}
            </div>
          </div>
        </section>
      )}

      <MagazineCta />
    </div>
  );
}
