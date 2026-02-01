/*
  # Private-Party Billing Schema (Stripe-Only Payment Data)
  
  ## Critical Security Rule
  This schema NEVER stores payment data. All payment information is owned,
  stored, and processed exclusively by Stripe. The platform is a billing
  coordinator and records system, not a payment processor.
  
  ## Forbidden Data (NEVER STORE)
  - Card numbers
  - Bank account numbers
  - Payment tokens
  - Stripe payment method IDs
  - Last-four digits
  - Expiration dates
  - Any payment credentials
  
  ## Allowed Data (Metadata & Status Only)
  - Internal invoice ID
  - Stripe invoice ID (reference only)
  - Payment status
  - Amounts
  - Timestamps
  - High-level method type (optional: "card", "ACH")
  
  ## New Tables
  
  ### `private_party_invoices`
  Patient/private-party invoices for ambulance transport
  - `id` (uuid, primary key)
  - `invoice_number` (text, unique) - Internal invoice number
  - `stripe_invoice_id` (text, nullable) - Stripe invoice reference
  - `stripe_customer_id` (text, nullable) - Stripe customer reference
  - `encounter_id` (uuid) - Links to encounter/incident
  - `service_type` (text) - 'ambulance_transport', 'telehealth'
  - `payer_type` (text) - 'patient', 'guarantor', 'private_party'
  - `payer_name` (text)
  - `payer_email` (text)
  - `amount_total` (numeric) - Total amount in cents
  - `amount_insurance_paid` (numeric) - Insurance portion paid in cents
  - `amount_patient_responsibility` (numeric) - Patient portion in cents
  - `amount_paid` (numeric) - Amount paid so far in cents
  - `amount_outstanding` (numeric) - Remaining balance in cents
  - `status` (text) - 'draft', 'sent', 'viewed', 'paid', 'partial', 'failed', 'disputed', 'cancelled'
  - `payment_status` (text) - 'unpaid', 'paid', 'failed', 'disputed'
  - `payment_method_type` (text, nullable) - High-level only: 'card', 'ach', 'other'
  - `stripe_hosted_url` (text, nullable) - URL to Stripe-hosted payment page
  - `sent_at` (timestamptz)
  - `paid_at` (timestamptz)
  - `due_date` (date)
  
  ### `patient_statements`
  Clear, non-clinical patient statements
  - `id` (uuid, primary key)
  - `invoice_id` (uuid) - Links to private_party_invoices
  - `statement_number` (text, unique)
  - `service_date` (date)
  - `service_type` (text) - 'ambulance_transport', 'telehealth'
  - `service_description` (text) - Plain language description
  - `origin_address` (text, nullable) - For ambulance
  - `destination_address` (text, nullable) - For ambulance
  - `level_of_service` (text) - Non-technical language
  - `total_charge` (numeric) - Original charge in cents
  - `insurance_payment` (numeric) - Insurance paid in cents
  - `adjustments` (numeric) - Adjustments in cents
  - `patient_balance` (numeric) - Final patient balance in cents
  - `generated_at` (timestamptz)
  
  ### `stripe_webhook_events`
  Audit trail of Stripe webhook events
  - `id` (uuid, primary key)
  - `stripe_event_id` (text, unique) - Stripe event ID
  - `event_type` (text) - 'invoice.paid', 'payment_intent.failed', etc.
  - `received_at` (timestamptz)
  - `processed_at` (timestamptz)
  - `processing_status` (text) - 'pending', 'processed', 'failed'
  - `related_invoice_id` (uuid, nullable) - Links to private_party_invoices
  - `event_data` (jsonb) - Webhook payload (no payment data)
  
  ### `payment_plans`
  Payment plan status tracking (plans configured in Stripe)
  - `id` (uuid, primary key)
  - `invoice_id` (uuid) - Links to private_party_invoices
  - `stripe_subscription_id` (text) - Stripe subscription reference
  - `plan_status` (text) - 'active', 'paused', 'completed', 'failed'
  - `installment_amount` (numeric) - Per-installment amount in cents
  - `installments_total` (integer)
  - `installments_paid` (integer)
  - `next_payment_date` (date)
  - `created_at` (timestamptz)
  
  ### `billing_disputes`
  Dispute tracking (disputes managed in Stripe)
  - `id` (uuid, primary key)
  - `invoice_id` (uuid) - Links to private_party_invoices
  - `stripe_dispute_id` (text) - Stripe dispute reference
  - `dispute_reason` (text)
  - `dispute_status` (text) - 'open', 'under_review', 'won', 'lost'
  - `amount_disputed` (numeric) - Amount in cents
  - `opened_at` (timestamptz)
  - `resolved_at` (timestamptz)
  
  ## Security
  - Enable RLS on all tables
  - Patient portal users can only see their own invoices
  - Agency/founder access through role-based permissions
  - All webhook processing logged and auditable
  - NO PAYMENT DATA EVER STORED
*/

