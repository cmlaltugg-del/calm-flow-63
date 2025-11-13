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
    const hasYoga = trainingStyles.includes('yoga');
    const hasPilates = trainingStyles.includes('pilates');
    const hasHome = trainingStyles.includes('home');
    const hasStrength = hasGym || hasHome; // Either gym or home strength training
    
    console.log('Training styles:', trainingStyles, { hasGym, hasHome, hasYoga, hasPilates, hasStrength });

    // Check if plan already exists for today
    const { data: existingPlan } = await supabase
      .from('daily_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_date', today)
      .maybeSingle();

    if (existingPlan) {
      console.log('Plan already exists for today');
      
      // Check if targets are missing and patch them if needed
      if (existingPlan.calorie_target === null || existingPlan.protein_target_g === null) {
        console.log('Patching missing targets in existing plan');
        
        const weightNum = profile.weight;
        const heightNum = profile.height;
        const ageNum = profile.age;
        const targetWeightNum = profile.target_weight_kg;
        
        if (weightNum && heightNum && ageNum) {
          // Calculate BMR
          let bmr;
          if (profile.gender === 'male') {
            bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
          } else {
            bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
          }
          
          // Activity factor based on training style
          let activityFactor = 1.45;
          if (hasGym) activityFactor = 1.55;
          else if (hasYoga) activityFactor = 1.40;
          else if (hasPilates) activityFactor = 1.45;
          else if (hasHome) activityFactor = 1.50;
          
          const tdee = Math.round(bmr * activityFactor);
          
          const goal = profile.goal || 'maintain';
          let calorie_target;
          if (goal === 'lose_weight') {
            calorie_target = tdee - 500;
          } else if (goal === 'gain_muscle') {
            calorie_target = tdee + 250;
          } else {
            calorie_target = tdee;
          }
          calorie_target = Math.max(calorie_target, 1200);
          
          const protein_target_g = Math.round(1.6 * (targetWeightNum || weightNum));
          
          // Update the plan with targets
          const { data: updatedPlan, error: updateError } = await supabase
            .from('daily_plans')
            .update({
              calorie_target,
              protein_target_g,
            })
            .eq('id', existingPlan.id)
            .select()
            .single();
          
          if (updateError) {
            console.error('Error updating plan targets:', updateError);
          } else {
            console.log('Successfully patched plan targets');
            return new Response(JSON.stringify(updatedPlan), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            });
          }
        }
      }
      
      return new Response(
        JSON.stringify(existingPlan),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine training mode combinations
    console.log('Mode check:', { hasStrength, hasYoga, hasPilates });
    
    let exercisesWithCalories: any[] = [];
    let pilatesWorkout: any = null;
    let total_exercise_calories = 0;
    let mainExercise: any = null;
    let randomYoga: any = null;
    let randomMeal: any = null;

    // Handle empty training_styles - provide default minimal workout
    if (!hasYoga && !hasStrength && !hasPilates) {
      console.log('No training styles selected, providing default workout');
      mainExercise = {
        title: 'Rest Day',
        instructions: 'Take a rest day to recover. Stay hydrated and do light stretching if desired.',
        reps_or_duration: 'Rest'
      };
    }
    // CASE 1: Yoga only
    else if (hasYoga && !hasStrength && !hasPilates) {
      console.log('Yoga-only mode');
      const intensity = profile.intensity || 'medium';
      const { data: yogaSessions, error: yogaError } = await supabase
        .from('yoga_sessions')
        .select('*')
        .eq('intensity_level', intensity)
        .gte('duration_minutes', 20)
        .lte('duration_minutes', 35)
        .limit(50);

      if (yogaError) console.error('Yoga fetch error:', yogaError);
      
      if (yogaSessions && yogaSessions.length > 0) {
        randomYoga = yogaSessions[Math.floor(Math.random() * yogaSessions.length)];
      } else {
        // Fallback yoga session when no data in database
        console.log('Using fallback yoga session');
        randomYoga = {
          title: 'Gentle Yoga Flow',
          instructions: 'Breathing focus. Cat-cow. Forward fold. Low lunge. Child\'s pose. Repeat calmly.',
          duration_minutes: 20,
          intensity_level: intensity,
        };
      }

      mainExercise = { title: randomYoga.title, instructions: randomYoga.instructions, reps_or_duration: `${randomYoga.duration_minutes} min` };
    }
    // CASE 2: Pilates only
    else if (hasPilates && !hasStrength && !hasYoga) {
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
      console.log('Selected pilates workout:', pilatesWorkout.title);
      mainExercise = {
        title: 'Rest Day',
        instructions: 'Focus on pilates today.',
        reps_or_duration: 'See pilates section'
      };
    }
    // CASE 3: Yoga + Pilates (no strength training)
    else if (hasYoga && hasPilates && !hasStrength) {
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

      if (yogaError) console.error('Yoga fetch error:', yogaError);

      if (yogaSessions && yogaSessions.length > 0) {
        randomYoga = yogaSessions[Math.floor(Math.random() * yogaSessions.length)];
      } else {
        // Fallback yoga session
        console.log('Using fallback yoga session for yoga+pilates');
        randomYoga = {
          title: 'Quick Yoga Stretch',
          instructions: 'Cat-cow. Forward fold. Spinal twist. Child\'s pose.',
          duration_minutes: 15,
          intensity_level: intensity,
        };
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
    // CASE 4: Strength training (gym or home, with or without yoga/pilates)
    else if (hasStrength) {
      console.log('Strength mode with optional yoga/pilates');
      // Main gym workout
      const exerciseTable = (hasGym || profile.workout_mode === 'gym') ? 'exercises_gym' : 'exercises_home';
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

      // Fetch meals for ALL strength training users
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

        if (yogaError) console.error('Yoga cooldown fetch error:', yogaError);

        if (yogaSessions && yogaSessions.length > 0) {
          randomYoga = yogaSessions[Math.floor(Math.random() * yogaSessions.length)];
        } else {
          // Fallback yoga cooldown
          console.log('Using fallback yoga cooldown');
          randomYoga = {
            title: 'Quick Cooldown',
            instructions: 'Child\'s pose. Cat-cow. Seated twist.',
            duration_minutes: 5,
            intensity_level: 'low',
          };
        }
      }
    }
    // Helper function to get GIF URL for yoga poses
    const getYogaGif = (poseName: string): string => {
      const poseKeywords: Record<string, string> = {
        'breathing': 'https://i.pinimg.com/originals/e2/cf/6f/e2cf6f49c4a8b8e8d8e8e8e8e8e8e8e8.gif',
        'cat-cow': 'https://i.pinimg.com/originals/b5/c5/d5/b5c5d5e5f5g5h5i5j5k5l5m5n5o5p5.gif',
        'forward fold': 'https://i.pinimg.com/originals/c6/d6/e6/c6d6e6f6g6h6i6j6k6l6m6n6o6p6.gif',
        'downward dog': 'https://media.giphy.com/media/3o7btNhMBytxAM6YBa/giphy.gif',
        'child': 'https://media.giphy.com/media/3o7btNRptqBgLSKR2w/giphy.gif',
        'warrior': 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif',
        'tree': 'https://media.giphy.com/media/l0HlMPcbD4jdARjRC/giphy.gif',
        'cobra': 'https://media.giphy.com/media/xT9IgN8YKRhByRBzMI/giphy.gif',
        'plank': 'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif',
        'twist': 'https://media.giphy.com/media/3o7btPMx7aVdJ5q8o0/giphy.gif',
        'lunge': 'https://media.giphy.com/media/xT9IgDEI1iZyb2wqo8/giphy.gif',
        'bridge': 'https://media.giphy.com/media/l0HlI6nMY0LBjQBTW/giphy.gif',
        'mountain': 'https://media.giphy.com/media/3o7btZ1Gm7ZL25pLMs/giphy.gif',
        'sun salutation': 'https://media.giphy.com/media/l0HlMSVVw9zqmClLq/giphy.gif',
      };
      
      const lowerPose = poseName.toLowerCase();
      for (const [keyword, url] of Object.entries(poseKeywords)) {
        if (lowerPose.includes(keyword)) {
          return url;
        }
      }
      // Default yoga pose gif
      return 'https://media.giphy.com/media/3o7btNhMBytxAM6YBa/giphy.gif';
    };

    // Helper function to get GIF URL for pilates exercises
    const getPilatesGif = (title: string): string => {
      const map: Record<string, string> = {
        'hundred': 'https://media.giphy.com/media/3o7TKy6vq3JCb52rS4/giphy.gif',
        'roll up': 'https://media.giphy.com/media/3o6nUPf3JtYN8pGzPM/giphy.gif',
        'single leg stretch': 'https://media.giphy.com/media/xT9IgpZrYwF0DLzLyw/giphy.gif',
        'double leg stretch': 'https://media.giphy.com/media/3o7btSgJtP2r8AjhS8/giphy.gif',
        'spine stretch': 'https://media.giphy.com/media/l0HlV5r9J9Q0pC8fO/giphy.gif',
        'bridge': 'https://media.giphy.com/media/l0HlI6nMY0LBjQBTW/giphy.gif',
        'side kick': 'https://media.giphy.com/media/3o7btQ9o5h5XnQn6CQ/giphy.gif',
        'plank': 'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif',
        'swimming': 'https://media.giphy.com/media/3o7btN1m0pYhYq1VAI/giphy.gif',
      };
      const lower = title.toLowerCase();
      for (const [k, url] of Object.entries(map)) {
        if (lower.includes(k)) return url;
      }
      return 'https://media.giphy.com/media/3o7TKy6vq3JCb52rS4/giphy.gif';
    };

    // Split yoga instructions into poses/steps
    const yogaPoses = randomYoga?.instructions ?
      randomYoga.instructions.split('.').filter((s: string) => s.trim()).map((pose: string, idx: number) => ({
        pose_name: `Step ${idx + 1}`,
        instructions: pose.trim(),
        gif_url: getYogaGif(pose)
      })) : 
      randomYoga ? [{ 
        pose_name: 'Full Session', 
        instructions: randomYoga.title,
        gif_url: getYogaGif(randomYoga.title)
      }] : [];

    // Calculate targets for ALL users with height/weight data
    let calorie_target = null;
    let protein_target_g = null;
    let daily_water_target_liters = 2.0;

    const weightNum = profile.weight;
    const heightNum = profile.height;
    const ageNum = profile.age;
    const targetWeightNum = profile.target_weight_kg;
    const goal = profile.goal || 'maintain';

    if (weightNum && heightNum && ageNum) {
      // Calculate BMR
      let bmr;
      if (profile.gender === 'male') {
        bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
      } else {
        bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
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
        calorie_target = tdee - 500;
      } else if (goal === 'gain_muscle') {
        calorie_target = tdee + 250;
      } else {
        calorie_target = tdee;
      }
      calorie_target = Math.max(calorie_target, 1200);
      
      // Protein target (1.6g per kg target weight)
      protein_target_g = Math.round(1.6 * (targetWeightNum || weightNum));
      
      // Water target
      daily_water_target_liters = parseFloat((weightNum * 0.033).toFixed(1));
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

    // Insert daily plan
    const planData: any = {
      user_id: user.id,
      plan_date: today,
      daily_water_target_liters,
      exercise_title: mainExercise?.title || 'No Exercise',
      exercise_instructions: mainExercise?.instructions || 'No exercise planned for today',
      reps_or_duration: mainExercise?.reps_or_duration || 'N/A',
      yoga_title: randomYoga?.title || 'No Yoga',
      yoga_duration_minutes: randomYoga?.duration_minutes || 0,
      pilates_duration_minutes: pilatesWorkout?.duration_minutes || 0,
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
        level: pilatesWorkout.level,
        gif_url: getPilatesGif(pilatesWorkout.title)
      }];
      planData.pilates_exercises_json = pilatesExercises;
    }

    // Add calorie/protein targets for all users
    if (calorie_target !== null && protein_target_g !== null) {
      planData.calorie_target = calorie_target;
      planData.protein_target_g = protein_target_g;
    }
    
    console.log('Plan data before insert:', {
      exercise_title: planData.exercise_title,
      yoga_title: planData.yoga_title,
      pilates_title: planData.pilates_title
    });

    const { data: newPlan, error: upsertError } = await supabase
      .from('daily_plans')
      .upsert(planData, { onConflict: 'user_id, plan_date' })
      .select()
      .single();

    if (upsertError) {
      console.error('Upsert error:', upsertError);

      // In case of race condition or conflict, return existing plan
      const { data: existingPlanAfterError } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_date', today)
        .maybeSingle();

      if (existingPlanAfterError) {
        console.log('Plan already exists for today');
        return new Response(
          JSON.stringify(existingPlanAfterError),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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
