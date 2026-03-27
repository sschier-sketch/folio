/*
  # Allow users to view their own Stripe invoices and credit notes

  1. New Policies
    - `stripe_invoices`: authenticated users can SELECT rows where
      `stripe_customer_id` matches their own billing_info record
    - `stripe_credit_notes`: same pattern

  2. Security
    - Uses a subquery against billing_info to resolve the user's stripe_customer_id
    - Only SELECT access, no INSERT/UPDATE/DELETE
    - Existing admin policies remain untouched
*/

CREATE POLICY "Users can view own invoices"
  ON stripe_invoices FOR SELECT
  TO authenticated
  USING (
    stripe_customer_id IS NOT NULL
    AND stripe_customer_id = (
      SELECT bi.stripe_customer_id
      FROM billing_info bi
      WHERE bi.user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Users can view own credit notes"
  ON stripe_credit_notes FOR SELECT
  TO authenticated
  USING (
    stripe_customer_id IS NOT NULL
    AND stripe_customer_id = (
      SELECT bi.stripe_customer_id
      FROM billing_info bi
      WHERE bi.user_id = auth.uid()
      LIMIT 1
    )
  );
