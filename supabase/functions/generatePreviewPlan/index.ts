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
  const systemPrompt = `You are a certified yoga instructor. Generate a yoga session in JSON format.
Return ONLY valid JSON with this exact structure:
{
  "title": "Yoga Session Name",
  "instructions": "Detailed pose sequence and breathing instructions (max 250 chars)",
  "duration_minutes": 25
}`;

  const intensity = profile.intensity || 'medium';
  const prompt = `Create a ${intensity} intensity yoga session, duration 20-30 minutes. Focus on flexibility and mindfulness.`;

  const aiResponse = await generateWithAI(prompt, systemPrompt);
  const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response format');
  
  return JSON.parse(jsonMatch[0]);
}

// Generate personalized pilates workout
async function generatePilates(profile: any): Promise<any> {
  const systemPrompt = `You are a certified pilates instructor. Generate a pilates workout in JSON format.
Return ONLY valid JSON with this exact structure:
{
  "title": "Pilates Workout Name",
  "instructions": "Exercise sequence with focus points (max 250 chars)",
  "duration_minutes": 25
}`;

  const intensity = profile.intensity || 'medium';
  const levelMap: Record<string, string> = { low: 'beginner', medium: 'intermediate', high: 'advanced' };
  const level = levelMap[intensity] || 'intermediate';

  const prompt = `Create a ${level} pilates workout, 20-30 minutes. Focus on core strength and stability.`;

  const aiResponse = await generateWithAI(prompt, systemPrompt);
  const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response format');
  
  return JSON.parse(jsonMatch[0]);
}

// Generate personalized strength exercise
async function generateExercise(profile: any, equipmentType: 'gym' | 'home'): Promise<any> {
  const systemPrompt = `You are a certified personal trainer. Generate a strength training exercise in JSON format.
Return ONLY valid JSON with this exact structure:
{
  "title": "Exercise Name",
  "instructions": "Proper form and execution steps (max 200 chars)"
}`;

  const equipment = equipmentType === 'gym' ? 'gym equipment (barbells, machines)' : 'bodyweight or minimal home equipment';
  const intensity = profile.intensity || 'medium';
  const levelMap: Record<string, string> = { low: 'beginner', medium: 'intermediate', high: 'advanced' };
  const level = levelMap[intensity] || 'intermediate';

  const prompt = `Create a ${level} strength exercise using ${equipment}. Focus on major muscle groups.`;

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
    const { profile } = await req.json();
    
    if (!profile || !profile.weight) {
      return new Response(
        JSON.stringify({ error: 'Missing required profile data' }),
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
      
      pilates_title: pilates?.title || null,
      pilates_instructions: pilates?.instructions || null,
      pilates_duration_minutes: pilates?.duration_minutes || null,
      
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
