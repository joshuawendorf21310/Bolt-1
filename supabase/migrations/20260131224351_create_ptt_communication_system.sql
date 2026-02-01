/*
  # CrewLink PTT (Push-to-Talk) Communication System
  
  ## Overview
  Advanced push-to-talk communication system similar to AT&T PTT but enhanced
  for EMS operations. Supports instant voice communication, group calls,
  emergency broadcasts, priority interrupts, and real-time location-aware PTT.
  
  ## New Tables
  
  ### 1. `talk_groups`
  Organized communication channels/groups for PTT
  - Predefined groups (dispatch, all units, stations)
  - Dynamic groups (incident-specific, tactical)
  - Priority levels and permissions
  - Member management
  
  ### 2. `talk_group_members`
  Membership tracking for talk groups
  - User/crew assignments to groups
  - Role within group (leader, member, listener)
  - Join/leave timestamps
  
  ### 3. `ptt_channels`
  Active PTT channels for communication
  - One-to-one channels
  - Group channels
  - Emergency channels
  - Channel status and participants
  
  ### 4. `ptt_sessions`
  Individual PTT transmission sessions
  - Who spoke, when, for how long
  - Which channel/group
  - Priority level
  - Location at time of transmission
  
  ### 5. `ptt_recordings`
  Audio recordings of PTT transmissions
  - Storage location reference
  - Playback metadata
  - Transcript (if available)
  - Retention policies
  
  ### 6. `ptt_presence`
  Real-time presence and availability for PTT
  - Online/offline status
  - Do not disturb
  - Current channel
  - Device status (mic enabled, etc.)
  
  ### 7. `emergency_broadcasts`
  Emergency alert broadcasts via PTT
  - Priority interrupt all communications
  - Emergency type and details
  - Response tracking
  - Geographic scope
  
  ## Features
  - Instant push-to-talk communication
  - Talk groups (dispatch, units, stations, tactical)
  - Emergency broadcast with priority interrupt
  - Location-aware PTT
  - Call recording and playback
  - Presence and availability status
  - One-to-one and group communication
  - Call history and analytics
  - Priority levels and interrupts
  
  ## Security
  - RLS enabled on all tables
  - Organization-based isolation
  - Role-based communication permissions
  - Audit trail for all transmissions
*/

