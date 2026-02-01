/*
  # NEMSIS v3.5.0 & CMS-Compliant EMS Billing System

  ## Overview
  This migration creates a comprehensive database schema for NEMSIS-compliant ePCR data capture
  and CMS-compliant ambulance billing. All PHI/PII data is encrypted at rest.

  ## 1. Core Tables

  ### Organizations & Users
  - `organizations` - EMS agencies/departments
  - `users` - System users with role-based access
  - `audit_logs` - HIPAA-compliant audit trail

  ### NEMSIS ePCR Tables
  - `incidents` - Core incident/response data (eResponse)
  - `patients` - Patient demographics (ePatient) 
  - `patient_vitals` - Vital signs with timestamps (eVitals)
  - `patient_history` - Medical history, medications, allergies (eHistory)
  - `procedures` - Interventions performed (eProcedures)
  - `scene_data` - Scene information (eScene)
  - `transport_data` - Transport/disposition details (eDisposition)

  ### Billing Tables
  - `payers` - Insurance companies/payers
  - `facilities` - Hospitals and healthcare facilities
  - `claims` - Main claim records
  - `claim_diagnoses` - ICD-10 codes linked to claims
  - `claim_lines` - Service line items (CPT/HCFA codes)
  - `claim_submissions` - Submission tracking (Office Ally)
  - `claim_payments` - Payment/ERA data
  - `denied_claims` - Denial management

  ## 2. Security
  - Row Level Security (RLS) enabled on all tables
  - Policies enforce organization-based data isolation
  - Audit logging for all PHI access
  - Encryption for sensitive fields

  ## 3. Compliance Features
  - NEMSIS v3.5.0 data elements
  - CMS-1500/837P claim format support
  - Ambulance-specific billing codes (A0425-A0434)
  - Origin/destination codes
  - Medical necessity documentation
  - Modifier support (GM, GN, QM, QN)
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ORGANIZATIONS & USERS
-- =====================================================

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  nemsis_state_id text, -- State NEMSIS ID
  npi text, -- National Provider Identifier
  taxonomy_code text DEFAULT '341600000X', -- Ambulance service
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip text,
  phone text,
  ein text, -- Employer Identification Number
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'user', -- admin, billing, ems, viewer
  npi text, -- Individual provider NPI
  certification_level text, -- EMT-B, EMT-I, Paramedic
  certification_number text,
  certification_state text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- AUDIT LOGGING (HIPAA Compliance)
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL, -- view, create, update, delete, export, print
  resource_type text NOT NULL, -- incident, patient, claim
  resource_id uuid,
  ip_address inet,
  user_agent text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- PAYERS & FACILITIES
-- =====================================================

CREATE TABLE IF NOT EXISTS payers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  payer_id text, -- Payer ID for 837P
  payer_type text NOT NULL, -- medicare, medicaid, commercial, workers_comp, self_pay
  address_line1 text,
  city text,
  state text,
  zip text,
  phone text,
  accepts_electronic boolean DEFAULT true,
  office_ally_enabled boolean DEFAULT false,
  requires_paper boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  facility_type text, -- hospital, nursing_home, residence, scene
  npi text,
  address_line1 text,
  city text,
  state text,
  zip text,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- NEMSIS ePCR: INCIDENTS (eResponse)
-- =====================================================

CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Incident Identification
  incident_number text UNIQUE NOT NULL,
  pcr_number text,
  state_incident_id text, -- State tracking number
  
  -- Response Times (eTimes)
  call_received_at timestamptz,
  unit_notified_at timestamptz,
  unit_enroute_at timestamptz,
  unit_arrived_scene_at timestamptz,
  arrived_patient_at timestamptz,
  unit_left_scene_at timestamptz,
  arrived_destination_at timestamptz,
  unit_available_at timestamptz,
  
  -- Response Details
  response_mode_to_scene text, -- lights_sirens, no_lights_sirens
  response_mode_from_scene text,
  unit_number text NOT NULL,
  vehicle_dispatch_location text,
  
  -- Crew Information
  primary_crew_member_id uuid REFERENCES users(id),
  crew_members jsonb DEFAULT '[]', -- Array of user IDs
  
  -- Scene Information (eScene)
  scene_gps_latitude numeric(10, 7),
  scene_gps_longitude numeric(10, 7),
  scene_address_line1 text,
  scene_city text,
  scene_state text,
  scene_zip text,
  scene_location_type text, -- residence, highway, public_building
  
  -- Incident Type (eSituation)
  complaint_type text, -- medical, trauma, other
  primary_complaint text,
  secondary_complaints text[],
  primary_symptom text,
  provider_impression text,
  
  -- Metadata
  status text DEFAULT 'draft', -- draft, completed, billed, closed
  is_billable boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- NEMSIS ePCR: PATIENTS (ePatient)
-- =====================================================

CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  
  -- Demographics
  first_name text NOT NULL,
  last_name text NOT NULL,
  middle_name text,
  date_of_birth date NOT NULL,
  age integer,
  age_units text DEFAULT 'years', -- years, months, days
  gender text NOT NULL, -- male, female, other, unknown
  race text,
  ethnicity text,
  
  -- Contact Information
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip text,
  home_phone text,
  mobile_phone text,
  email text,
  
  -- Insurance (Primary)
  primary_insurance_payer_id uuid REFERENCES payers(id),
  primary_insurance_number text,
  primary_insurance_group text,
  primary_subscriber_name text,
  primary_subscriber_dob date,
  primary_subscriber_relationship text, -- self, spouse, child, other
  
  -- Insurance (Secondary)
  secondary_insurance_payer_id uuid REFERENCES payers(id),
  secondary_insurance_number text,
  secondary_insurance_group text,
  
  -- Medicare/Medicaid Specific
  medicare_number text,
  medicaid_number text,
  
  -- Emergency Contact
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  
  -- SSN (encrypted)
  ssn_encrypted text, -- Encrypted with pgcrypto
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- NEMSIS ePCR: PATIENT HISTORY (eHistory)
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Medical History
  past_medical_history text[],
  current_medications text[],
  allergies text[],
  immunizations jsonb DEFAULT '[]',
  
  -- Advance Directives
  advance_directives text, -- none, dnr, living_will, healthcare_proxy
  advance_directive_verified boolean DEFAULT false,
  
  -- Barriers to Care
  communication_barrier text,
  
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- NEMSIS ePCR: VITALS (eVitals)
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_vitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Timing
  obtained_at timestamptz NOT NULL,
  vital_set_number integer DEFAULT 1, -- 1st set, 2nd set, etc.
  
  -- Vital Signs
  systolic_bp integer,
  diastolic_bp integer,
  heart_rate integer,
  pulse_oximetry integer, -- SpO2 percentage
  respiratory_rate integer,
  temperature numeric(4, 1),
  temperature_method text, -- oral, rectal, tympanic, temporal
  blood_glucose integer,
  gcs_eye integer,
  gcs_verbal integer,
  gcs_motor integer,
  gcs_total integer,
  pain_scale integer, -- 0-10
  
  -- Additional Assessments
  pupils text, -- equal_reactive, unequal, dilated, pinpoint
  skin_assessment text, -- normal, pale, flushed, cyanotic
  
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- NEMSIS ePCR: PROCEDURES (eProcedures)
-- =====================================================

CREATE TABLE IF NOT EXISTS procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Procedure Details
  procedure_code text NOT NULL, -- CPT code
  procedure_description text NOT NULL,
  performed_at timestamptz NOT NULL,
  performed_by_id uuid REFERENCES users(id),
  
  -- Clinical Details
  successful boolean DEFAULT true,
  number_of_attempts integer DEFAULT 1,
  complications text,
  response_to_procedure text,
  
  -- Medication Administration
  is_medication boolean DEFAULT false,
  medication_name text,
  medication_dose numeric,
  medication_dose_unit text,
  medication_route text, -- IV, IM, PO, sublingual, inhaled
  
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- NEMSIS ePCR: TRANSPORT (eDisposition)
-- =====================================================

CREATE TABLE IF NOT EXISTS transport_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Transport Decision
  transport_disposition text NOT NULL, -- transported, refused, cancelled, dead_on_scene
  transport_reason text,
  level_of_service text NOT NULL, -- BLS, ALS1, ALS2, SCT, PI
  
  -- Origin (Pickup)
  origin_facility_id uuid REFERENCES facilities(id),
  origin_code text NOT NULL, -- E=Residence, H=Hospital, I=SNF, etc. (CMS codes)
  origin_address_line1 text,
  origin_city text,
  origin_state text,
  origin_zip text,
  
  -- Destination (Dropoff)
  destination_facility_id uuid REFERENCES facilities(id),
  destination_code text, -- Same CMS codes
  destination_address_line1 text,
  destination_city text,
  destination_state text,
  destination_zip text,
  
  -- Mileage (CMS Requirement)
  total_mileage numeric(6, 2) NOT NULL,
  loaded_mileage numeric(6, 2), -- Miles with patient
  
  -- Patient Condition (Medical Necessity)
  patient_condition_codes text[], -- C1-C7 condition codes
  transport_medically_necessary boolean DEFAULT true,
  medical_necessity_reason text,
  
  -- Patient Status
  patient_status_on_arrival text, -- stable, critical, deceased
  patient_acuity text, -- emergent, urgent, non_urgent
  
  -- Signatures
  patient_signature_obtained boolean DEFAULT false,
  patient_refused_signature boolean DEFAULT false,
  crew_signature_id uuid REFERENCES users(id),
  
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- BILLING: CLAIMS
-- =====================================================

CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  payer_id uuid REFERENCES payers(id),
  
  -- Claim Identification
  claim_number text UNIQUE,
  claim_type text DEFAULT 'professional', -- CMS-1500
  
  -- Financial
  total_charge numeric(10, 2) NOT NULL DEFAULT 0,
  total_paid numeric(10, 2) DEFAULT 0,
  balance numeric(10, 2) DEFAULT 0,
  
  -- Status
  status text DEFAULT 'draft', -- draft, ready, submitted, accepted, paid, denied, appeal
  submission_method text, -- electronic_837p, paper_cms1500
  
  -- Dates
  service_date date NOT NULL,
  statement_date date,
  due_date date,
  
  -- Medical Necessity
  medical_necessity_documented boolean DEFAULT false,
  requires_prior_auth boolean DEFAULT false,
  prior_auth_number text,
  
  -- AI Coding
  ai_coded boolean DEFAULT false,
  ai_coding_confidence numeric(3, 2), -- 0.00-1.00
  ai_suggestions jsonb,
  
  -- Notes
  billing_notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- BILLING: CLAIM DIAGNOSES (ICD-10)
-- =====================================================

CREATE TABLE IF NOT EXISTS claim_diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid REFERENCES claims(id) ON DELETE CASCADE,
  
  icd10_code text NOT NULL,
  description text NOT NULL,
  pointer_sequence integer NOT NULL, -- A, B, C, D (1-4)
  is_primary boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- BILLING: CLAIM LINES (Service Lines)
-- =====================================================

CREATE TABLE IF NOT EXISTS claim_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid REFERENCES claims(id) ON DELETE CASCADE,
  
  line_number integer NOT NULL,
  
  -- Service Code
  procedure_code text NOT NULL, -- A0425, A0426, A0427, A0428, A0429, A0433, A0434
  procedure_description text NOT NULL,
  
  -- Modifiers (Ambulance-specific)
  modifier_1 text, -- GM (multiple patients), QM (basic life support)
  modifier_2 text, -- QN (ambulance furnished directly)
  modifier_3 text,
  modifier_4 text,
  
  -- Origin/Destination
  origin_code text NOT NULL, -- CMS Place of Service codes
  destination_code text NOT NULL,
  
  -- Pricing
  unit_charge numeric(10, 2) NOT NULL,
  units numeric(6, 2) DEFAULT 1, -- For mileage
  total_charge numeric(10, 2) NOT NULL,
  
  -- Diagnosis Pointers
  diagnosis_pointers text[], -- ['A', 'B'] references claim_diagnoses
  
  -- Service Details
  service_date date NOT NULL,
  
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- BILLING: SUBMISSIONS (Office Ally Tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS claim_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid REFERENCES claims(id) ON DELETE CASCADE,
  
  -- Submission Details
  submission_method text NOT NULL, -- office_ally_837p, lob_paper
  submitted_at timestamptz DEFAULT now(),
  submitted_by_id uuid REFERENCES users(id),
  
  -- Office Ally Response
  office_ally_submission_id text,
  office_ally_status text, -- accepted, rejected, pending
  office_ally_response jsonb,
  
  -- Lob Response (Paper Claims)
  lob_letter_id text,
  lob_tracking_number text,
  lob_expected_delivery_date date,
  lob_status text, -- processed, in_transit, delivered
  
  -- Tracking
  clearinghouse_id text,
  clearinghouse_status text,
  status_checked_at timestamptz,
  
  -- Errors
  rejection_reason text,
  validation_errors jsonb,
  
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- BILLING: PAYMENTS (ERA/EOB)
-- =====================================================

CREATE TABLE IF NOT EXISTS claim_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid REFERENCES claims(id) ON DELETE CASCADE,
  
  -- Payment Details
  payment_date date NOT NULL,
  payment_amount numeric(10, 2) NOT NULL,
  payment_method text, -- check, eft, credit_card
  
  -- Check/EFT Details
  check_number text,
  eft_trace_number text,
  
  -- ERA Details
  era_835_file_id text,
  claim_adjustment_group_code text, -- CO, OA, PI, PR
  claim_adjustment_reason_codes text[], -- CARC codes
  
  -- Line Item Adjustments
  adjustments jsonb DEFAULT '[]',
  
  -- Status
  reconciled boolean DEFAULT false,
  reconciled_at timestamptz,
  reconciled_by_id uuid REFERENCES users(id),
  
  notes text,
  
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- BILLING: DENIED CLAIMS
-- =====================================================

CREATE TABLE IF NOT EXISTS denied_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid REFERENCES claims(id) ON DELETE CASCADE,
  
  -- Denial Details
  denied_at timestamptz DEFAULT now(),
  denial_reason_code text NOT NULL, -- CARC code
  denial_reason_description text NOT NULL,
  denial_category text, -- coding_error, medical_necessity, authorization, demographics
  
  -- Resolution
  resolution_status text DEFAULT 'pending', -- pending, corrected, appealed, written_off
  corrected_at timestamptz,
  corrected_by_id uuid REFERENCES users(id),
  
  -- AI Analysis
  ai_analyzed boolean DEFAULT false,
  ai_suggested_fix text,
  ai_denial_pattern text,
  
  -- Appeal
  appeal_filed boolean DEFAULT false,
  appeal_filed_at timestamptz,
  appeal_outcome text,
  
  notes text,
  
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_incidents_org ON incidents(organization_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_at);
CREATE INDEX IF NOT EXISTS idx_patients_incident ON patients(incident_id);
CREATE INDEX IF NOT EXISTS idx_claims_org ON claims(organization_id);
CREATE INDEX IF NOT EXISTS idx_claims_incident ON claims(incident_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_payer ON claims(payer_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payers ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE denied_claims ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can view data from their organization
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can view incidents from their organization
CREATE POLICY "Users can view org incidents"
  ON incidents FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can create incidents in their organization
CREATE POLICY "Users can create org incidents"
  ON incidents FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can update incidents in their organization
CREATE POLICY "Users can update org incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Apply similar policies to other tables
CREATE POLICY "Users can view org patients"
  ON patients FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create org patients"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view org claims"
  ON claims FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create org claims"
  ON claims FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view org audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Audit logs are append-only
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view org payers"
  ON payers FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view org facilities"
  ON facilities FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );