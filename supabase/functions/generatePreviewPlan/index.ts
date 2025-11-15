import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import { getCorsHeaders, validateProfile } from '../_shared/security.ts';

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

  const targetCalories = profile.calorie_target ? Math.round(profile.calorie_target / 3) : 450;
  const prompt = `Create a ${goalText} meal. Target calories: ${targetCalories} per meal.`;

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
  "instructions": "Overall workout guidance and form tips (max 200 chars)"
}

Available exercises: ${availableExercises.join(", ")}
IMPORTANT: Use ONLY exercises from the available list above.`;

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
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile } = await req.json();
    
    // Validate profile data
    const validation = validateProfile(profile);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating AI-powered preview plan');

    const trainingStyles = profile.training_styles || [];
    const hasGym = trainingStyles.includes('gym');
    const hasYoga = trainingStyles.includes('yoga');
    const hasPilates = trainingStyles.includes('pilates');
    const hasHome = trainingStyles.includes('home');
    const hasStrength = hasGym || hasHome;

    // Calculate nutritional targets
    const weightNum = profile.weight;
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

    // Generate AI-powered content
    let exercise = null;
    let yoga = null;
    let pilates = null;
    let meal = null;

    try {
      console.log('Generating preview content with AI...');
      meal = await generateMeal(enrichedProfile);
      console.log('Meal generated:', meal.title);

      if (hasYoga && !hasStrength && !hasPilates) {
        yoga = await generateYoga(enrichedProfile);
        console.log('Yoga generated:', yoga.title);
      } else if (hasPilates && !hasStrength && !hasYoga) {
        pilates = await generatePilates(enrichedProfile);
        console.log('Pilates generated:', pilates.title);
      } else if (hasYoga && hasPilates && !hasStrength) {
        yoga = await generateYoga(enrichedProfile);
        pilates = await generatePilates(enrichedProfile);
        console.log('Yoga + Pilates generated');
      } else if (hasStrength) {
        const equipmentType = hasGym ? 'gym' : 'home';
        exercise = await generateExercise(enrichedProfile, equipmentType);
        console.log('Exercise generated:', exercise.title);
        
        if (hasYoga) {
          yoga = await generateYoga(enrichedProfile);
        } else if (hasPilates) {
          pilates = await generatePilates(enrichedProfile);
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

    const plan = {
      daily_water_target_liters: parseFloat(waterTarget.toFixed(1)),
      
      meal_title: meal?.title || null,
      meal_instructions: meal?.instructions || null,
      meal_ingredients: meal?.ingredients || null,
      meal_calories_estimate: meal?.calories_estimate || null,
      
      exercise_title: exercise?.title || null,
      exercise_instructions: exercise?.instructions || null,
      
      yoga_title: yoga?.title || null,
      yoga_instructions: yoga?.instructions || null,
      yoga_duration_minutes: yoga?.duration_minutes || null,
      yoga_poses_json: yoga?.poses || null,
      
      pilates_title: pilates?.title || null,
      pilates_instructions: pilates?.instructions || null,
      pilates_duration_minutes: pilates?.duration_minutes || null,
      pilates_exercises_json: pilates?.exercises || null,
      
      calorie_target: Math.round(calorieTarget),
      protein_target_g: Math.round(proteinTarget),
    };

    console.log('AI-powered preview plan generated successfully');

    return new Response(
      JSON.stringify(plan),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generatePreviewPlan:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