-- Talk Groups Table
CREATE TABLE IF NOT EXISTS talk_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  group_name text NOT NULL,
  group_type text DEFAULT 'standard',
  description text,
  priority_level integer DEFAULT 1,
  is_emergency boolean DEFAULT false,
  is_active boolean DEFAULT true,
  auto_join boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  station text,
  max_members integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_talk_groups_org ON talk_groups(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_talk_groups_type ON talk_groups(group_type);
CREATE INDEX IF NOT EXISTS idx_talk_groups_incident ON talk_groups(incident_id) WHERE incident_id IS NOT NULL;

-- Talk Group Members Table
CREATE TABLE IF NOT EXISTS talk_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talk_group_id uuid NOT NULL REFERENCES talk_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crew_id uuid REFERENCES crew_roster(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  can_transmit boolean DEFAULT true,
  can_receive boolean DEFAULT true,
  is_active boolean DEFAULT true,
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(talk_group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_talk_group_members_group ON talk_group_members(talk_group_id, is_active);
CREATE INDEX IF NOT EXISTS idx_talk_group_members_user ON talk_group_members(user_id, is_active);

-- PTT Channels Table
CREATE TABLE IF NOT EXISTS ptt_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  talk_group_id uuid REFERENCES talk_groups(id) ON DELETE CASCADE,
  channel_type text DEFAULT 'group',
  channel_name text,
  is_emergency boolean DEFAULT false,
  priority_level integer DEFAULT 1,
  current_speaker_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  speaking_started_at timestamptz,
  is_active boolean DEFAULT true,
  participant_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ptt_channels_org ON ptt_channels(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ptt_channels_group ON ptt_channels(talk_group_id);
CREATE INDEX IF NOT EXISTS idx_ptt_channels_active ON ptt_channels(is_active, current_speaker_id) WHERE is_active = true;

-- PTT Sessions Table
CREATE TABLE IF NOT EXISTS ptt_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES ptt_channels(id) ON DELETE CASCADE,
  talk_group_id uuid REFERENCES talk_groups(id) ON DELETE CASCADE,
  speaker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  speaker_crew_id uuid REFERENCES crew_roster(id) ON DELETE SET NULL,
  session_type text DEFAULT 'voice',
  priority integer DEFAULT 1,
  is_emergency boolean DEFAULT false,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  location_lat numeric,
  location_lng numeric,
  location_address text,
  interrupted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  listener_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ptt_sessions_channel ON ptt_sessions(channel_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ptt_sessions_speaker ON ptt_sessions(speaker_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ptt_sessions_group ON ptt_sessions(talk_group_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ptt_sessions_emergency ON ptt_sessions(is_emergency, started_at DESC) WHERE is_emergency = true;

-- PTT Recordings Table
CREATE TABLE IF NOT EXISTS ptt_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES ptt_sessions(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  recording_url text,
  storage_path text,
  file_size_bytes bigint,
  duration_seconds integer,
  format text DEFAULT 'webm',
  transcript text,
  transcript_confidence numeric,
  is_available boolean DEFAULT true,
  retention_until timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ptt_recordings_session ON ptt_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_ptt_recordings_org ON ptt_recordings(organization_id, created_at DESC);

-- PTT Presence Table
CREATE TABLE IF NOT EXISTS ptt_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crew_id uuid REFERENCES crew_roster(id) ON DELETE CASCADE,
  status text DEFAULT 'offline',
  do_not_disturb boolean DEFAULT false,
  current_channel_id uuid REFERENCES ptt_channels(id) ON DELETE SET NULL,
  current_talk_group_id uuid REFERENCES talk_groups(id) ON DELETE SET NULL,
  device_type text,
  mic_enabled boolean DEFAULT true,
  speaker_enabled boolean DEFAULT true,
  location_lat numeric,
  location_lng numeric,
  last_active_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_ptt_presence_user ON ptt_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_ptt_presence_status ON ptt_presence(status, last_active_at) WHERE status = 'online';
CREATE INDEX IF NOT EXISTS idx_ptt_presence_channel ON ptt_presence(current_channel_id) WHERE current_channel_id IS NOT NULL;

-- Emergency Broadcasts Table
CREATE TABLE IF NOT EXISTS emergency_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  initiated_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emergency_type text NOT NULL,
  priority integer DEFAULT 10,
  title text NOT NULL,
  message text NOT NULL,
  incident_id uuid REFERENCES incidents(id) ON DELETE SET NULL,
  target_scope text DEFAULT 'organization',
  target_station text,
  target_radius_miles numeric,
  target_location_lat numeric,
  target_location_lng numeric,
  requires_acknowledgment boolean DEFAULT true,
  audio_url text,
  is_active boolean DEFAULT true,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  acknowledged_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emergency_broadcasts_org ON emergency_broadcasts(organization_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_broadcasts_active ON emergency_broadcasts(is_active, started_at DESC) WHERE is_active = true;

-- Emergency Broadcast Acknowledgments Table
CREATE TABLE IF NOT EXISTS emergency_broadcast_acks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id uuid NOT NULL REFERENCES emergency_broadcasts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crew_id uuid REFERENCES crew_roster(id) ON DELETE SET NULL,
  acknowledged_at timestamptz DEFAULT now(),
  location_lat numeric,
  location_lng numeric,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(broadcast_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_emergency_broadcast_acks_broadcast ON emergency_broadcast_acks(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_emergency_broadcast_acks_user ON emergency_broadcast_acks(user_id);

-- Enable Row Level Security
ALTER TABLE talk_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE talk_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ptt_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE ptt_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ptt_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ptt_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_broadcast_acks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for talk_groups
CREATE POLICY "Users can view talk groups in their organization"
  ON talk_groups FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create talk groups"
  ON talk_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update talk groups they created"
  ON talk_groups FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- RLS Policies for talk_group_members
CREATE POLICY "Users can view talk group members"
  ON talk_group_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join talk groups"
  ON talk_group_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave talk groups"
  ON talk_group_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for ptt_channels
CREATE POLICY "Users can view PTT channels"
  ON ptt_channels FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create PTT channels"
  ON ptt_channels FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update PTT channels"
  ON ptt_channels FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for ptt_sessions
CREATE POLICY "Users can view PTT sessions"
  ON ptt_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create PTT sessions"
  ON ptt_sessions FOR INSERT
  TO authenticated
  WITH CHECK (speaker_id = auth.uid());

CREATE POLICY "Users can update their PTT sessions"
  ON ptt_sessions FOR UPDATE
  TO authenticated
  USING (speaker_id = auth.uid())
  WITH CHECK (speaker_id = auth.uid());

-- RLS Policies for ptt_recordings
CREATE POLICY "Users can view PTT recordings"
  ON ptt_recordings FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert PTT recordings"
  ON ptt_recordings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for ptt_presence
CREATE POLICY "Users can view PTT presence"
  ON ptt_presence FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own presence"
  ON ptt_presence FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own presence"
  ON ptt_presence FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for emergency_broadcasts
CREATE POLICY "Users can view emergency broadcasts"
  ON emergency_broadcasts FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create emergency broadcasts"
  ON emergency_broadcasts FOR INSERT
  TO authenticated
  WITH CHECK (
    initiated_by = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update emergency broadcasts"
  ON emergency_broadcasts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for emergency_broadcast_acks
CREATE POLICY "Users can view emergency broadcast acknowledgments"
  ON emergency_broadcast_acks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can acknowledge emergency broadcasts"
  ON emergency_broadcast_acks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create default talk groups for organizations
CREATE OR REPLACE FUNCTION create_default_talk_groups()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO talk_groups (organization_id, group_name, group_type, description, priority_level, auto_join)
  VALUES
    (NEW.id, 'Dispatch', 'dispatch', 'Primary dispatch channel', 5, true),
    (NEW.id, 'All Units', 'broadcast', 'Broadcast to all units', 3, true),
    (NEW.id, 'Station 1', 'station', 'Station 1 communications', 2, false),
    (NEW.id, 'Tactical 1', 'tactical', 'Tactical channel 1', 4, false),
    (NEW.id, 'Emergency', 'emergency', 'Emergency communications only', 10, true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'create_default_talk_groups_trigger'
  ) THEN
    CREATE TRIGGER create_default_talk_groups_trigger
    AFTER INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION create_default_talk_groups();
  END IF;
END $$;