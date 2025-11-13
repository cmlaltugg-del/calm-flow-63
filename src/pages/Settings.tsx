import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Home, User, Settings as SettingsIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    height: "",
    weight: "",
    target_weight_kg: "",
    gender: "",
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }

    setEmail(user.email || "");
    fetchProfile();
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          height: data.height?.toString() || "",
          weight: data.weight?.toString() || "",
          target_weight_kg: data.target_weight_kg?.toString() || "",
          gender: data.gender || "",
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Fetch existing profile data for calculations
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('age, goal, workout_mode, training_styles')
        .eq('user_id', user!.id)
        .single();
      
      const weight = parseFloat(profile.weight);
      const height = parseFloat(profile.height);
      const age = existingProfile?.age;
      const gender = profile.gender;
      const goal = existingProfile?.goal;
      const workoutMode = existingProfile?.workout_mode;
      const trainingStyles = existingProfile?.training_styles || [];
      
      let dailyCalories = null;
      let proteinTarget = null;
      
      // Calculate daily calories and protein target if we have the required data
      if (weight && height && age && gender) {
        // Calculate BMR using Mifflin-St Jeor Equation
        let bmr: number;
        if (gender === 'male') {
          bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
          bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }
        
        // Activity multipliers based on workout mode
        const activityMultipliers: { [key: string]: number } = {
          'strength_training': 1.55,
          'cardio': 1.725,
          'mixed': 1.6375,
        };
        
        const activityMultiplier = activityMultipliers[workoutMode || ''] || 1.2;
        let tdee = bmr * activityMultiplier;
        
        // Adjust calories based on goal
        if (goal === 'lose_weight') {
          dailyCalories = Math.round(tdee - 500);
        } else if (goal === 'gain_muscle') {
          dailyCalories = Math.round(tdee + 300);
        } else {
          dailyCalories = Math.round(tdee);
        }
        
        // Calculate protein target
        const hasStrengthTraining = trainingStyles.includes('gym') || 
                                    trainingStyles.includes('home') ||
                                    workoutMode === 'strength_training';
        
        proteinTarget = Math.round(weight * (hasStrengthTraining ? 2.2 : 1.6));
      }
      
      // Update profile with new values and calculated targets
      const { error } = await supabase
        .from('profiles')
        .update({
          height: parseFloat(profile.height) || null,
          weight: parseFloat(profile.weight) || null,
          target_weight_kg: parseFloat(profile.target_weight_kg) || null,
          gender: profile.gender || null,
          daily_calories: dailyCalories,
          protein_target: proteinTarget,
        })
        .eq('user_id', user!.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: dailyCalories 
          ? "Profile and nutritional targets updated successfully" 
          : "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24">
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <Home className="h-5 w-5" />
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                value={profile.height}
                onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                placeholder="170"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={profile.weight}
                onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
                placeholder="70"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_weight">Target Weight (kg)</Label>
              <Input
                id="target_weight"
                type="number"
                value={profile.target_weight_kg}
                onChange={(e) => setProfile({ ...profile, target_weight_kg: e.target.value })}
                placeholder="65"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={profile.gender} onValueChange={(value) => setProfile({ ...profile, gender: value })}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button 
            className="w-full" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>

          <Button 
            className="w-full" 
            variant="destructive"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
        <div className="max-w-md mx-auto flex items-center justify-around py-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <User className="h-5 w-5" />
            <span className="text-xs">Profile</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex flex-col items-center gap-1 text-primary"
          >
            <SettingsIcon className="h-5 w-5" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
