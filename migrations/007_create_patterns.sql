-- Migration 007: Create patterns table with org isolation
-- DSR v0.2.0 Enterprise Foundation

CREATE TABLE patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    
    -- Pattern identification
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- hero, card, list, grid, etc.
    
    -- Detection info
    confidence DECIMAL(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    detection_method VARCHAR(100) DEFAULT 'heuristic', -- heuristic, ml, manual
    
    -- Structure (stored as JSON for flexibility)
    structure JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Example structure:
    -- {
    --   "elements": [{"type": "heading", "role": "title"}, ...],
    --   "layout": {"type": "flex", "direction": "column"},
    --   "constraints": {"minWidth": 320, "maxWidth": 1200}
    -- }
    
    -- Source reference
    source_file VARCHAR(500), -- Figma file key
    source_node VARCHAR(500), -- Figma node ID
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    description TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'rejected')),
    
    -- Audit
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique pattern per workspace
    UNIQUE(organization_id, workspace_id, slug)
);

-- Indexes
CREATE INDEX idx_patterns_org_id ON patterns(organization_id);
CREATE INDEX idx_patterns_workspace_id ON patterns(workspace_id);
CREATE INDEX idx_patterns_type ON patterns(type);
CREATE INDEX idx_patterns_status ON patterns(status);
CREATE INDEX idx_patterns_confidence ON patterns(confidence);
CREATE INDEX idx_patterns_detection ON patterns(detection_method);

-- JSONB indexes for structure queries
CREATE INDEX idx_patterns_structure ON patterns USING gin(structure);
CREATE INDEX idx_patterns_tags ON patterns USING gin(tags);

-- Trigger for updated_at
CREATE TRIGGER update_patterns_updated_at 
    BEFORE UPDATE ON patterns 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE patterns IS 'UI patterns detected or defined in workspaces';
COMMENT ON COLUMN patterns.structure IS 'JSON representation of pattern structure';
COMMENT ON COLUMN patterns.confidence IS 'Detection confidence 0.0-1.0';
