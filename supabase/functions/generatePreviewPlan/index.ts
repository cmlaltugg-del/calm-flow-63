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
    const hasHome = trainingStyles.includes('home');
    const hasStrength = hasGym || hasHome;
    
    console.log('Preview training styles:', trainingStyles, { hasGym, hasHome, hasYoga, hasPilates, hasStrength });

    let randomExercise: any = null;
    let randomMeal: any = null;
    let randomYoga: any = null;
    let randomPilates: any = null;

    // Handle empty training_styles
    if (!hasYoga && !hasStrength && !hasPilates) {
      console.log('No training styles selected, providing default plan');
    }
    // CASE 1: Yoga only
    else if (hasYoga && !hasStrength && !hasPilates) {
      console.log('Preview Yoga-only mode');
      const intensity = profile.intensity || 'medium';
      const { data: yogaSessions, error: yogaError } = await supabase
        .from('yoga_sessions')
        .select('*')
        .eq('intensity_level', intensity)
        .gte('duration_minutes', 20)
        .lte('duration_minutes', 35)
        .limit(50);

      if (yogaError) console.error('Yoga fetch error (preview):', yogaError);
      if (yogaSessions && yogaSessions.length > 0) {
        randomYoga = yogaSessions[Math.floor(Math.random() * yogaSessions.length)];
      } else {
        // Fallback yoga session to avoid empty UI in preview
        randomYoga = {
          title: 'Gentle Yoga Flow',
          instructions: 'Breathing focus. Cat-cow. Forward fold. Low lunge. Child\'s pose. Repeat calmly.',
          duration_minutes: 20,
          intensity_level: intensity,
        };
        console.log('Using fallback preview yoga session');
      }
    }
    // CASE 2: Pilates only
    else if (hasPilates && !hasStrength && !hasYoga) {
      console.log('Preview Pilates-only mode');
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
        console.log('Selected preview pilates:', randomPilates.title);
      }
    }
    // CASE 3: Yoga + Pilates (no strength training)
    else if (hasYoga && hasPilates && !hasStrength) {
      console.log('Preview Yoga + Pilates mode');
      const intensity = profile.intensity || 'medium';
      const levelMap: Record<string, string> = { low: 'beginner', medium: 'intermediate', high: 'advanced' };
      const level = levelMap[intensity];

      // Get yoga session
      const { data: yogaSessions, error: yogaError } = await supabase
        .from('yoga_sessions')
        .select('*')
        .eq('intensity_level', intensity)
        .gte('duration_minutes', 12)
        .lte('duration_minutes', 35)
        .limit(50);

      if (!yogaError && yogaSessions && yogaSessions.length > 0) {
        randomYoga = yogaSessions[Math.floor(Math.random() * yogaSessions.length)];
      }

      // Get pilates session
      const { data: pilatesExercises, error: pilatesError } = await supabase
        .from('pilates_exercises')
        .select('*')
        .eq('level', level)
        .limit(50);

      if (!pilatesError && pilatesExercises && pilatesExercises.length > 0) {
        randomPilates = pilatesExercises[Math.floor(Math.random() * pilatesExercises.length)];
      }
    }
    // CASE 4: Strength training (gym or home, with or without yoga/pilates)
    else if (hasStrength) {
      console.log('Preview Strength mode');
      const exerciseTable = (hasGym || profile.workout_mode === 'gym') ? 'exercises_gym' : 'exercises_home';
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

      // Pilates session for gym users
      if (hasPilates) {
        const intensity = profile.intensity || 'medium';
        const levelMap: Record<string, string> = { low: 'beginner', medium: 'intermediate', high: 'advanced' };
        const level = levelMap[intensity];

        const { data: pilatesExercises, error: pilatesError } = await supabase
          .from('pilates_exercises')
          .select('*')
          .eq('level', level)
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

    // Calculate targets for ALL users with height/weight data
    if (weight && height && age) {
      // Calculate BMR
      let bmr;
      if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      }

      // Activity factor based on training style
      let activityFactor = 1.45; // Default
      if (hasGym) activityFactor = 1.55;
      else if (hasYoga) activityFactor = 1.40;
      else if (hasPilates) activityFactor = 1.45;
      else if (hasHome) activityFactor = 1.50;
      
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

      // Protein target (1.6g per kg target weight)
      proteinTarget = Math.round(1.6 * targetWeight);
    }

    // Fetch meals for ALL users (not just strength training)
    if (!randomMeal) {
      let mealsQuery = supabase.from('meals').select('*');
      if (goal === 'gain_muscle') {
        mealsQuery = mealsQuery.eq('protein_focused', true);
      }
      
      const { data: meals, error: mealError } = await mealsQuery.limit(50);
      if (!mealError && meals && meals.length > 0) {
        randomMeal = meals[Math.floor(Math.random() * meals.length)];
      }
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
    } else if (!randomYoga && !randomPilates) {
      plan.exercise_title = 'Rest Day';
      plan.exercise_instructions = 'Take a rest day to recover.';
      plan.reps_or_duration = 'Rest';
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

    // Add pilates data
    if (randomPilates) {
      plan.pilates_title = randomPilates.title;
      plan.pilates_instructions = randomPilates.instructions;
      plan.pilates_duration_minutes = randomPilates.duration_minutes;
      
      // Create pilates exercises array
      const pilatesExercises = [{
        title: randomPilates.title,
        instructions: randomPilates.instructions,
        duration_minutes: randomPilates.duration_minutes,
        level: randomPilates.level
      }];
      plan.pilates_exercises_json = pilatesExercises;
    }

    // Add calorie/protein targets (only for strength training users)
    if (hasStrength) {
      plan.calorie_target = calorieTarget;
      plan.protein_target_g = proteinTarget;
    }

    console.log('Generated preview plan:', JSON.stringify(plan, null, 2));

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
