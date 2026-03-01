/*
  # Fix Wohnungsgeberbestätigung category and rename Meldebestätigung

  1. Changes
    - Move `wohnungsgeberbestaetigung` from category `kuendigung` to `sonstiges`
    - Update description for `wohnungsgeberbestaetigung` to reflect its distinct purpose
    - Rename `meldebestaetigung` title from "Meldebestätigung (Wohnungsgeberbestätigung)" to "Meldebestätigung"

  2. Important Notes
    - No destructive changes, only updates to metadata
*/

UPDATE wizard_templates
SET category = 'sonstiges',
    description = 'Bestätigen Sie als Wohnungsgeber den Ein- oder Auszug Ihrer Mieter nach § 19 BMG für die Meldebehörde.'
WHERE id = 'wohnungsgeberbestaetigung';

UPDATE wizard_templates
SET title = 'Meldebestätigung'
WHERE id = 'meldebestaetigung';
