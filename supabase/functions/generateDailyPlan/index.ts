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

    // CASE 1: Yoga only (no gym, no pilates)
    if (hasYoga && !hasGym && !hasPilates) {
      console.log('Yoga-only mode');
      // Main workout will be yoga, handled below
      mainExercise = { title: 'Yoga Session', instructions: 'See yoga section', reps_or_duration: '30-45 min' };
    }
    // CASE 2: Pilates only (no gym, no yoga)
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

      const selectedPilates = pilatesExercises.sort(() => 0.5 - Math.random())[0];
      mainExercise = selectedPilates;
      mainExercise.reps_or_duration = `${mainExercise.duration_minutes} minutes`;
      exercisesWithCalories = [{
        title: selectedPilates.title,
        instructions: selectedPilates.instructions,
        reps_or_duration: mainExercise.reps_or_duration,
        calories: Math.round(selectedPilates.duration_minutes * 5)
      }];
      total_exercise_calories = exercisesWithCalories[0].calories;
    }
    // CASE 3: Gym (with or without yoga/pilates)
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

      // Add pilates core work (5-10 min) if pilates selected
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
          const coreWorkouts = pilatesExercises.filter(p => p.duration_minutes >= 5 && p.duration_minutes <= 10);
          if (coreWorkouts.length > 0) {
            pilatesWorkout = coreWorkouts.sort(() => 0.5 - Math.random())[0];
            const pilatesCalories = Math.round(pilatesWorkout.duration_minutes * 5);
            total_exercise_calories += pilatesCalories;
          }
        }
      }
    }

    // Select meal (only for gym users)
    let randomMeal: any = null;
    if (hasGym) {
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

      randomMeal = meals[Math.floor(Math.random() * meals.length)];
    }

    // Select yoga based on training styles and intensity
    let randomYoga: any = null;
    if (hasYoga) {
      let allowedIntensities: string[] = ['low', 'medium'];
      
      // For yoga-only users, use their selected intensity
      if (!hasGym && profile.intensity) {
        allowedIntensities = [profile.intensity];
      }
      // For gym users with yoga, select 3-5 min cooldown sessions
      else if (hasGym) {
        if (profile.goal) {
          const intensityMap: Record<string, string[]> = {
            lose_weight: ['low', 'medium'],
            gain_muscle: ['medium', 'high'],
            maintain: ['low', 'medium'],
          };
          allowedIntensities = intensityMap[profile.goal] || ['low', 'medium'];
        }
      }
      
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

      // If gym+yoga, prefer shorter sessions (3-5 min cooldown)
      let availableYoga = yogaSessions;
      if (hasGym) {
        const shortSessions = yogaSessions.filter(y => y.duration_minutes >= 3 && y.duration_minutes <= 5);
        if (shortSessions.length > 0) {
          availableYoga = shortSessions;
        }
      }

      randomYoga = availableYoga[Math.floor(Math.random() * availableYoga.length)];
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
    };

    // Add meal data if available (gym users)
    if (randomMeal) {
      planData.meal_title = randomMeal.title;
      planData.meal_instructions = randomMeal.instructions;
      planData.meal_ingredients = randomMeal.ingredients;
      planData.meal_calories_estimate = randomMeal.calories || 0;
    }

    // Add exercise data if available
    if (mainExercise) {
      let combinedTitle = mainExercise.title;
      let combinedInstructions = mainExercise.instructions || '';
      
      // For combined workouts, add pilates to the exercise section
      if (pilatesWorkout) {
        combinedTitle = `${mainExercise.title} + ${pilatesWorkout.title}`;
        combinedInstructions = `${combinedInstructions}\n\n--- PILATES CORE (${pilatesWorkout.duration_minutes} min) ---\n${pilatesWorkout.instructions}`;
        exercisesWithCalories.push({
          title: pilatesWorkout.title,
          instructions: pilatesWorkout.instructions,
          reps_or_duration: `${pilatesWorkout.duration_minutes} minutes`,
          calories: Math.round(pilatesWorkout.duration_minutes * 5)
        });
      }
      
      planData.exercise_title = combinedTitle;
      planData.exercise_instructions = combinedInstructions;
      planData.reps_or_duration = mainExercise.reps_or_duration;
      planData.exercises_json = exercisesWithCalories;
      planData.total_exercise_calories = total_exercise_calories;
    }

    // Add yoga data if available
    if (randomYoga) {
      let yogaTitle = randomYoga.title;
      // If combined with gym, label as cooldown
      if (hasGym && randomYoga.duration_minutes <= 5) {
        yogaTitle = `${randomYoga.title} (Cooldown)`;
      }
      planData.yoga_title = yogaTitle;
      planData.yoga_instructions = randomYoga.instructions;
      planData.yoga_duration_minutes = randomYoga.duration_minutes;
      planData.yoga_poses_json = yogaPoses;
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
