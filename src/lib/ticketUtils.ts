export function getCategoryLabel(category: string): string {
  const categoryMap: { [key: string]: string } = {
    message: "Nachricht",
    general: "Allgemein",
    maintenance: "Wartung",
    repair: "Reparatur",
    complaint: "Beschwerde",
    question: "Frage",
  };

  return categoryMap[category] || category;
}

export const TASK_RELEVANT_CATEGORIES = ["maintenance", "repair"] as const;

export const MESSAGE_CATEGORIES = ["message", "complaint", "general", "question"] as const;

const TICKET_TO_TASK_CATEGORY: Record<string, string> = {
  maintenance: "wartung",
  repair: "reparatur",
};

export function isTaskRelevantCategory(category: string): boolean {
  return (TASK_RELEVANT_CATEGORIES as readonly string[]).includes(category);
}

export function isMessageCategory(category: string): boolean {
  return (MESSAGE_CATEGORIES as readonly string[]).includes(category);
}

export function mapTicketCategoryToTaskCategory(ticketCategory: string): string {
  return TICKET_TO_TASK_CATEGORY[ticketCategory] || "allgemein";
}
