/*
  # SLA Timers, Priority Scoring, and AI-First Billing System
*/

CREATE TABLE IF NOT EXISTS sla_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_type text NOT NULL,
  item_type text NOT NULL,
  condition_trigger text,
  target_response_hours integer,
  soft_breach_hours integer,
  hard_breach_hours integer,
  priority_multiplier decimal(3,2) DEFAULT 1.0,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS queue_item_sla_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_type text NOT NULL,
  queue_item_id uuid NOT NULL,
  sla_definition_id uuid REFERENCES sla_definitions(id),
  sla_started_at timestamptz NOT NULL,
  target_response_at timestamptz,
  soft_breach_at timestamptz,
  hard_breach_at timestamptz,
  soft_breach_triggered boolean DEFAULT false,
  soft_breach_acknowledged boolean DEFAULT false,
  hard_breach_triggered boolean DEFAULT false,
  hard_breach_acknowledged boolean DEFAULT false,
  hard_breach_acknowledged_at timestamptz,
  sla_completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS priority_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_type text NOT NULL,
  queue_item_id uuid NOT NULL,
  base_priority integer DEFAULT 50,
  escalation_factors jsonb DEFAULT '{}',
  calculated_priority integer DEFAULT 50,
  is_critical boolean DEFAULT false,
  critical_reason text,
  override_priority integer,
  override_reason text,
  override_by_user text,
  override_at timestamptz,
  last_recalculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS confidence_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_type text NOT NULL,
  queue_item_id uuid,
  entity_id uuid,
  confidence_score integer,
  confidence_level text,
  reasoning text,
  uncertain_fields jsonb DEFAULT '[]',
  ai_recommendation text,
  approval_required boolean DEFAULT false,
  approval_given boolean DEFAULT false,
  approval_given_at timestamptz,
  approved_by text,
  approval_changes jsonb DEFAULT '{}',
  approved_value_final jsonb,
  ai_recovery_attempted boolean DEFAULT false,
  recovery_method text,
  recovery_successful boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS face_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid,
  patient_first_name text,
  patient_last_name text,
  patient_dob date,
  patient_sex text,
  patient_address_street text,
  patient_address_city text,
  patient_address_state text,
  patient_address_zip text,
  patient_phone text,
  primary_payer_name text,
  primary_payer_id text,
  plan_type text,
  coverage_effective_date date,
  coverage_termination_date date,
  subscriber_name text,
  subscriber_dob date,
  subscriber_relationship text,
  member_id text,
  group_number text,
  secondary_payer_name text,
  secondary_member_id text,
  overall_confidence_score integer,
  extraction_method text,
  source_type text,
  is_approved boolean DEFAULT false,
  approved_at timestamptz,
  approved_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS face_sheet_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  face_sheet_id uuid NOT NULL REFERENCES face_sheets(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  field_value text,
  field_confidence integer,
  extraction_source text,
  extraction_method text,
  is_uncertain boolean DEFAULT false,
  uncertainty_reason text,
  correction_needed boolean DEFAULT false,
  original_value text,
  validated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS face_sheet_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  face_sheet_id uuid NOT NULL REFERENCES face_sheets(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  source_reference text,
  source_url text,
  extraction_timestamp timestamptz,
  is_original boolean DEFAULT true,
  document_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  actor_id text NOT NULL,
  actor_type text,
  entity_type text,
  entity_id uuid,
  queue_type text,
  queue_item_id uuid,
  old_values jsonb,
  new_values jsonb,
  reason text,
  risk_assessment jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS end_of_day_reconciliation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_date date NOT NULL,
  total_billable_encounters integer DEFAULT 0,
  total_face_sheets_created integer DEFAULT 0,
  total_face_sheets_approved integer DEFAULT 0,
  total_face_sheets_pending integer DEFAULT 0,
  total_face_sheets_flagged integer DEFAULT 0,
  total_claims_submitted integer DEFAULT 0,
  total_claims_in_progress integer DEFAULT 0,
  missed_deadlines integer DEFAULT 0,
  unresolved_critical_items integer DEFAULT 0,
  unlinked_calls integer DEFAULT 0,
  unlinked_faxes integer DEFAULT 0,
  blocking_documents integer DEFAULT 0,
  all_clear boolean DEFAULT false,
  reconciliation_status text,
  reviewed_by text,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sla_tracking_queue ON queue_item_sla_tracking(queue_type, queue_item_id);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_soft_breach ON queue_item_sla_tracking(soft_breach_triggered) WHERE soft_breach_triggered = true;
CREATE INDEX IF NOT EXISTS idx_sla_tracking_hard_breach ON queue_item_sla_tracking(hard_breach_triggered) WHERE hard_breach_triggered = true;
CREATE INDEX IF NOT EXISTS idx_priority_scores_queue ON priority_scores(queue_type);
CREATE INDEX IF NOT EXISTS idx_confidence_decisions_type ON confidence_decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_face_sheets_encounter ON face_sheets(encounter_id);
CREATE INDEX IF NOT EXISTS idx_face_sheets_approval ON face_sheets(is_approved);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log_entries(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_eod_reconciliation_date ON end_of_day_reconciliation(reconciliation_date DESC);

ALTER TABLE sla_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_item_sla_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE priority_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE confidence_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_sheet_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_sheet_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE end_of_day_reconciliation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read SLA"
  ON sla_definitions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated manage SLA tracking"
  ON queue_item_sla_tracking FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated manage priority"
  ON priority_scores FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated manage confidence"
  ON confidence_decisions FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated manage face sheets"
  ON face_sheets FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated manage face sheet fields"
  ON face_sheet_fields FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated manage face sheet sources"
  ON face_sheet_sources FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated manage audit"
  ON audit_log_entries FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated manage reconciliation"
  ON end_of_day_reconciliation FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

INSERT INTO sla_definitions (queue_type, item_type, condition_trigger, target_response_hours, soft_breach_hours, hard_breach_hours, priority_multiplier, description)
VALUES
  ('calls', 'inbound', 'ring_started', 0, 0, 0, 1.5, 'Inbound call response'),
  ('calls', 'outbound', 'call_required', 4, 4, 24, 1.2, 'Outbound call initiation'),
  ('calls', 'escalation', 'escalation_triggered', 0, 0, 1, 2.0, 'Escalation acknowledgment'),
  ('voicemails', 'new', 'voicemail_received', 1, 2, 8, 1.3, 'Voicemail review'),
  ('voicemails', 'action_required', 'action_flagged', 1, 1, 8, 1.5, 'Voicemail action'),
  ('documents', 'draft', 'created', 48, 72, 120, 1.0, 'Draft document finalization'),
  ('documents', 'required', 'requirement_detected', 8, 24, 48, 1.8, 'Required document acquisition'),
  ('documents', 'review', 'flagged_for_review', 24, 24, 48, 1.2, 'Document review'),
  ('billing', 'ready_to_bill', 'encounter_complete', 24, 48, 72, 1.2, 'Claim submission'),
  ('billing', 'waiting_payer', 'submitted', 72, 168, 720, 0.8, 'Payer response'),
  ('billing', 'action_required', 'payer_response', 24, 24, 48, 1.5, 'Billing action required')
ON CONFLICT DO NOTHING;