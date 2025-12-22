/*
  # Automatische Erinnerungstickets für Mieterhöhungen

  1. Änderungen
    - Fügt `auto_create_rent_increase_tickets` boolean Feld zu `rental_contracts` hinzu
    - Erstellt Funktion `create_rent_increase_reminder_tickets()` die automatisch Tickets erstellt
    - Die Funktion erstellt Tickets 3 Monate vor Indexmiete- und Staffelmiete-Erhöhungen
  
  2. Funktionsweise
    - Für Indexmiete: Prüft `index_first_increase_date` und danach jährlich
    - Für Staffelmiete: Berechnet basierend auf `contract_start` und `staffel_years`
    - Erstellt nur ein Ticket pro Erhöhung (verhindert Duplikate)
  
  3. Verwendung
    - Kann manuell aufgerufen werden: SELECT create_rent_increase_reminder_tickets();
    - Sollte täglich via Cron ausgeführt werden (z.B. via Edge Function)
*/

-- Feld hinzufügen für automatische Ticket-Erstellung
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'auto_create_rent_increase_tickets'
  ) THEN
    ALTER TABLE rental_contracts 
    ADD COLUMN auto_create_rent_increase_tickets boolean DEFAULT false;
  END IF;
END $$;

-- Funktion zum Erstellen von Erinnerungstickets
CREATE OR REPLACE FUNCTION create_rent_increase_reminder_tickets()
RETURNS TABLE(tickets_created integer) AS $$
DECLARE
  contract_record RECORD;
  next_increase_date date;
  reminder_date date;
  ticket_title text;
  ticket_description text;
  years_since_start integer;
  new_rent numeric;
  ticket_exists boolean;
  tickets_count integer := 0;
BEGIN
  -- Durchlaufe alle aktiven Verträge mit aktivierter Erinnerungsfunktion
  FOR contract_record IN 
    SELECT rc.*, p.name as property_name, p.address
    FROM rental_contracts rc
    JOIN properties p ON p.id = rc.property_id
    WHERE rc.auto_create_rent_increase_tickets = true
      AND (rc.contract_end IS NULL OR rc.contract_end > CURRENT_DATE)
      AND rc.rent_increase_type IN ('index', 'staffel')
  LOOP
    next_increase_date := NULL;
    
    -- Berechne nächstes Erhöhungsdatum basierend auf Typ
    IF contract_record.rent_increase_type = 'index' THEN
      -- Indexmiete: Erste Erhöhung oder jährlich danach
      IF contract_record.index_first_increase_date IS NOT NULL THEN
        next_increase_date := contract_record.index_first_increase_date;
        
        -- Wenn das erste Datum in der Vergangenheit liegt, berechne nächstes jährliches Datum
        WHILE next_increase_date <= CURRENT_DATE LOOP
          next_increase_date := next_increase_date + INTERVAL '1 year';
        END LOOP;
      END IF;
      
    ELSIF contract_record.rent_increase_type = 'staffel' THEN
      -- Staffelmiete: Berechne basierend auf Vertragsbeginn und Intervall
      IF contract_record.staffel_years IS NOT NULL AND contract_record.staffel_years > 0 THEN
        years_since_start := EXTRACT(YEAR FROM AGE(CURRENT_DATE, contract_record.contract_start));
        next_increase_date := contract_record.contract_start + 
                             (((years_since_start / contract_record.staffel_years) + 1) * contract_record.staffel_years || ' years')::interval;
      END IF;
    END IF;
    
    -- Wenn ein Erhöhungsdatum gefunden wurde
    IF next_increase_date IS NOT NULL THEN
      reminder_date := next_increase_date - INTERVAL '3 months';
      
      -- Prüfe ob wir im 3-Monats-Fenster sind (heute bis in 7 Tagen)
      IF reminder_date >= CURRENT_DATE AND reminder_date <= CURRENT_DATE + INTERVAL '7 days' THEN
        
        -- Prüfe ob bereits ein Ticket für diese Erhöhung existiert
        SELECT EXISTS(
          SELECT 1 FROM tickets 
          WHERE property_id = contract_record.property_id
            AND title LIKE '%Mieterhöhung%'
            AND description LIKE '%' || to_char(next_increase_date, 'DD.MM.YYYY') || '%'
            AND created_at > CURRENT_DATE - INTERVAL '90 days'
        ) INTO ticket_exists;
        
        IF NOT ticket_exists THEN
          -- Berechne neue Miete für Beschreibung
          IF contract_record.rent_increase_type = 'staffel' THEN
            IF contract_record.staffel_type = 'fixed' THEN
              new_rent := contract_record.base_rent + COALESCE(contract_record.staffel_amount, 0);
            ELSE
              new_rent := contract_record.base_rent * (1 + COALESCE(contract_record.staffel_amount, 0) / 100);
            END IF;
          ELSE
            new_rent := NULL; -- Indexmiete ist variabel
          END IF;
          
          -- Erstelle Ticket-Texte
          IF contract_record.rent_increase_type = 'index' THEN
            ticket_title := 'Erinnerung: Indexmiete-Erhöhung durchführen';
            ticket_description := format(
              E'Automatische Erinnerung:\n\n' ||
              'Am %s ist die jährliche Indexmiete-Anpassung fällig.\n\n' ||
              'Immobilie: %s\n' ||
              'Adresse: %s\n' ||
              'Aktuelle Kaltmiete: %s €\n\n' ||
              'Bitte prüfen Sie den aktuellen Verbraucherpreisindex und ' ||
              'berechnen Sie die neue Miete entsprechend der vertraglichen Vereinbarung.',
              to_char(next_increase_date, 'DD.MM.YYYY'),
              contract_record.property_name,
              COALESCE(contract_record.address, 'N/A'),
              contract_record.base_rent
            );
          ELSE
            ticket_title := 'Erinnerung: Staffelmiete-Erhöhung durchführen';
            ticket_description := format(
              E'Automatische Erinnerung:\n\n' ||
              'Am %s ist die Staffelmiete-Erhöhung fällig.\n\n' ||
              'Immobilie: %s\n' ||
              'Adresse: %s\n' ||
              'Aktuelle Kaltmiete: %s €\n' ||
              'Neue Kaltmiete: %s €\n' ||
              'Erhöhung: %s %s\n\n' ||
              'Bitte informieren Sie die Mieter schriftlich über die Mieterhöhung.',
              to_char(next_increase_date, 'DD.MM.YYYY'),
              contract_record.property_name,
              COALESCE(contract_record.address, 'N/A'),
              contract_record.base_rent,
              ROUND(new_rent, 2),
              contract_record.staffel_amount,
              CASE WHEN contract_record.staffel_type = 'fixed' THEN '€' ELSE '%' END
            );
          END IF;
          
          -- Erstelle das Ticket
          INSERT INTO tickets (
            property_id,
            user_id,
            title,
            description,
            status,
            priority,
            category
          ) VALUES (
            contract_record.property_id,
            contract_record.user_id,
            ticket_title,
            ticket_description,
            'open',
            'medium',
            'other'
          );
          
          tickets_count := tickets_count + 1;
        END IF;
      END IF;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT tickets_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kommentar zur Funktion
COMMENT ON FUNCTION create_rent_increase_reminder_tickets() IS 
'Erstellt automatisch Erinnerungs-Tickets für anstehende Mieterhöhungen (Index- und Staffelmiete). Sollte täglich ausgeführt werden.';
