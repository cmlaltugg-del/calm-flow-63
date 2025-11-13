import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Loader2, Lock, Target, Flame, Beef, Droplets, Home, User, Settings, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SignupModal } from "@/components/SignupModal";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StreakCounter } from "@/components/StreakCounter";
import { DailyProgressCard } from "@/components/DailyProgressCard";
import { WeeklySummaryCard } from "@/components/WeeklySummaryCard";
import { WaterProgressBar } from "@/components/WaterProgressBar";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { getTimeBasedGreeting, getMotivationalMessage } from "@/lib/greetings";
import { triggerStreakCelebration } from "@/lib/celebration";
import PullToRefresh from "@/components/PullToRefresh";
import { triggerHaptic } from "@/lib/haptics";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [waterIntake, setWaterIntake] = useState(0);
  const [waterLoading, setWaterLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dailyPlan, setDailyPlan] = useState<any>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [signupCardSource, setSignupCardSource] = useState<string>('');
  const [profile, setProfile] = useState<any>(null);
  const [weeklyStats, setWeeklyStats] = useState({ workouts: 0, calories: 0, goalPercentage: 0 });

  const dailyWaterTarget = dailyPlan?.daily_water_target_liters || 2.5;

  useEffect(() => {
    if (authLoading) return;
    const onboardingComplete = sessionStorage.getItem('onboardingComplete');
    if (user) {
      fetchDailyPlan();
      fetchWeeklyStats();
    } else if (onboardingComplete === 'true') {
      generatePreviewPlan();
    } else {
      navigate('/onboarding/height-weight');
    }
  }, [user, authLoading, navigate]);

  const fetchWeeklyStats = async () => {
    if (!user) return;
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data } = await (supabase as any).from('workout_history').select('calories_burned').eq('user_id', user.id).gte('completed_at', sevenDaysAgo.toISOString());
      const totalWorkouts = data?.length || 0;
      const totalCalories = data?.reduce((sum: number, w: any) => sum + (w.calories_burned || 0), 0) || 0;
      setWeeklyStats({ workouts: totalWorkouts, calories: totalCalories, goalPercentage: Math.min(Math.round((totalWorkouts / 7) * 100), 100) });
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
    }
  };

  const fetchDailyPlan = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch profile - it should exist by now
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast({
          title: "Connection Issue",
          description: "Unable to load your profile. Check your connection and refresh.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Initialize water intake from profile
      if (profileData) {
        const today = new Date().toISOString().split('T')[0];
        const lastUpdate = (profileData as any).last_water_update_date;
        
        // Reset water intake if it's a new day
        if (lastUpdate !== today) {
          await (supabase as any)
            .from('profiles')
            .update({ 
              water_intake_today: 0, 
              last_water_update_date: today 
            })
            .eq('user_id', user!.id);
          setWaterIntake(0);
        } else {
          setWaterIntake((profileData as any).water_intake_today || 0);
        }
      }

      if (!profileData) {
        // Try to create the profile from onboarding data if available
        const height = sessionStorage.getItem('height');
        const weight = sessionStorage.getItem('weight');
        const gender = sessionStorage.getItem('gender');
        const targetWeight = sessionStorage.getItem('targetWeight');
        const age = sessionStorage.getItem('age');
        const goal = sessionStorage.getItem('goal');
        const workoutMode = sessionStorage.getItem('workoutMode');

        if (height && weight && gender && targetWeight && age && goal && workoutMode) {
          const weightNum = parseFloat(weight);
          const heightNum = parseFloat(height);
          const ageNum = parseInt(age);
          const targetWeightNum = parseFloat(targetWeight);
          const trainingStylesStr = sessionStorage.getItem('trainingStyles');
          const intensity = sessionStorage.getItem('intensity');
          const trainingStyles = trainingStylesStr ? JSON.parse(trainingStylesStr) : [];
          const hasGym = trainingStyles.includes('gym');

          // Prepare profile data
          const profileDataToInsert: any = {
            user_id: user!.id,
            training_styles: trainingStyles,
          };

          // Only add gym-related data if gym is selected
          if (hasGym) {
            // Calculate targets
            let bmr;
            if (gender === 'male') {
              bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
            } else {
              bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
            }
            const activityFactor = workoutMode === 'home' ? 1.45 : 1.55;
            const tdee = bmr * activityFactor;
            const daily_calories = Math.round(tdee - 350);
            const protein_target = Math.round(targetWeightNum * 2);

            profileDataToInsert.height = heightNum;
            profileDataToInsert.weight = weightNum;
            profileDataToInsert.gender = gender;
            profileDataToInsert.target_weight_kg = targetWeightNum;
            profileDataToInsert.age = ageNum;
            profileDataToInsert.goal = goal;
            profileDataToInsert.workout_mode = workoutMode;
            profileDataToInsert.daily_calories = daily_calories;
            profileDataToInsert.protein_target = protein_target;
          } else {
            profileDataToInsert.intensity = intensity;
          }

          const { data: createdProfile, error: createErr } = await supabase
            .from('profiles')
            .upsert(profileDataToInsert, { onConflict: 'user_id' })
            .select()
            .single();

          if (createErr || !createdProfile) {
            console.error('Failed to create profile from onboarding data:', createErr);
            toast({
              title: 'Error creating profile',
              description: 'Please redo onboarding.',
              variant: 'destructive',
            });
            navigate('/onboarding/height-weight');
            return;
          }

          setProfile(createdProfile);
          // Now generate a plan
          await generateNewPlan();
          return;
        }

        console.log('No profile and no onboarding data, redirecting to onboarding');
        toast({
          title: 'Profile not found',
          description: 'Please complete onboarding first.',
          variant: 'destructive',
        });
        navigate('/onboarding/height-weight');
        return;
      }

      setProfile(profileData);
      
      console.log('Profile training styles:', profileData.training_styles);
      
      // Fetch daily plan
      const { data, error } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', user!.id)
        .eq('plan_date', today)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        console.log('No daily plan found for today, generating new plan...');
        await generateNewPlan();
      } else {
        console.log('Daily plan loaded:', {
          has_yoga: !!data.yoga_title,
          has_pilates: !!data.pilates_title,
          yoga_title: data.yoga_title,
          pilates_title: data.pilates_title,
          calorie_target: data.calorie_target,
          protein_target_g: data.protein_target_g
        });
        
        // If targets are missing, regenerate to patch them
        if (data.calorie_target === null || data.protein_target_g === null) {
          console.log('Targets missing, regenerating plan to patch');
          await generateNewPlan();
        } else {
          setDailyPlan(data);
          setIsPreview(false);
        }
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
      console.log('Invoking generateDailyPlan edge function...');
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('generateDailyPlan');
      
      if (error) {
        console.error('generateDailyPlan error:', error);
        throw error;
      }
      
      console.log('Plan generated successfully:', data);
      
      // Set the plan data directly from the response for immediate display
      if (data) {
        setDailyPlan(data);
        setIsPreview(false);
        toast({
          title: "Plan Generated",
          description: "Your personalized workout plan is ready!",
        });
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      toast({
        title: "Error",
        description: "We couldn't prepare your personal plan — contact support.",
        variant: "destructive",
      });
    } finally {
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

      const trainingStylesStr = sessionStorage.getItem('trainingStyles');
      const intensity = sessionStorage.getItem('intensity');
      const trainingStyles = trainingStylesStr ? JSON.parse(trainingStylesStr) : [];

      const { data, error } = await supabase.functions.invoke('generatePreviewPlan', {
        body: {
          profile: {
            height: parseFloat(height || '170'),
            weight: parseFloat(weight || '70'),
            gender: gender || 'male',
            target_weight_kg: parseFloat(targetWeight || '70'),
            age: parseInt(age || '30'),
            goal: goal || 'maintain',
            workout_mode: workoutMode || 'home',
            training_styles: trainingStyles,
            intensity: intensity || 'medium'
          }
        }
      });

      if (error) throw error;

      setDailyPlan(data);
      setIsPreview(true);
      console.log('Preview plan loaded:', {
        has_yoga: !!data.yoga_title,
        has_pilates: !!data.pilates_title,
        yoga_title: data.yoga_title,
        pilates_title: data.pilates_title,
        training_styles: trainingStyles
      });
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

  const addWater = async () => {
    if (!user || waterLoading) return;
    
    const newAmount = Math.min(waterIntake + 0.25, dailyWaterTarget);
    setWaterIntake(newAmount);
    setWaterLoading(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ 
          water_intake_today: newAmount,
          last_water_update_date: today
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating water intake:', error);
      toast({
        title: "Error",
        description: "Failed to save water intake",
        variant: "destructive",
      });
      // Revert on error
      setWaterIntake(prev => Math.max(prev - 0.25, 0));
    } finally {
      setWaterLoading(false);
    }
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
      <div className="min-h-screen bg-background p-6 pb-24 max-w-2xl mx-auto">
        <DashboardSkeleton />
      </div>
    );
  }

  const todayExercise = dailyPlan && dailyPlan.exercise_title && dailyPlan.exercise_title !== 'No Exercise' ? {
    title: dailyPlan.exercise_title,
    duration: dailyPlan.reps_or_duration,
    instructions: dailyPlan.exercise_instructions,
    planId: dailyPlan.id,
    exercises: dailyPlan.exercises_json || [],
    totalCalories: dailyPlan.total_exercise_calories || 0
  } : null;

  const todayMeal = dailyPlan && dailyPlan.meal_title && dailyPlan.meal_title !== 'No Meal Plan' ? {
    title: dailyPlan.meal_title,
    instructions: dailyPlan.meal_instructions,
    ingredients: dailyPlan.meal_ingredients,
    calories: dailyPlan.meal_calories_estimate,
    planId: dailyPlan.id
  } : null;

  const todayYoga = dailyPlan && dailyPlan.yoga_title && dailyPlan.yoga_title !== 'No Yoga' && dailyPlan.yoga_duration_minutes ? {
    title: dailyPlan.yoga_title,
    duration: `${dailyPlan.yoga_duration_minutes} min`,
    instructions: dailyPlan.yoga_instructions,
    planId: dailyPlan.id,
    poses: dailyPlan.yoga_poses_json || []
  } : null;

  const todayPilates = dailyPlan && dailyPlan.pilates_title && dailyPlan.pilates_title !== 'No Pilates' && dailyPlan.pilates_duration_minutes ? {
    title: dailyPlan.pilates_title,
    duration: `${dailyPlan.pilates_duration_minutes} min`,
    instructions: dailyPlan.pilates_instructions,
    planId: dailyPlan.id,
    exercises: dailyPlan.pilates_exercises_json || []
  } : null;

  // Check user's training styles (preview uses session storage)
  const trainingStyles = isPreview
    ? (JSON.parse(sessionStorage.getItem('trainingStyles') || '[]') as string[])
    : (profile?.training_styles || []);
  console.log('Dashboard training styles:', trainingStyles);
  const hasGym = trainingStyles.includes('gym');
  const hasYoga = trainingStyles.includes('yoga');
  const hasPilates = trainingStyles.includes('pilates');

  // Calculate progress based on completed tasks
  const completedTasks = isPreview ? 0 : (
    (dailyPlan?.is_completed_exercise ? 1 : 0) +
    (dailyPlan?.is_completed_yoga ? 1 : 0) +
    (dailyPlan?.is_completed_meal ? 1 : 0)
  );
  const totalTasks = 3;
  const progressPercentage = isPreview ? 25 : Math.round((completedTasks / totalTasks) * 100);

  // Get personalized messages
  const greeting = getTimeBasedGreeting();
  const currentStreak = profile?.current_streak || 0;
  const motivationalMsg = getMotivationalMessage(currentStreak, progressPercentage);

  const handleRefresh = async () => {
    if (user) {
      await Promise.all([fetchDailyPlan(), fetchWeeklyStats()]);
    } else {
      await generatePreviewPlan();
    }
    triggerHaptic("success");
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <TooltipProvider>
        <div className="min-h-screen bg-background p-6 pb-24 max-w-2xl mx-auto space-y-6 animate-fade-in mb-safe">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">{greeting}! 👋</h1>
          <p className="text-muted-foreground text-sm">{motivationalMsg}</p>
          {!isPreview && profile && <StreakCounter currentStreak={currentStreak} longestStreak={profile.longest_streak || 0} />}
        </div>
        <DailyProgressCard 
          completedCount={completedTasks} 
          totalCount={totalTasks} 
          isPreview={isPreview}
          currentStreak={currentStreak}
        />
        {!isPreview && <WeeklySummaryCard weeklyWorkouts={weeklyStats.workouts} weeklyCalories={weeklyStats.calories} weeklyGoalPercentage={weeklyStats.goalPercentage} />}
        <WaterProgressBar waterIntake={waterIntake} dailyTarget={dailyWaterTarget} onAddWater={addWater} loading={waterLoading} isPreview={isPreview} />

        {/* Targets Card - Show for all users with calculated targets */}
        {(dailyPlan?.calorie_target || dailyPlan?.protein_target_g || profile?.daily_calories || profile?.protein_target) && (
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
                    {(dailyPlan?.calorie_target ?? profile?.daily_calories) || '—'} kcal
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Beef className="h-4 w-4" />
                    <span>Protein Target</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {(dailyPlan?.protein_target_g ?? profile?.protein_target) || '—'} g
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
        )}

        {/* Today's Exercise - Show only for gym users */}
        {trainingStyles.includes('gym') && todayExercise && (
          <Card className={`relative transition-all duration-300 ${dailyPlan?.is_completed_exercise ? 'opacity-70' : ''}`}>
            {dailyPlan?.is_completed_exercise && !isPreview && (
              <Badge className="absolute top-3 right-3 z-10 bg-success hover:bg-success text-success-foreground">
                ✓ Completed
              </Badge>
            )}
            {isPreview && (
              <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                <Button onClick={() => handleUnlock('exercise')} size="lg" className="gap-2">
                  <Lock className="h-4 w-4" />
                  Sign Up to Unlock
                </Button>
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Today's Exercise
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help ml-auto" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Complete your strength training exercises to build muscle and increase calorie burn</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{todayExercise.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{todayExercise.duration}</p>
                {todayExercise.totalCalories > 0 && (
                  <Badge variant="secondary">{todayExercise.totalCalories} cal total</Badge>
                )}
              </div>
              
              {/* Render exercises list */}
              {todayExercise.exercises && todayExercise.exercises.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Exercises:</h4>
                  <div className="space-y-2">
                    {todayExercise.exercises.map((exercise: any, index: number) => (
                      <div key={index} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium">{exercise.title}</span>
                          <span className="text-sm text-muted-foreground">{exercise.reps_or_duration}</span>
                        </div>
                        {exercise.instructions && (
                          <p className="text-xs text-muted-foreground mt-1">{getFirstInstruction(exercise.instructions)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {!isPreview && (
                <Button 
                  className="w-full"
                  onClick={() => {
                    triggerHaptic("medium");
                    navigate('/exercise-detail', { 
                      state: { 
                        title: todayExercise.title, 
                        duration: todayExercise.duration,
                        instructions: todayExercise.instructions,
                        planId: todayExercise.planId,
                        exercises: todayExercise.exercises,
                        totalCalories: todayExercise.totalCalories
                      } 
                    });
                  }}
                  disabled={dailyPlan?.is_completed_exercise}
                >
                  {dailyPlan?.is_completed_exercise ? 'Completed ✓' : 'View Full Workout'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Today's Pilates - Show if there's pilates data */}
        {todayPilates && (
          <Card className={`relative overflow-hidden transition-all duration-300 ${dailyPlan?.is_completed_pilates ? 'opacity-70' : ''}`}>
            {dailyPlan?.is_completed_pilates && !isPreview && (
              <Badge className="absolute top-3 right-3 z-10 bg-success hover:bg-success text-success-foreground">
                ✓ Completed
              </Badge>
            )}
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
                <CardTitle className="flex items-center gap-2">
                  Today's Pilates
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help ml-auto" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Improve your core strength, flexibility and posture with targeted pilates movements</p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{todayPilates.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{todayPilates.duration}</p>
                </div>
                
                {/* Render pilates exercises list */}
                {!isPreview && todayPilates.exercises && todayPilates.exercises.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Exercises:</h4>
                    <div className="space-y-2">
                      {todayPilates.exercises.map((exercise: any, index: number) => (
                        <div key={index} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium">{exercise.title}</span>
                            <span className="text-sm text-muted-foreground">{exercise.duration_minutes} min</span>
                          </div>
                          {exercise.instructions && (
                            <p className="text-xs text-muted-foreground mt-1">{getFirstInstruction(exercise.instructions)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <Button 
                  className="w-full" 
                  disabled={isPreview || dailyPlan?.is_completed_pilates}
                  onClick={() => {
                    if (!isPreview) {
                      triggerHaptic("medium");
                      navigate('/pilates-detail', {
                        state: {
                          title: todayPilates.title,
                          duration: todayPilates.duration,
                          instructions: todayPilates.instructions,
                          planId: todayPilates.planId,
                          exercises: todayPilates.exercises
                        }
                      });
                    }
                  }}
                >
                  {!isPreview && dailyPlan?.is_completed_pilates ? 'Completed ✓' : 'View Full Session'}
                </Button>
              </CardContent>
            </div>
            {isPreview && (
              <div className="absolute bottom-3 right-3 z-10">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary/10"
                  onClick={() => handleUnlock('pilates')}
                >
                  Unlock with free account
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Today's Yoga - Show if there's yoga data */}
        {todayYoga && (
          <Card className={`relative overflow-hidden transition-all duration-300 ${dailyPlan?.is_completed_yoga ? 'opacity-70' : ''}`}>
            {dailyPlan?.is_completed_yoga && !isPreview && (
              <Badge className="absolute top-3 right-3 z-10 bg-success hover:bg-success text-success-foreground">
                ✓ Completed
              </Badge>
            )}
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
                <CardTitle className="flex items-center gap-2">
                  Today's Yoga
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help ml-auto" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Enhance flexibility, reduce stress and improve mind-body connection through yoga practice</p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{todayYoga.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{todayYoga.duration}</p>
                </div>
                
                {/* Render yoga poses list */}
                {!isPreview && todayYoga.poses && todayYoga.poses.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Poses:</h4>
                    <div className="space-y-2">
                      {todayYoga.poses.map((pose: any, index: number) => (
                        <div key={index} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium">{pose.title}</span>
                            <span className="text-sm text-muted-foreground">{pose.duration_minutes} min</span>
                          </div>
                          {pose.instructions && (
                            <p className="text-xs text-muted-foreground mt-1">{getFirstInstruction(pose.instructions)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <Button 
                  className="w-full" 
                  disabled={isPreview || dailyPlan?.is_completed_yoga}
                  onClick={() => {
                    if (!isPreview) {
                      triggerHaptic("medium");
                      navigate('/yoga-detail', {
                        state: {
                          title: todayYoga.title,
                          duration: todayYoga.duration,
                          instructions: todayYoga.instructions,
                          planId: todayYoga.planId,
                          poses: todayYoga.poses
                        }
                      });
                    }
                  }}
                >
                  {!isPreview && dailyPlan?.is_completed_yoga ? 'Completed ✓' : 'View Full Session'}
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

        {/* Today's Meal - Show if data exists and user has gym */}
        {todayMeal && (
          <Card className={`relative overflow-hidden transition-all duration-300 ${dailyPlan?.is_completed_meal ? 'opacity-70' : ''}`}>
            {dailyPlan?.is_completed_meal && !isPreview && (
              <Badge className="absolute top-3 right-3 z-10 bg-success hover:bg-success text-success-foreground">
                ✓ Completed
              </Badge>
            )}
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
                <CardTitle className="flex items-center gap-2">
                  Today's Meal
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help ml-auto" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Follow your personalized meal plan to meet your calorie and protein targets</p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{todayMeal.title}</h3>
                </div>
                <Button 
                  className="w-full"
                  disabled={isPreview || dailyPlan?.is_completed_meal}
                  onClick={() => {
                    if (!isPreview) {
                      triggerHaptic("medium");
                      navigate('/meal-detail', {
                        state: {
                          title: todayMeal.title,
                          instructions: todayMeal.instructions,
                          ingredients: todayMeal.ingredients,
                          calories: todayMeal.calories,
                          planId: todayMeal.planId
                        }
                      });
                    }
                  }}
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

        <SignupModal 
          open={signupModalOpen}
          onOpenChange={setSignupModalOpen}
          onSignupSuccess={handleSignupSuccess}
          cardSource={signupCardSource}
        />

        {/* Bottom Navigation */}
        {!isPreview && (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
            <div className="max-w-md mx-auto flex items-center justify-around py-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex flex-col items-center gap-1 text-primary"
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
                className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span className="text-xs">Settings</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
    </PullToRefresh>
  );
};

export default Dashboard;
