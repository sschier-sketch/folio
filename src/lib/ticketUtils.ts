export function getCategoryLabel(category: string): string {
  const categoryMap: { [key: string]: string } = {
    general: "Allgemein",
    maintenance: "Wartung",
    repair: "Reparatur",
    complaint: "Beschwerde",
    question: "Frage",
  };

  return categoryMap[category] || category;
}
