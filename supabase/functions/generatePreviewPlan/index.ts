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
    const { profile } = await req.json();
    
    if (!profile || !profile.weight || !profile.goal || !profile.workout_mode) {
      return new Response(
        JSON.stringify({ error: 'Missing required profile data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Select exercise based on workout mode
    const exerciseTable = profile.workout_mode === 'home' ? 'exercises_home' : 'exercises_gym';
    const { data: exercises, error: exerciseError } = await supabase
      .from(exerciseTable)
      .select('*');

    if (exerciseError) throw exerciseError;

    const randomExercise = exercises[Math.floor(Math.random() * exercises.length)];

    // Select meal (protein-focused if goal is gain_muscle)
    let mealQuery = supabase.from('meals').select('*');
    
    if (profile.goal === 'gain_muscle') {
      mealQuery = mealQuery.eq('protein_focused', true);
    }

    const { data: meals, error: mealError } = await mealQuery;
    if (mealError) throw mealError;

    const randomMeal = meals[Math.floor(Math.random() * meals.length)];

    // Select yoga session based on intensity
    const intensityLevels = profile.goal === 'lose_weight' 
      ? ['moderate', 'high']
      : profile.goal === 'gain_muscle'
      ? ['low', 'moderate']
      : ['low', 'moderate', 'high'];

    const { data: yogaSessions, error: yogaError } = await supabase
      .from('yoga_sessions')
      .select('*')
      .in('intensity_level', intensityLevels);

    if (yogaError) throw yogaError;

    const randomYoga = yogaSessions[Math.floor(Math.random() * yogaSessions.length)];

    // Calculate water target
    const dailyWaterTarget = (profile.weight * 0.033).toFixed(1);

    const plan = {
      exercise_title: randomExercise.title,
      exercise_instructions: randomExercise.instructions,
      reps_or_duration: randomExercise.reps_or_duration,
      meal_title: randomMeal.title,
      meal_instructions: randomMeal.instructions,
      yoga_title: randomYoga.title,
      yoga_instructions: randomYoga.instructions,
      yoga_duration_minutes: randomYoga.duration_minutes,
      daily_water_target_liters: parseFloat(dailyWaterTarget)
    };

    console.log('Generated preview plan:', plan);

    return new Response(
      JSON.stringify(plan),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating preview plan:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
