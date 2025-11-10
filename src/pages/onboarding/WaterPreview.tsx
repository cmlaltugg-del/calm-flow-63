import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Droplet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const WaterPreview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const weight = sessionStorage.getItem("weight") || "70";
  const dailyTarget = Math.round(parseInt(weight) * 0.033 * 10) / 10;

  const handleContinue = async () => {
    try {
      setLoading(true);
      
      const height = sessionStorage.getItem('height');
      const weight = sessionStorage.getItem('weight');
      const gender = sessionStorage.getItem('gender');
      const targetWeight = sessionStorage.getItem('targetWeight');
      const age = sessionStorage.getItem('age');
      const goal = sessionStorage.getItem('goal');
      const workoutMode = sessionStorage.getItem('workoutMode');

      if (!height || !weight || !gender || !targetWeight || !age || !goal || !workoutMode) {
        toast({
          title: "Missing information",
          description: "Please complete all onboarding steps",
          variant: "destructive",
        });
        return;
      }

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign up to continue",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      // Save profile to database
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          height: parseFloat(height),
          weight: parseFloat(weight),
          gender: gender,
          target_weight_kg: parseFloat(targetWeight),
          age: parseInt(age),
          goal: goal,
          workout_mode: workoutMode,
        });

      if (profileError) {
        console.error('Profile save error:', profileError);
        throw profileError;
      }

      // Generate daily plan
      const { error: planError } = await supabase.functions.invoke('generateDailyPlan');

      if (planError) {
        console.error('Plan generation error:', planError);
        throw planError;
      }

      toast({
        title: "Success!",
        description: "Your personalized plan is ready",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error in onboarding completion:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-12">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-light text-foreground">Daily water target</h2>
            <p className="text-muted-foreground font-light">Calculated automatically based on your weight</p>
          </div>

          <div className="bg-accent rounded-3xl p-8 text-center space-y-4">
            <div className="flex justify-center">
              <Droplet className="h-16 w-16 text-primary" />
            </div>
            <div className="space-y-1">
              <div className="text-5xl font-light text-primary">{dailyTarget}L</div>
              <div className="text-sm text-muted-foreground">per day</div>
            </div>
            <p className="text-sm text-muted-foreground pt-4">
              Stay hydrated throughout the day with gentle reminders
            </p>
          </div>
        </div>

        <Button
          onClick={handleContinue}
          size="lg"
          className="w-full rounded-full h-14 text-base font-medium"
          disabled={loading}
        >
          {loading ? "Setting up..." : "Continue to Dashboard"}
        </Button>
      </div>
    </div>
  );
};

export default WaterPreview;
