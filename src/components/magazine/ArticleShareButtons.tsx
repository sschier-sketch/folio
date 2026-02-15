import { Facebook, Linkedin, Mail } from "lucide-react";

interface Props {
  url: string;
  title: string;
}

export default function ArticleShareButtons({ url, title }: Props) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const emailSubject = encodeURIComponent(
    "Interessanter Fachartikel rund um Vermietung & Immobilien"
  );
  const emailBody = encodeURIComponent(
    `In diesem Beitrag werden wichtige Aspekte für Vermieter kompakt und verständlich zusammengefasst. Ich teile ihn gern mit dir zur Inspiration oder als Entscheidungshilfe.\n\nZum Artikel: ${url}`
  );

  const links = [
    {
      label: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}`,
    },
    {
      label: "E-Mail",
      icon: Mail,
      href: `mailto:?subject=${emailSubject}&body=${emailBody}`,
    },
  ];

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        Teilen
      </span>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target={link.label === "E-Mail" ? undefined : "_blank"}
          rel="noopener noreferrer"
          aria-label={`Artikel teilen via ${link.label}`}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-[#3c8af7] hover:text-white transition-all duration-200"
        >
          <link.icon className="w-4 h-4" />
        </a>
      ))}
    </div>
  );
}
