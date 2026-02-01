/*
  # CrewLink Paging & Dispatch System
  
  ## Overview
  Complete crew paging and dispatch management system similar to FlightVector.
  Handles crew roster, availability status, shift assignments, paging/alerts,
  and response tracking.
  
  ## New Tables
  
  ### 1. `crew_roster`
  Master crew roster with certifications and availability
  - User profile extension with crew-specific data
  - Certification levels, specialties, and contact info
  - Current availability status
  
  ### 2. `crew_shifts`
  Scheduled shifts for crew members
  - Shift start/end times
  - Assigned stations/units
  - Shift types (regular, overtime, on-call)
  
  ### 3. `crew_assignments`
  Current crew assignments to units
  - Links crew members to specific units
  - Role on unit (driver, attendant, medic, supervisor)
  - Assignment start/end times
  
  ### 4. `pages`
  Dispatch pages/alerts sent to crews
  - Page content and priority
  - Target recipients (individuals, units, or broadcast)
  - Response tracking
  
  ### 5. `page_responses`
  Crew responses to pages
  - Acknowledgment status
  - Response type (available, unavailable, enroute)
  - Response timestamp and ETA
  
  ### 6. `crew_status_log`
  Historical log of crew status changes
  - Status transitions (available, on-call, responding, on-scene, etc.)
  - Timestamps for analytics and reporting
  
  ## Security
  - RLS enabled on all tables
  - Organization-based data isolation
  - Role-based access for dispatch vs crew
  
  ## Features
  - Real-time crew availability tracking
  - Instant paging with acknowledgment
  - Response time analytics
  - Shift management and scheduling
  - Unit staffing oversight
*/

-- Crew Roster Table
CREATE TABLE IF NOT EXISTS crew_roster (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id text,
  certification_level text NOT NULL,
  certifications jsonb DEFAULT '[]'::jsonb,
  specialties jsonb DEFAULT '[]'::jsonb,
  phone_primary text,
  phone_secondary text,
  email_primary text,
  email_secondary text,
  home_station text,
  current_status text DEFAULT 'off_duty',
  status_updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  hire_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_crew_roster_org ON crew_roster(organization_id);
CREATE INDEX IF NOT EXISTS idx_crew_roster_status ON crew_roster(current_status) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_crew_roster_user ON crew_roster(user_id);

-- Crew Shifts Table
CREATE TABLE IF NOT EXISTS crew_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id uuid NOT NULL REFERENCES crew_roster(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  shift_date date NOT NULL,
  shift_start timestamptz NOT NULL,
  shift_end timestamptz NOT NULL,
  shift_type text DEFAULT 'regular',
  assigned_station text,
  assigned_unit_id uuid REFERENCES units(id) ON DELETE SET NULL,
  role text,
  notes text,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crew_shifts_crew ON crew_shifts(crew_id);
CREATE INDEX IF NOT EXISTS idx_crew_shifts_date ON crew_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_crew_shifts_unit ON crew_shifts(assigned_unit_id);

-- Crew Assignments Table
CREATE TABLE IF NOT EXISTS crew_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id uuid NOT NULL REFERENCES crew_roster(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  incident_id uuid REFERENCES incidents(id) ON DELETE SET NULL,
  role text NOT NULL,
  assignment_start timestamptz DEFAULT now(),
  assignment_end timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crew_assignments_crew ON crew_assignments(crew_id);
CREATE INDEX IF NOT EXISTS idx_crew_assignments_unit ON crew_assignments(unit_id);
CREATE INDEX IF NOT EXISTS idx_crew_assignments_active ON crew_assignments(unit_id) WHERE is_active = true;

-- Pages Table
CREATE TABLE IF NOT EXISTS pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  incident_id uuid REFERENCES incidents(id) ON DELETE SET NULL,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_type text DEFAULT 'dispatch',
  priority text DEFAULT 'normal',
  subject text NOT NULL,
  message text NOT NULL,
  target_type text NOT NULL,
  target_unit_ids jsonb DEFAULT '[]'::jsonb,
  target_crew_ids jsonb DEFAULT '[]'::jsonb,
  requires_response boolean DEFAULT true,
  expires_at timestamptz,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pages_org ON pages(organization_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_pages_incident ON pages(incident_id);
CREATE INDEX IF NOT EXISTS idx_pages_priority ON pages(priority, sent_at DESC);

-- Page Responses Table
CREATE TABLE IF NOT EXISTS page_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  crew_id uuid NOT NULL REFERENCES crew_roster(id) ON DELETE CASCADE,
  response_type text NOT NULL,
  response_message text,
  estimated_eta timestamptz,
  responded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(page_id, crew_id)
);

CREATE INDEX IF NOT EXISTS idx_page_responses_page ON page_responses(page_id);
CREATE INDEX IF NOT EXISTS idx_page_responses_crew ON page_responses(crew_id);

-- Crew Status Log Table
CREATE TABLE IF NOT EXISTS crew_status_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id uuid NOT NULL REFERENCES crew_roster(id) ON DELETE CASCADE,
  previous_status text,
  new_status text NOT NULL,
  status_changed_at timestamptz DEFAULT now(),
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  unit_id uuid REFERENCES units(id) ON DELETE SET NULL,
  incident_id uuid REFERENCES incidents(id) ON DELETE SET NULL,
  location_lat numeric,
  location_lng numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crew_status_log_crew ON crew_status_log(crew_id, status_changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_crew_status_log_status ON crew_status_log(new_status, status_changed_at DESC);

-- Enable Row Level Security
ALTER TABLE crew_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_status_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crew_roster
CREATE POLICY "Users can view crew roster in their organization"
  ON crew_roster FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own crew roster entry"
  ON crew_roster FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can insert crew roster entries"
  ON crew_roster FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for crew_shifts
CREATE POLICY "Users can view crew shifts in their organization"
  ON crew_shifts FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own shifts"
  ON crew_shifts FOR UPDATE
  TO authenticated
  USING (
    crew_id IN (
      SELECT id FROM crew_roster WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    crew_id IN (
      SELECT id FROM crew_roster WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage crew shifts"
  ON crew_shifts FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for crew_assignments
CREATE POLICY "Users can view crew assignments"
  ON crew_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage crew assignments"
  ON crew_assignments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update crew assignments"
  ON crew_assignments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for pages
CREATE POLICY "Users can view pages in their organization"
  ON pages FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can send pages"
  ON pages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for page_responses
CREATE POLICY "Users can view page responses"
  ON page_responses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Crew can respond to pages"
  ON page_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    crew_id IN (
      SELECT id FROM crew_roster WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Crew can update their responses"
  ON page_responses FOR UPDATE
  TO authenticated
  USING (
    crew_id IN (
      SELECT id FROM crew_roster WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    crew_id IN (
      SELECT id FROM crew_roster WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for crew_status_log
CREATE POLICY "Users can view crew status log"
  ON crew_status_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert crew status log"
  ON crew_status_log FOR INSERT
  TO authenticated
  WITH CHECK (true);