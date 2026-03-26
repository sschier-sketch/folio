/*
  # Update tasks Pro feature text to reflect standalone page

  1. Modified Tables
    - `pro_feature_texts`: Updates the existing `property_maintenance` entry
      - `page` changed from "property" to "tasks"
      - `tab` changed from "maintenance" to "overview"
      - `title` updated to "Aufgabenverwaltung"
      - `description` updated to better describe the standalone tasks section
      - `features` updated with comprehensive feature list

  2. Important Notes
    - The `feature_key` remains "property_maintenance" for backward compatibility
    - This update reflects that tasks now have their own top-level navigation section
*/

UPDATE pro_feature_texts
SET
  page = 'tasks',
  tab = 'overview',
  title = 'Aufgabenverwaltung',
  description = 'Organisieren Sie alle Aufgaben, Wartungen und Instandhaltungen zentral an einem Ort – mit Board- und Listenansicht, Zuweisungen und automatischen Erinnerungen.',
  features = '["Aufgaben erstellen, zuweisen und priorisieren", "Kanban-Board und Listenansicht", "Wiederkehrende Wartungen automatisch planen", "Kosten und Fristen je Aufgabe erfassen", "Verknüpfung mit Immobilien, Einheiten und Mietern", "Statusverfolgung und Aufgabenhistorie"]'::jsonb,
  updated_at = now()
WHERE feature_key = 'property_maintenance';
