/*
  # Kredite: Datumsfelder optional machen

  1. Problem
    - start_date und end_date waren als NOT NULL definiert
    - Beim Erstellen neuer Kredite werden diese Felder oft leer gelassen
    - Dies führte zu Fehlern beim INSERT

  2. Änderungen
    - Entferne NOT NULL Constraint von start_date
    - Entferne NOT NULL Constraint von end_date
    - Beide Felder sind jetzt optional

  3. Sicherheit
    - Keine Änderungen an RLS-Policies nötig
    - Der Trigger create_loan_reminders() prüft bereits auf NULL-Werte

  4. Hinweis
    - Bearbeiten bestehender Kredite funktionierte, weil Daten vorhanden waren
    - Nur Erstellen neuer Kredite schlug fehl
*/

-- =====================================================
-- 1. ENTFERNE NOT NULL CONSTRAINTS
-- =====================================================

-- Mache start_date optional
ALTER TABLE loans 
  ALTER COLUMN start_date DROP NOT NULL;

-- Mache end_date optional  
ALTER TABLE loans 
  ALTER COLUMN end_date DROP NOT NULL;

-- =====================================================
-- 2. DOKUMENTATION
-- =====================================================

COMMENT ON COLUMN loans.start_date IS 
'Startdatum des Kredits (optional). Kann nachträglich ergänzt werden.';

COMMENT ON COLUMN loans.end_date IS 
'Enddatum des Kredits (optional). Kann nachträglich ergänzt werden.';
