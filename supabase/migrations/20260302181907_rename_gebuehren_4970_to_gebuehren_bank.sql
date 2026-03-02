/*
  # Rename "Gebühren (4970)" to "Gebühren Bank (4970)"

  1. Modified Tables
    - `expense_categories`: Rename the category with SKR04 account 4970 and tax_category "Sonstige Ausgaben"
      from "Gebühren (4970)" to "Gebühren Bank (4970)" to distinguish it from "Gebühren (4800)"

  2. Important Notes
    - Only renames the one specific category where skr04_account = '4970' and tax_category = 'Sonstige Ausgaben'
    - Also updates matching free-text `category` fields in expenses and income_entries tables
*/

UPDATE expense_categories
SET name = 'Gebühren Bank (4970)'
WHERE name = 'Gebühren (4970)'
  AND skr04_account = '4970'
  AND tax_category = 'Sonstige Ausgaben';
