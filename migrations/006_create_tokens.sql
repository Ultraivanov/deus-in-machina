-- Migration 006: Create tokens table with org isolation
-- DSR v0.2.0 Enterprise Foundation

CREATE TABLE tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    
    -- Token identification
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- color, typography, spacing, etc.
    
    -- Token value
    value VARCHAR(500) NOT NULL,
    value_type VARCHAR(50) NOT NULL DEFAULT 'string', -- string, number, color, etc.
    
    -- Semantic info
    role VARCHAR(100),
    scale VARCHAR(50),
    state VARCHAR(50),
    
    -- Source tracking
    source VARCHAR(100) DEFAULT 'manual', -- figma, manual, import
    source_ref VARCHAR(500), -- Figma variable ID, etc.
    
    -- Metadata
    description TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'deleted')),
    
    -- Audit
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique token per workspace
    UNIQUE(organization_id, workspace_id, slug)
);

-- Indexes for performance
CREATE INDEX idx_tokens_org_id ON tokens(organization_id);
CREATE INDEX idx_tokens_workspace_id ON tokens(workspace_id);
CREATE INDEX idx_tokens_category ON tokens(category);
CREATE INDEX idx_tokens_status ON tokens(status);
CREATE INDEX idx_tokens_slug ON tokens(slug);
CREATE INDEX idx_tokens_source ON tokens(source);

-- Full-text search on name and description
CREATE INDEX idx_tokens_search ON tokens USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Trigger for updated_at
CREATE TRIGGER update_tokens_updated_at 
    BEFORE UPDATE ON tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE tokens IS 'Design tokens with organization and workspace isolation';
COMMENT ON COLUMN tokens.slug IS 'URL-safe identifier, unique per workspace';
COMMENT ON COLUMN tokens.metadata IS 'JSON storage for additional token properties';
