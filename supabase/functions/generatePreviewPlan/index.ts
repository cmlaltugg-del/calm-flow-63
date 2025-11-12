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

    // Handle empty training_styles
    if (!hasYoga && !hasGym && !hasPilates) {
      console.log('No training styles selected, providing default plan');
    }
    // CASE 1: Yoga only
    if (hasYoga && !hasGym && !hasPilates) {
      const intensity = profile.intensity || 'medium';
      const { data: yogaSessions, error: yogaError } = await supabase
        .from('yoga_sessions')
        .select('*')
        .eq('intensity_level', intensity)
        .gte('duration_minutes', 20)
        .lte('duration_minutes', 35)
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
    // CASE 3: Yoga + Pilates (no gym)
    else if (hasYoga && hasPilates && !hasGym) {
      const intensity = profile.intensity || 'medium';
      const levelMap: Record<string, string> = { low: 'beginner', medium: 'intermediate', high: 'advanced' };
      const level = levelMap[intensity];

      // Get 15 min yoga warmup
      const { data: yogaSessions, error: yogaError } = await supabase
        .from('yoga_sessions')
        .select('*')
        .eq('intensity_level', intensity)
        .gte('duration_minutes', 12)
        .lte('duration_minutes', 18)
        .limit(50);

      if (!yogaError && yogaSessions && yogaSessions.length > 0) {
        randomYoga = yogaSessions[Math.floor(Math.random() * yogaSessions.length)];
      }

      // Get 15 min pilates core
      const { data: pilatesExercises, error: pilatesError } = await supabase
        .from('pilates_exercises')
        .select('*')
        .eq('level', level)
        .gte('duration_minutes', 12)
        .lte('duration_minutes', 18)
        .limit(50);

      if (!pilatesError && pilatesExercises && pilatesExercises.length > 0) {
        randomPilates = pilatesExercises[Math.floor(Math.random() * pilatesExercises.length)];
      }
    }
    // CASE 4: Gym (with or without yoga/pilates)
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

      // Pilates core finisher for gym users (8 min)
      if (hasPilates) {
        const intensity = profile.intensity || 'medium';
        const levelMap: Record<string, string> = { low: 'beginner', medium: 'intermediate', high: 'advanced' };
        const level = levelMap[intensity];

        const { data: pilatesExercises, error: pilatesError } = await supabase
          .from('pilates_exercises')
          .select('*')
          .eq('level', level)
          .gte('duration_minutes', 6)
          .lte('duration_minutes', 10)
          .limit(50);

        if (!pilatesError && pilatesExercises && pilatesExercises.length > 0) {
          randomPilates = pilatesExercises[Math.floor(Math.random() * pilatesExercises.length)];
        }
      }

      // Yoga cooldown for gym users (5-8 min)
      if (hasYoga) {
        const { data: yogaSessions, error: yogaError } = await supabase
          .from('yoga_sessions')
          .select('*')
          .gte('duration_minutes', 5)
          .lte('duration_minutes', 8)
          .limit(50);

        if (!yogaError && yogaSessions && yogaSessions.length > 0) {
          randomYoga = yogaSessions[Math.floor(Math.random() * yogaSessions.length)];
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
      let exerciseTitle = randomExercise.title;
      let exerciseInstructions = randomExercise.instructions;
      
      // If gym + pilates, combine in exercise section
      if (hasGym && hasPilates && randomPilates) {
        exerciseTitle = `${randomExercise.title} + ${randomPilates.title} (Core Finisher)`;
        exerciseInstructions = `${randomExercise.instructions}\n\n--- PILATES CORE FINISHER (${randomPilates.duration_minutes} min) ---\n${randomPilates.instructions}`;
      }
      
      plan.exercise_title = exerciseTitle;
      plan.exercise_instructions = exerciseInstructions;
      plan.reps_or_duration = randomExercise.reps_or_duration;
    } else if (randomPilates && !hasGym) {
      // For pilates-only or yoga+pilates
      if (hasYoga && randomYoga) {
        plan.exercise_title = `Yoga Warmup + Pilates Core`;
        plan.exercise_instructions = `Start with 15 min yoga warmup, then transition to 15 min pilates core work.`;
        plan.reps_or_duration = `${(randomYoga.duration_minutes || 15) + (randomPilates.duration_minutes || 15)} minutes total`;
      } else {
        plan.exercise_title = randomPilates.title;
        plan.exercise_instructions = randomPilates.instructions;
        plan.reps_or_duration = `${randomPilates.duration_minutes} minutes`;
      }
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
      let yogaTitle = randomYoga.title;
      
      // For gym + yoga, label as cooldown
      if (hasGym && randomYoga.duration_minutes <= 8) {
        yogaTitle = `${randomYoga.title} (Cooldown)`;
      }
      // For yoga-only, use main session
      else if (hasYoga && !hasGym && !hasPilates) {
        yogaTitle = randomYoga.title;
      }
      // For yoga+pilates without gym, yoga is part of combined workout
      else if (hasYoga && hasPilates && !hasGym) {
        yogaTitle = `${randomYoga.title} (Warmup)`;
      }
      
      plan.yoga_title = yogaTitle;
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
