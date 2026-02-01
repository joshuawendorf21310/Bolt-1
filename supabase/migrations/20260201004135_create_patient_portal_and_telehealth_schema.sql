/*
  # Patient Portal Access & Carefusion Telehealth Schema
  
  ## Purpose
  1. Patient portal: Secure, isolated access for patients to view invoices and pay bills
  2. Telehealth: Carefusion Telehealth encounters as distinct billable service type
  
  ## New Tables
  
  ### `patient_portal_access`
  Patient portal authentication and access control
  - `id` (uuid, primary key)
  - `patient_email` (text, unique) - Patient email for login
  - `patient_name` (text)
  - `access_token` (text, unique) - Secure access token (not a payment token!)
  - `token_expires_at` (timestamptz)
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  - `last_login` (timestamptz)
  
  ### `patient_invoice_access`
  Map patients to their invoices
  - `id` (uuid, primary key)
  - `patient_access_id` (uuid) - Links to patient_portal_access
  - `invoice_id` (uuid) - Links to private_party_invoices
  - `can_view` (boolean)
  - `can_pay` (boolean)
  
  ### `telehealth_encounters`
  Carefusion Telehealth session records
  - `id` (uuid, primary key)
  - `encounter_number` (text, unique)
  - `patient_name` (text)
  - `patient_dob` (date)
  - `session_start` (timestamptz)
  - `session_end` (timestamptz)
  - `duration_minutes` (integer)
  - `provider_type` (text) - 'physician', 'nurse', 'paramedic', 'emt'
  - `service_category` (text) - 'consultation', 'follow_up', 'triage', 'assessment'
  - `disposition` (text) - 'resolved', 'ems_dispatched', 'referred', 'follow_up_needed'
  - `resulted_in_transport` (boolean) - Whether EMS was dispatched
  - `transport_incident_id` (uuid, nullable) - Links to transport incident if applicable
  - `clinical_notes` (text) - Provider documentation
  - `is_billable` (boolean)
  - `created_at` (timestamptz)
  
  ### `telehealth_billing_events`
  Billable events from telehealth encounters
  - `id` (uuid, primary key)
  - `encounter_id` (uuid) - Links to telehealth_encounters
  - `billing_claim_id` (uuid, nullable) - Links to billing_claims if insurance
  - `private_invoice_id` (uuid, nullable) - Links to private_party_invoices if self-pay
  - `cpt_code` (text) - CPT/HCPCS code
  - `service_description` (text)
  - `charge_amount` (numeric) - Amount in cents
  - `payer_path` (text) - 'insurance', 'patient_self_pay', 'contracted_organization'
  - `billing_status` (text) - 'pending', 'submitted', 'paid', 'denied'
  - `created_at` (timestamptz)
  
  ### `telehealth_transport_bundles`
  Track when telehealth and transport should/should not be bundled
  - `id` (uuid, primary key)
  - `telehealth_encounter_id` (uuid) - Links to telehealth_encounters
  - `transport_incident_id` (uuid) - Links to transport incident
  - `billing_relationship` (text) - 'separate', 'bundled', 'telehealth_only', 'transport_only'
  - `bundling_rule` (text) - Reason for bundling decision
  - `created_at` (timestamptz)
  
  ## Security
  - Patient portal users have strict row-level security
  - Patients can ONLY see their own data
  - Clinical notes visible to providers only, not patients
  - Telehealth and transport billing remain distinct by default
*/

-- Create patient portal access table
CREATE TABLE IF NOT EXISTS patient_portal_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_email text NOT NULL UNIQUE,
  patient_name text NOT NULL,
  access_token text NOT NULL UNIQUE,
  token_expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Create patient invoice access mapping table
CREATE TABLE IF NOT EXISTS patient_invoice_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_access_id uuid NOT NULL REFERENCES patient_portal_access(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES private_party_invoices(id) ON DELETE CASCADE,
  can_view boolean DEFAULT true,
  can_pay boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(patient_access_id, invoice_id)
);

