import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AI-powered content generation helper
async function generateWithAI(prompt: string, systemPrompt: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI Gateway error:', response.status, errorText);
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Generate personalized meal
async function generateMeal(profile: any): Promise<any> {
  const systemPrompt = `You are a professional nutritionist. Generate a single healthy meal recipe in JSON format.
Return ONLY valid JSON with this exact structure:
{
  "title": "Meal Name",
  "instructions": "Step by step cooking instructions (max 200 chars)",
  "ingredients": "Comma separated ingredients list",
  "calories_estimate": 450
}`;

  const goalText = profile.goal === 'gain_muscle' ? 'high protein for muscle gain' : 
                   profile.goal === 'lose_weight' ? 'low calorie for weight loss' : 
                   'balanced nutrition';

  const prompt = `Create a ${goalText} meal. Target calories: ${Math.round(profile.calorie_target / 3)} per meal.`;

  const aiResponse = await generateWithAI(prompt, systemPrompt);
  
  // Extract JSON from response
  const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid AI response format');
  }
  
  return JSON.parse(jsonMatch[0]);
}

// Generate personalized yoga session
async function generateYoga(profile: any): Promise<any> {
  const availablePoses = [
    "Downward Dog", "Warrior I", "Warrior II", "Tree Pose", "Child's Pose",
    "Cat-Cow Stretch", "Cobra Pose", "Pigeon Pose", "Triangle Pose", "Bridge Pose",
    "Seated Forward Bend", "Corpse Pose", "Plank Pose", "Boat Pose", "Mountain Pose"
  ];
  
  const systemPrompt = `You are a certified yoga instructor. Generate a yoga session in JSON format.
Return ONLY valid JSON with this exact structure:
{
  "title": "Yoga Session Name",
  "instructions": "Overall session flow and breathing guidance (max 200 chars)",
  "duration_minutes": 25,
  "poses": [
    {
      "name": "Pose Name (must be from available list)",
      "duration": "2 mins",
      "instructions": "Detailed instructions for this specific pose (max 100 chars)"
    }
  ]
}

Available poses: ${availablePoses.join(", ")}
IMPORTANT: Use ONLY poses from the available list above. Include 5-7 poses.`;

  const intensity = profile.intensity || 'medium';
  const prompt = `Create a ${intensity} intensity yoga session, 20-30 minutes total. Focus on flexibility and mindfulness. Include a warm-up, main flow, and cool-down.`;

  const aiResponse = await generateWithAI(prompt, systemPrompt);
  const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response format');
  
  return JSON.parse(jsonMatch[0]);
}

// Generate personalized pilates workout
async function generatePilates(profile: any): Promise<any> {
  const availableExercises = [
    "The Hundred", "Roll Up", "Single Leg Circle", "Rolling Like a Ball",
    "Single Leg Stretch", "Double Leg Stretch", "Spine Stretch Forward", "Swan Dive",
    "Single Straight Leg", "Criss Cross", "Teaser", "Swimming",
    "Leg Pull Front", "Side Kick Series", "Seal", "Shoulder Bridge"
  ];
  
  const systemPrompt = `You are a certified pilates instructor. Generate a pilates workout in JSON format.
Return ONLY valid JSON with this exact structure:
{
  "title": "Pilates Workout Name",
  "instructions": "Overall workout focus and breathing cues (max 200 chars)",
  "duration_minutes": 25,
  "exercises": [
    {
      "name": "Exercise Name (must be from available list)",
      "duration": "3 mins",
      "instructions": "Detailed execution steps for this exercise (max 100 chars)"
    }
  ]
}

Available exercises: ${availableExercises.join(", ")}
IMPORTANT: Use ONLY exercises from the available list above. Include 6-8 exercises.`;

  const intensity = profile.intensity || 'medium';
  const levelMap: Record<string, string> = { low: 'beginner', medium: 'intermediate', high: 'advanced' };
  const level = levelMap[intensity] || 'intermediate';

  const prompt = `Create a ${level} pilates workout, 20-30 minutes total. Focus on core strength, stability and controlled movements.`;

  const aiResponse = await generateWithAI(prompt, systemPrompt);
  const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response format');
  
  return JSON.parse(jsonMatch[0]);
}

