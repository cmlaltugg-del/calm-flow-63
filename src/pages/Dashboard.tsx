import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Loader2, Lock, Target, Flame, Beef, Droplets } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SignupModal } from "@/components/SignupModal";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [waterIntake, setWaterIntake] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dailyPlan, setDailyPlan] = useState<any>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [signupCardSource, setSignupCardSource] = useState<string>('');
  const [profile, setProfile] = useState<any>(null);

  const dailyWaterTarget = dailyPlan?.daily_water_target_liters || 2.5;
  const waterProgress = (waterIntake / dailyWaterTarget) * 100;

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      // Authenticated user - fetch real plan
      fetchDailyPlan();
    } else {
      // Check if onboarding is complete
      const onboardingComplete = sessionStorage.getItem('onboardingComplete');
      
      if (!onboardingComplete) {
        // Redirect to onboarding
        navigate('/onboarding/height-weight');
      } else {
        // Generate preview plan
        generatePreviewPlan();
      }
    }
  }, [user, authLoading]);

  const fetchDailyPlan = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setProfile(profileData);
      }
      
      // Fetch daily plan
      const { data, error } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', user!.id)
        .eq('plan_date', today)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        await generateNewPlan();
      } else {
        setDailyPlan(data);
        setIsPreview(false);
      }
    } catch (error) {
      console.error('Error fetching daily plan:', error);
      toast({
        title: "Error",
        description: "Failed to load your daily plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNewPlan = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generateDailyPlan');
      
      if (error) throw error;
      
      await fetchDailyPlan();
    } catch (error) {
      console.error('Error generating plan:', error);
      toast({
        title: "Error",
        description: "We couldn't prepare your personal plan — contact support.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const generatePreviewPlan = async () => {
    try {
      setLoading(true);
      console.log('preview_shown');
      
      const height = sessionStorage.getItem('height');
      const weight = sessionStorage.getItem('weight');
      const goal = sessionStorage.getItem('goal');
      const workoutMode = sessionStorage.getItem('workoutMode');

      const gender = sessionStorage.getItem('gender');
      const targetWeight = sessionStorage.getItem('targetWeight');
      const age = sessionStorage.getItem('age');

      const { data, error } = await supabase.functions.invoke('generatePreviewPlan', {
        body: {
          profile: {
            height: parseFloat(height || '170'),
            weight: parseFloat(weight || '70'),
            gender: gender || 'male',
            target_weight_kg: parseFloat(targetWeight || '70'),
            age: parseInt(age || '30'),
            goal: goal || 'maintain',
            workout_mode: workoutMode || 'home'
          }
        }
      });

      if (error) throw error;

      setDailyPlan(data);
      setIsPreview(true);
    } catch (error) {
      console.error('Error generating preview plan:', error);
      toast({
        title: "Error",
        description: "Couldn't prepare your preview — try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addWater = () => {
    setWaterIntake(prev => Math.min(prev + 0.25, dailyWaterTarget));
  };

  const handleUnlock = (cardName: string) => {
    console.log('unlock_modal_opened', { which_card: cardName });
    setSignupCardSource(cardName);
    setSignupModalOpen(true);
  };

  const handleSignupSuccess = () => {
    // Reload to fetch real plan
    window.location.reload();
  };

  const getFirstInstruction = (instructions: string | null) => {
    if (!instructions) return '';
    const lines = instructions.split('\n').filter(line => line.trim());
    return lines[0] || '';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const todayExercise = dailyPlan ? {
    title: dailyPlan.exercise_title,
    duration: dailyPlan.reps_or_duration,
    instructions: dailyPlan.exercise_instructions,
    planId: dailyPlan.id
  } : null;

  const todayMeal = dailyPlan ? {
    title: dailyPlan.meal_title,
    instructions: dailyPlan.meal_instructions,
    ingredients: dailyPlan.meal_ingredients,
    calories: dailyPlan.meal_calories_estimate,
    planId: dailyPlan.id
  } : null;

  const todayYoga = dailyPlan ? {
    title: dailyPlan.yoga_title,
    duration: `${dailyPlan.yoga_duration_minutes} min`,
    instructions: dailyPlan.yoga_instructions,
    planId: dailyPlan.id
  } : null;

  // Calculate progress based on completed tasks
  const completedTasks = isPreview ? 0 : (
    (dailyPlan?.is_completed_exercise ? 1 : 0) +
    (dailyPlan?.is_completed_yoga ? 1 : 0) +
    (dailyPlan?.is_completed_meal ? 1 : 0)
  );
  const totalTasks = 3;
  const progressPercentage = isPreview ? 25 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Greeting */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}
          </h1>
          <p className="text-muted-foreground">
            {isPreview ? "Here's a preview of your personalized plan" : "Here's your personalized plan for today"}
          </p>
        </div>

        {/* Daily Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overall</span>
              <span className="text-sm font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} />
            {!isPreview && (
              <p className="text-xs text-muted-foreground">
                {completedTasks} of {totalTasks} tasks completed
              </p>
            )}
          </CardContent>
        </Card>

        {/* Targets Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Your Targets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Target className="h-4 w-4" />
                  <span>Target Weight</span>
                </div>
                <p className="text-2xl font-bold">
                  {(isPreview ? sessionStorage.getItem('targetWeight') : profile?.target_weight_kg) || '—'} kg
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Flame className="h-4 w-4" />
                  <span>Daily Calories</span>
                </div>
                <p className="text-2xl font-bold">
                  {(isPreview ? dailyPlan?.calorie_target : profile?.daily_calories) || '—'} kcal
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Beef className="h-4 w-4" />
                  <span>Protein Target</span>
                </div>
                <p className="text-2xl font-bold">
                  {(isPreview ? dailyPlan?.protein_target_g : profile?.protein_target) || '—'} g
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Droplets className="h-4 w-4" />
                  <span>Water Target</span>
                </div>
                <p className="text-2xl font-bold">
                  {dailyWaterTarget} L
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Exercise */}
        {todayExercise && (
          <Card className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Today's Exercise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{todayExercise.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{todayExercise.duration}</p>
                {isPreview && (
                  <p className="text-sm text-muted-foreground">
                    {getFirstInstruction(todayExercise.instructions)}
                  </p>
                )}
              </div>
              {!isPreview ? (
                <Button 
                  className="w-full"
                  onClick={() => navigate('/exercise-detail', { 
                    state: { 
                      title: todayExercise.title, 
                      duration: todayExercise.duration,
                      instructions: todayExercise.instructions,
                      planId: todayExercise.planId
                    } 
                  })}
                  disabled={dailyPlan?.is_completed_exercise}
                >
                  {dailyPlan?.is_completed_exercise ? 'Completed ✓' : 'Start Exercise'}
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="h-px bg-border" />
                  <p className="text-xs text-muted-foreground italic">
                    Full workout details available after signup
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Today's Yoga - LOCKED */}
        {todayYoga && (
          <Card className="relative overflow-hidden">
            {isPreview && (
              <>
                <div className="absolute top-3 right-3 z-10 bg-background/90 backdrop-blur-sm rounded-full p-1.5 border border-border">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50 z-[5]" />
              </>
            )}
            <div className={isPreview ? "filter blur-[4px] opacity-95" : ""}>
              <CardHeader>
                <CardTitle>Today's Yoga</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{todayYoga.title}</h3>
                  <p className="text-sm text-muted-foreground">{todayYoga.duration}</p>
                </div>
                <Button 
                  className="w-full" 
                  disabled={isPreview || dailyPlan?.is_completed_yoga}
                  onClick={() => !isPreview && navigate('/yoga-detail', {
                    state: {
                      title: todayYoga.title,
                      duration: todayYoga.duration,
                      instructions: todayYoga.instructions,
                      planId: todayYoga.planId
                    }
                  })}
                >
                  {!isPreview && dailyPlan?.is_completed_yoga ? 'Completed ✓' : 'Start Yoga'}
                </Button>
              </CardContent>
            </div>
            {isPreview && (
              <div className="absolute bottom-3 right-3 z-10">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary/10"
                  onClick={() => handleUnlock('yoga')}
                >
                  Unlock with free account
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Water Intake - UNLOCKED */}
        <Card>
          <CardHeader>
            <CardTitle>Water Intake</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Target</span>
              <span className="text-sm font-medium">{dailyWaterTarget}L</span>
            </div>
            <Progress value={waterProgress} />
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{waterIntake.toFixed(2)}L</span>
              <Button onClick={addWater} size="sm">
                +0.25L
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Today's Meal - LOCKED */}
        {todayMeal && (
          <Card className="relative overflow-hidden">
            {isPreview && (
              <>
                <div className="absolute top-3 right-3 z-10 bg-background/90 backdrop-blur-sm rounded-full p-1.5 border border-border">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50 z-[5]" />
              </>
            )}
            <div className={isPreview ? "filter blur-[4px] opacity-95" : ""}>
              <CardHeader>
                <CardTitle>Today's Meal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{todayMeal.title}</h3>
                </div>
                <Button 
                  className="w-full"
                  disabled={isPreview || dailyPlan?.is_completed_meal}
                  onClick={() => !isPreview && navigate('/meal-detail', {
                    state: {
                      title: todayMeal.title,
                      instructions: todayMeal.instructions,
                      ingredients: todayMeal.ingredients,
                      calories: todayMeal.calories,
                      planId: todayMeal.planId
                    }
                  })}
                >
                  {!isPreview && dailyPlan?.is_completed_meal ? 'Completed ✓' : 'View Meal'}
                </Button>
              </CardContent>
            </div>
            {isPreview && (
              <div className="absolute bottom-3 right-3 z-10">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary/10"
                  onClick={() => handleUnlock('meal')}
                >
                  Unlock with free account
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>

      <SignupModal 
        open={signupModalOpen}
        onOpenChange={setSignupModalOpen}
        onSignupSuccess={handleSignupSuccess}
        cardSource={signupCardSource}
      />
    </div>
  );
};

export default Dashboard;
