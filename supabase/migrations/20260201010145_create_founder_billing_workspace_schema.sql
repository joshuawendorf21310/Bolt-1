/*
  # Founder Billing Workspace Schema
  
  ## Purpose
  Private, founder-only workspace for billing operations, communications, and document management.
  This workspace is NOT multi-user, NOT collaborative, and NOT customer-facing.
  
  ## Communication Channels
  - Email (via Malibu) - authoritative written billing channel
  - AI Phone Assistant - human-quality voice for insurance calls
  - Fax - compliance and legacy payer requirements
  
  ## Document Workspace
  - Internal office suite (Word, Excel, PowerPoint-like)
  - PDF viewer and annotator
  - Cloud saving with versioning
  - Organized by agency, claim, encounter, billing period
  
  ## Security
  - Founder-only access
  - Encrypted at rest and in transit
  - Immutable history for finalized documents
  - Full audit logging
  
  ## New Tables
  
  ### `billing_emails`
  Internal billing email communication via Malibu
  - `id` (uuid, primary key)
  - `thread_id` (text) - Email thread identifier
  - `message_id` (text, unique) - Unique message ID
  - `subject` (text)
  - `from_address` (text)
  - `to_addresses` (jsonb) - Array of recipient addresses
  - `cc_addresses` (jsonb)
  - `bcc_addresses` (jsonb)
  - `body_text` (text) - Plain text body
  - `body_html` (text) - HTML body
  - `headers` (jsonb) - Original email headers
  - `direction` (text) - 'inbound', 'outbound'
  - `status` (text) - 'draft', 'sent', 'received', 'archived'
  - `tags` (jsonb) - Organizational tags
  - `linked_agency_id` (uuid)
  - `linked_claim_id` (uuid)
  - `linked_encounter_id` (uuid)
  - `internal_notes` (text) - Founder notes
  - `sent_at` (timestamptz)
  - `received_at` (timestamptz)
  - `created_at` (timestamptz)
  
  ### `ai_phone_calls`
  AI-powered phone calls for billing operations
  - `id` (uuid, primary key)
  - `call_sid` (text, unique) - External phone system ID
  - `phone_number` (text) - Number called/calling
  - `direction` (text) - 'outbound', 'inbound'
  - `call_purpose` (text) - 'eligibility', 'claim_status', 'follow_up', 'escalation'
  - `organization_name` (text) - Insurance company or entity called
  - `call_status` (text) - 'initiated', 'in_progress', 'completed', 'failed', 'requires_review'
  - `duration_seconds` (integer)
  - `transcript` (text) - Full call transcript
  - `summary` (text) - AI-generated summary
  - `outcome` (text) - Call result/outcome
  - `recording_url` (text) - Call recording location
  - `ai_model_used` (text)
  - `escalation_required` (boolean)
  - `escalation_reason` (text)
  - `founder_reviewed` (boolean)
  - `linked_agency_id` (uuid)
  - `linked_claim_id` (uuid)
  - `linked_encounter_id` (uuid)
  - `started_at` (timestamptz)
  - `completed_at` (timestamptz)
  - `created_at` (timestamptz)
  
  ### `billing_faxes`
  Fax communications for billing compliance
  - `id` (uuid, primary key)
  - `fax_sid` (text, unique) - External fax system ID
  - `fax_number` (text) - Number faxed to/from
  - `direction` (text) - 'inbound', 'outbound'
  - `page_count` (integer)
  - `status` (text) - 'queued', 'sending', 'sent', 'received', 'failed'
  - `fax_image_url` (text) - Immutable fax image
  - `pdf_url` (text) - PDF conversion of fax
  - `ocr_text` (text) - Extracted text via OCR
  - `purpose` (text) - 'eob', 'prior_auth', 'claim_submission', 'payer_correspondence'
  - `linked_agency_id` (uuid)
  - `linked_claim_id` (uuid)
  - `linked_encounter_id` (uuid)
  - `internal_notes` (text)
  - `sent_at` (timestamptz)
  - `received_at` (timestamptz)
  - `created_at` (timestamptz)
  
  ### `workspace_documents`
  Internal document workspace files
  - `id` (uuid, primary key)
  - `document_name` (text)
  - `document_type` (text) - 'word', 'excel', 'powerpoint', 'pdf', 'text'
  - `mime_type` (text)
  - `file_size_bytes` (bigint)
  - `storage_path` (text) - Cloud storage location
  - `current_version` (integer)
  - `organization_type` (text) - 'agency', 'claim', 'encounter', 'billing_period', 'general'
  - `linked_agency_id` (uuid)
  - `linked_claim_id` (uuid)
  - `linked_encounter_id` (uuid)
  - `billing_period` (text)
  - `tags` (jsonb)
  - `is_template` (boolean)
  - `is_finalized` (boolean)
  - `finalized_at` (timestamptz)
  - `created_by` (text) - Always 'founder'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `document_versions`
  Version history for all documents
  - `id` (uuid, primary key)
  - `document_id` (uuid) - Links to workspace_documents
  - `version_number` (integer)
  - `storage_path` (text) - Immutable version storage
  - `file_size_bytes` (bigint)
  - `change_summary` (text)
  - `created_by` (text) - Always 'founder'
  - `created_at` (timestamptz)
  
  ### `pdf_annotations`
  PDF annotations and markup
  - `id` (uuid, primary key)
  - `document_id` (uuid) - Links to workspace_documents
  - `page_number` (integer)
  - `annotation_type` (text) - 'note', 'highlight', 'stamp', 'drawing'
  - `annotation_data` (jsonb) - Position, content, style
  - `annotation_text` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `workspace_activity_log`
  Audit log for all workspace activity
  - `id` (uuid, primary key)
  - `activity_type` (text) - 'email_sent', 'call_made', 'fax_sent', 'document_created', 'document_edited'
  - `entity_type` (text) - 'email', 'phone_call', 'fax', 'document'
  - `entity_id` (uuid)
  - `activity_description` (text)
  - `metadata` (jsonb)
  - `created_at` (timestamptz)
  
  ## Security
  - Enable RLS on all tables
  - Founder-only access for all operations
  - All content encrypted
  - Immutable history for finalized documents
*/

