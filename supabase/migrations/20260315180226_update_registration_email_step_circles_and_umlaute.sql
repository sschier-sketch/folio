/*
  # Refine Onboarding Email - Step Circles & Umlaute

  1. Changes
    - Add 1px border (#d0d5dd) to the three numbered step circles
    - Rename step labels: "Schritt 01" -> "Immobilie", "Schritt 02" -> "Einheit", "Schritt 03" -> "Mieter"
    - Plain text version: replace ASCII substitutes with proper German Umlaute (ä, ö, ü, ß, Ä, Ö, Ü)

  2. Security
    - No schema changes, data-only update
*/

DO $$
DECLARE
  v_current_html text;
  v_current_text text;
BEGIN

SELECT body_html, body_text INTO v_current_html, v_current_text
FROM email_templates
WHERE template_key = 'registration' AND language = 'de';

-- Fix step circles: add 1px border
v_current_html := replace(v_current_html,
  'width: 52px; height: 52px; border-radius: 50%; background-color: #EEF4FF; text-align: center; line-height: 52px; font-size: 18px; font-weight: 700; color: #3c8af7; display: inline-block;">01',
  'width: 52px; height: 52px; border-radius: 50%; background-color: #EEF4FF; border: 1px solid #d0d5dd; text-align: center; line-height: 50px; font-size: 18px; font-weight: 700; color: #3c8af7; display: inline-block;">01');

v_current_html := replace(v_current_html,
  'width: 52px; height: 52px; border-radius: 50%; background-color: #EEF4FF; text-align: center; line-height: 52px; font-size: 18px; font-weight: 700; color: #3c8af7; display: inline-block;">02',
  'width: 52px; height: 52px; border-radius: 50%; background-color: #EEF4FF; border: 1px solid #d0d5dd; text-align: center; line-height: 50px; font-size: 18px; font-weight: 700; color: #3c8af7; display: inline-block;">02');

v_current_html := replace(v_current_html,
  'width: 52px; height: 52px; border-radius: 50%; background-color: #EEF4FF; text-align: center; line-height: 52px; font-size: 18px; font-weight: 700; color: #3c8af7; display: inline-block;">03',
  'width: 52px; height: 52px; border-radius: 50%; background-color: #EEF4FF; border: 1px solid #d0d5dd; text-align: center; line-height: 50px; font-size: 18px; font-weight: 700; color: #3c8af7; display: inline-block;">03');

-- Rename step labels
v_current_html := replace(v_current_html,
  '>Schritt 01</span>',
  '>Immobilie</span>');

v_current_html := replace(v_current_html,
  '>Schritt 02</span>',
  '>Einheit</span>');

v_current_html := replace(v_current_html,
  '>Schritt 03</span>',
  '>Mieter</span>');

-- Fix plain text: replace ASCII with proper Umlaute
v_current_text := replace(v_current_text, 'schoen, dass', 'schön, dass');
v_current_text := replace(v_current_text, '30-taegiger', '30-tägiger');
v_current_text := replace(v_current_text, 'koennen', 'können');
v_current_text := replace(v_current_text, 'faellt', 'fällt');
v_current_text := replace(v_current_text, 'fuer ', 'für ');
v_current_text := replace(v_current_text, 'Ueberblick', 'Überblick');
v_current_text := replace(v_current_text, 'Mietvertraege', 'Mietverträge');
v_current_text := replace(v_current_text, 'Zahlungseingaenge', 'Zahlungseingänge');
v_current_text := replace(v_current_text, 'Uebersicht', 'Übersicht');
v_current_text := replace(v_current_text, 'ueber ', 'über ');
v_current_text := replace(v_current_text, 'vollstaendigen', 'vollständigen');
v_current_text := replace(v_current_text, 'hinzufuegen', 'hinzufügen');
v_current_text := replace(v_current_text, 'Waehlen', 'Wählen');
v_current_text := replace(v_current_text, 'zugehoerigen', 'zugehörigen');
v_current_text := replace(v_current_text, 'spaeter', 'später');
v_current_text := replace(v_current_text, 'Mietverhaeltnis', 'Mietverhältnis');
v_current_text := replace(v_current_text, 'Mietverhaeltnisse', 'Mietverhältnisse');
v_current_text := replace(v_current_text, 'Gewerbeflaeche', 'Gewerbefläche');
v_current_text := replace(v_current_text, 'erhaelt', 'erhält');
v_current_text := replace(v_current_text, 'Stellplaetzen', 'Stellplätzen');
v_current_text := replace(v_current_text, 'enthaelt', 'enthält');
v_current_text := replace(v_current_text, 'Vertraege', 'Verträge');
v_current_text := replace(v_current_text, 'vollstaendig', 'vollständig');
v_current_text := replace(v_current_text, 'uebersichtlich', 'übersichtlich');
v_current_text := replace(v_current_text, 'Loesung', 'Lösung');
v_current_text := replace(v_current_text, 'Beduerfnisse', 'Bedürfnisse');
v_current_text := replace(v_current_text, 'Eigentuemerin', 'Eigentümerin');
v_current_text := replace(v_current_text, 'verknuepfen', 'verknüpfen');
v_current_text := replace(v_current_text, 'Waehrend', 'Während');
v_current_text := replace(v_current_text, 'taegigen', 'tägigen');
v_current_text := replace(v_current_text, 'noetig', 'nötig');
v_current_text := replace(v_current_text, 'koennen', 'können');

UPDATE email_templates
SET
  body_html = v_current_html,
  body_text = v_current_text,
  updated_at = now()
WHERE template_key = 'registration' AND language = 'de';

END $$;
