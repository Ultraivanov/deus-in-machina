-- Migration 004: Create api_keys table
-- DSR v0.2.0 Enterprise Foundation

CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Key data (hashed for storage)
    name VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(8) NOT NULL, -- First 8 chars of key for identification
    key_hash VARCHAR(255) NOT NULL, -- SHA-256 hash of full key
    
    -- Scopes and permissions
    scopes JSONB DEFAULT '["read"]'::jsonb, -- ["read", "write", "admin"]
    
    -- Usage tracking
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_api_keys_org_id ON api_keys(organization_id);
CREATE INDEX idx_api_keys_created_by ON api_keys(created_by);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at) WHERE expires_at IS NOT NULL;

-- Only active keys (not revoked, not expired)
CREATE INDEX idx_api_keys_active ON api_keys(organization_id) 
WHERE revoked_at IS NULL AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);

-- Trigger for updated_at
CREATE TRIGGER update_api_keys_updated_at 
    BEFORE UPDATE ON api_keys 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE api_keys IS 'API keys for programmatic access to DSR';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256 hash of the actual API key (keys are never stored in plain text)';
COMMENT ON COLUMN api_keys.scopes IS 'JSON array of permissions: read, write, admin';
