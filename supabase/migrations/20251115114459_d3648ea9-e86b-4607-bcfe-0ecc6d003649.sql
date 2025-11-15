-- Fix RLS policies for new tables created in previous migration

-- Enable RLS on api_rate_limits table
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Enable RLS on audit_logs table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for api_rate_limits
-- Users can view their own rate limit data
CREATE POLICY "Users can view their own rate limits"
ON api_rate_limits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only system can insert rate limit records (done via edge functions)
CREATE POLICY "System can insert rate limits"
ON api_rate_limits
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Only system can update rate limit records
CREATE POLICY "System can update rate limits"
ON api_rate_limits
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- RLS policies for audit_logs
-- Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only system can insert audit logs (done via edge functions)
CREATE POLICY "System can insert audit logs"
ON audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);