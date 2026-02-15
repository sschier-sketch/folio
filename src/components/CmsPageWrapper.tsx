import { useCmsPage } from "../hooks/useCmsPage";

interface CmsPageWrapperProps {
  slug: string;
  fallback: React.ReactNode;
}

export default function CmsPageWrapper({ slug, fallback }: CmsPageWrapperProps) {
  const { content, loading } = useCmsPage(slug);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!content) {
    return <>{fallback}</>;
  }

  return (
    <div
      className="prose prose-blue max-w-none space-y-4 text-gray-700
        prose-headings:text-dark
        prose-h2:text-2xl prose-h2:font-semibold prose-h2:mb-4 prose-h2:mt-8
        prose-h3:text-xl prose-h3:font-semibold prose-h3:mb-3 prose-h3:mt-6
        prose-p:leading-relaxed
        prose-li:leading-relaxed
        prose-strong:text-dark
        prose-a:text-primary-blue prose-a:no-underline hover:prose-a:underline"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
