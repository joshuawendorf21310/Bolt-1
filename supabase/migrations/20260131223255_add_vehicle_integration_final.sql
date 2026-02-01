/*
  # Vehicle Integration System
  
  ## New Tables
  
  1. vehicle_telemetry - OBD-II diagnostics
  2. gps_tracking - GPS with mileage
  3. lights_sirens_events - Emergency equipment tracking
  4. camera_events - Safety monitoring
  5. trip_logs - Complete trip records
  
  ## Security
  - RLS enabled
  - Authenticated access
*/

-- Add vehicle columns to units if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'units' AND column_name = 'vin') THEN
    ALTER TABLE units ADD COLUMN vin text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'units' AND column_name = 'license_plate') THEN
    ALTER TABLE units ADD COLUMN license_plate text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'units' AND column_name = 'year') THEN
    ALTER TABLE units ADD COLUMN year integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'units' AND column_name = 'make') THEN
    ALTER TABLE units ADD COLUMN make text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'units' AND column_name = 'model') THEN
    ALTER TABLE units ADD COLUMN model text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'units' AND column_name = 'current_odometer') THEN
    ALTER TABLE units ADD COLUMN current_odometer numeric DEFAULT 0;
  END IF;
END $$;

-- Vehicle Telemetry
CREATE TABLE IF NOT EXISTS vehicle_telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  speed_mph numeric,
  rpm integer,
  engine_temp numeric,
  fuel_level numeric,
  battery_voltage numeric,
  odometer numeric,
  engine_load numeric,
  throttle_position numeric,
  coolant_temp numeric,
  oil_pressure numeric,
  check_engine_light boolean DEFAULT false,
  dtc_codes jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_telemetry_unit_timestamp 
  ON vehicle_telemetry(unit_id, timestamp DESC);

-- GPS Tracking
CREATE TABLE IF NOT EXISTS gps_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  incident_id uuid REFERENCES incidents(id) ON DELETE SET NULL,
  timestamp timestamptz DEFAULT now(),
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  altitude numeric,
  speed numeric,
  heading numeric,
  accuracy numeric,
  trip_distance numeric DEFAULT 0,
  total_distance numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gps_tracking_unit_timestamp 
  ON gps_tracking(unit_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_incident 
  ON gps_tracking(incident_id);

-- Lights and Sirens Events
CREATE TABLE IF NOT EXISTS lights_sirens_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  incident_id uuid REFERENCES incidents(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  duration_seconds integer DEFAULT 0,
  location_lat numeric,
  location_lng numeric,
  exported_to_nemsis boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lights_sirens_unit 
  ON lights_sirens_events(unit_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_lights_sirens_incident 
  ON lights_sirens_events(incident_id);

-- Camera Events
CREATE TABLE IF NOT EXISTS camera_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  camera_type text NOT NULL,
  event_type text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  severity text DEFAULT 'low',
  video_url text,
  snapshot_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  acknowledged boolean DEFAULT false,
  acknowledged_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_camera_events_unit 
  ON camera_events(unit_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_camera_events_type 
  ON camera_events(event_type, severity);
CREATE INDEX IF NOT EXISTS idx_camera_events_unacknowledged 
  ON camera_events(unit_id) WHERE acknowledged = false;

-- Trip Logs (epcr_id will be added later when epcrs table exists)
CREATE TABLE IF NOT EXISTS trip_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  incident_id uuid REFERENCES incidents(id) ON DELETE SET NULL,
  epcr_id uuid,
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  start_odometer numeric,
  end_odometer numeric,
  trip_distance numeric,
  lights_used boolean DEFAULT false,
  sirens_used boolean DEFAULT false,
  lights_duration_seconds integer DEFAULT 0,
  sirens_duration_seconds integer DEFAULT 0,
  average_speed numeric,
  max_speed numeric,
  route_data jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_logs_unit 
  ON trip_logs(unit_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_trip_logs_incident 
  ON trip_logs(incident_id);
CREATE INDEX IF NOT EXISTS idx_trip_logs_epcr 
  ON trip_logs(epcr_id);

-- Enable RLS
ALTER TABLE vehicle_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE lights_sirens_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE camera_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view vehicle telemetry"
  ON vehicle_telemetry FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert vehicle telemetry"
  ON vehicle_telemetry FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view GPS tracking"
  ON gps_tracking FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert GPS tracking"
  ON gps_tracking FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update GPS tracking"
  ON gps_tracking FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view lights/sirens events"
  ON lights_sirens_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert lights/sirens events"
  ON lights_sirens_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update lights/sirens events"
  ON lights_sirens_events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view camera events"
  ON camera_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert camera events"
  ON camera_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can acknowledge camera events"
  ON camera_events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view trip logs"
  ON trip_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert trip logs"
  ON trip_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update trip logs"
  ON trip_logs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);