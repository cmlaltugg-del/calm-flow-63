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

    console.log('Profile found for user:', user.id, 'training_styles:', profile.training_styles);

    const today = new Date().toISOString().split('T')[0];
    const trainingStyles = profile.training_styles || [];
    const hasGym = trainingStyles.includes('gym');

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

    // Determine training mode combinations
    const hasYoga = trainingStyles.includes('yoga');
    const hasPilates = trainingStyles.includes('pilates');
    
    let exercisesWithCalories: any[] = [];
    let pilatesWorkout: any = null;
    let total_exercise_calories = 0;
    let mainExercise: any = null;
    let randomYoga: any = null;
    let randomMeal: any = null;

    // Handle empty training_styles - provide default minimal workout
    if (!hasYoga && !hasGym && !hasPilates) {
      console.log('No training styles selected, providing default workout');
      mainExercise = {
        title: 'Rest Day',
        instructions: 'Take a rest day to recover. Stay hydrated and do light stretching if desired.',
        reps_or_duration: 'Rest'
      };
    }
    // CASE 1: Yoga only
    if (hasYoga && !hasGym && !hasPilates) {
      console.log('Yoga-only mode');
      const intensity = profile.intensity || 'medium';
      const { data: yogaSessions, error: yogaError } = await supabase
        .from('yoga_sessions')
        .select('*')
        .eq('intensity_level', intensity)
        .gte('duration_minutes', 20)
        .lte('duration_minutes', 35)
        .limit(50);

      if (yogaError || !yogaSessions || yogaSessions.length === 0) {
        console.error('Yoga fetch error:', yogaError);
        return new Response(
          JSON.stringify({ error: 'No yoga sessions available' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      randomYoga = yogaSessions[Math.floor(Math.random() * yogaSessions.length)];
      mainExercise = { title: randomYoga.title, instructions: randomYoga.instructions, reps_or_duration: `${randomYoga.duration_minutes} min` };
    }
    // CASE 2: Pilates only
    else if (hasPilates && !hasGym && !hasYoga) {
      console.log('Pilates-only mode');
      const intensity = profile.intensity || 'medium';
      const levelMap: Record<string, string> = { low: 'beginner', medium: 'intermediate', high: 'advanced' };
      const level = levelMap[intensity];

      const { data: pilatesExercises, error: pilatesError } = await supabase
        .from('pilates_exercises')
        .select('*')
        .eq('level', level)
        .limit(50);

      if (pilatesError || !pilatesExercises || pilatesExercises.length === 0) {
        console.error('Pilates fetch error:', pilatesError);
        return new Response(
          JSON.stringify({ error: 'No pilates exercises available' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const selectedPilates = pilatesExercises[Math.floor(Math.random() * pilatesExercises.length)];
      pilatesWorkout = selectedPilates;
      mainExercise = {
        title: 'Rest Day',
        instructions: 'Focus on pilates today.',
        reps_or_duration: 'See pilates section'
      };
    }
    // CASE 3: Yoga + Pilates (no gym)
    else if (hasYoga && hasPilates && !hasGym) {
      console.log('Yoga + Pilates mode');
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

      if (pilatesError || !pilatesExercises || pilatesExercises.length === 0) {
        console.error('Pilates fetch error:', pilatesError);
        return new Response(
          JSON.stringify({ error: 'No pilates exercises available' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      pilatesWorkout = pilatesExercises[Math.floor(Math.random() * pilatesExercises.length)];
      mainExercise = {
        title: 'Combined Yoga + Pilates Session',
        instructions: `Today's plan includes both yoga and pilates. See each section for details.`,
        reps_or_duration: 'See yoga and pilates sections'
      };
    }
    // CASE 4: Gym (with or without yoga/pilates)
    else if (hasGym) {
      console.log('Gym mode with optional yoga/pilates');
      // Main gym workout
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

      const shuffled = exercises.sort(() => 0.5 - Math.random());
      const selectedExercises = shuffled.slice(0, Math.min(5, exercises.length));
      
      exercisesWithCalories = selectedExercises.map(ex => ({
        title: ex.title,
        instructions: ex.instructions,
        reps_or_duration: ex.reps_or_duration,
        calories: Math.round(Math.random() * 30 + 40)
      }));
      
      total_exercise_calories = exercisesWithCalories.reduce((sum, ex) => sum + ex.calories, 0);
      mainExercise = selectedExercises[0];

      // Fetch meals for gym users
      let mealsQuery = supabase.from('meals').select('*');
      if (profile.goal === 'gain_muscle') {
        mealsQuery = mealsQuery.eq('protein_focused', true);
      }
      
      const { data: meals, error: mealError } = await mealsQuery.limit(50);
      if (!mealError && meals && meals.length > 0) {
        randomMeal = meals[Math.floor(Math.random() * meals.length)];
      }

      // Add pilates session if pilates selected
      if (hasPilates) {
        const intensity = profile.intensity || 'medium';
        const levelMap: Record<string, string> = { low: 'beginner', medium: 'intermediate', high: 'advanced' };
        const level = levelMap[intensity];

        const { data: pilatesExercises, error: pilatesError } = await supabase
          .from('pilates_exercises')
          .select('*')
          .eq('level', level)
          .limit(50);

        if (pilatesExercises && pilatesExercises.length > 0) {
          pilatesWorkout = pilatesExercises[Math.floor(Math.random() * pilatesExercises.length)];
        }
      }

      // Add yoga cooldown if yoga selected (5-8 min)
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
    // Split yoga instructions into poses/steps
    const yogaPoses = randomYoga?.instructions ?
      randomYoga.instructions.split('.').filter((s: string) => s.trim()).map((pose: string, idx: number) => ({
        pose_name: `Step ${idx + 1}`,
        instructions: pose.trim()
      })) : 
      randomYoga ? [{ pose_name: 'Full Session', instructions: randomYoga.title }] : [];

    // Calculate targets (only for gym users)
    let calorie_target = null;
    let protein_target_g = null;
    let daily_water_target_liters = 2.0;

    if (hasGym) {
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
      
      calorie_target = Math.round(tdee - 350);
      protein_target_g = Math.round(targetWeightNum * 2);
      daily_water_target_liters = Math.round(weightNum * 0.033 * 10) / 10;
    }

    // Insert daily plan
    const planData: any = {
      user_id: user.id,
      plan_date: today,
      daily_water_target_liters,
      exercise_title: mainExercise?.title || 'No Exercise',
      exercise_instructions: mainExercise?.instructions || 'No exercise planned for today',
      reps_or_duration: mainExercise?.reps_or_duration || 'N/A',
      yoga_title: randomYoga?.title || 'No Yoga',
      meal_title: randomMeal?.title || 'No Meal Plan',
    };

    // Add meal data if available (gym users)
    if (randomMeal) {
      planData.meal_instructions = randomMeal.instructions;
      planData.meal_ingredients = randomMeal.ingredients;
      planData.meal_calories_estimate = randomMeal.calories || 0;
    }

    // Add exercise data if available
    if (mainExercise) {
      planData.exercise_title = mainExercise.title;
      planData.exercise_instructions = mainExercise.instructions || '';
      planData.reps_or_duration = mainExercise.reps_or_duration;
    }
    
    if (exercisesWithCalories.length > 0) {
      planData.exercises_json = exercisesWithCalories;
      planData.total_exercise_calories = total_exercise_calories;
    }

    // Add yoga data if available
    if (randomYoga) {
      planData.yoga_title = randomYoga.title;
      planData.yoga_instructions = randomYoga.instructions;
      planData.yoga_duration_minutes = randomYoga.duration_minutes;
    }
    
    if (yogaPoses.length > 0) {
      planData.yoga_poses_json = yogaPoses;
    }

    // Add pilates data if available
    if (pilatesWorkout) {
      planData.pilates_title = pilatesWorkout.title;
      planData.pilates_instructions = pilatesWorkout.instructions;
      planData.pilates_duration_minutes = pilatesWorkout.duration_minutes;
      
      // Create pilates exercises array
      const pilatesExercises = [{
        title: pilatesWorkout.title,
        instructions: pilatesWorkout.instructions,
        duration_minutes: pilatesWorkout.duration_minutes,
        level: pilatesWorkout.level
      }];
      planData.pilates_exercises_json = pilatesExercises;
    }

    // Add calorie/protein targets if gym user
    if (hasGym) {
      planData.calorie_target = calorie_target;
      planData.protein_target_g = protein_target_g;
    }

    const { data: newPlan, error: insertError } = await supabase
      .from('daily_plans')
      .insert(planData)
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
