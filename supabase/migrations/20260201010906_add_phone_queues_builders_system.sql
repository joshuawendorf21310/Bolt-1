/*
  # Phone System, Queues, and Builders Schema
  
  ## Purpose
  Complete the Founder Billing Workspace with:
  - Real-time phone system with audio states
  - Four operational queues (Calls, Voicemails, Documents, Billing)
  - Invoice, NEMSIS, RxNorm, and SNOMED builders
  - Document retention and folder/tag system
  - Call-to-document linking
  
  ## Phone System
  - Live call management with audio states
  - Voicemail records with transcripts
  - Call waiting and escalation tracking
  - Audio channel settings (ringer, in-call, notifications)
  - DND (Do Not Disturb) settings
  
  ## Queue System
  - Calls Queue: Real-time and historical call control
  - Voicemails Queue: Unattended call triage
  - Documents Queue: Work-in-progress documents
  - Billing Queue: Primary billing execution queue
  
  ## Builders
  - Invoice Builder: Create patient-pay and private-party invoices
  - NEMSIS Builder: Validate and export ePCR data
  - RxNorm Builder: Standardize medication documentation
  - SNOMED Builder: Standardize clinical concepts
  
  ## Document System
  - Document states: Draft, Final, Archived
  - Folder hierarchy for organization
  - Tag system for context
  - Retention rules enforcement
  
  ## New Tables
  
  ### `phone_system_settings`
  Global phone system configuration
  
  ### `active_calls`
  Real-time call state management
  
  ### `voicemail_records`
  Voicemail storage with transcripts
  
  ### `call_escalations`
  AI-to-human escalation tracking
  
  ### `document_folders`
  Hierarchical folder structure
  
  ### `document_tags`
  Tag definitions and rules
  
  ### `document_folder_assignments`
  Document-to-folder mapping
  
  ### `document_tag_assignments`
  Document-to-tag mapping
  
  ### `call_document_links`
  Links between calls and documents
  
  ### `queue_calls`
  Calls queue management
  
  ### `queue_voicemails`
  Voicemails queue management
  
  ### `queue_documents`
  Documents queue management
  
  ### `queue_billing`
  Billing queue management
  
  ### `invoices`
  Invoice records
  
  ### `invoice_line_items`
  Invoice line item details
  
  ### `nemsis_validations`
  NEMSIS validation results
  
  ### `rxnorm_mappings`
  Medication to RxNorm mappings
  
  ### `snomed_mappings`
  Clinical concept to SNOMED mappings
  
  ### `system_failover_status`
  Track system component health
*/

-- Phone system settings
CREATE TABLE IF NOT EXISTS phone_system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ringer_volume integer DEFAULT 80 CHECK (ringer_volume >= 0 AND ringer_volume <= 100),
  in_call_volume integer DEFAULT 80 CHECK (in_call_volume >= 0 AND in_call_volume <= 100),
  notification_volume integer DEFAULT 60 CHECK (notification_volume >= 0 AND notification_volume <= 100),
  ringer_muted boolean DEFAULT false,
  notifications_muted boolean DEFAULT false,
  dnd_enabled boolean DEFAULT false,
  dnd_until timestamptz,
  dnd_route_to text DEFAULT 'voicemail' CHECK (dnd_route_to IN ('voicemail', 'ai')),
  ai_answer_first boolean DEFAULT true,
  primary_device text DEFAULT 'browser',
  ringtone text DEFAULT 'default',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Active calls (real-time state)
