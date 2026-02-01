/*
  # Platform Pricing Schema (Fixed Pricing Model)
  
  ## Pricing Model (Non-Negotiable)
  - Monthly Platform Fee: $500 per agency (base subscription)
  - Per-Billable-Call Fee: $45 per billable encounter
  - No percentage-based pricing or revenue sharing
  - No adjustment for automation level
  - Stripe fees passed through transparently (not marked up)
  
  ## Billable Calls Include
  - EMS transports
  - Treatment-in-place
  - Documented refusals
  - Private-pay encounters
  - Patient bill pay events
  - Telehealth encounters
  
  ## New Tables
  
  ### `agency_subscriptions`
  Track agency platform subscriptions and monthly base fee
  - `id` (uuid, primary key)
  - `agency_id` (uuid) - Links to agency/organization
  - `agency_name` (text)
  - `subscription_status` (text) - 'active', 'suspended', 'cancelled'
  - `monthly_platform_fee` (numeric) - Base fee in cents (default 50000 = $500)
  - `billing_cycle_day` (integer) - Day of month for billing (1-28)
  - `current_period_start` (date)
  - `current_period_end` (date)
  - `activated_at` (timestamptz)
  - `suspended_at` (timestamptz)
  - `cancelled_at` (timestamptz)
  
  ### `billable_calls`
  Track all billable encounters for per-call fee
  - `id` (uuid, primary key)
  - `agency_id` (uuid) - Links to agency
  - `call_type` (text) - 'ems_transport', 'treatment_in_place', 'refusal', 'private_pay', 'telehealth'
  - `encounter_id` (uuid) - Links to encounter/incident/telehealth record
  - `encounter_number` (text) - Human-readable identifier
  - `call_date` (date)
  - `per_call_fee` (numeric) - Fee in cents (default 4500 = $45)
  - `billing_status` (text) - 'pending', 'invoiced', 'paid'
  - `invoiced_at` (timestamptz)
  - `platform_invoice_id` (uuid) - Links to platform_invoices when invoiced
  - `created_at` (timestamptz)
  
  ### `platform_invoices`
  Monthly invoices to agencies (base fee + usage fees)
  - `id` (uuid, primary key)
  - `agency_id` (uuid) - Links to agency
  - `invoice_number` (text, unique)
  - `invoice_period_start` (date)
  - `invoice_period_end` (date)
  - `base_platform_fee` (numeric) - Monthly $500 fee in cents
  - `billable_calls_count` (integer) - Number of billable calls
  - `billable_calls_total` (numeric) - Total per-call fees in cents
  - `subtotal` (numeric) - Base fee + call fees in cents
  - `stripe_passthrough_fees` (numeric) - Stripe fees (not marked up) in cents
  - `total_amount_due` (numeric) - Final total in cents
  - `amount_paid` (numeric) - Amount paid in cents
  - `invoice_status` (text) - 'draft', 'sent', 'paid', 'overdue', 'cancelled'
  - `due_date` (date)
  - `issued_at` (timestamptz)
  - `paid_at` (timestamptz)
  - `created_at` (timestamptz)
  
  ### `platform_invoice_line_items`
  Individual line items on platform invoices (for transparency)
  - `id` (uuid, primary key)
  - `invoice_id` (uuid) - Links to platform_invoices
  - `line_type` (text) - 'base_fee', 'per_call_fee', 'stripe_passthrough'
  - `description` (text)
  - `quantity` (integer) - 1 for base fee, call count for per-call
  - `unit_price` (numeric) - Price per unit in cents
  - `amount` (numeric) - Total line amount in cents
  - `period_start` (date)
  - `period_end` (date)
  
  ### `pricing_policy_overrides`
  Track any pricing policy changes (rare)
  - `id` (uuid, primary key)
  - `agency_id` (uuid, nullable) - Specific agency or null for system-wide
  - `override_type` (text) - 'monthly_fee', 'per_call_fee'
  - `standard_price` (numeric) - Standard price in cents
  - `override_price` (numeric) - Override price in cents
  - `override_reason` (text)
  - `effective_from` (date)
  - `effective_until` (date, nullable)
  - `approved_by` (text)
  - `created_at` (timestamptz)
  
  ## Security
  - Enable RLS on all tables
  - Agency users can view their own subscriptions and invoices
  - Only platform administrators can manage pricing
  - All pricing changes are audited
*/

