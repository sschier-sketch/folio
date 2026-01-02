/*
  # Add Bank and Reminders Tables

  1. New Tables
    - `bank_connections` - Bank account connections for Premium users
    - `bank_transactions` - Imported bank transactions
    - `payment_reminders` - Payment reminders and dunning system

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Fix expense_categories if columns are missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expense_categories' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE expense_categories ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expense_categories' AND column_name = 'tax_category'
  ) THEN
    ALTER TABLE expense_categories ADD COLUMN tax_category text DEFAULT 'other';
  END IF;
END $$;

-- Insert default expense categories if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM expense_categories WHERE is_default = true LIMIT 1) THEN
    INSERT INTO expense_categories (name, tax_category, is_default) VALUES
      ('Instandhaltung', 'maintenance', true),
      ('Verwaltung', 'administration', true),
      ('Versicherungen', 'insurance', true),
      ('Energie', 'utilities', true),
      ('Sonstiges', 'other', true);
  END IF;
END $$;

-- bank_connections table
CREATE TABLE IF NOT EXISTS bank_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  connection_status text DEFAULT 'active' CHECK (connection_status IN ('active', 'inactive', 'error')),
  last_sync timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bank connections" ON bank_connections;
CREATE POLICY "Users can view own bank connections"
  ON bank_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bank connections" ON bank_connections;
CREATE POLICY "Users can insert own bank connections"
  ON bank_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bank connections" ON bank_connections;
CREATE POLICY "Users can update own bank connections"
  ON bank_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bank connections" ON bank_connections;
CREATE POLICY "Users can delete own bank connections"
  ON bank_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_bank_connections_user_id ON bank_connections(user_id);

-- bank_transactions table
CREATE TABLE IF NOT EXISTS bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_connection_id uuid REFERENCES bank_connections(id) ON DELETE CASCADE NOT NULL,
  transaction_date date NOT NULL,
  amount decimal NOT NULL,
  description text DEFAULT '',
  sender text DEFAULT '',
  matched_payment_id uuid REFERENCES rent_payments(id) ON DELETE SET NULL,
  matched_expense_id uuid REFERENCES expenses(id) ON DELETE SET NULL,
  status text DEFAULT 'unmatched' CHECK (status IN ('unmatched', 'suggested', 'matched')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bank transactions" ON bank_transactions;
CREATE POLICY "Users can view own bank transactions"
  ON bank_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bank_connections
      WHERE bank_connections.id = bank_transactions.bank_connection_id
      AND bank_connections.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own bank transactions" ON bank_transactions;
CREATE POLICY "Users can insert own bank transactions"
  ON bank_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bank_connections
      WHERE bank_connections.id = bank_transactions.bank_connection_id
      AND bank_connections.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own bank transactions" ON bank_transactions;
CREATE POLICY "Users can update own bank transactions"
  ON bank_transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bank_connections
      WHERE bank_connections.id = bank_transactions.bank_connection_id
      AND bank_connections.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bank_connections
      WHERE bank_connections.id = bank_transactions.bank_connection_id
      AND bank_connections.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own bank transactions" ON bank_transactions;
CREATE POLICY "Users can delete own bank transactions"
  ON bank_transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bank_connections
      WHERE bank_connections.id = bank_transactions.bank_connection_id
      AND bank_connections.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_bank_transactions_connection_id ON bank_transactions(bank_connection_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON bank_transactions(transaction_date);

-- payment_reminders table
CREATE TABLE IF NOT EXISTS payment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rent_payment_id uuid REFERENCES rent_payments(id) ON DELETE CASCADE NOT NULL,
  reminder_level integer DEFAULT 1 CHECK (reminder_level IN (1, 2, 3)),
  sent_at timestamptz DEFAULT now(),
  reminder_type text DEFAULT 'friendly' CHECK (reminder_type IN ('friendly', 'formal', 'dunning')),
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'acknowledged')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payment reminders" ON payment_reminders;
CREATE POLICY "Users can view own payment reminders"
  ON payment_reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payment reminders" ON payment_reminders;
CREATE POLICY "Users can insert own payment reminders"
  ON payment_reminders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payment reminders" ON payment_reminders;
CREATE POLICY "Users can update own payment reminders"
  ON payment_reminders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own payment reminders" ON payment_reminders;
CREATE POLICY "Users can delete own payment reminders"
  ON payment_reminders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_payment_reminders_user_id ON payment_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_payment_id ON payment_reminders(rent_payment_id);