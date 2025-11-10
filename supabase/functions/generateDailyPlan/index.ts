import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating daily plan for user:', user.id);

    // Fetch user profile with detailed logging
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ 
          error: 'Profile not found',
          details: profileError.message,
          user_id: user.id 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile) {
      console.error('No profile data returned for user:', user.id);
      return new Response(
        JSON.stringify({ 
          error: 'Profile not found',
          user_id: user.id 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Profile found for user:', user.id, 'workout_mode:', profile.workout_mode);

    const today = new Date().toISOString().split('T')[0];

    // Check if plan already exists for today
    const { data: existingPlan } = await supabase
      .from('daily_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_date', today)
      .maybeSingle();

    if (existingPlan) {
      console.log('Plan already exists for today');
      return new Response(
        JSON.stringify(existingPlan),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Select exercise based on workout mode
    const exerciseTable = profile.workout_mode === 'home' ? 'exercises_home' : 'exercises_gym';
    const { data: exercises, error: exerciseError } = await supabase
      .from(exerciseTable)
      .select('*')
      .limit(50);

    if (exerciseError || !exercises || exercises.length === 0) {
      console.error('Exercise fetch error:', exerciseError);
      return new Response(
        JSON.stringify({ error: 'No exercises available' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const randomExercise = exercises[Math.floor(Math.random() * exercises.length)];

    // Select meal
    let mealsQuery = supabase.from('meals').select('*');
    if (profile.goal === 'gain_muscle') {
      mealsQuery = mealsQuery.eq('protein_focused', true);
    }
    
    const { data: meals, error: mealError } = await mealsQuery.limit(50);

    if (mealError || !meals || meals.length === 0) {
      console.error('Meal fetch error:', mealError);
      return new Response(
        JSON.stringify({ error: 'No meals available' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const randomMeal = meals[Math.floor(Math.random() * meals.length)];

    // Select yoga based on goal intensity
    const intensityMap: Record<string, string[]> = {
      lose_weight: ['low', 'medium'],
      gain_muscle: ['medium', 'high'],
      maintain: ['low', 'medium'],
    };
    const allowedIntensities = intensityMap[profile.goal] || ['low'];
    
    const { data: yogaSessions, error: yogaError } = await supabase
      .from('yoga_sessions')
      .select('*')
      .in('intensity_level', allowedIntensities)
      .limit(50);

    if (yogaError || !yogaSessions || yogaSessions.length === 0) {
      console.error('Yoga fetch error:', yogaError);
      return new Response(
        JSON.stringify({ error: 'No yoga sessions available' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const randomYoga = yogaSessions[Math.floor(Math.random() * yogaSessions.length)];

    // Calculate targets
    const weightNum = profile.weight;
    const heightNum = profile.height;
    const ageNum = profile.age;
    const targetWeightNum = profile.target_weight_kg;
    
    let bmr;
    if (profile.gender === 'male') {
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
    } else {
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
    }
    
    const activityFactor = profile.workout_mode === 'home' ? 1.45 : 1.55;
    const tdee = bmr * activityFactor;
    
    const calorie_target = Math.round(tdee - 350);
    const protein_target_g = Math.round(targetWeightNum * 2);
    const daily_water_target_liters = Math.round(weightNum * 0.033 * 10) / 10;

    // Insert daily plan
    const { data: newPlan, error: insertError } = await supabase
      .from('daily_plans')
      .insert({
        user_id: user.id,
        plan_date: today,
        exercise_title: randomExercise.title,
        exercise_instructions: randomExercise.instructions,
        reps_or_duration: randomExercise.reps_or_duration,
        meal_title: randomMeal.title,
        meal_instructions: randomMeal.instructions,
        meal_ingredients: randomMeal.ingredients,
        meal_calories_estimate: randomMeal.calories || 0,
        yoga_title: randomYoga.title,
        yoga_instructions: randomYoga.instructions,
        yoga_duration_minutes: randomYoga.duration_minutes,
        daily_water_target_liters,
        calorie_target,
        protein_target_g,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create plan' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Daily plan created successfully');

    return new Response(
      JSON.stringify(newPlan),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating daily plan:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