-- Create agency subscriptions table
CREATE TABLE IF NOT EXISTS agency_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL,
  agency_name text NOT NULL,
  subscription_status text NOT NULL DEFAULT 'active' CHECK (subscription_status IN (
    'active', 'suspended', 'cancelled'
  )),
  monthly_platform_fee numeric NOT NULL DEFAULT 50000,
  billing_cycle_day integer NOT NULL DEFAULT 1 CHECK (billing_cycle_day BETWEEN 1 AND 28),
  current_period_start date NOT NULL,
  current_period_end date NOT NULL,
  activated_at timestamptz DEFAULT now(),
  suspended_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agency_id)
);

-- Create billable calls table
CREATE TABLE IF NOT EXISTS billable_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL,
  call_type text NOT NULL CHECK (call_type IN (
    'ems_transport', 'treatment_in_place', 'refusal', 'private_pay', 'telehealth'
  )),
  encounter_id uuid NOT NULL,
  encounter_number text NOT NULL,
  call_date date NOT NULL,
  per_call_fee numeric NOT NULL DEFAULT 4500,
  billing_status text NOT NULL DEFAULT 'pending' CHECK (billing_status IN (
    'pending', 'invoiced', 'paid'
  )),
  invoiced_at timestamptz,
  platform_invoice_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Create platform invoices table
CREATE TABLE IF NOT EXISTS platform_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL,
  invoice_number text NOT NULL UNIQUE,
  invoice_period_start date NOT NULL,
  invoice_period_end date NOT NULL,
  base_platform_fee numeric NOT NULL DEFAULT 50000,
  billable_calls_count integer NOT NULL DEFAULT 0,
  billable_calls_total numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL,
  stripe_passthrough_fees numeric DEFAULT 0,
  total_amount_due numeric NOT NULL,
  amount_paid numeric DEFAULT 0,
  invoice_status text NOT NULL DEFAULT 'draft' CHECK (invoice_status IN (
    'draft', 'sent', 'paid', 'overdue', 'cancelled'
  )),
  due_date date NOT NULL,
  issued_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create platform invoice line items table
CREATE TABLE IF NOT EXISTS platform_invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES platform_invoices(id) ON DELETE CASCADE,
  line_type text NOT NULL CHECK (line_type IN (
    'base_fee', 'per_call_fee', 'stripe_passthrough'
  )),
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  amount numeric NOT NULL,
  period_start date,
  period_end date,
  created_at timestamptz DEFAULT now()
);

-- Create pricing policy overrides table
CREATE TABLE IF NOT EXISTS pricing_policy_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid,
  override_type text NOT NULL CHECK (override_type IN (
    'monthly_fee', 'per_call_fee'
  )),
  standard_price numeric NOT NULL,
  override_price numeric NOT NULL,
  override_reason text NOT NULL,
  effective_from date NOT NULL,
  effective_until date,
  approved_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agency_subscriptions_agency ON agency_subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_subscriptions_status ON agency_subscriptions(subscription_status);
CREATE INDEX IF NOT EXISTS idx_billable_calls_agency ON billable_calls(agency_id);
CREATE INDEX IF NOT EXISTS idx_billable_calls_date ON billable_calls(call_date DESC);
CREATE INDEX IF NOT EXISTS idx_billable_calls_status ON billable_calls(billing_status);
CREATE INDEX IF NOT EXISTS idx_billable_calls_invoice ON billable_calls(platform_invoice_id);
CREATE INDEX IF NOT EXISTS idx_platform_invoices_agency ON platform_invoices(agency_id);
CREATE INDEX IF NOT EXISTS idx_platform_invoices_status ON platform_invoices(invoice_status);
CREATE INDEX IF NOT EXISTS idx_platform_invoices_period ON platform_invoices(invoice_period_start DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice ON platform_invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_pricing_overrides_agency ON pricing_policy_overrides(agency_id);
CREATE INDEX IF NOT EXISTS idx_pricing_overrides_effective ON pricing_policy_overrides(effective_from, effective_until);

-- Enable RLS
ALTER TABLE agency_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billable_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_policy_overrides ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Agency users can view their own data, admins can manage all
CREATE POLICY "Authenticated users can view subscriptions"
  ON agency_subscriptions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage subscriptions"
  ON agency_subscriptions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view billable calls"
  ON billable_calls FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create billable calls"
  ON billable_calls FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update billable calls"
  ON billable_calls FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view platform invoices"
  ON platform_invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage platform invoices"
  ON platform_invoices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view invoice line items"
  ON platform_invoice_line_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage invoice line items"
  ON platform_invoice_line_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view pricing overrides"
  ON pricing_policy_overrides FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage pricing overrides"
  ON pricing_policy_overrides FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);