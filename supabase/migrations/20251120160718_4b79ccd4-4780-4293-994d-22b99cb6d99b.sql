-- Enable RLS on new tables
ALTER TABLE plan_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- RLS policies for plan_cache (system-managed, no user access needed)
CREATE POLICY "System manages plan cache"
ON plan_cache
FOR ALL
USING (false);

-- RLS policies for subscription_tiers (public read-only)
CREATE POLICY "Anyone can view subscription tiers"
ON subscription_tiers
FOR SELECT
USING (true);