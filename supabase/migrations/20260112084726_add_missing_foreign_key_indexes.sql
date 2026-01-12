/*
  # Add Missing Foreign Key Indexes

  1. Performance Improvements
    - Add indexes for all unindexed foreign keys
    - Improves query performance for joins and foreign key lookups
    - Prevents table scans when querying related data

  2. New Indexes
    - admin_activity_log: admin_user_id
    - bank_transactions: matched_expense_id, matched_payment_id
    - document_associations: created_by
    - document_history: user_id
    - expense_categories: user_id
    - expense_splits: property_id, unit_id
    - expenses: document_id, receipt_id
    - income_entries: document_id, unit_id
    - loans: user_id
    - maintenance_tasks: unit_id, user_id
    - property_contacts: user_id
    - property_documents: unit_id, user_id
    - property_equipment: user_id
    - property_history: user_id
    - rent_payments: property_id
    - rental_contracts: unit_id, user_id
    - system_updates: created_by
    - tenant_communications: deleted_by
    - tenants: contract_id
    - tickets: assigned_user_id, property_id, tenant_id
    - user_referrals: referred_user_id
*/

-- Admin activity log
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_user_id 
  ON admin_activity_log(admin_user_id);

-- Bank transactions
CREATE INDEX IF NOT EXISTS idx_bank_transactions_matched_expense_id 
  ON bank_transactions(matched_expense_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_matched_payment_id 
  ON bank_transactions(matched_payment_id);

-- Document associations
CREATE INDEX IF NOT EXISTS idx_document_associations_created_by 
  ON document_associations(created_by);

-- Document history
CREATE INDEX IF NOT EXISTS idx_document_history_user_id 
  ON document_history(user_id);

-- Expense categories
CREATE INDEX IF NOT EXISTS idx_expense_categories_user_id 
  ON expense_categories(user_id);

-- Expense splits
CREATE INDEX IF NOT EXISTS idx_expense_splits_property_id 
  ON expense_splits(property_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_unit_id 
  ON expense_splits(unit_id);

-- Expenses
CREATE INDEX IF NOT EXISTS idx_expenses_document_id 
  ON expenses(document_id);
CREATE INDEX IF NOT EXISTS idx_expenses_receipt_id 
  ON expenses(receipt_id);

-- Income entries
CREATE INDEX IF NOT EXISTS idx_income_entries_document_id 
  ON income_entries(document_id);
CREATE INDEX IF NOT EXISTS idx_income_entries_unit_id_fk 
  ON income_entries(unit_id);

-- Loans
CREATE INDEX IF NOT EXISTS idx_loans_user_id 
  ON loans(user_id);

-- Maintenance tasks
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_unit_id 
  ON maintenance_tasks(unit_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_user_id 
  ON maintenance_tasks(user_id);

-- Property contacts
CREATE INDEX IF NOT EXISTS idx_property_contacts_user_id 
  ON property_contacts(user_id);

-- Property documents
CREATE INDEX IF NOT EXISTS idx_property_documents_unit_id 
  ON property_documents(unit_id);
CREATE INDEX IF NOT EXISTS idx_property_documents_user_id 
  ON property_documents(user_id);

-- Property equipment
CREATE INDEX IF NOT EXISTS idx_property_equipment_user_id 
  ON property_equipment(user_id);

-- Property history
CREATE INDEX IF NOT EXISTS idx_property_history_user_id 
  ON property_history(user_id);

-- Rent payments
CREATE INDEX IF NOT EXISTS idx_rent_payments_property_id 
  ON rent_payments(property_id);

-- Rental contracts
CREATE INDEX IF NOT EXISTS idx_rental_contracts_unit_id 
  ON rental_contracts(unit_id);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_user_id 
  ON rental_contracts(user_id);

-- System updates
CREATE INDEX IF NOT EXISTS idx_system_updates_created_by 
  ON system_updates(created_by);

-- Tenant communications
CREATE INDEX IF NOT EXISTS idx_tenant_communications_deleted_by 
  ON tenant_communications(deleted_by);

-- Tenants
CREATE INDEX IF NOT EXISTS idx_tenants_contract_id 
  ON tenants(contract_id);

-- Tickets
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_user_id 
  ON tickets(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_property_id 
  ON tickets(property_id);
CREATE INDEX IF NOT EXISTS idx_tickets_tenant_id 
  ON tickets(tenant_id);

-- User referrals
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred_user_id 
  ON user_referrals(referred_user_id);
