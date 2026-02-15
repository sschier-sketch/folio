import { RefLink } from "../common/RefLink";
import { CATEGORY_LABELS } from "./magazineConstants";

interface FeaturedPost {
  slug: string;
  title: string;
  excerpt?: string;
  hero_image_url?: string;
  category: string;
  reading_time_minutes: number;
  published_at: string;
}

interface Props {
  post: FeaturedPost;
  basePath: string;
}

export default function MagazineFeatured({ post, basePath }: Props) {
  return (
    <section className="pb-20">
      <div className="max-w-[1200px] mx-auto px-4">
        <RefLink
          to={`${basePath}/${post.slug}`}
          className="group grid md:grid-cols-2 gap-8 md:gap-12 items-center bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 transition-colors"
        >
          {post.hero_image_url && (
            <div className="overflow-hidden rounded-2xl md:rounded-none md:rounded-l-2xl h-64 md:h-[420px]">
              <img
                src={post.hero_image_url}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
              />
            </div>
          )}
          <div className={`p-8 md:pr-12 ${!post.hero_image_url ? "md:col-span-2" : ""}`}>
            <div className="flex items-center gap-3 mb-5">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#3c8af7]/10 text-[#3c8af7]">
                {CATEGORY_LABELS[post.category] || post.category}
              </span>
              <span className="text-sm text-gray-400">
                {post.reading_time_minutes} Min. Lesezeit
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 group-hover:text-[#3c8af7] transition-colors leading-tight">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="text-gray-500 leading-relaxed mb-6 line-clamp-3">
                {post.excerpt}
              </p>
            )}
            <span className="inline-block px-6 py-3 bg-[#3c8af7] text-white text-sm font-semibold rounded-lg group-hover:bg-[#2b7ae6] transition-colors">
              Artikel lesen
            </span>
          </div>
        </RefLink>
      </div>
    </section>
  );
}
