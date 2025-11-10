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

    const weight = profile.weight || 70;
    const height = profile.height || 170;
    const age = profile.age || 30;
    const gender = profile.gender || 'male';
    const targetWeight = profile.target_weight_kg || weight;
    const goal = profile.goal || 'maintain';
    const workout_mode = profile.workout_mode || 'home';

    // Calculate BMR
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity factor and TDEE
    const activityFactor = workout_mode === 'gym' ? 1.55 : 1.45;
    const tdee = Math.round(bmr * activityFactor);

    // Calorie target based on goal
    let calorieTarget;
    if (goal === 'lose_weight') {
      calorieTarget = tdee - 500;
    } else if (goal === 'gain_muscle') {
      calorieTarget = tdee + 250;
    } else {
      calorieTarget = tdee;
    }
    calorieTarget = Math.max(calorieTarget, 1200);

    // Protein target
    const proteinTarget = Math.round(1.8 * targetWeight);

    // Calculate water target
    const dailyWaterTarget = (weight * 0.033).toFixed(1);

    const plan = {
      exercise_title: randomExercise.title,
      exercise_instructions: randomExercise.instructions,
      reps_or_duration: randomExercise.reps_or_duration,
      meal_title: randomMeal.title,
      meal_instructions: randomMeal.instructions,
      meal_ingredients: randomMeal.ingredients || null,
      meal_calories_estimate: randomMeal.calories || null,
      yoga_title: randomYoga.title,
      yoga_instructions: randomYoga.instructions,
      yoga_duration_minutes: randomYoga.duration_minutes,
      daily_water_target_liters: parseFloat(dailyWaterTarget),
      calorie_target: calorieTarget,
      protein_target_g: proteinTarget,
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
