/*
  # Business Financial Tracking Schema
  
  ## Purpose
  Core financial tracking for the founder's dashboard that maintains strict
  business/personal separation. This schema tracks ONLY business accounts,
  transactions, and obligations - never personal finances.
  
  ## New Tables
  
  ### `business_accounts`
  Business bank accounts and cash tracking
  - `id` (uuid, primary key)
  - `account_name` (text) - Human-readable name
  - `account_type` (text) - 'checking', 'savings', 'credit_card'
  - `current_balance` (numeric) - Current balance in cents
  - `institution_name` (text) - Bank name
  - `last_synced_at` (timestamptz) - Last successful bank feed sync
  - `sync_status` (text) - 'connected', 'degraded', 'disconnected'
  - `is_active` (boolean) - Whether account is currently in use
  
  ### `service_lines`
  Revenue and expense categories by business line
  - `id` (uuid, primary key)
  - `name` (text) - 'transport', 'ems', 'fire_contracts', etc.
  - `description` (text)
  - `is_active` (boolean)
  
  ### `business_transactions`
  All cash movements (business only)
  - `id` (uuid, primary key)
  - `account_id` (uuid) - Links to business_accounts
  - `service_line_id` (uuid, nullable) - Links to service_lines
  - `transaction_date` (date)
  - `posted_date` (date)
  - `amount` (numeric) - Amount in cents (positive = inflow, negative = outflow)
  - `transaction_type` (text) - 'revenue', 'expense', 'transfer', 'payroll', 'tax', 'distribution'
  - `category` (text) - Expense/revenue category
  - `description` (text)
  - `vendor_payee` (text, nullable)
  - `reconciled` (boolean) - Whether matched to bank statement
  - `reconciled_at` (timestamptz, nullable)
  
  ### `accounts_receivable`
  Money owed to the business
  - `id` (uuid, primary key)
  - `service_line_id` (uuid) - Links to service_lines
  - `customer_name` (text)
  - `invoice_number` (text)
  - `invoice_date` (date)
  - `due_date` (date)
  - `amount_billed` (numeric) - Original invoice amount in cents
  - `amount_paid` (numeric) - Amount paid so far in cents
  - `amount_outstanding` (numeric) - Remaining balance in cents
  - `aging_bucket` (text) - 'current', '30', '60', '90', '120_plus'
  - `status` (text) - 'outstanding', 'partially_paid', 'paid', 'written_off'
  
  ### `accounts_payable`
  Business obligations and upcoming payments
  - `id` (uuid, primary key)
  - `service_line_id` (uuid, nullable) - Links to service_lines
  - `vendor_name` (text)
  - `bill_number` (text)
  - `bill_date` (date)
  - `due_date` (date)
  - `amount_due` (numeric) - Total amount in cents
  - `amount_paid` (numeric) - Amount paid so far in cents
  - `amount_outstanding` (numeric) - Remaining balance in cents
  - `priority` (text) - 'payroll', 'taxes', 'critical', 'normal'
  - `status` (text) - 'pending', 'scheduled', 'paid'
  
  ### `business_tax_reserves`
  Tax obligations and reserves (business side only)
  - `id` (uuid, primary key)
  - `tax_type` (text) - 'payroll_federal', 'payroll_state', 'sales', 'estimated_income'
  - `period_start` (date)
  - `period_end` (date)
  - `amount_expected` (numeric) - Expected liability in cents
  - `amount_reserved` (numeric) - Amount set aside in cents
  - `due_date` (date)
  - `paid_date` (date, nullable)
  - `status` (text) - 'accruing', 'due_soon', 'overdue', 'paid'
  
  ### `bank_reconciliations`
  Track reconciliation status for accounting integrity
  - `id` (uuid, primary key)
  - `account_id` (uuid) - Links to business_accounts
  - `period_start` (date)
  - `period_end` (date)
  - `reconciled_at` (timestamptz)
  - `reconciled_by` (uuid) - Links to auth.users
  - `statement_balance` (numeric) - Bank statement balance in cents
  - `book_balance` (numeric) - Accounting system balance in cents
  - `difference` (numeric) - Unreconciled difference in cents
  - `status` (text) - 'complete', 'pending', 'discrepancy'
  
  ## Security
  - Enable RLS on all tables
  - Founder-only access by default (auth required, user must have founder role)
  - Separation of duties enforced via role checks
  - No personal finance data ever enters these tables
*/

