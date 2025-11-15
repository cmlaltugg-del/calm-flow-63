import { supabase } from '@/integrations/supabase/client';

export interface UserDataExport {
  profile: any;
  dailyPlans: any[];
  workoutHistory: any[];
  exportDate: string;
}

/**
 * Export all user data for GDPR compliance
 */
export const exportUserData = async (userId: string): Promise<UserDataExport> => {
  // Fetch profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Fetch daily plans
  const { data: dailyPlans } = await supabase
    .from('daily_plans')
    .select('*')
    .eq('user_id', userId)
    .order('plan_date', { ascending: false });

  // Fetch workout history
  const { data: workoutHistory } = await supabase
    .from('workout_history')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  return {
    profile: profile || {},
    dailyPlans: dailyPlans || [],
    workoutHistory: workoutHistory || [],
    exportDate: new Date().toISOString()
  };
};

/**
 * Download user data as JSON file
 */
export const downloadUserData = async (userId: string) => {
  const data = await exportUserData(userId);
  
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `user_data_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Delete all user data (GDPR Right to Erasure)
 */
export const deleteUserAccount = async (userId: string) => {
  try {
    // Log the deletion for audit purposes
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'account_deletion_requested',
      details: { timestamp: new Date().toISOString() }
    });

    // Delete profile (CASCADE will handle related data)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    if (profileError) throw profileError;

    // Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) throw authError;

    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};
