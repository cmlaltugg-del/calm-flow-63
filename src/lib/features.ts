export const canAccessFeature = (
  feature: string, 
  subscription: string
): boolean => {
  const features: Record<string, string[]> = {
    free: ['basic_workout', 'basic_tracking'],
    basic: ['unlimited_workout', 'video_guides', 'basic_analytics'],
    premium: ['unlimited_workout', 'video_guides', 'advanced_analytics', 'posture_ai']
  };
  
  return features[subscription]?.includes(feature) || false;
};