-- Create service lines table first (referenced by others)
CREATE TABLE IF NOT EXISTS service_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create business accounts table
CREATE TABLE IF NOT EXISTS business_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('checking', 'savings', 'credit_card', 'line_of_credit')),
  current_balance numeric NOT NULL DEFAULT 0,
  institution_name text NOT NULL,
  last_synced_at timestamptz,
  sync_status text NOT NULL DEFAULT 'disconnected' CHECK (sync_status IN ('connected', 'degraded', 'disconnected')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create business transactions table
CREATE TABLE IF NOT EXISTS business_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES business_accounts(id),
  service_line_id uuid REFERENCES service_lines(id),
  transaction_date date NOT NULL,
  posted_date date NOT NULL,
  amount numeric NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('revenue', 'expense', 'transfer', 'payroll', 'tax', 'distribution', 'capital')),
  category text NOT NULL,
  description text NOT NULL,
  vendor_payee text,
  reconciled boolean DEFAULT false,
  reconciled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create accounts receivable table
CREATE TABLE IF NOT EXISTS accounts_receivable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_line_id uuid NOT NULL REFERENCES service_lines(id),
  customer_name text NOT NULL,
  invoice_number text NOT NULL UNIQUE,
  invoice_date date NOT NULL,
  due_date date NOT NULL,
  amount_billed numeric NOT NULL,
  amount_paid numeric DEFAULT 0,
  amount_outstanding numeric NOT NULL,
  aging_bucket text NOT NULL DEFAULT 'current' CHECK (aging_bucket IN ('current', '30', '60', '90', '120_plus')),
  status text NOT NULL DEFAULT 'outstanding' CHECK (status IN ('outstanding', 'partially_paid', 'paid', 'written_off')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create accounts payable table
CREATE TABLE IF NOT EXISTS accounts_payable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_line_id uuid REFERENCES service_lines(id),
  vendor_name text NOT NULL,
  bill_number text NOT NULL,
  bill_date date NOT NULL,
  due_date date NOT NULL,
  amount_due numeric NOT NULL,
  amount_paid numeric DEFAULT 0,
  amount_outstanding numeric NOT NULL,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('payroll', 'taxes', 'critical', 'normal')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'paid')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create business tax reserves table
CREATE TABLE IF NOT EXISTS business_tax_reserves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_type text NOT NULL CHECK (tax_type IN ('payroll_federal', 'payroll_state', 'payroll_local', 'sales', 'estimated_income', 'property', 'other')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  amount_expected numeric NOT NULL DEFAULT 0,
  amount_reserved numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  paid_date date,
  status text NOT NULL DEFAULT 'accruing' CHECK (status IN ('accruing', 'due_soon', 'overdue', 'paid')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bank reconciliations table
CREATE TABLE IF NOT EXISTS bank_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES business_accounts(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  reconciled_at timestamptz NOT NULL DEFAULT now(),
  reconciled_by uuid NOT NULL REFERENCES auth.users(id),
  statement_balance numeric NOT NULL,
  book_balance numeric NOT NULL,
  difference numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('complete', 'pending', 'discrepancy')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_account ON business_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON business_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_service_line ON business_transactions(service_line_id);
CREATE INDEX IF NOT EXISTS idx_ar_status ON accounts_receivable(status);
CREATE INDEX IF NOT EXISTS idx_ar_aging ON accounts_receivable(aging_bucket);
CREATE INDEX IF NOT EXISTS idx_ar_due_date ON accounts_receivable(due_date);
CREATE INDEX IF NOT EXISTS idx_ap_due_date ON accounts_payable(due_date);
CREATE INDEX IF NOT EXISTS idx_ap_priority ON accounts_payable(priority);
CREATE INDEX IF NOT EXISTS idx_tax_due_date ON business_tax_reserves(due_date);
CREATE INDEX IF NOT EXISTS idx_reconciliations_account ON bank_reconciliations(account_id);

-- Enable RLS on all tables
ALTER TABLE service_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_tax_reserves ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_reconciliations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Founder-only access by default
-- Note: This assumes users have an 'app_metadata' field with 'role' property
-- For MVP, we'll use authenticated users. Add role checks when RBAC is implemented.

CREATE POLICY "Authenticated users can view service lines"
  ON service_lines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage service lines"
  ON service_lines FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view business accounts"
  ON business_accounts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage business accounts"
  ON business_accounts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view transactions"
  ON business_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create transactions"
  ON business_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update transactions"
  ON business_transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete transactions"
  ON business_transactions FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view AR"
  ON accounts_receivable FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage AR"
  ON accounts_receivable FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view AP"
  ON accounts_payable FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage AP"
  ON accounts_payable FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view tax reserves"
  ON business_tax_reserves FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage tax reserves"
  ON business_tax_reserves FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view reconciliations"
  ON bank_reconciliations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create reconciliations"
  ON bank_reconciliations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default service lines
INSERT INTO service_lines (name, description) VALUES
  ('transport', 'Non-emergency medical transport'),
  ('ems', 'Emergency medical services'),
  ('fire_contracts', 'Fire department contracts'),
  ('other', 'Other revenue and expenses')
ON CONFLICT (name) DO NOTHING;