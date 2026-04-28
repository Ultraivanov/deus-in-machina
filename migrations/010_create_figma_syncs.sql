-- Migration 010: Create figma_syncs table
-- DSR v0.2.0 Enterprise Foundation

CREATE TABLE figma_syncs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    
    -- Figma source
    figma_file_key VARCHAR(255) NOT NULL,
    figma_file_name VARCHAR(500),
    figma_last_modified_at TIMESTAMP WITH TIME ZONE,
    
    -- Sync configuration
    sync_type VARCHAR(50) NOT NULL DEFAULT 'full' CHECK (sync_type IN ('full', 'incremental', 'webhook')),
    auto_sync BOOLEAN DEFAULT false,
    auto_sync_interval_minutes INTEGER DEFAULT 60,
    
    -- Sync status
    last_sync_status VARCHAR(50) DEFAULT 'pending' CHECK (last_sync_status IN ('pending', 'running', 'success', 'failed', 'cancelled')),
    last_sync_started_at TIMESTAMP WITH TIME ZONE,
    last_sync_completed_at TIMESTAMP WITH TIME ZONE,
    last_sync_error TEXT,
    
    -- Statistics
    tokens_synced INTEGER DEFAULT 0,
    tokens_created INTEGER DEFAULT 0,
    tokens_updated INTEGER DEFAULT 0,
    tokens_deleted INTEGER DEFAULT 0,
    
    -- Figma API metadata
    figma_version VARCHAR(50),
    figma_branch VARCHAR(255),
    
    -- Credentials (encrypted in production)
    figma_token_hint VARCHAR(20), -- Last 4 chars of token for identification
    
    -- Audit
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique sync per workspace + file
    UNIQUE(organization_id, workspace_id, figma_file_key)
);

-- Indexes
CREATE INDEX idx_figma_syncs_org_id ON figma_syncs(organization_id);
CREATE INDEX idx_figma_syncs_workspace_id ON figma_syncs(workspace_id);
CREATE INDEX idx_figma_syncs_file_key ON figma_syncs(figma_file_key);
CREATE INDEX idx_figma_syncs_status ON figma_syncs(last_sync_status);
CREATE INDEX idx_figma_syncs_auto_sync ON figma_syncs(auto_sync) WHERE auto_sync = true;

-- Trigger for updated_at
CREATE TRIGGER update_figma_syncs_updated_at 
    BEFORE UPDATE ON figma_syncs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE figma_syncs IS 'Figma file synchronization tracking per workspace';
COMMENT ON COLUMN figma_syncs.figma_token_hint IS 'For identification only; actual token stored securely';
