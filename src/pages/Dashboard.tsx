import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Activity, Droplet, Utensils, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const [waterIntake, setWaterIntake] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dailyPlan, setDailyPlan] = useState<any>(null);
  const { toast } = useToast();
  const userName = "Friend";
  const weight = localStorage.getItem("userWeight") || "70";
  const dailyWaterTarget = dailyPlan?.daily_water_target_liters || Math.round(parseInt(weight) * 0.033 * 10) / 10;
  const waterProgress = Math.min((waterIntake / dailyWaterTarget) * 100, 100);

  const todayExercise = {
    title: dailyPlan?.exercise_title || "Morning Stretch",
    duration: dailyPlan?.reps_or_duration || "15 minutes",
    instructions: dailyPlan?.exercise_instructions || "",
  };

  const todayMeal = {
    title: dailyPlan?.meal_title || "Protein Bowl",
    instructions: dailyPlan?.meal_instructions || "",
  };

  const todayYoga = {
    title: dailyPlan?.yoga_title || "Gentle Stretch Flow",
    duration: dailyPlan?.yoga_duration_minutes ? `${dailyPlan.yoga_duration_minutes} minutes` : "10 minutes",
    instructions: dailyPlan?.yoga_instructions || "",
  };

  useEffect(() => {
    fetchDailyPlan();
  }, []);

  const fetchDailyPlan = async () => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      // Fetch daily plan for today
      const { data, error } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_date', today)
        .maybeSingle();

      if (error) {
        console.error('Error fetching daily plan:', error);
        throw error;
      }

      if (!data) {
        // No plan exists for today - generate one
        console.log('No plan found for today, generating...');
        await generateNewPlan();
      } else {
        setDailyPlan(data);
      }
    } catch (error) {
      console.error('Error in fetchDailyPlan:', error);
      toast({
        title: "Error",
        description: "Failed to load your daily plan.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNewPlan = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generateDailyPlan');

      if (error) {
        console.error('Error generating plan:', error);
        throw error;
      }

      // Refetch the plan after generation
      await fetchDailyPlan();
    } catch (error) {
      console.error('Error generating new plan:', error);
    }
  };

  const addWater = () => {
    setWaterIntake((prev) => Math.min(prev + 0.25, dailyWaterTarget));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Greeting */}
        <div className="space-y-1">
          <h1 className="text-3xl font-light text-foreground">Hi 👋</h1>
          <p className="text-muted-foreground font-light">{userName}</p>
        </div>

        {/* Daily Progress Ring */}
        <Card className="p-6 rounded-3xl shadow-wellness border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PieChart className="h-6 w-6 text-[#4A4A4A]" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Daily Progress</p>
                <p className="text-2xl font-light">45%</p>
              </div>
            </div>
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-wellness-progress"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray="226"
                  strokeDashoffset="102"
                  strokeLinecap="round"
                  className="text-primary"
                />
              </svg>
            </div>
          </div>
        </Card>

        {/* Exercise Card */}
        <Card className="p-6 rounded-3xl shadow-wellness border-border/50 space-y-4">
          <div className="flex items-start gap-3">
            <Activity className="h-6 w-6 text-[#4A4A4A] mt-1" />
            <div className="flex-1 space-y-1">
              <p className="text-sm text-muted-foreground">Today's Exercise</p>
              <h3 className="text-xl font-medium">{todayExercise.title}</h3>
              <p className="text-muted-foreground">{todayExercise.duration}</p>
            </div>
          </div>
          <Button 
            className="w-full rounded-full h-12"
            onClick={() => navigate("/exercise-detail", { 
              state: { 
                title: todayExercise.title, 
                instructions: todayExercise.instructions,
                duration: todayExercise.duration 
              } 
            })}
          >
            Start
          </Button>
        </Card>

        {/* Yoga Card */}
        <Card className="p-6 rounded-3xl shadow-wellness border-border/50 space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-[#4A4A4A]" />
            <div className="flex-1 space-y-1">
              <p className="text-sm text-muted-foreground">Today's Yoga</p>
              <h3 className="text-xl font-medium">{todayYoga.title}</h3>
              <p className="text-muted-foreground">{todayYoga.duration}</p>
            </div>
          </div>
          <Button 
            className="w-full rounded-full h-12"
            onClick={() => navigate("/yoga-detail", { 
              state: { 
                title: todayYoga.title, 
                instructions: todayYoga.instructions,
                duration: todayYoga.duration 
              } 
            })}
          >
            Start Yoga
          </Button>
        </Card>

        {/* Water Tracker */}
        <Card className="p-6 rounded-3xl shadow-wellness border-border/50 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplet className="h-6 w-6 text-primary" />
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Water Intake</p>
                  <p className="text-lg font-medium">
                    {waterIntake.toFixed(2)}L / {dailyWaterTarget}L
                  </p>
                </div>
              </div>
            </div>
            <Progress value={waterProgress} className="h-2" />
          </div>
          <Button
            onClick={addWater}
            variant="outline"
            className="w-full rounded-full h-12"
            disabled={waterIntake >= dailyWaterTarget}
          >
            + 0.25L
          </Button>
        </Card>

        {/* Meal Card */}
        <Card className="p-6 rounded-3xl shadow-wellness border-border/50 space-y-4">
          <div className="flex items-center gap-3">
            <Utensils className="h-6 w-6 text-[#4A4A4A]" />
            <div className="flex-1 space-y-1">
              <p className="text-sm text-muted-foreground">Today's Meal</p>
              <h3 className="text-xl font-medium">{todayMeal.title}</h3>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full rounded-full h-12"
            onClick={() => navigate("/meal-detail", { 
              state: { 
                title: todayMeal.title, 
                instructions: todayMeal.instructions 
              } 
            })}
          >
            View Meal
          </Button>
        </Card>

        {/* Footer Message */}
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground font-light italic">
            One small step is enough today.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
