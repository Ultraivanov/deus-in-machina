-- Migration 001: Create organizations table
-- DSR v0.2.0 Enterprise Foundation

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    billing_plan VARCHAR(50) DEFAULT 'free' CHECK (billing_plan IN ('free', 'pro', 'enterprise')),
    
    -- Quotas
    max_users INTEGER DEFAULT 5,
    max_workspaces INTEGER DEFAULT 3,
    max_tokens INTEGER DEFAULT 1000,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on slug for fast lookup
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Index on billing_plan for filtering
CREATE INDEX idx_organizations_billing_plan ON organizations(billing_plan);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default data for testing
INSERT INTO organizations (name, slug, billing_plan, max_users, max_workspaces, max_tokens) 
VALUES ('Default Org', 'default', 'free', 5, 3, 1000);