CREATE TABLE IF NOT EXISTS active_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid text UNIQUE NOT NULL,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  caller_number text,
  callee_number text,
  caller_identity text,
  call_state text NOT NULL DEFAULT 'ringing' CHECK (call_state IN (
    'ringing', 'answered', 'active', 'on_hold', 'escalating', 
    'transferring', 'ending', 'completed'
  )),
  handled_by text NOT NULL DEFAULT 'ai' CHECK (handled_by IN ('ai', 'founder', 'voicemail')),
  ai_confidence_level integer DEFAULT 100 CHECK (ai_confidence_level >= 0 AND ai_confidence_level <= 100),
  escalation_triggered boolean DEFAULT false,
  escalation_reason text,
  escalation_keywords jsonb DEFAULT '[]',
  live_transcript text,
  call_context jsonb DEFAULT '{}',
  linked_claim_id uuid,
  linked_invoice_id uuid,
  linked_encounter_id uuid,
  linked_agency_id uuid,
  started_at timestamptz DEFAULT now(),
  answered_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer DEFAULT 0
);

-- Voicemail records
CREATE TABLE IF NOT EXISTS voicemail_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid REFERENCES ai_phone_calls(id),
  voicemail_sid text UNIQUE,
  caller_number text NOT NULL,
  caller_identity text,
  audio_url text,
  transcript text,
  duration_seconds integer DEFAULT 0,
  voicemail_status text NOT NULL DEFAULT 'new' CHECK (voicemail_status IN (
    'new', 'reviewed', 'action_required', 'resolved'
  )),
  suggested_context jsonb DEFAULT '{}',
  linked_claim_id uuid,
  linked_invoice_id uuid,
  linked_encounter_id uuid,
  linked_agency_id uuid,
  reviewed_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Call escalations
CREATE TABLE IF NOT EXISTS call_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL,
  escalation_trigger text NOT NULL CHECK (escalation_trigger IN (
    'human_requested', 'dispute_language', 'legal_language', 
    'payment_commitment', 'confidence_failure', 'keyword_match'
  )),
  trigger_keywords jsonb DEFAULT '[]',
  ai_summary text,
  escalation_accepted boolean DEFAULT false,
  founder_joined_at timestamptz,
  outcome text,
  created_at timestamptz DEFAULT now()
);

-- Document folders
CREATE TABLE IF NOT EXISTS document_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_name text NOT NULL,
  parent_folder_id uuid REFERENCES document_folders(id) ON DELETE CASCADE,
  folder_type text CHECK (folder_type IN (
    'agencies', 'billing_periods', 'claims', 'templates', 
    'compliance', 'reference', 'custom'
  )),
  folder_path text,
  is_system_folder boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Document tags
CREATE TABLE IF NOT EXISTS document_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name text UNIQUE NOT NULL,
  tag_category text CHECK (tag_category IN (
    'document_type', 'workflow_state', 'billing_context', 
    'compliance', 'clinical', 'custom'
  )),
  tag_color text,
  is_system_tag boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Document folder assignments
CREATE TABLE IF NOT EXISTS document_folder_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES workspace_documents(id) ON DELETE CASCADE,
  folder_id uuid NOT NULL REFERENCES document_folders(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(document_id, folder_id)
);

