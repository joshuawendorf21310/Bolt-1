/*
  # Fire Operations Module
  
  Complete fire department management system tables
*/

CREATE TABLE IF NOT EXISTS fire_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  jurisdiction text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fire_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES fire_departments(id),
  name text NOT NULL,
  address text,
  latitude numeric,
  longitude numeric,
  call_sign text,
  station_type text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fire_personnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  department_id uuid REFERENCES fire_departments(id),
  first_name text,
  last_name text,
  badge_number text UNIQUE,
  rank text,
  station_id uuid REFERENCES fire_stations(id),
  is_active boolean DEFAULT true,
  is_incident_commander boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fire_apparatus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id uuid REFERENCES fire_stations(id),
  name text,
  apparatus_type text,
  unit_number text UNIQUE,
  current_status text DEFAULT 'available',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fire_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES fire_departments(id),
  dispatch_number text UNIQUE,
  incident_type text,
  address text,
  latitude numeric,
  longitude numeric,
  dispatch_time timestamptz DEFAULT now(),
  arrival_time timestamptz,
  clearance_time timestamptz,
  status text DEFAULT 'dispatched',
  incident_commander uuid REFERENCES fire_personnel(id),
  severity_level int,
  injuries int DEFAULT 0,
  units_dispatched int,
  hazmat_involved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incident_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES fire_incidents(id),
  apparatus_id uuid REFERENCES fire_apparatus(id),
  dispatch_time timestamptz DEFAULT now(),
  arrival_time timestamptz,
  status text DEFAULT 'dispatched',
  crew_lead uuid REFERENCES fire_personnel(id),
  personnel_count int,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incident_personnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES fire_incidents(id),
  personnel_id uuid REFERENCES fire_personnel(id),
  unit_id uuid REFERENCES incident_units(id),
  role text,
  dispatch_time timestamptz DEFAULT now(),
  arrival_time timestamptz,
  status text DEFAULT 'assigned',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fire_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personnel_id uuid REFERENCES fire_personnel(id),
  certification_name text,
  expiration_date date,
  is_current boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fire_training_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personnel_id uuid REFERENCES fire_personnel(id),
  training_name text,
  training_date date,
  hours_completed numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fire_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fire_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fire_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE fire_apparatus ENABLE ROW LEVEL SECURITY;
ALTER TABLE fire_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE fire_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE fire_training_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_dept" ON fire_personnel FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "users_view_incidents" ON fire_incidents FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "users_manage_incidents" ON fire_incidents FOR UPDATE TO authenticated
  USING (true);

CREATE INDEX idx_incidents_dept ON fire_incidents(department_id);
CREATE INDEX idx_incidents_time ON fire_incidents(dispatch_time DESC);
CREATE INDEX idx_units_incident ON incident_units(incident_id);
