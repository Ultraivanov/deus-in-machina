-- Migration 008: Create validations table with org isolation
-- DSR v0.2.0 Enterprise Foundation

CREATE TABLE validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    
    -- Validation run info
    name VARCHAR(255) NOT NULL,
    run_type VARCHAR(50) NOT NULL DEFAULT 'manual' CHECK (run_type IN ('manual', 'ci', 'scheduled', 'webhook')),
    
    -- Source being validated
    source_type VARCHAR(50) NOT NULL, -- figma, code, tokens, etc.
    source_ref VARCHAR(500), -- File key, PR URL, etc.
    
    -- Results summary
    status VARCHAR(50) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- {
    --   "total": 150,
    --   "passed": 140,
    --   "warnings": 8,
    --   "errors": 2,
    --   "duration_ms": 1250
    -- }
    
    -- Detailed results (stored separately for large runs)
    results_count INTEGER DEFAULT 0,
    
    -- Ruleset used
    ruleset_version VARCHAR(50),
    ruleset_config JSONB,
    
    -- Error details (if failed)
    error_message TEXT,
    error_stack TEXT,
    
    -- Metadata
    triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_validations_org_id ON validations(organization_id);
CREATE INDEX idx_validations_workspace_id ON validations(workspace_id);
CREATE INDEX idx_validations_status ON validations(status);
CREATE INDEX idx_validations_run_type ON validations(run_type);
CREATE INDEX idx_validations_source_type ON validations(source_type);
CREATE INDEX idx_validations_triggered_by ON validations(triggered_by);
CREATE INDEX idx_validations_started_at ON validations(started_at);

-- Composite index for filtering recent runs
CREATE INDEX idx_validations_org_recent ON validations(organization_id, started_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_validations_updated_at 
    BEFORE UPDATE ON validations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE validations IS 'Validation runs and results per organization';
COMMENT ON COLUMN validations.summary IS 'JSON summary of validation results';
COMMENT ON COLUMN validations.results_count IS 'Number of detailed results (stored in validations_results table)';
