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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating daily plan for user:', user.id);

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found. Please complete onboarding first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Profile:', profile);

    // Calculate BMR (Basal Metabolic Rate)
    const age = profile.age || 30;
    const gender = profile.gender || 'male';
    const height = profile.height || 170;
    const weight = profile.weight || 70;
    const targetWeight = profile.target_weight_kg || weight;

    let bmr;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity factor based on workout mode
    const activityFactor = profile.workout_mode === 'gym' ? 1.55 : 1.45;
    const tdee = Math.round(bmr * activityFactor);

    // Calculate calorie target based on goal
    let calorieTarget;
    if (profile.goal === 'lose_weight') {
      calorieTarget = tdee - 500;
    } else if (profile.goal === 'gain_muscle') {
      calorieTarget = tdee + 250;
    } else {
      calorieTarget = tdee;
    }
    
    // Ensure minimum safe calorie intake
    calorieTarget = Math.max(calorieTarget, 1200);

    // Calculate protein target (1.8g per kg of target weight)
    const proteinTarget = Math.round(1.8 * targetWeight);

    console.log('Calculated targets:', {
      bmr,
      tdee,
      calorieTarget,
      proteinTarget,
    });

    // Select exercise based on workout mode
    let exercise;
    if (profile.workout_mode === 'home') {
      const { data, error } = await supabaseClient
        .from('exercises_home')
        .select('*')
        .limit(10);
      
      if (error) {
        console.error('Error fetching home exercises:', error);
        throw error;
      }
      
      // Randomly select one
      exercise = data[Math.floor(Math.random() * data.length)];
    } else {
      const { data, error } = await supabaseClient
        .from('exercises_gym')
        .select('*')
        .limit(10);
      
      if (error) {
        console.error('Error fetching gym exercises:', error);
        throw error;
      }
      
      exercise = data[Math.floor(Math.random() * data.length)];
    }

    console.log('Selected exercise:', exercise.title);

    // Select meal based on goal
    let mealQuery = supabaseClient.from('meals').select('*');
    
    if (profile.goal === 'gain_muscle') {
      mealQuery = mealQuery.eq('protein_focused', true);
    }
    
    const { data: meals, error: mealsError } = await mealQuery.limit(10);
    
    if (mealsError) {
      console.error('Error fetching meals:', mealsError);
      throw mealsError;
    }
    
    const meal = meals[Math.floor(Math.random() * meals.length)];
    console.log('Selected meal:', meal.title);

    // Select yoga based on goal intensity
    let yogaIntensities = ['low', 'medium'];
    if (profile.goal === 'lose_weight' || profile.goal === 'gain_muscle') {
      yogaIntensities = ['medium', 'high'];
    }

    const { data: yogaSessions, error: yogaError } = await supabaseClient
      .from('yoga_sessions')
      .select('*')
      .in('intensity_level', yogaIntensities)
      .limit(10);

    if (yogaError) {
      console.error('Error fetching yoga sessions:', yogaError);
      throw yogaError;
    }

    const yoga = yogaSessions[Math.floor(Math.random() * yogaSessions.length)];
    console.log('Selected yoga:', yoga.title);

    // Calculate water target
    const dailyWaterTarget = Math.round((profile.weight * 0.033) * 10) / 10;
    console.log('Daily water target:', dailyWaterTarget);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Insert or update daily plan
    const { data: plan, error: planError } = await supabaseClient
      .from('daily_plans')
      .upsert({
        user_id: user.id,
        plan_date: today,
        exercise_title: exercise.title,
        exercise_instructions: exercise.instructions,
        reps_or_duration: exercise.reps_or_duration,
        meal_title: meal.title,
        meal_instructions: meal.instructions,
        meal_ingredients: meal.ingredients || null,
        meal_calories_estimate: meal.calories || null,
        yoga_title: yoga.title,
        yoga_instructions: yoga.instructions,
        yoga_duration_minutes: yoga.duration_minutes,
        daily_water_target_liters: dailyWaterTarget,
        calorie_target: calorieTarget,
        protein_target_g: proteinTarget,
        is_completed_exercise: false,
        is_completed_yoga: false,
        is_completed_meal: false,
      }, {
        onConflict: 'user_id,plan_date'
      })
      .select()
      .single();

    if (planError) {
      console.error('Error creating daily plan:', planError);
      throw planError;
    }

    console.log('Daily plan created successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        plan: {
          exercise: {
            title: exercise.title,
            instructions: exercise.instructions,
            reps_or_duration: exercise.reps_or_duration,
          },
          meal: {
            title: meal.title,
            instructions: meal.instructions,
          },
          yoga: {
            title: yoga.title,
            instructions: yoga.instructions,
            duration_minutes: yoga.duration_minutes,
          },
          daily_water_target_liters: dailyWaterTarget,
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generateDailyPlan:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
