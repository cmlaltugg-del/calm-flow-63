import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  // Add production domains when deployed
  // 'https://yourapp.com',
  // 'https://www.yourapp.com',
];

/**
 * Get CORS headers with origin validation
 */
export const getCorsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin || '') 
    ? (origin || ALLOWED_ORIGINS[0]) 
    : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true'
});

/**
 * Check rate limit for a user and endpoint
 * Limit: 3 requests per day per endpoint
 */
export const checkRateLimit = async (
  supabase: any,
  userId: string,
  endpoint: string
): Promise<{ allowed: boolean; message?: string }> => {
  const today = new Date().toISOString().split('T')[0];
  
  // Check existing rate limit for today
  const { data: existing } = await supabase
    .from('api_rate_limits')
    .select('request_count')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .eq('window_start', today)
    .single();
  
  if (existing) {
    if (existing.request_count >= 3) {
      return {
        allowed: false,
        message: 'Rate limit exceeded. You can generate 3 plans per day. Try again tomorrow.'
      };
    }
    
    // Increment count
    await supabase
      .from('api_rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .eq('window_start', today);
  } else {
    // Create new rate limit entry
    await supabase
      .from('api_rate_limits')
      .insert({
        user_id: userId,
        endpoint: endpoint,
        window_start: today,
        request_count: 1
      });
  }
  
  return { allowed: true };
};

/**
 * Validate profile data for plan generation
 */
export const validateProfile = (profile: any): { valid: boolean; error?: string } => {
  if (!profile) {
    return { valid: false, error: 'Missing profile data' };
  }

  // Validate weight
  if (!profile.weight || typeof profile.weight !== 'number') {
    return { valid: false, error: 'Weight is required and must be a number' };
  }
  if (profile.weight < 30 || profile.weight > 300) {
    return { valid: false, error: 'Invalid weight: must be between 30-300 kg' };
  }

  // Validate height (optional but must be valid if provided)
  if (profile.height && (profile.height < 100 || profile.height > 250)) {
    return { valid: false, error: 'Invalid height: must be between 100-250 cm' };
  }

  // Validate age (optional but must be valid if provided)
  if (profile.age && (profile.age < 13 || profile.age > 100)) {
    return { valid: false, error: 'Invalid age: must be between 13-100 years' };
  }

  // Validate goal (optional but must be valid if provided)
  const validGoals = ['lose_weight', 'gain_muscle', 'tone_flexibility', 'maintain'];
  if (profile.goal && !validGoals.includes(profile.goal)) {
    return { valid: false, error: 'Invalid goal. Must be one of: lose_weight, gain_muscle, tone_flexibility, maintain' };
  }

  // Validate intensity (optional but must be valid if provided)
  const validIntensities = ['low', 'medium', 'high'];
  if (profile.intensity && !validIntensities.includes(profile.intensity)) {
    return { valid: false, error: 'Invalid intensity. Must be one of: low, medium, high' };
  }

  // Validate training_styles (optional but must be valid if provided)
  if (profile.training_styles && !Array.isArray(profile.training_styles)) {
    return { valid: false, error: 'training_styles must be an array' };
  }

  return { valid: true };
};