// Generate personalized strength exercise
async function generateExercise(profile: any, equipmentType: 'gym' | 'home'): Promise<any> {
  const gymExercises = [
    "Push-ups", "Squats", "Plank", "Lunges", "Burpees", "Mountain Climbers",
    "Bench Press", "Deadlift", "Shoulder Press", "Bicep Curls", "Tricep Dips",
    "Lat Pulldown", "Leg Press", "Chest Fly", "Russian Twists", "Leg Raises"
  ];
  
  const homeExercises = [
    "Push-ups", "Squats", "Plank", "Lunges", "Burpees", "Mountain Climbers",
    "Jumping Jacks", "Russian Twists", "Leg Raises", "Bicycle Crunches"
  ];
  
  const availableExercises = equipmentType === 'gym' ? gymExercises : homeExercises;
  
  const systemPrompt = `You are a certified personal trainer. Generate a strength training workout in JSON format.
Return ONLY valid JSON with this exact structure:
{
  "title": "Workout Name",
  "instructions": "Overall workout guidance and form tips (max 200 chars)",
  "total_calories": 350,
  "exercises": [
    {
      "name": "Exercise Name (must be from available list)",
      "reps_or_duration": "3 sets x 12 reps",
      "calories": 80,
      "instructions": "Detailed form and execution (max 100 chars)"
    }
  ]
}

Available exercises: ${availableExercises.join(", ")}
IMPORTANT: Use ONLY exercises from the available list above. Include 5-6 exercises. Total calories should be 300-400.`;

  const equipment = equipmentType === 'gym' ? 'gym equipment (barbells, machines)' : 'bodyweight or minimal home equipment';
  const intensity = profile.intensity || 'medium';
  const levelMap: Record<string, string> = { low: 'beginner', medium: 'intermediate', high: 'advanced' };
  const level = levelMap[intensity] || 'intermediate';

  const prompt = `Create a ${level} full-body strength workout using ${equipment}. Target major muscle groups with proper progression.`;

  const aiResponse = await generateWithAI(prompt, systemPrompt);
  const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response format');
  
  return JSON.parse(jsonMatch[0]);
}

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

    console.log('Generating AI-powered daily plan for user:', user.id);

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Profile found, training_styles:', profile.training_styles);

    const today = new Date().toISOString().split('T')[0];
    const trainingStyles = profile.training_styles || [];
    const hasGym = trainingStyles.includes('gym');
    const hasYoga = trainingStyles.includes('yoga');
    const hasPilates = trainingStyles.includes('pilates');
    const hasHome = trainingStyles.includes('home');
    const hasStrength = hasGym || hasHome;

    // Check if plan already exists for today
    const { data: existingPlan } = await supabase
      .from('daily_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_date', today)
      .maybeSingle();

    if (existingPlan) {
      console.log('Plan already exists for today');
      
      // Check if targets are missing and patch them
      if (existingPlan.calorie_target === null || existingPlan.protein_target_g === null) {
        console.log('Patching missing targets');
        
        const weightNum = profile.weight;
        const heightNum = profile.height;
        const ageNum = profile.age;
        
        if (weightNum && heightNum && ageNum) {
          let bmr;
          if (profile.gender === 'male') {
            bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
          } else {
            bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
          }
          
          let activityFactor = 1.45;
          if (hasGym) activityFactor = 1.55;
          else if (hasYoga) activityFactor = 1.40;
          else if (hasPilates) activityFactor = 1.45;
          else if (hasHome) activityFactor = 1.50;
          
          const tdee = bmr * activityFactor;
          let calorieTarget = tdee;
          
          if (profile.goal === 'lose_weight') {
            calorieTarget = tdee - 500;
          } else if (profile.goal === 'gain_muscle') {
            calorieTarget = tdee + 300;
          }
          
          const proteinTarget = profile.goal === 'gain_muscle' ? weightNum * 2 : weightNum * 1.6;
          const waterTarget = weightNum * 0.045;
          
          await supabase
            .from('daily_plans')
            .update({
              calorie_target: Math.round(calorieTarget),
              protein_target_g: Math.round(proteinTarget),
              daily_water_target_liters: parseFloat(waterTarget.toFixed(1))
            })
            .eq('id', existingPlan.id);
            
          existingPlan.calorie_target = Math.round(calorieTarget);
          existingPlan.protein_target_g = Math.round(proteinTarget);
          existingPlan.daily_water_target_liters = parseFloat(waterTarget.toFixed(1));
        }
      }
      
      return new Response(
        JSON.stringify(existingPlan),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating new AI-powered plan');

    // Calculate nutritional targets
    const weightNum = profile.weight || 70;
    const heightNum = profile.height || 170;
    const ageNum = profile.age || 30;
    
    let bmr;
    if (profile.gender === 'male') {
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
    } else {
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
    }
    
    let activityFactor = 1.45;
    if (hasGym) activityFactor = 1.55;
    else if (hasYoga) activityFactor = 1.40;
    else if (hasPilates) activityFactor = 1.45;
    else if (hasHome) activityFactor = 1.50;
    
    const tdee = bmr * activityFactor;
    let calorieTarget = tdee;
    
    if (profile.goal === 'lose_weight') {
      calorieTarget = tdee - 500;
    } else if (profile.goal === 'gain_muscle') {
      calorieTarget = tdee + 300;
    }
    
    const proteinTarget = profile.goal === 'gain_muscle' ? weightNum * 2 : weightNum * 1.6;
    const waterTarget = weightNum * 0.045;

    // Add calorie target to profile for AI generation
    const enrichedProfile = {
      ...profile,
      calorie_target: Math.round(calorieTarget)
    };

    // Generate AI-powered content based on training style
    let exercise = null;
    let yoga = null;
    let pilates = null;
    let meal = null;

    try {
      console.log('Generating meal with AI...');
      meal = await generateMeal(enrichedProfile);
      console.log('Meal generated:', meal.title);

      // Generate yoga if requested
      if (hasYoga) {
        console.log('Generating yoga session with AI...');
        try {
          yoga = await generateYoga(enrichedProfile);
          console.log('Yoga generated:', yoga.title);
        } catch (yogaError) {
          console.error('Yoga generation failed:', yogaError);
          // Continue with other content generation
        }
      }

      // Generate pilates if requested
      if (hasPilates) {
        console.log('Generating pilates workout with AI...');
        try {
          pilates = await generatePilates(enrichedProfile);
          console.log('Pilates generated:', pilates.title);
        } catch (pilatesError) {
          console.error('Pilates generation failed:', pilatesError);
          // Continue with other content generation
        }
      }

      // Generate strength training if requested
      if (hasStrength || hasGym || hasHome) {
        const equipmentType = hasGym ? 'gym' : 'home';
        console.log(`Generating ${equipmentType} exercise with AI...`);
        try {
          exercise = await generateExercise(enrichedProfile, equipmentType);
          console.log('Exercise generated:', exercise.title);
        } catch (exerciseError) {
          console.error('Exercise generation failed:', exerciseError);
          // Continue with other content generation
        }
      }
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      const errorMessage = aiError instanceof Error ? aiError.message : 'Unknown AI error';
      return new Response(
        JSON.stringify({ error: 'Failed to generate AI content', details: errorMessage }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct daily plan
    const dailyPlan = {
      user_id: user.id,
      plan_date: today,
      calorie_target: Math.round(calorieTarget),
      protein_target_g: Math.round(proteinTarget),
      daily_water_target_liters: parseFloat(waterTarget.toFixed(1)),
      
      exercise_title: exercise?.title || null,
      exercise_instructions: exercise?.instructions || null,
      reps_or_duration: exercise ? 'N/A' : 'N/A',
      exercises_json: exercise?.exercises || null,
      total_exercise_calories: exercise?.total_calories || null,
      
      meal_title: meal?.title || null,
      meal_instructions: meal?.instructions || null,
      meal_ingredients: meal?.ingredients || null,
      meal_calories_estimate: meal?.calories_estimate || null,
      
      yoga_title: yoga?.title || null,
      yoga_instructions: yoga?.instructions || null,
      yoga_duration_minutes: yoga?.duration_minutes || 0,
      yoga_poses_json: yoga?.poses || null,
      
      pilates_title: pilates?.title || null,
      pilates_instructions: pilates?.instructions || null,
      pilates_duration_minutes: pilates?.duration_minutes || 0,
      pilates_exercises_json: pilates?.exercises || null,
    };

    console.log('Upserting AI-generated plan to database');
    
    const { data: insertedPlan, error: insertError } = await supabase
      .from('daily_plans')
      .upsert(dailyPlan, { 
        onConflict: 'user_id,plan_date',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save plan', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI-powered plan generated successfully');

    return new Response(
      JSON.stringify(insertedPlan),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generateDailyPlan:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
