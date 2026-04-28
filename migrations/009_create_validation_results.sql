-- Migration 009: Create validation_results table
-- DSR v0.2.0 Enterprise Foundation

CREATE TABLE validation_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    validation_id UUID NOT NULL REFERENCES validations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Issue details
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('error', 'warning', 'info')),
    rule_id VARCHAR(100) NOT NULL,
    rule_name VARCHAR(255),
    message TEXT NOT NULL,
    
    -- Location
    file_path VARCHAR(500),
    line_number INTEGER,
    column_number INTEGER,
    
    -- Context
    context JSONB, -- Surrounding code, token info, etc.
    suggestion TEXT, -- How to fix
    
    -- Status
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'fixed', 'ignored', 'false_positive')),
    fixed_at TIMESTAMP WITH TIME ZONE,
    fixed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_validation_results_validation_id ON validation_results(validation_id);
CREATE INDEX idx_validation_results_org_id ON validation_results(organization_id);
CREATE INDEX idx_validation_results_severity ON validation_results(severity);
CREATE INDEX idx_validation_results_status ON validation_results(status);
CREATE INDEX idx_validation_results_rule_id ON validation_results(rule_id);

-- Composite for filtering open issues
CREATE INDEX idx_validation_results_open ON validation_results(organization_id, status, severity);

-- Comments
COMMENT ON TABLE validation_results IS 'Individual validation issues per run';
