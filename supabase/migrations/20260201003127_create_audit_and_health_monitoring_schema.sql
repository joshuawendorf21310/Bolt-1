/*
  # Audit Trail and System Health Monitoring Schema
  
  ## Purpose
  Provide immutable audit trail for compliance and system health monitoring
  for the founder dashboard's "accounting integrity" and alerting needs.
  
  ## New Tables
  
  ### `audit_log`
  Immutable audit trail for security and compliance
  - `id` (uuid, primary key)
  - `event_timestamp` (timestamptz) - When the event occurred
  - `event_type` (text) - Category of event
  - `actor_id` (uuid) - Who performed the action
  - `actor_role` (text) - Role at time of action
  - `resource_type` (text) - What was accessed/modified
  - `resource_id` (text) - Specific resource identifier
  - `action` (text) - What was done
  - `result` (text) - Success, failure, error
  - `ip_address` (inet) - Source IP
  - `user_agent` (text) - Browser/client info
  - `details` (jsonb) - Additional context
  
  ### `system_health_signals`
  Real-time health status of integrated systems
  - `id` (uuid, primary key)
  - `system_name` (text) - 'bank_feed', 'clearinghouse', 'infrastructure', etc.
  - `signal_type` (text) - 'connectivity', 'latency', 'error_rate', 'freshness'
  - `status` (text) - 'healthy', 'degraded', 'down', 'unknown'
  - `last_check` (timestamptz) - When signal was last measured
  - `last_success` (timestamptz) - When system last worked
  - `current_value` (numeric) - Current metric value
  - `threshold_warning` (numeric) - Warning threshold
  - `threshold_critical` (numeric) - Critical threshold
  - `details` (jsonb) - Additional context
  
  ### `data_freshness_tracking`
  Track when critical data was last updated
  - `id` (uuid, primary key)
  - `data_source` (text) - 'bank_transactions', 'claims_status', etc.
  - `last_updated` (timestamptz) - When data was last refreshed
  - `update_frequency_expected` (interval) - How often we expect updates
  - `is_stale` (boolean) - Whether data is past expected freshness
  - `staleness_threshold` (interval) - How old before considered stale
  
  ### `dashboard_alerts`
  Alert configuration and history
  - `id` (uuid, primary key)
  - `alert_type` (text) - 'cash_low', 'reconciliation_stale', etc.
  - `severity` (text) - 'info', 'warning', 'critical'
  - `title` (text) - Short alert title
  - `message` (text) - Detailed explanation
  - `action_required` (text) - What to do next
  - `triggered_at` (timestamptz) - When alert fired
  - `acknowledged_at` (timestamptz) - When user acknowledged
  - `acknowledged_by` (uuid) - Who acknowledged
  - `resolved_at` (timestamptz) - When issue resolved
  - `context` (jsonb) - Additional data for troubleshooting
  
  ### `tool_integration_status`
  Track connectivity and health of external integrations
  - `id` (uuid, primary key)
  - `tool_name` (text) - 'office_ally', 'telnyx', 'metriport', etc.
  - `integration_type` (text) - 'clearinghouse', 'telephony', 'healthcare_data'
  - `connection_status` (text) - 'connected', 'degraded', 'disconnected'
  - `last_successful_call` (timestamptz)
  - `last_failed_call` (timestamptz)
  - `failure_count_24h` (integer) - Failed calls in last 24 hours
  - `average_latency_ms` (numeric) - Average response time
  - `rate_limit_status` (jsonb) - Current rate limit info
  - `credentials_valid` (boolean) - Whether auth is working
  - `last_checked` (timestamptz)
  
  ## Security
  - Enable RLS on all tables
  - Audit log is append-only (no updates or deletes)
  - Health signals viewable by authenticated users
  - Alerts viewable by authenticated users
*/

-- Create audit log table (append-only)
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_timestamp timestamptz DEFAULT now(),
  event_type text NOT NULL CHECK (event_type IN (
    'authentication', 'authorization', 'billing_action', 'claim_modification',
    'payment_posting', 'compensation_event', 'financial_transaction',
    'sensitive_data_access', 'automation_override', 'system_configuration'
  )),
  actor_id uuid REFERENCES auth.users(id),
  actor_role text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  action text NOT NULL,
  result text NOT NULL CHECK (result IN ('success', 'failure', 'error', 'denied')),
  ip_address inet,
  user_agent text,
  details jsonb DEFAULT '{}'::jsonb
);

