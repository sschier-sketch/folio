/*
  # Fix Mietschuldenfreiheitsbescheinigung title

  1. Changes
    - Updates the wizard template title to use a hyphenated form
      so it fits better in the card UI: "Mietschuldenfreiheits- bescheinigung"

  2. Notes
    - Title was too long for the template card box
*/

UPDATE wizard_templates
SET title = 'Mietschuldenfreiheits- bescheinigung'
WHERE id = 'mietschuldenfreiheit';