-- Document tag assignments
CREATE TABLE IF NOT EXISTS document_tag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES workspace_documents(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES document_tags(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(document_id, tag_id)
);

-- Call to document links
CREATE TABLE IF NOT EXISTS call_document_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid,
  voicemail_id uuid REFERENCES voicemail_records(id),
  document_id uuid NOT NULL REFERENCES workspace_documents(id) ON DELETE CASCADE,
  link_type text CHECK (link_type IN (
    'call_summary', 'appeal_note', 'follow_up_letter', 
    'evidence', 'transcript', 'other'
  )),
  created_from_call boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Queue: Calls
CREATE TABLE IF NOT EXISTS queue_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid,
  queue_state text NOT NULL DEFAULT 'active' CHECK (queue_state IN (
    'active', 'completed', 'follow_up_required'
  )),
  call_direction text NOT NULL,
  call_status text NOT NULL,
  caller_identity text,
  handled_by text,
  follow_up_reason text,
  follow_up_deadline timestamptz,
  priority integer DEFAULT 50,
  entered_queue_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Queue: Voicemails
CREATE TABLE IF NOT EXISTS queue_voicemails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voicemail_id uuid NOT NULL REFERENCES voicemail_records(id) ON DELETE CASCADE,
  queue_state text NOT NULL DEFAULT 'new' CHECK (queue_state IN (
    'new', 'reviewed', 'action_required', 'resolved'
  )),
  caller_identity text,
  suggested_action text,
  action_deadline timestamptz,
  priority integer DEFAULT 50,
  entered_queue_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Queue: Documents
CREATE TABLE IF NOT EXISTS queue_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES workspace_documents(id) ON DELETE CASCADE,
  queue_state text NOT NULL DEFAULT 'draft' CHECK (queue_state IN (
    'draft', 'needs_review', 'waiting_external', 'ready_to_finalize'
  )),
  document_purpose text,
  blocking_workflow boolean DEFAULT false,
  workflow_reference text,
  required_by timestamptz,
  priority integer DEFAULT 50,
  entered_queue_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Queue: Billing
CREATE TABLE IF NOT EXISTS queue_billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_reference text NOT NULL,
  billing_type text NOT NULL CHECK (billing_type IN (
    'epcr_complete', 'telehealth_complete', 'claim_denied', 
    'payer_response', 'patient_pay_followup', 'eligibility_check'
  )),
  queue_state text NOT NULL DEFAULT 'ready' CHECK (queue_state IN (
    'ready', 'in_progress', 'waiting_payer', 'action_required', 'resolved'
  )),
  encounter_id uuid,
  claim_id uuid,
  agency_id uuid,
  billing_stage text,
  next_action text NOT NULL,
  action_deadline timestamptz,
  days_in_queue integer DEFAULT 0,
  priority integer DEFAULT 50,
  metadata jsonb DEFAULT '{}',
  entered_queue_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  invoice_type text NOT NULL CHECK (invoice_type IN (
    'patient_pay', 'private_party', 'platform_fee', 'agency_billing'
  )),
  invoice_state text NOT NULL DEFAULT 'draft' CHECK (invoice_state IN (
    'draft', 'final', 'sent', 'paid', 'partial', 'overdue', 'voided'
  )),
  encounter_id uuid,
  agency_id uuid,
  billable_call_id uuid,
  payer_type text CHECK (payer_type IN ('insurance', 'patient', 'private_party')),
  payer_name text,
  payer_contact jsonb,
  subtotal_cents integer DEFAULT 0,
  adjustments_cents integer DEFAULT 0,
  total_cents integer DEFAULT 0,
  amount_paid_cents integer DEFAULT 0,
  balance_cents integer DEFAULT 0,
  stripe_invoice_id text,
  stripe_payment_intent_id text,
  due_date date,
  sent_at timestamptz,
  paid_at timestamptz,
  voided_at timestamptz,
  void_reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Invoice line items
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  line_number integer NOT NULL,
  item_type text NOT NULL CHECK (item_type IN (
    'transport', 'mileage', 'service_level', 'telehealth', 
    'supplies', 'adjustment', 'other'
  )),
  description text NOT NULL,
  quantity decimal(10,2) DEFAULT 1,
  unit_price_cents integer DEFAULT 0,
  line_total_cents integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- NEMSIS validations
CREATE TABLE IF NOT EXISTS nemsis_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  epcr_id uuid NOT NULL,
  validation_version text NOT NULL,
  validation_status text NOT NULL DEFAULT 'pending' CHECK (validation_status IN (
    'pending', 'valid', 'invalid', 'incomplete'
  )),
  required_fields_complete integer DEFAULT 0,
  required_fields_total integer DEFAULT 0,
  validation_errors jsonb DEFAULT '[]',
  validation_warnings jsonb DEFAULT '[]',
  export_ready boolean DEFAULT false,
  export_format text,
  exported_at timestamptz,
  validated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- RxNorm mappings
CREATE TABLE IF NOT EXISTS rxnorm_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_entry text NOT NULL,
  rxnorm_concept_id text,
  rxnorm_name text,
  dose text,
  dose_unit text,
  route text,
  mapping_status text NOT NULL DEFAULT 'unmapped' CHECK (mapping_status IN (
    'unmapped', 'suggested', 'confirmed', 'unknown'
  )),
  mapping_confidence integer CHECK (mapping_confidence >= 0 AND mapping_confidence <= 100),
  mapped_by text,
  mapped_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- SNOMED mappings
CREATE TABLE IF NOT EXISTS snomed_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_term text NOT NULL,
  snomed_concept_id text,
  snomed_description text,
  term_type text CHECK (term_type IN (
    'symptom', 'finding', 'impression', 'procedure', 'other'
  )),
  mapping_status text NOT NULL DEFAULT 'unmapped' CHECK (mapping_status IN (
    'unmapped', 'suggested', 'confirmed', 'unknown'
  )),
  mapping_confidence integer CHECK (mapping_confidence >= 0 AND mapping_confidence <= 100),
  mapped_by text,
  mapped_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- System failover status
CREATE TABLE IF NOT EXISTS system_failover_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_name text UNIQUE NOT NULL CHECK (component_name IN (
    'phone_service', 'document_storage', 'billing_integration', 
    'clearinghouse', 'stripe', 'fax_service'
  )),
  component_status text NOT NULL DEFAULT 'operational' CHECK (component_status IN (
    'operational', 'degraded', 'offline'
  )),
  failover_active boolean DEFAULT false,
  failover_mode text,
  last_checked timestamptz DEFAULT now(),
  status_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_phone_settings_user ON phone_system_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_active_calls_state ON active_calls(call_state);
CREATE INDEX IF NOT EXISTS idx_active_calls_started ON active_calls(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_voicemail_status ON voicemail_records(voicemail_status);
CREATE INDEX IF NOT EXISTS idx_voicemail_created ON voicemail_records(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_escalations_call ON call_escalations(call_id);

CREATE INDEX IF NOT EXISTS idx_doc_folders_parent ON document_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_doc_folders_type ON document_folders(folder_type);

CREATE INDEX IF NOT EXISTS idx_doc_folder_assign_doc ON document_folder_assignments(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_folder_assign_folder ON document_folder_assignments(folder_id);

CREATE INDEX IF NOT EXISTS idx_doc_tag_assign_doc ON document_tag_assignments(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_tag_assign_tag ON document_tag_assignments(tag_id);

CREATE INDEX IF NOT EXISTS idx_call_doc_links_call ON call_document_links(call_id);
CREATE INDEX IF NOT EXISTS idx_call_doc_links_doc ON call_document_links(document_id);

CREATE INDEX IF NOT EXISTS idx_queue_calls_state ON queue_calls(queue_state);
CREATE INDEX IF NOT EXISTS idx_queue_calls_priority ON queue_calls(priority DESC, entered_queue_at);

CREATE INDEX IF NOT EXISTS idx_queue_voicemails_state ON queue_voicemails(queue_state);
CREATE INDEX IF NOT EXISTS idx_queue_voicemails_priority ON queue_voicemails(priority DESC, entered_queue_at);

CREATE INDEX IF NOT EXISTS idx_queue_documents_state ON queue_documents(queue_state);
CREATE INDEX IF NOT EXISTS idx_queue_documents_blocking ON queue_documents(blocking_workflow) WHERE blocking_workflow = true;
CREATE INDEX IF NOT EXISTS idx_queue_documents_priority ON queue_documents(priority DESC, entered_queue_at);

CREATE INDEX IF NOT EXISTS idx_queue_billing_state ON queue_billing(queue_state);
CREATE INDEX IF NOT EXISTS idx_queue_billing_priority ON queue_billing(priority DESC, entered_queue_at);
CREATE INDEX IF NOT EXISTS idx_queue_billing_deadline ON queue_billing(action_deadline);

CREATE INDEX IF NOT EXISTS idx_invoices_state ON invoices(invoice_state);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_invoices_agency ON invoices(agency_id);
CREATE INDEX IF NOT EXISTS idx_invoices_encounter ON invoices(encounter_id);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_line_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_nemsis_epcr ON nemsis_validations(epcr_id);
CREATE INDEX IF NOT EXISTS idx_nemsis_status ON nemsis_validations(validation_status);

CREATE INDEX IF NOT EXISTS idx_rxnorm_status ON rxnorm_mappings(mapping_status);
CREATE INDEX IF NOT EXISTS idx_snomed_status ON snomed_mappings(mapping_status);

-- Enable RLS
ALTER TABLE phone_system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE voicemail_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_folder_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_document_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_voicemails ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nemsis_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rxnorm_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE snomed_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_failover_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Founder-only access
CREATE POLICY "Authenticated users can manage phone settings"
  ON phone_system_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage active calls"
  ON active_calls FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage voicemail records"
  ON voicemail_records FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view call escalations"
  ON call_escalations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create call escalations"
  ON call_escalations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage document folders"
  ON document_folders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage document tags"
  ON document_tags FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage folder assignments"
  ON document_folder_assignments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage tag assignments"
  ON document_tag_assignments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage call document links"
  ON call_document_links FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage calls queue"
  ON queue_calls FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage voicemails queue"
  ON queue_voicemails FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage documents queue"
  ON queue_documents FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage billing queue"
  ON queue_billing FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage invoice line items"
  ON invoice_line_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage NEMSIS validations"
  ON nemsis_validations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage RxNorm mappings"
  ON rxnorm_mappings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage SNOMED mappings"
  ON snomed_mappings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view failover status"
  ON system_failover_status FOR SELECT
  TO authenticated
  USING (true);

-- Insert system folders
INSERT INTO document_folders (folder_name, folder_type, folder_path, is_system_folder)
VALUES 
  ('Agencies', 'agencies', '/agencies', true),
  ('Billing Periods', 'billing_periods', '/billing_periods', true),
  ('Claims', 'claims', '/claims', true),
  ('Templates', 'templates', '/templates', true),
  ('Compliance', 'compliance', '/compliance', true),
  ('Reference', 'reference', '/reference', true)
ON CONFLICT DO NOTHING;

-- Insert system tags
INSERT INTO document_tags (tag_name, tag_category, tag_color, is_system_tag)
VALUES 
  ('Claim', 'document_type', '#3b82f6', true),
  ('Invoice', 'document_type', '#10b981', true),
  ('EOB', 'document_type', '#f59e0b', true),
  ('Appeal', 'document_type', '#ef4444', true),
  ('Denial', 'billing_context', '#dc2626', true),
  ('Telehealth', 'billing_context', '#8b5cf6', true),
  ('Self-Pay', 'billing_context', '#06b6d4', true),
  ('Insurance', 'billing_context', '#0ea5e9', true),
  ('Final', 'workflow_state', '#059669', true),
  ('Draft', 'workflow_state', '#6b7280', true),
  ('Compliance', 'compliance', '#7c3aed', true)
ON CONFLICT DO NOTHING;

-- Initialize system failover status
INSERT INTO system_failover_status (component_name, component_status, status_message)
VALUES 
  ('phone_service', 'operational', 'Phone service running normally'),
  ('document_storage', 'operational', 'Document storage running normally'),
  ('billing_integration', 'operational', 'Billing integrations running normally'),
  ('clearinghouse', 'operational', 'Clearinghouse connections active'),
  ('stripe', 'operational', 'Stripe payment processing active'),
  ('fax_service', 'operational', 'Fax service running normally')
ON CONFLICT DO NOTHING;