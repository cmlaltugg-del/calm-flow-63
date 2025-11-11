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
    
    if (!profile || !profile.weight) {
      return new Response(
        JSON.stringify({ error: 'Missing required profile data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const trainingStyles = profile.training_styles || [];
    const hasGym = trainingStyles.includes('gym');
    const hasYoga = trainingStyles.includes('yoga');
    const hasPilates = trainingStyles.includes('pilates');

    let randomExercise: any = null;
    let randomMeal: any = null;
    let randomYoga: any = null;
    let randomPilates: any = null;

    // CASE 1: Yoga only
    if (hasYoga && !hasGym && !hasPilates) {
      const intensity = profile.intensity || 'medium';
      const { data: yogaSessions, error: yogaError } = await supabase
        .from('yoga_sessions')
        .select('*')
        .eq('intensity_level', intensity)
        .limit(50);

      if (yogaError) throw yogaError;
      if (yogaSessions && yogaSessions.length > 0) {
        randomYoga = yogaSessions[Math.floor(Math.random() * yogaSessions.length)];
      }
    }
    // CASE 2: Pilates only
    else if (hasPilates && !hasGym && !hasYoga) {
      const intensity = profile.intensity || 'medium';
      const levelMap: Record<string, string> = { low: 'beginner', medium: 'intermediate', high: 'advanced' };
      const level = levelMap[intensity];

      const { data: pilatesExercises, error: pilatesError } = await supabase
        .from('pilates_exercises')
        .select('*')
        .eq('level', level)
        .limit(50);

      if (pilatesError) throw pilatesError;
      if (pilatesExercises && pilatesExercises.length > 0) {
        randomPilates = pilatesExercises[Math.floor(Math.random() * pilatesExercises.length)];
      }
    }
    // CASE 3: Gym (with or without yoga/pilates)
    else if (hasGym) {
      const exerciseTable = profile.workout_mode === 'home' ? 'exercises_home' : 'exercises_gym';
      const { data: exercises, error: exerciseError } = await supabase
        .from(exerciseTable)
        .select('*')
        .limit(50);

      if (exerciseError) throw exerciseError;
      if (exercises && exercises.length > 0) {
        randomExercise = exercises[Math.floor(Math.random() * exercises.length)];
      }

      // Meal for gym users
      let mealQuery = supabase.from('meals').select('*');
      if (profile.goal === 'gain_muscle') {
        mealQuery = mealQuery.eq('protein_focused', true);
      }

      const { data: meals, error: mealError } = await mealQuery.limit(50);
      if (mealError) throw mealError;
      if (meals && meals.length > 0) {
        randomMeal = meals[Math.floor(Math.random() * meals.length)];
      }

      // Yoga cooldown for gym users
      if (hasYoga) {
        const { data: yogaSessions, error: yogaError } = await supabase
          .from('yoga_sessions')
          .select('*')
          .gte('duration_minutes', 3)
          .lte('duration_minutes', 5)
          .limit(50);

        if (!yogaError && yogaSessions && yogaSessions.length > 0) {
          randomYoga = yogaSessions[Math.floor(Math.random() * yogaSessions.length)];
        }
      }

      // Pilates core for gym users
      if (hasPilates) {
        const intensity = profile.intensity || 'medium';
        const levelMap: Record<string, string> = { low: 'beginner', medium: 'intermediate', high: 'advanced' };
        const level = levelMap[intensity];

        const { data: pilatesExercises, error: pilatesError } = await supabase
          .from('pilates_exercises')
          .select('*')
          .eq('level', level)
          .gte('duration_minutes', 5)
          .lte('duration_minutes', 10)
          .limit(50);

        if (!pilatesError && pilatesExercises && pilatesExercises.length > 0) {
          randomPilates = pilatesExercises[Math.floor(Math.random() * pilatesExercises.length)];
        }
      }
    }

    const weight = profile.weight || 70;
    const height = profile.height || 170;
    const age = profile.age || 30;
    const gender = profile.gender || 'male';
    const targetWeight = profile.target_weight_kg || weight;
    const goal = profile.goal || 'maintain';
    const workout_mode = profile.workout_mode || 'home';

    let calorieTarget = null;
    let proteinTarget = null;

    // Calculate targets only for gym users
    if (hasGym) {
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
      if (goal === 'lose_weight') {
        calorieTarget = tdee - 500;
      } else if (goal === 'gain_muscle') {
        calorieTarget = tdee + 250;
      } else {
        calorieTarget = tdee;
      }
      calorieTarget = Math.max(calorieTarget, 1200);

      // Protein target
      proteinTarget = Math.round(1.8 * targetWeight);
    }

    // Calculate water target
    const dailyWaterTarget = (weight * 0.033).toFixed(1);

    const plan: any = {
      daily_water_target_liters: parseFloat(dailyWaterTarget),
    };

    // Add exercise data
    if (randomExercise) {
      plan.exercise_title = randomExercise.title;
      plan.exercise_instructions = randomExercise.instructions;
      plan.reps_or_duration = randomExercise.reps_or_duration;
    } else if (randomPilates) {
      plan.exercise_title = randomPilates.title;
      plan.exercise_instructions = randomPilates.instructions;
      plan.reps_or_duration = `${randomPilates.duration_minutes} minutes`;
    }

    // Add meal data (only for gym users)
    if (randomMeal) {
      plan.meal_title = randomMeal.title;
      plan.meal_instructions = randomMeal.instructions;
      plan.meal_ingredients = randomMeal.ingredients || null;
      plan.meal_calories_estimate = randomMeal.calories || null;
    }

    // Add yoga data
    if (randomYoga) {
      plan.yoga_title = randomYoga.title;
      plan.yoga_instructions = randomYoga.instructions;
      plan.yoga_duration_minutes = randomYoga.duration_minutes;
    }

    // Add calorie/protein targets (only for gym users)
    if (hasGym) {
      plan.calorie_target = calorieTarget;
      plan.protein_target_g = proteinTarget;
    }

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