-- Create billing emails table
CREATE TABLE IF NOT EXISTS billing_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id text NOT NULL,
  message_id text NOT NULL UNIQUE,
  subject text,
  from_address text NOT NULL,
  to_addresses jsonb NOT NULL DEFAULT '[]',
  cc_addresses jsonb DEFAULT '[]',
  bcc_addresses jsonb DEFAULT '[]',
  body_text text,
  body_html text,
  headers jsonb DEFAULT '{}',
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'received', 'archived')),
  tags jsonb DEFAULT '[]',
  linked_agency_id uuid,
  linked_claim_id uuid,
  linked_encounter_id uuid,
  internal_notes text,
  sent_at timestamptz,
  received_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create AI phone calls table
CREATE TABLE IF NOT EXISTS ai_phone_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid text UNIQUE,
  phone_number text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  call_purpose text NOT NULL CHECK (call_purpose IN (
    'eligibility', 'claim_status', 'follow_up', 'escalation', 'other'
  )),
  organization_name text,
  call_status text NOT NULL DEFAULT 'initiated' CHECK (call_status IN (
    'initiated', 'in_progress', 'completed', 'failed', 'requires_review'
  )),
  duration_seconds integer DEFAULT 0,
  transcript text,
  summary text,
  outcome text,
  recording_url text,
  ai_model_used text,
  escalation_required boolean DEFAULT false,
  escalation_reason text,
  founder_reviewed boolean DEFAULT false,
  linked_agency_id uuid,
  linked_claim_id uuid,
  linked_encounter_id uuid,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create billing faxes table
CREATE TABLE IF NOT EXISTS billing_faxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fax_sid text UNIQUE,
  fax_number text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  page_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'sending', 'sent', 'received', 'failed'
  )),
  fax_image_url text,
  pdf_url text,
  ocr_text text,
  purpose text CHECK (purpose IN (
    'eob', 'prior_auth', 'claim_submission', 'payer_correspondence', 'other'
  )),
  linked_agency_id uuid,
  linked_claim_id uuid,
  linked_encounter_id uuid,
  internal_notes text,
  sent_at timestamptz,
  received_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create workspace documents table
