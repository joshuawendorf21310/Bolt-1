/*
  # Advanced Features Schema

  ## Overview
  Extends the NEMSIS system with advanced features for ImageTrend-style functionality

  ## 1. New Tables

  ### Validation & Rules
  - `validation_rules` - Custom validation rules builder
  - `visibility_rules` - Field visibility rules
  - `state_requirements` - State-specific required fields

  ### OCR & Documents
  - `scanned_documents` - OCR'd documents (facesheet, PCS, AOB, ABN)
  - `ocr_extractions` - Extracted data from documents

  ### Device Integrations
  - `device_readings` - Cardiac monitors, IV pumps, ventilators
  - `rhythm_strips` - Cardiac rhythm strip images and analysis
  - `pta_interventions` - Prior to Arrival interventions from transferring facilities

  ### Medical Coding
  - `icd10_codes` - ICD-10 diagnosis codes cache
  - `rxnorm_medications` - RxNorm medication database
  - `snomed_procedures` - SNOMED procedure codes

  ### Smart Features
  - `patient_search_index` - Fast patient search and repeat finder
  - `epcr_templates` - Reusable ePCR templates
  - `cms_facilities` - CMS facility database

  ## 2. ePCR Types
  - Enhanced incidents table with epcr_type field (fire_ems, medical_transport, hems, cct)
*/

-- =====================================================
-- VALIDATION RULES SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS validation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  description text,
  rule_type text NOT NULL, -- required, format, range, conditional, state_required
  
  field_name text NOT NULL,
  epcr_type text, -- fire_ems, medical_transport, hems, cct, all
  
  condition_expression jsonb,
  validation_expression text,
  error_message text,
  
  priority integer DEFAULT 100,
  is_active boolean DEFAULT true,
  
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS visibility_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  field_name text NOT NULL,
  epcr_type text,
  
  show_when_expression jsonb NOT NULL,
  
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS state_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  state_code text NOT NULL,
  field_name text NOT NULL,
  epcr_type text,
  is_required boolean DEFAULT true,
  
  requirement_notes text,
  
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- OCR & DOCUMENT SCANNING
-- =====================================================

CREATE TABLE IF NOT EXISTS scanned_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  
  document_type text NOT NULL, -- facesheet, pcs_form, aob, abn, insurance_card
  
  original_file_url text NOT NULL,
  ocr_status text DEFAULT 'pending', -- pending, processing, completed, failed
  
  ocr_confidence numeric(3, 2),
  extracted_text text,
  
  processed_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ocr_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scanned_document_id uuid REFERENCES scanned_documents(id) ON DELETE CASCADE,
  
  field_name text NOT NULL,
  field_value text,
  confidence numeric(3, 2),
  
  auto_populated boolean DEFAULT false,
  manually_verified boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- DEVICE INTEGRATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS device_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  
  device_type text NOT NULL, -- cardiac_monitor, iv_pump, ventilator
  device_manufacturer text,
  device_model text,
  
  reading_timestamp timestamptz NOT NULL,
  
  data jsonb NOT NULL,
  
  imported_from text, -- manual, bluetooth, wifi, ocr
  
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rhythm_strips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  
  strip_timestamp timestamptz NOT NULL,
  
  image_url text NOT NULL,
  
  rhythm_interpretation text,
  ai_analysis jsonb,
  
  heart_rate integer,
  rhythm_type text, -- sinus, afib, vfib, vtach, asystole, pea
  
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pta_interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  
  transferring_facility_id uuid REFERENCES facilities(id),
  
  intervention_type text NOT NULL,
  intervention_description text NOT NULL,
  
  performed_at timestamptz,
  performed_by text,
  
  medication_name text,
  medication_dose numeric,
  medication_route text,
  
  procedure_name text,
  
  notes text,
  
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- MEDICAL CODING DATABASES
-- =====================================================

CREATE TABLE IF NOT EXISTS icd10_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  code text UNIQUE NOT NULL,
  description text NOT NULL,
  category text,
  
  is_billable boolean DEFAULT true,
  
  search_vector tsvector,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rxnorm_medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  rxcui text UNIQUE NOT NULL,
  name text NOT NULL,
  generic_name text,
  brand_names text[],
  
  drug_class text,
  route text[],
  strength text,
  
  search_vector tsvector,
  
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS snomed_procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  concept_id text UNIQUE NOT NULL,
  term text NOT NULL,
  fully_specified_name text,
  
  procedure_category text,
  nemsis_mapping text,
  
  search_vector tsvector,
  
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- PATIENT SEARCH & REPEAT FEATURES
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_search_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  
  search_text text NOT NULL,
  last_incident_date timestamptz,
  incident_count integer DEFAULT 0,
  
  search_vector tsvector,
  
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS epcr_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  epcr_type text NOT NULL,
  
  template_data jsonb NOT NULL,
  
  is_global boolean DEFAULT false,
  created_by uuid REFERENCES users(id),
  
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cms_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  ccn text UNIQUE NOT NULL,
  facility_name text NOT NULL,
  
  address_line1 text,
  city text,
  state text,
  zip text,
  
  facility_type text,
  
  phone text,
  
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  
  search_vector tsvector,
  
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- ENHANCED INCIDENTS TABLE
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'epcr_type'
  ) THEN
    ALTER TABLE incidents ADD COLUMN epcr_type text DEFAULT 'fire_ems';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'is_hems'
  ) THEN
    ALTER TABLE incidents ADD COLUMN is_hems boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'is_cct'
  ) THEN
    ALTER TABLE incidents ADD COLUMN is_cct boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'validation_errors'
  ) THEN
    ALTER TABLE incidents ADD COLUMN validation_errors jsonb DEFAULT '[]';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'nemsis_xml'
  ) THEN
    ALTER TABLE incidents ADD COLUMN nemsis_xml text;
  END IF;
END $$;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_validation_rules_org ON validation_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_validation_rules_field ON validation_rules(field_name);
CREATE INDEX IF NOT EXISTS idx_scanned_documents_incident ON scanned_documents(incident_id);
CREATE INDEX IF NOT EXISTS idx_device_readings_patient ON device_readings(patient_id);
CREATE INDEX IF NOT EXISTS idx_rhythm_strips_patient ON rhythm_strips(patient_id);
CREATE INDEX IF NOT EXISTS idx_pta_interventions_patient ON pta_interventions(patient_id);

CREATE INDEX IF NOT EXISTS idx_icd10_search ON icd10_codes USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_rxnorm_search ON rxnorm_medications USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_snomed_search ON snomed_procedures USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_patient_search ON patient_search_index USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_cms_facilities_search ON cms_facilities USING gin(search_vector);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE validation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE visibility_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanned_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rhythm_strips ENABLE ROW LEVEL SECURITY;
ALTER TABLE pta_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE icd10_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rxnorm_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE snomed_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE epcr_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org validation rules"
  ON validation_rules FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view org scanned documents"
  ON scanned_documents FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create org scanned documents"
  ON scanned_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "All users can view ICD-10 codes"
  ON icd10_codes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All users can view RxNorm medications"
  ON rxnorm_medications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All users can view SNOMED procedures"
  ON snomed_procedures FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All users can view CMS facilities"
  ON cms_facilities FOR SELECT
  TO authenticated
  USING (true);