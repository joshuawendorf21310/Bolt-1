/*
  # Founder Compensation Schema
  
  ## Purpose
  Track founder compensation strictly on the business side. This schema records
  what the business pays to the founder (salary and distributions) and provides
  guardrails for safe withdrawal decisions. It NEVER tracks what happens to money
  after it leaves the business.
  
  ## New Tables
  
  ### `founder_compensation_events`
  Record of all compensation payments from business to founder
  - `id` (uuid, primary key)
  - `founder_id` (uuid) - Links to auth.users
  - `event_date` (date) - Date of payment
  - `event_type` (text) - 'salary', 'distribution', 'bonus', 'reimbursement'
  - `amount` (numeric) - Amount paid in cents
  - `transaction_id` (uuid, nullable) - Links to business_transactions
  - `period_start` (date, nullable) - For salary, the pay period start
  - `period_end` (date, nullable) - For salary, the pay period end
  - `notes` (text)
  
  ### `founder_compensation_policy`
  Configuration for safe withdrawal calculations and guardrails
  - `id` (uuid, primary key)
  - `minimum_cash_buffer` (numeric) - Minimum cash to keep in business (cents)
  - `payroll_runway_months` (integer) - How many months of payroll to reserve
  - `tax_reserve_percentage` (numeric) - Percentage to reserve for taxes (0-100)
  - `safe_distribution_percentage` (numeric) - Max % of available cash to distribute (0-100)
  - `updated_at` (timestamptz)
  - `updated_by` (uuid) - Links to auth.users
  
  ### `founder_withdrawal_calculations`
  Historical record of safe withdrawal calculations
  - `id` (uuid, primary key)
  - `calculated_at` (timestamptz)
  - `total_cash_available` (numeric) - Total business cash in cents
  - `minimum_buffer_required` (numeric) - Policy-based minimum buffer
  - `payroll_reserve_required` (numeric) - Reserved for upcoming payroll
  - `tax_reserve_required` (numeric) - Reserved for tax obligations
  - `ap_reserve_required` (numeric) - Reserved for AP obligations
  - `available_for_distribution` (numeric) - Cash available after reserves
  - `safe_distribution_amount` (numeric) - Recommended max distribution
  - `calculation_notes` (text)
  
  ## Answers These Questions
  1. "How much has the business paid me?" → Sum of compensation_events
  2. "Can the business afford to pay me?" → Latest withdrawal_calculation
  3. "How much can I safely take out?" → safe_distribution_amount
  4. "What reserves are needed?" → Components of the calculation
  
  ## What This Does NOT Track
  - Personal bank accounts
  - Personal spending
  - What founder does with distributions
  - Personal net worth
  - Personal tax payments
  
  ## Security
  - Enable RLS on all tables
  - Founder-only access to view their own compensation
  - Audit trail for all compensation events
*/

-- Create founder compensation events table
CREATE TABLE IF NOT EXISTS founder_compensation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id uuid NOT NULL REFERENCES auth.users(id),
  event_date date NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('salary', 'distribution', 'bonus', 'reimbursement')),
  amount numeric NOT NULL CHECK (amount > 0),
  transaction_id uuid REFERENCES business_transactions(id),
  period_start date,
  period_end date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create founder compensation policy table (single-row config)
CREATE TABLE IF NOT EXISTS founder_compensation_policy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  minimum_cash_buffer numeric NOT NULL DEFAULT 1000000, -- $10,000 default
  payroll_runway_months integer NOT NULL DEFAULT 3,
  tax_reserve_percentage numeric NOT NULL DEFAULT 30,
  safe_distribution_percentage numeric NOT NULL DEFAULT 25,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create founder withdrawal calculations table
CREATE TABLE IF NOT EXISTS founder_withdrawal_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calculated_at timestamptz DEFAULT now(),
  total_cash_available numeric NOT NULL,
  minimum_buffer_required numeric NOT NULL,
  payroll_reserve_required numeric NOT NULL,
  tax_reserve_required numeric NOT NULL,
  ap_reserve_required numeric NOT NULL,
  available_for_distribution numeric NOT NULL,
  safe_distribution_amount numeric NOT NULL,
  calculation_notes text DEFAULT ''
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_compensation_events_founder ON founder_compensation_events(founder_id);
CREATE INDEX IF NOT EXISTS idx_compensation_events_date ON founder_compensation_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_compensation_events_type ON founder_compensation_events(event_type);
CREATE INDEX IF NOT EXISTS idx_withdrawal_calc_date ON founder_withdrawal_calculations(calculated_at DESC);

-- Enable RLS
ALTER TABLE founder_compensation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_compensation_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_withdrawal_calculations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Founder can view their own compensation
CREATE POLICY "Founders can view own compensation events"
  ON founder_compensation_events FOR SELECT
  TO authenticated
  USING (auth.uid() = founder_id);

CREATE POLICY "Founders can create compensation events"
  ON founder_compensation_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = founder_id);

CREATE POLICY "Authenticated users can view compensation policy"
  ON founder_compensation_policy FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update compensation policy"
  ON founder_compensation_policy FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert compensation policy"
  ON founder_compensation_policy FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view withdrawal calculations"
  ON founder_withdrawal_calculations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create withdrawal calculations"
  ON founder_withdrawal_calculations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default policy if none exists
INSERT INTO founder_compensation_policy (
  minimum_cash_buffer,
  payroll_runway_months,
  tax_reserve_percentage,
  safe_distribution_percentage
) VALUES (
  1000000,  -- $10,000 minimum buffer
  3,        -- 3 months payroll runway
  30,       -- 30% for taxes
  25        -- 25% max distribution of available
)
ON CONFLICT DO NOTHING;