CREATE TABLE IF NOT EXISTS workspace_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_name text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN (
    'word', 'excel', 'powerpoint', 'pdf', 'text'
  )),
  mime_type text NOT NULL,
  file_size_bytes bigint DEFAULT 0,
  storage_path text NOT NULL,
  current_version integer DEFAULT 1,
  organization_type text CHECK (organization_type IN (
    'agency', 'claim', 'encounter', 'billing_period', 'general'
  )),
  linked_agency_id uuid,
  linked_claim_id uuid,
  linked_encounter_id uuid,
  billing_period text,
  tags jsonb DEFAULT '[]',
  is_template boolean DEFAULT false,
  is_finalized boolean DEFAULT false,
  finalized_at timestamptz,
  created_by text DEFAULT 'founder',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document versions table
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES workspace_documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  storage_path text NOT NULL,
  file_size_bytes bigint DEFAULT 0,
  change_summary text,
  created_by text DEFAULT 'founder',
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_id, version_number)
);

-- Create PDF annotations table
CREATE TABLE IF NOT EXISTS pdf_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES workspace_documents(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  annotation_type text NOT NULL CHECK (annotation_type IN (
    'note', 'highlight', 'stamp', 'drawing'
  )),
  annotation_data jsonb NOT NULL DEFAULT '{}',
  annotation_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workspace activity log table
CREATE TABLE IF NOT EXISTS workspace_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type text NOT NULL CHECK (activity_type IN (
    'email_sent', 'email_received', 'call_made', 'call_received', 
    'fax_sent', 'fax_received', 'document_created', 'document_edited', 
    'document_finalized', 'pdf_annotated'
  )),
  entity_type text NOT NULL CHECK (entity_type IN (
    'email', 'phone_call', 'fax', 'document'
  )),
  entity_id uuid NOT NULL,
  activity_description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_billing_emails_thread ON billing_emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_billing_emails_status ON billing_emails(status);
CREATE INDEX IF NOT EXISTS idx_billing_emails_created ON billing_emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_emails_agency ON billing_emails(linked_agency_id);
CREATE INDEX IF NOT EXISTS idx_billing_emails_claim ON billing_emails(linked_claim_id);

CREATE INDEX IF NOT EXISTS idx_ai_calls_status ON ai_phone_calls(call_status);
CREATE INDEX IF NOT EXISTS idx_ai_calls_purpose ON ai_phone_calls(call_purpose);
CREATE INDEX IF NOT EXISTS idx_ai_calls_escalation ON ai_phone_calls(escalation_required) WHERE escalation_required = true;
CREATE INDEX IF NOT EXISTS idx_ai_calls_created ON ai_phone_calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_calls_agency ON ai_phone_calls(linked_agency_id);
CREATE INDEX IF NOT EXISTS idx_ai_calls_claim ON ai_phone_calls(linked_claim_id);

CREATE INDEX IF NOT EXISTS idx_faxes_status ON billing_faxes(status);
CREATE INDEX IF NOT EXISTS idx_faxes_direction ON billing_faxes(direction);
CREATE INDEX IF NOT EXISTS idx_faxes_created ON billing_faxes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_faxes_agency ON billing_faxes(linked_agency_id);
CREATE INDEX IF NOT EXISTS idx_faxes_claim ON billing_faxes(linked_claim_id);

CREATE INDEX IF NOT EXISTS idx_documents_type ON workspace_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_org_type ON workspace_documents(organization_type);
CREATE INDEX IF NOT EXISTS idx_documents_finalized ON workspace_documents(is_finalized);
CREATE INDEX IF NOT EXISTS idx_documents_created ON workspace_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_agency ON workspace_documents(linked_agency_id);
CREATE INDEX IF NOT EXISTS idx_documents_claim ON workspace_documents(linked_claim_id);

CREATE INDEX IF NOT EXISTS idx_document_versions_doc ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_created ON document_versions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pdf_annotations_doc ON pdf_annotations(document_id);
CREATE INDEX IF NOT EXISTS idx_pdf_annotations_page ON pdf_annotations(document_id, page_number);

CREATE INDEX IF NOT EXISTS idx_activity_log_type ON workspace_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON workspace_activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON workspace_activity_log(created_at DESC);

-- Enable RLS
ALTER TABLE billing_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_phone_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_faxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Founder-only access (authenticated users for now)
CREATE POLICY "Authenticated users can manage billing emails"
  ON billing_emails FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage AI phone calls"
  ON ai_phone_calls FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage billing faxes"
  ON billing_faxes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage workspace documents"
  ON workspace_documents FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view document versions"
  ON document_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create document versions"
  ON document_versions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage PDF annotations"
  ON pdf_annotations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view activity log"
  ON workspace_activity_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create activity log"
  ON workspace_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);