import { RefLink } from "../common/RefLink";
import { CATEGORY_LABELS } from "./magazineConstants";

interface Post {
  slug: string;
  title: string;
  excerpt?: string;
  hero_image_url?: string;
  category: string;
  reading_time_minutes: number;
  author_name: string;
  published_at: string;
}

interface Props {
  post: Post;
  basePath: string;
}

export default function MagazineCard({ post, basePath }: Props) {
  const formattedDate = new Date(post.published_at).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <RefLink
      to={`${basePath}/${post.slug}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative overflow-hidden h-52">
        {post.hero_image_url ? (
          <img
            src={post.hero_image_url}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-300 text-sm">Kein Bild</span>
          </div>
        )}
        <span className="absolute top-4 left-4 px-3 py-1 text-xs font-semibold rounded-full bg-white/90 backdrop-blur-sm text-gray-800">
          {CATEGORY_LABELS[post.category] || post.category}
        </span>
      </div>
      <div className="flex flex-col flex-1 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#3c8af7] transition-colors leading-snug line-clamp-2">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-50 mt-auto">
          <div className="flex items-center gap-2">
            <span>{post.author_name}</span>
            <span className="text-gray-200">|</span>
            <span>{formattedDate}</span>
          </div>
          <span>{post.reading_time_minutes} Min.</span>
        </div>
      </div>
    </RefLink>
  );
}
