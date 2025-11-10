import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Profile {
  weight: number;
  goal: 'lose_weight' | 'gain_muscle' | 'maintain';
  workout_mode: 'home' | 'gym';
}

interface Exercise {
  title: string;
  instructions: string;
  reps_or_duration: string;
}

interface Meal {
  title: string;
  instructions: string;
}

interface YogaSession {
  title: string;
  instructions: string;
  duration_minutes: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('User authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating daily plan for user:', user.id);

    // 1. Fetch user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('weight, goal, workout_mode')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found. Please complete onboarding first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const typedProfile = profile as Profile;
    console.log('User profile:', typedProfile);

    // 2. Select exercise based on workout_mode
    const exerciseTable = typedProfile.workout_mode === 'home' ? 'exercises_home' : 'exercises_gym';
    const { data: exercises, error: exerciseError } = await supabaseClient
      .from(exerciseTable)
      .select('title, instructions, reps_or_duration');

    if (exerciseError || !exercises || exercises.length === 0) {
      console.error('Exercise fetch error:', exerciseError);
      return new Response(
        JSON.stringify({ error: 'No exercises found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pick random exercise
    const selectedExercise = exercises[Math.floor(Math.random() * exercises.length)] as Exercise;
    console.log('Selected exercise:', selectedExercise.title);

    // 3. Select meal based on goal
    let mealQuery = supabaseClient.from('meals').select('title, instructions');
    
    if (typedProfile.goal === 'gain_muscle') {
      mealQuery = mealQuery.eq('protein_focused', true);
    }

    const { data: meals, error: mealError } = await mealQuery;

    if (mealError || !meals || meals.length === 0) {
      console.error('Meal fetch error:', mealError);
      return new Response(
        JSON.stringify({ error: 'No meals found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pick random meal
    const selectedMeal = meals[Math.floor(Math.random() * meals.length)] as Meal;
    console.log('Selected meal:', selectedMeal.title);

    // 4. Select yoga session based on goal
    let yogaIntensities: string[] = [];
    
    if (typedProfile.goal === 'lose_weight') {
      yogaIntensities = ['medium', 'high'];
    } else if (typedProfile.goal === 'gain_muscle') {
      yogaIntensities = ['medium', 'high'];
    } else {
      yogaIntensities = ['low', 'medium'];
    }

    const { data: yogaSessions, error: yogaError } = await supabaseClient
      .from('yoga_sessions')
      .select('title, instructions, duration_minutes')
      .in('intensity_level', yogaIntensities);

    if (yogaError || !yogaSessions || yogaSessions.length === 0) {
      console.error('Yoga fetch error:', yogaError);
      return new Response(
        JSON.stringify({ error: 'No yoga sessions found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pick random yoga session
    const selectedYoga = yogaSessions[Math.floor(Math.random() * yogaSessions.length)] as YogaSession;
    console.log('Selected yoga:', selectedYoga.title);

    // 5. Calculate daily water target
    const dailyWaterTarget = Math.round(typedProfile.weight * 0.033 * 10) / 10;
    console.log('Daily water target:', dailyWaterTarget);

    // 6. Insert or update daily_plans
    const today = new Date().toISOString().split('T')[0];
    
    const planData = {
      user_id: user.id,
      plan_date: today,
      exercise_title: selectedExercise.title,
      exercise_instructions: selectedExercise.instructions,
      reps_or_duration: selectedExercise.reps_or_duration,
      meal_title: selectedMeal.title,
      meal_instructions: selectedMeal.instructions,
      yoga_title: selectedYoga.title,
      yoga_instructions: selectedYoga.instructions,
      yoga_duration_minutes: selectedYoga.duration_minutes,
      daily_water_target_liters: dailyWaterTarget,
    };

    const { data: plan, error: planError } = await supabaseClient
      .from('daily_plans')
      .upsert(planData, { onConflict: 'user_id,plan_date' })
      .select()
      .single();

    if (planError) {
      console.error('Daily plan insert error:', planError);
      return new Response(
        JSON.stringify({ error: 'Failed to create daily plan', details: planError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Daily plan created successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        plan: plan,
        message: 'Daily plan generated successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});