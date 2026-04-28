-- Migration 003: Create organization_members junction table
-- DSR v0.2.0 Enterprise Foundation

CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    
    -- Invitation tracking
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    invited_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint: one membership per user per org
    UNIQUE(organization_id, user_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_role ON organization_members(role);
CREATE INDEX idx_org_members_status ON organization_members(status);

-- Trigger for updated_at
CREATE TRIGGER update_org_members_updated_at 
    BEFORE UPDATE ON organization_members 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE organization_members IS 'Junction table for organization membership';
COMMENT ON COLUMN organization_members.role IS 'owner: full control, admin: manage members, member: limited access';
COMMENT ON COLUMN organization_members.status IS 'pending: invited but not accepted, active: full member, suspended: temporarily disabled';

-- Constraint: only one owner per organization
CREATE UNIQUE INDEX idx_org_single_owner 
ON organization_members(organization_id) 
WHERE role = 'owner';
