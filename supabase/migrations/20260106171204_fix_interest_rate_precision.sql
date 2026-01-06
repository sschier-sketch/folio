/*
  # Zinssatz-Präzision auf 3 Nachkommastellen erweitern

  1. Änderungen
    - Ändert interest_rate von numeric(5,2) auf numeric(10,3)
    - Ermöglicht Zinssätze mit 3 Dezimalstellen (z.B. 2,375%)
*/

-- Ändere die Präzision der interest_rate Spalte
ALTER TABLE loans 
ALTER COLUMN interest_rate TYPE numeric(10,3);
