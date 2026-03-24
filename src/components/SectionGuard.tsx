import { ReactNode } from "react";
import { ShieldOff } from "lucide-react";
import { usePermissions, SectionKey } from "../hooks/usePermissions";
import { useLanguage } from "../contexts/LanguageContext";

interface SectionGuardProps {
  section: SectionKey;
  children: ReactNode;
}

const SECTION_LABELS_DE: Record<SectionKey, string> = {
  finances: "Finanzen",
  statements: "Abrechnungen",
  rent_payments: "Mieteingänge",
  leases: "Mietverhältnisse",
  messages: "Nachrichten",
  tasks: "Aufgaben",
  billing: "Tarif & Abrechnung",
  users: "Benutzerverwaltung",
};

const SECTION_LABELS_EN: Record<SectionKey, string> = {
  finances: "Finances",
  statements: "Statements",
  rent_payments: "Rent Payments",
  leases: "Leases",
  messages: "Messages",
  tasks: "Tasks",
  billing: "Billing",
  users: "User Management",
};

export function SectionGuard({ section, children }: SectionGuardProps) {
  const { isOwner, isActiveMember, canAccessSection, loading } = usePermissions();
  const { language } = useLanguage();
  const de = language === "de";

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isOwner) return <>{children}</>;

  if (!isActiveMember) {
    return (
      <div className="bg-white rounded-lg p-12 text-center">
        <ShieldOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-dark mb-2">
          {de ? "Zugriff deaktiviert" : "Access Disabled"}
        </h3>
        <p className="text-gray-400 max-w-md mx-auto">
          {de
            ? "Ihr Zugang wurde deaktiviert. Bitte kontaktieren Sie den Kontoinhaber."
            : "Your access has been disabled. Please contact the account owner."}
        </p>
      </div>
    );
  }

  if (!canAccessSection(section)) {
    const label = de ? SECTION_LABELS_DE[section] : SECTION_LABELS_EN[section];
    return (
      <div className="bg-white rounded-lg p-12 text-center">
        <ShieldOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-dark mb-2">
          {de ? "Kein Zugriff" : "No Access"}
        </h3>
        <p className="text-gray-400 max-w-md mx-auto">
          {de
            ? `Sie haben keine Berechtigung für den Bereich "${label}". Bitte kontaktieren Sie den Kontoinhaber, um Zugriff zu erhalten.`
            : `You do not have permission to access "${label}". Please contact the account owner to get access.`}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
