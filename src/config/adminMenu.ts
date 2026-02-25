import {
  Activity,
  Users,
  MessageSquare,
  Mail,
  FileText,
  Bell,
  Settings,
  Globe,
  TrendingUp,
  Sparkles,
  BookOpen,
  AtSign,
  Timer,
  HelpCircle,
  PenLine,
  Monitor,
  Receipt,
  type LucideIcon,
} from "lucide-react";

export type AdminTabKey =
  | "overview"
  | "users"
  | "tickets"
  | "templates"
  | "email_logs"
  | "document_templates"
  | "system_updates"
  | "feedback"
  | "system_settings"
  | "system_info"
  | "seo"
  | "affiliates"
  | "pro_features"
  | "magazine"
  | "email_settings"
  | "cron_jobs"
  | "faqs"
  | "cms"
  | "invoices";

export interface AdminMenuItem {
  key: AdminTabKey;
  label: string;
  icon: LucideIcon;
}

export interface AdminMenuGroup {
  id: string;
  label: string;
  items: AdminMenuItem[];
  defaultOpen?: boolean;
}

export const adminMenuGroups: AdminMenuGroup[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    defaultOpen: true,
    items: [
      { key: "overview", label: "Übersicht", icon: Activity },
    ],
  },
  {
    id: "users_communication",
    label: "User & Kommunikation",
    defaultOpen: true,
    items: [
      { key: "users", label: "Benutzer", icon: Users },
      { key: "tickets", label: "Tickets", icon: MessageSquare },
      { key: "feedback", label: "Feedback", icon: MessageSquare },
    ],
  },
  {
    id: "email_documents",
    label: "E-Mail & Dokumente",
    defaultOpen: true,
    items: [
      { key: "templates", label: "E-Mail Templates", icon: Mail },
      { key: "email_logs", label: "E-Mail Logs", icon: Activity },
      { key: "email_settings", label: "E-Mail Einstellungen", icon: AtSign },
      { key: "document_templates", label: "Dokument-Vorlagen", icon: FileText },
    ],
  },
  {
    id: "content_growth",
    label: "Content & Growth",
    defaultOpen: true,
    items: [
      { key: "cms", label: "CMS", icon: PenLine },
      { key: "magazine", label: "Magazin", icon: BookOpen },
      { key: "faqs", label: "FAQ-Verwaltung", icon: HelpCircle },
      { key: "seo", label: "SEO", icon: Globe },
      { key: "affiliates", label: "Affiliates", icon: TrendingUp },
      { key: "pro_features", label: "Pro-Features", icon: Sparkles },
    ],
  },
  {
    id: "billing",
    label: "Finanzen",
    defaultOpen: true,
    items: [
      { key: "invoices", label: "Rechnungen", icon: Receipt },
    ],
  },
  {
    id: "system",
    label: "System",
    defaultOpen: true,
    items: [
      { key: "system_settings", label: "Einstellungen", icon: Settings },
      { key: "system_info", label: "Systeminfos", icon: Monitor },
      { key: "system_updates", label: "System-Updates", icon: Bell },
      { key: "cron_jobs", label: "Cron Jobs", icon: Timer },
    ],
  },
];

export function getMenuItemByKey(key: AdminTabKey): AdminMenuItem | undefined {
  for (const group of adminMenuGroups) {
    const item = group.items.find((i) => i.key === key);
    if (item) return item;
  }
  return undefined;
}

export function getGroupByKey(key: AdminTabKey): AdminMenuGroup | undefined {
  return adminMenuGroups.find((g) => g.items.some((i) => i.key === key));
}
