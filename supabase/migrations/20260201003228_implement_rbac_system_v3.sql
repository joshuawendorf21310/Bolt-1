/*
  # Role-Based Access Control (RBAC) System
  
  ## Purpose
  Implement role-based access control to support founder-only access by default
  with the ability to delegate billing tasks later. This enforces least privilege
  and separation of duties.
  
  ## Roles Defined
  - founder: Full access to all areas (financial, billing, configuration)
  - biller: Access to billing operations only (no financial visibility beyond AR)
  - viewer: Read-only access for reporting
  
  ## New Tables
  
  ### `system_user_roles`
  Assign system-level roles to users (different from employee roles)
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Links to auth.users
  - `role` (text) - 'founder', 'biller', 'viewer'
  - `granted_at` (timestamptz)
  - `granted_by` (uuid) - Who granted the role
  
  ### `role_permissions`
  Define what each role can do
  - `id` (uuid, primary key)
  - `role` (text) - 'founder', 'biller', 'viewer'
  - `resource` (text) - 'financial_data', 'billing_operations', etc.
  - `action` (text) - 'read', 'write', 'delete'
  
  ## Helper Functions
  - has_role(role_name): Check if current user has a role
  - has_permission(resource, action): Check if current user can perform action
  
  ## Security
  - All access checks must go through role/permission system
  - Default deny: users with no role have no access
  - Founder role required for financial data and configuration
  - Biller role sufficient for billing operations
*/

-- Create system user roles table
CREATE TABLE IF NOT EXISTS system_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('founder', 'biller', 'viewer')),
  granted_at timestamptz DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Create role permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('founder', 'biller', 'viewer')),
  resource text NOT NULL,
  action text NOT NULL CHECK (action IN ('read', 'write', 'delete', 'execute')),
  UNIQUE(role, resource, action)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_user_roles_user ON system_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_system_user_roles_role ON system_user_roles(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);

-- Enable RLS
ALTER TABLE system_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_user_roles
CREATE POLICY "Users can view their own system roles"
  ON system_user_roles FOR SELECT
  TO authenticated
  USING (system_user_roles.user_id = auth.uid());

CREATE POLICY "Founders can manage system user roles"
  ON system_user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_user_roles sur
      WHERE sur.user_id = auth.uid() AND sur.role = 'founder'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_user_roles sur
      WHERE sur.user_id = auth.uid() AND sur.role = 'founder'
    )
  );

-- RLS Policies for role_permissions
CREATE POLICY "Everyone can view role permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only founders can modify role permissions"
  ON role_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_user_roles sur
      WHERE sur.user_id = auth.uid() AND sur.role = 'founder'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_user_roles sur
      WHERE sur.user_id = auth.uid() AND sur.role = 'founder'
    )
  );

-- Helper function: Check if current user has a specific role
CREATE OR REPLACE FUNCTION has_role(role_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM system_user_roles
    WHERE user_id = auth.uid()
    AND role = role_name
  );
END;
$$;

-- Helper function: Check if current user has permission for resource/action
CREATE OR REPLACE FUNCTION has_permission(resource_name text, action_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM system_user_roles sur
    JOIN role_permissions rp ON sur.role = rp.role
    WHERE sur.user_id = auth.uid()
    AND rp.resource = resource_name
    AND rp.action = action_name
  );
END;
$$;

-- Insert default permissions for each role
INSERT INTO role_permissions (role, resource, action) VALUES
  -- Founder: Full access to everything
  ('founder', 'financial_data', 'read'),
  ('founder', 'financial_data', 'write'),
  ('founder', 'billing_operations', 'read'),
  ('founder', 'billing_operations', 'write'),
  ('founder', 'billing_operations', 'execute'),
  ('founder', 'compensation_data', 'read'),
  ('founder', 'compensation_data', 'write'),
  ('founder', 'system_configuration', 'read'),
  ('founder', 'system_configuration', 'write'),
  ('founder', 'user_management', 'read'),
  ('founder', 'user_management', 'write'),
  ('founder', 'audit_log', 'read'),
  
  -- Biller: Access to billing operations only
  ('biller', 'billing_operations', 'read'),
  ('biller', 'billing_operations', 'write'),
  ('biller', 'billing_operations', 'execute'),
  ('biller', 'accounts_receivable', 'read'),
  ('biller', 'accounts_receivable', 'write'),
  
  -- Viewer: Read-only access to reports
  ('viewer', 'financial_data', 'read'),
  ('viewer', 'billing_operations', 'read'),
  ('viewer', 'accounts_receivable', 'read')
ON CONFLICT (role, resource, action) DO NOTHING;