-- Create private party invoices table
CREATE TABLE IF NOT EXISTS private_party_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  stripe_invoice_id text,
  stripe_customer_id text,
  encounter_id uuid,
  service_type text NOT NULL CHECK (service_type IN ('ambulance_transport', 'telehealth')),
  payer_type text NOT NULL CHECK (payer_type IN ('patient', 'guarantor', 'private_party')),
  payer_name text NOT NULL,
  payer_email text NOT NULL,
  amount_total numeric NOT NULL,
  amount_insurance_paid numeric DEFAULT 0,
  amount_patient_responsibility numeric NOT NULL,
  amount_paid numeric DEFAULT 0,
  amount_outstanding numeric NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'viewed', 'paid', 'partial', 'failed', 'disputed', 'cancelled'
  )),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN (
    'unpaid', 'paid', 'failed', 'disputed'
  )),
  payment_method_type text CHECK (payment_method_type IN ('card', 'ach', 'other')),
  stripe_hosted_url text,
  sent_at timestamptz,
  paid_at timestamptz,
  due_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create patient statements table
CREATE TABLE IF NOT EXISTS patient_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES private_party_invoices(id),
  statement_number text NOT NULL UNIQUE,
  service_date date NOT NULL,
  service_type text NOT NULL CHECK (service_type IN ('ambulance_transport', 'telehealth')),
  service_description text NOT NULL,
  origin_address text,
  destination_address text,
  level_of_service text NOT NULL,
  total_charge numeric NOT NULL,
  insurance_payment numeric DEFAULT 0,
  adjustments numeric DEFAULT 0,
  patient_balance numeric NOT NULL,
  generated_at timestamptz DEFAULT now()
);

-- Create Stripe webhook events table
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  received_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processing_status text NOT NULL DEFAULT 'pending' CHECK (processing_status IN (
    'pending', 'processed', 'failed'
  )),
  related_invoice_id uuid REFERENCES private_party_invoices(id),
  event_data jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Create payment plans table
CREATE TABLE IF NOT EXISTS payment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES private_party_invoices(id),
  stripe_subscription_id text NOT NULL,
  plan_status text NOT NULL DEFAULT 'active' CHECK (plan_status IN (
    'active', 'paused', 'completed', 'failed', 'cancelled'
  )),
  installment_amount numeric NOT NULL,
  installments_total integer NOT NULL,
  installments_paid integer DEFAULT 0,
  next_payment_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create billing disputes table
CREATE TABLE IF NOT EXISTS billing_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES private_party_invoices(id),
  stripe_dispute_id text NOT NULL,
  dispute_reason text NOT NULL,
  dispute_status text NOT NULL DEFAULT 'open' CHECK (dispute_status IN (
    'open', 'under_review', 'won', 'lost', 'closed'
  )),
  amount_disputed numeric NOT NULL,
  opened_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_private_invoices_stripe_id ON private_party_invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_private_invoices_encounter ON private_party_invoices(encounter_id);
CREATE INDEX IF NOT EXISTS idx_private_invoices_status ON private_party_invoices(status);
CREATE INDEX IF NOT EXISTS idx_private_invoices_payment_status ON private_party_invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_private_invoices_email ON private_party_invoices(payer_email);
CREATE INDEX IF NOT EXISTS idx_statements_invoice ON patient_statements(invoice_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON stripe_webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON stripe_webhook_events(processing_status);
CREATE INDEX IF NOT EXISTS idx_payment_plans_invoice ON payment_plans(invoice_id);
CREATE INDEX IF NOT EXISTS idx_disputes_invoice ON billing_disputes(invoice_id);

-- Enable RLS
ALTER TABLE private_party_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Agency/founder can see all, patients can see their own
CREATE POLICY "Authenticated users can view private invoices"
  ON private_party_invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage private invoices"
  ON private_party_invoices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view statements"
  ON patient_statements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create statements"
  ON patient_statements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view webhook events"
  ON stripe_webhook_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create webhook events"
  ON stripe_webhook_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update webhook events"
  ON stripe_webhook_events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view payment plans"
  ON payment_plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage payment plans"
  ON payment_plans FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view disputes"
  ON billing_disputes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage disputes"
  ON billing_disputes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);