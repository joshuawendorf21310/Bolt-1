/*
  # Add Missing Billing Command Center Tables
  
  ## Purpose
  Complete the billing command center schema by adding tables that don't yet exist.
  Handle existing tables gracefully.
  
  ## New Tables Added
  - eligibility_checks (270/271 eligibility verification)
  - claim_submissions (837P submissions)
  - claim_status_inquiries (276/277 status checks)
  - remittance_advices (835/ERA payment explanations)
  
  ## Security
  - Enable RLS on all new tables
  - Authenticated user access
*/

-- Create eligibility checks table if not exists
CREATE TABLE IF NOT EXISTS eligibility_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES billing_claims(id),
  checked_at timestamptz DEFAULT now(),
  patient_name text NOT NULL,
  patient_dob date NOT NULL,
  payer_name text NOT NULL,
  payer_id text NOT NULL,
  coverage_active boolean DEFAULT false,
  coverage_details jsonb DEFAULT '{}'::jsonb,
  eligibility_status text NOT NULL DEFAULT 'unknown' CHECK (eligibility_status IN ('active', 'inactive', 'unknown', 'error')),
  response_271_id uuid REFERENCES edi_transactions(id)
);

-- Create claim submissions table if not exists
CREATE TABLE IF NOT EXISTS claim_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES billing_claims(id),
  submitted_at timestamptz DEFAULT now(),
  submission_method text NOT NULL DEFAULT 'electronic' CHECK (submission_method IN ('electronic', 'paper')),
  clearinghouse_status text NOT NULL DEFAULT 'pending' CHECK (clearinghouse_status IN ('accepted', 'rejected', 'pending')),
  rejection_reason text,
  transaction_837_id uuid REFERENCES edi_transactions(id)
);

-- Create claim status inquiries table if not exists
CREATE TABLE IF NOT EXISTS claim_status_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES billing_claims(id),
  inquired_at timestamptz DEFAULT now(),
  payer_claim_number text,
  status_code text NOT NULL,
  status_description text NOT NULL,
  payer_message text,
  transaction_277_id uuid REFERENCES edi_transactions(id)
);

-- Create remittance advices table if not exists
CREATE TABLE IF NOT EXISTS remittance_advices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES billing_claims(id),
  received_at timestamptz DEFAULT now(),
  check_number text NOT NULL,
  check_date date NOT NULL,
  paid_amount numeric NOT NULL,
  adjustment_amount numeric DEFAULT 0,
  patient_responsibility numeric DEFAULT 0,
  denial_code text,
  denial_reason text,
  posted_to_ar boolean DEFAULT false,
  transaction_835_id uuid REFERENCES edi_transactions(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_eligibility_claim ON eligibility_checks(claim_id);
CREATE INDEX IF NOT EXISTS idx_submissions_claim ON claim_submissions(claim_id);
CREATE INDEX IF NOT EXISTS idx_status_inquiries_claim ON claim_status_inquiries(claim_id);
CREATE INDEX IF NOT EXISTS idx_remittance_claim ON remittance_advices(claim_id);
CREATE INDEX IF NOT EXISTS idx_remittance_posted ON remittance_advices(posted_to_ar);

-- Enable RLS
ALTER TABLE eligibility_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_status_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE remittance_advices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view eligibility checks' AND tablename = 'eligibility_checks') THEN
    CREATE POLICY "Authenticated users can view eligibility checks"
      ON eligibility_checks FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can create eligibility checks' AND tablename = 'eligibility_checks') THEN
    CREATE POLICY "Authenticated users can create eligibility checks"
      ON eligibility_checks FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view submissions' AND tablename = 'claim_submissions') THEN
    CREATE POLICY "Authenticated users can view submissions"
      ON claim_submissions FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can create submissions' AND tablename = 'claim_submissions') THEN
    CREATE POLICY "Authenticated users can create submissions"
      ON claim_submissions FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view status inquiries' AND tablename = 'claim_status_inquiries') THEN
    CREATE POLICY "Authenticated users can view status inquiries"
      ON claim_status_inquiries FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can create status inquiries' AND tablename = 'claim_status_inquiries') THEN
    CREATE POLICY "Authenticated users can create status inquiries"
      ON claim_status_inquiries FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view remittance advices' AND tablename = 'remittance_advices') THEN
    CREATE POLICY "Authenticated users can view remittance advices"
      ON remittance_advices FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage remittance advices' AND tablename = 'remittance_advices') THEN
    CREATE POLICY "Authenticated users can manage remittance advices"
      ON remittance_advices FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;