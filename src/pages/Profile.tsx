import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Home, User, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    height: "",
    weight: "",
    target_weight_kg: "",
    age: "",
    gender: "",
    workout_mode: "",
    daily_calories: "",
    protein_target: "",
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/');
      return;
    }

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
          age: data.age?.toString() || "",
          gender: data.gender || "",
          workout_mode: data.workout_mode || "",
          daily_calories: data.daily_calories?.toString() || "",
          protein_target: data.protein_target?.toString() || "",
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
      const { error } = await supabase
        .from('profiles')
        .update({
          height: parseFloat(profile.height) || null,
          weight: parseFloat(profile.weight) || null,
          target_weight_kg: parseFloat(profile.target_weight_kg) || null,
          age: parseInt(profile.age) || null,
          gender: profile.gender || null,
          workout_mode: profile.workout_mode || null,
          daily_calories: parseInt(profile.daily_calories) || null,
          protein_target: parseInt(profile.protein_target) || null,
        })
        .eq('user_id', user!.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
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
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  if (loading || authLoading) {
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
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <Home className="h-5 w-5" />
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
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
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                placeholder="30"
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

            <div className="space-y-2">
              <Label htmlFor="workout_mode">Workout Mode</Label>
              <Select value={profile.workout_mode} onValueChange={(value) => setProfile({ ...profile, workout_mode: value })}>
                <SelectTrigger id="workout_mode">
                  <SelectValue placeholder="Select workout mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="gym">Gym</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calculated Targets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="daily_calories">Daily Calories</Label>
              <Input
                id="daily_calories"
                type="number"
                value={profile.daily_calories}
                onChange={(e) => setProfile({ ...profile, daily_calories: e.target.value })}
                placeholder="2000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="protein_target">Protein Target (g)</Label>
              <Input
                id="protein_target"
                type="number"
                value={profile.protein_target}
                onChange={(e) => setProfile({ ...profile, protein_target: e.target.value })}
                placeholder="140"
              />
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
            className="flex flex-col items-center gap-1 text-primary"
          >
            <User className="h-5 w-5" />
            <span className="text-xs">Profile</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
