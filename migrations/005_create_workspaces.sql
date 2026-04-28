-- Migration 005: Create workspaces table
-- DSR v0.2.0 Enterprise Foundation

CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    
    -- Workspace config
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    environment VARCHAR(50) DEFAULT 'development' CHECK (environment IN ('development', 'staging', 'production')),
    
    -- Figma integration
    figma_file_key VARCHAR(255),
    figma_last_sync_at TIMESTAMP WITH TIME ZONE,
    
    -- Settings
    settings JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique slug per organization
    UNIQUE(organization_id, slug)
);

-- Indexes
CREATE INDEX idx_workspaces_org_id ON workspaces(organization_id);
CREATE INDEX idx_workspaces_environment ON workspaces(environment);
CREATE INDEX idx_workspaces_figma_file ON workspaces(figma_file_key) WHERE figma_file_key IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_workspaces_updated_at 
    BEFORE UPDATE ON workspaces 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE workspaces IS 'Isolated environments within an organization (dev/staging/prod)';
COMMENT ON COLUMN workspaces.settings IS 'JSON configuration for workspace-specific settings';
