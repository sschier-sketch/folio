/*
  # Remove duplicate account_invitation email templates

  1. Changes
    - Delete `account_invitation` email templates (DE and EN) that were created as duplicates
    - The existing `user_invitation` templates (created earlier) are now used by the invite-account-member edge function
    - No data loss: the `user_invitation` templates already contain the correct content and variables

  2. Important Notes
    - The edge function `invite-account-member` has been updated to reference `user_invitation` instead of `account_invitation`
    - The `user_invitation` templates support the same variables: {{inviter_name}}, {{invitee_email}}, {{invitation_link}}
*/

DELETE FROM email_templates WHERE template_key = 'account_invitation';