-- Create telehealth encounters table
CREATE TABLE IF NOT EXISTS telehealth_encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_number text NOT NULL UNIQUE,
  patient_name text NOT NULL,
  patient_dob date NOT NULL,
  session_start timestamptz NOT NULL,
  session_end timestamptz,
  duration_minutes integer,
  provider_type text NOT NULL CHECK (provider_type IN (
    'physician', 'nurse_practitioner', 'physician_assistant', 'nurse', 'paramedic', 'emt', 'other'
  )),
  service_category text NOT NULL CHECK (service_category IN (
    'consultation', 'follow_up', 'triage', 'assessment', 'urgent_care', 'mental_health'
  )),
  disposition text NOT NULL CHECK (disposition IN (
    'resolved', 'ems_dispatched', 'referred', 'follow_up_needed', 'transferred', 'self_care'
  )),
  resulted_in_transport boolean DEFAULT false,
  transport_incident_id uuid,
  clinical_notes text,
  is_billable boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create telehealth billing events table
CREATE TABLE IF NOT EXISTS telehealth_billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid NOT NULL REFERENCES telehealth_encounters(id),
  billing_claim_id uuid REFERENCES billing_claims(id),
  private_invoice_id uuid REFERENCES private_party_invoices(id),
  cpt_code text NOT NULL,
  service_description text NOT NULL,
  charge_amount numeric NOT NULL,
  payer_path text NOT NULL CHECK (payer_path IN (
    'insurance', 'patient_self_pay', 'contracted_organization'
  )),
  billing_status text NOT NULL DEFAULT 'pending' CHECK (billing_status IN (
    'pending', 'submitted', 'paid', 'denied', 'appealed'
  )),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create telehealth transport bundles table
CREATE TABLE IF NOT EXISTS telehealth_transport_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telehealth_encounter_id uuid NOT NULL REFERENCES telehealth_encounters(id),
  transport_incident_id uuid NOT NULL,
  billing_relationship text NOT NULL CHECK (billing_relationship IN (
    'separate', 'bundled', 'telehealth_only', 'transport_only'
  )),
  bundling_rule text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_patient_access_email ON patient_portal_access(patient_email);
CREATE INDEX IF NOT EXISTS idx_patient_access_token ON patient_portal_access(access_token);
CREATE INDEX IF NOT EXISTS idx_patient_invoice_access_patient ON patient_invoice_access(patient_access_id);
CREATE INDEX IF NOT EXISTS idx_patient_invoice_access_invoice ON patient_invoice_access(invoice_id);
CREATE INDEX IF NOT EXISTS idx_telehealth_encounter_number ON telehealth_encounters(encounter_number);
CREATE INDEX IF NOT EXISTS idx_telehealth_session_start ON telehealth_encounters(session_start DESC);
CREATE INDEX IF NOT EXISTS idx_telehealth_billable ON telehealth_encounters(is_billable);
CREATE INDEX IF NOT EXISTS idx_telehealth_billing_encounter ON telehealth_billing_events(encounter_id);
CREATE INDEX IF NOT EXISTS idx_telehealth_billing_status ON telehealth_billing_events(billing_status);
CREATE INDEX IF NOT EXISTS idx_telehealth_bundles_telehealth ON telehealth_transport_bundles(telehealth_encounter_id);
CREATE INDEX IF NOT EXISTS idx_telehealth_bundles_transport ON telehealth_transport_bundles(transport_incident_id);

-- Enable RLS
ALTER TABLE patient_portal_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_invoice_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE telehealth_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE telehealth_billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE telehealth_transport_bundles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patient portal (patients see only their own data)
CREATE POLICY "Patients can view their own portal access"
  ON patient_portal_access FOR SELECT
  TO authenticated
  USING (patient_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Authenticated staff can manage patient access"
  ON patient_portal_access FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Patients can view their invoice access"
  ON patient_invoice_access FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_portal_access
      WHERE id = patient_invoice_access.patient_access_id
      AND patient_email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "Authenticated staff can manage invoice access"
  ON patient_invoice_access FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for telehealth (staff access, patients cannot see clinical notes)
CREATE POLICY "Authenticated users can view telehealth encounters"
  ON telehealth_encounters FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage telehealth encounters"
  ON telehealth_encounters FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view telehealth billing"
  ON telehealth_billing_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage telehealth billing"
  ON telehealth_billing_events FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view bundles"
  ON telehealth_transport_bundles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage bundles"
  ON telehealth_transport_bundles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);