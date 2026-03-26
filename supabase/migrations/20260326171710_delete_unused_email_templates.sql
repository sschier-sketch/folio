/*
  # Delete unused email templates

  Removes three email templates that have no associated system function:

  1. `contract_signed` - No trigger or edge function sends this
  2. `rent_increase_notification` - IndexRent wizard uses custom freetext, not this template
  3. `rent_payment_reminder` - Dunning system uses per-user custom templates, not this global one

  Deletes both DE and EN versions of each template.
*/

DELETE FROM email_templates WHERE template_key = 'contract_signed';
DELETE FROM email_templates WHERE template_key = 'rent_increase_notification';
DELETE FROM email_templates WHERE template_key = 'rent_payment_reminder';
