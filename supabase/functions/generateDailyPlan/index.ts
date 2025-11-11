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

    // Select exercises based on training styles
    let exercisesWithCalories: any[] = [];
    let total_exercise_calories = 0;
    let mainExercise: any = null;

    if (hasGym) {
      // Select 5 exercises based on workout mode
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

      // Pick 5 random exercises
      const shuffled = exercises.sort(() => 0.5 - Math.random());
      const selectedExercises = shuffled.slice(0, Math.min(5, exercises.length));
      
      // Calculate calories for each exercise (rough estimate: 5-8 cal/min)
      exercisesWithCalories = selectedExercises.map(ex => ({
        title: ex.title,
        instructions: ex.instructions,
        reps_or_duration: ex.reps_or_duration,
        calories: Math.round(Math.random() * 30 + 40) // 40-70 calories per exercise
      }));
      
      total_exercise_calories = exercisesWithCalories.reduce((sum, ex) => sum + ex.calories, 0);
      mainExercise = selectedExercises[0];
    } else if (trainingStyles.includes('pilates')) {
      // Select pilates exercises
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

      const shuffled = pilatesExercises.sort(() => 0.5 - Math.random());
      const selectedPilates = shuffled.slice(0, Math.min(5, pilatesExercises.length));
      
      exercisesWithCalories = selectedPilates.map(ex => ({
        title: ex.title,
        instructions: ex.instructions,
        reps_or_duration: `${ex.duration_minutes} minutes`,
        calories: Math.round(ex.duration_minutes * 5) // Rough estimate: 5 cal/min for pilates
      }));
      
      total_exercise_calories = exercisesWithCalories.reduce((sum, ex) => sum + ex.calories, 0);
      mainExercise = selectedPilates[0];
      mainExercise.reps_or_duration = `${mainExercise.duration_minutes} minutes`;
    }

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

    // Select yoga based on training styles and intensity
    let randomYoga: any = null;
    if (trainingStyles.includes('yoga')) {
      let allowedIntensities: string[] = ['low', 'medium'];
      
      if (hasGym && profile.goal) {
        const intensityMap: Record<string, string[]> = {
          lose_weight: ['low', 'medium'],
          gain_muscle: ['medium', 'high'],
          maintain: ['low', 'medium'],
        };
        allowedIntensities = intensityMap[profile.goal] || ['low', 'medium'];
      } else if (profile.intensity) {
        allowedIntensities = [profile.intensity];
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

      randomYoga = yogaSessions[Math.floor(Math.random() * yogaSessions.length)];
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
      meal_title: randomMeal.title,
      meal_instructions: randomMeal.instructions,
      meal_ingredients: randomMeal.ingredients,
      meal_calories_estimate: randomMeal.calories || 0,
    };

    // Add exercise data if available
    if (mainExercise) {
      planData.exercise_title = mainExercise.title;
      planData.exercise_instructions = mainExercise.instructions;
      planData.reps_or_duration = mainExercise.reps_or_duration;
      planData.exercises_json = exercisesWithCalories;
      planData.total_exercise_calories = total_exercise_calories;
    }

    // Add yoga data if available
    if (randomYoga) {
      planData.yoga_title = randomYoga.title;
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