-- Create system health signals table
CREATE TABLE IF NOT EXISTS system_health_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_name text NOT NULL,
  signal_type text NOT NULL CHECK (signal_type IN (
    'connectivity', 'latency', 'error_rate', 'freshness', 'saturation'
  )),
  status text NOT NULL CHECK (status IN ('healthy', 'degraded', 'down', 'unknown')),
  last_check timestamptz DEFAULT now(),
  last_success timestamptz,
  current_value numeric,
  threshold_warning numeric,
  threshold_critical numeric,
  details jsonb DEFAULT '{}'::jsonb,
  UNIQUE(system_name, signal_type)
);

-- Create data freshness tracking table
CREATE TABLE IF NOT EXISTS data_freshness_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source text NOT NULL UNIQUE,
  last_updated timestamptz DEFAULT now(),
  update_frequency_expected interval NOT NULL,
  is_stale boolean DEFAULT false,
  staleness_threshold interval NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Create dashboard alerts table
CREATE TABLE IF NOT EXISTS dashboard_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title text NOT NULL,
  message text NOT NULL,
  action_required text NOT NULL,
  triggered_at timestamptz DEFAULT now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  context jsonb DEFAULT '{}'::jsonb
);

-- Create tool integration status table
CREATE TABLE IF NOT EXISTS tool_integration_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name text NOT NULL UNIQUE,
  integration_type text NOT NULL CHECK (integration_type IN (
    'clearinghouse', 'telephony', 'healthcare_data', 'infrastructure', 'ai_inference', 'banking'
  )),
  connection_status text NOT NULL DEFAULT 'unknown' CHECK (connection_status IN (
    'connected', 'degraded', 'disconnected', 'unknown'
  )),
  last_successful_call timestamptz,
  last_failed_call timestamptz,
  failure_count_24h integer DEFAULT 0,
  average_latency_ms numeric DEFAULT 0,
  rate_limit_status jsonb DEFAULT '{}'::jsonb,
  credentials_valid boolean DEFAULT false,
  last_checked timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_health_signals_system ON system_health_signals(system_name);
CREATE INDEX IF NOT EXISTS idx_health_signals_status ON system_health_signals(status);
CREATE INDEX IF NOT EXISTS idx_freshness_stale ON data_freshness_tracking(is_stale);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON dashboard_alerts(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON dashboard_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_tool_status_connection ON tool_integration_status(connection_status);

-- Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_freshness_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_integration_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view audit log"
  ON audit_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can append to audit log"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view health signals"
  ON system_health_signals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can update health signals"
  ON system_health_signals FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view freshness tracking"
  ON data_freshness_tracking FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can update freshness tracking"
  ON data_freshness_tracking FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view alerts"
  ON dashboard_alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can acknowledge alerts"
  ON dashboard_alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "System can create alerts"
  ON dashboard_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view tool integration status"
  ON tool_integration_status FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can update tool integration status"
  ON tool_integration_status FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default data sources for freshness tracking
INSERT INTO data_freshness_tracking (data_source, update_frequency_expected, staleness_threshold) VALUES
  ('bank_transactions', '24 hours'::interval, '48 hours'::interval),
  ('clearinghouse_claims', '4 hours'::interval, '8 hours'::interval),
  ('claim_status_updates', '24 hours'::interval, '48 hours'::interval),
  ('remittance_advices', '24 hours'::interval, '48 hours'::interval)
ON CONFLICT (data_source) DO NOTHING;

-- Insert default tool integration statuses
INSERT INTO tool_integration_status (tool_name, integration_type) VALUES
  ('office_ally', 'clearinghouse'),
  ('telnyx', 'telephony'),
  ('metriport', 'healthcare_data'),
  ('digitalocean', 'infrastructure'),
  ('ollama', 'ai_inference')
ON CONFLICT (tool_name) DO NOTHING;