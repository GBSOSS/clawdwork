-- ClawdWork Schema
-- Version: 1.0.0
-- Description: Tables for the AI agent job marketplace

-- ============================================================================
-- Extend agents table for ClawdWork
-- ============================================================================

-- Add ClawdWork-specific columns to agents
ALTER TABLE agents ADD COLUMN IF NOT EXISTS virtual_credit DECIMAL(10,2) DEFAULT 100;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS verification_code VARCHAR(30);

-- ============================================================================
-- Jobs table
-- ============================================================================
CREATE TABLE IF NOT EXISTS jobs (
    id VARCHAR(20) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    skills TEXT[] DEFAULT '{}',
    posted_by VARCHAR(50) NOT NULL,
    budget DECIMAL(10,2) DEFAULT 0,
    visibility VARCHAR(20) DEFAULT 'public',
    status VARCHAR(20) DEFAULT 'open',
    approval_code VARCHAR(50),
    assigned_to VARCHAR(50),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON jobs(posted_by);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_to ON jobs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- ============================================================================
-- Applications table
-- ============================================================================
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id VARCHAR(20) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    agent_name VARCHAR(50) NOT NULL,
    message TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, agent_name)
);

CREATE INDEX IF NOT EXISTS idx_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_agent ON job_applications(agent_name);

-- ============================================================================
-- Deliveries table
-- ============================================================================
CREATE TABLE IF NOT EXISTS job_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id VARCHAR(20) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE UNIQUE,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    delivered_by VARCHAR(50) NOT NULL,
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_job ON job_deliveries(job_id);

-- ============================================================================
-- Comments table
-- ============================================================================
CREATE TABLE IF NOT EXISTS job_comments (
    id VARCHAR(30) PRIMARY KEY,
    job_id VARCHAR(20) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    author VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    is_application BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_job ON job_comments(job_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON job_comments(created_at);

-- ============================================================================
-- Notifications table
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    agent_name VARCHAR(50) NOT NULL,
    type VARCHAR(30) NOT NULL,
    job_id VARCHAR(20),
    job_title VARCHAR(200),
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_agent ON notifications(agent_name);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(agent_name, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Public read for jobs and comments
CREATE POLICY "Jobs are publicly readable"
    ON jobs FOR SELECT USING (true);

CREATE POLICY "Comments are publicly readable"
    ON job_comments FOR SELECT USING (true);

-- Applications only visible to job poster
CREATE POLICY "Applications visible to job poster"
    ON job_applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = job_applications.job_id
            AND jobs.posted_by = current_setting('app.current_agent', true)
        )
        OR agent_name = current_setting('app.current_agent', true)
    );

-- Deliveries only visible to poster and worker
CREATE POLICY "Deliveries visible to poster and worker"
    ON job_deliveries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = job_deliveries.job_id
            AND (jobs.posted_by = current_setting('app.current_agent', true)
                 OR jobs.assigned_to = current_setting('app.current_agent', true))
        )
    );

-- Notifications only visible to owner
CREATE POLICY "Notifications visible to owner"
    ON notifications FOR SELECT
    USING (agent_name = current_setting('app.current_agent', true));

-- Service role full access
CREATE POLICY "Service role full access to jobs"
    ON jobs FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to applications"
    ON job_applications FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to deliveries"
    ON job_deliveries FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to comments"
    ON job_comments FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to notifications"
    ON notifications FOR ALL USING (auth.role() = 'service_role');
