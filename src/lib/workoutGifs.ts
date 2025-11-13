import { supabase } from "@/integrations/supabase/client";

// Exercise name to GIF filename mapping
// Users will upload GIFs to Supabase Storage with these exact filenames
export const EXERCISE_GIFS: Record<string, string> = {
  // Gym Exercises
  "Push-ups": "pushups.gif",
  "Squats": "squats.gif",
  "Plank": "plank.gif",
  "Lunges": "lunges.gif",
  "Burpees": "burpees.gif",
  "Mountain Climbers": "mountain-climbers.gif",
  "Jumping Jacks": "jumping-jacks.gif",
  "Bench Press": "bench-press.gif",
  "Deadlift": "deadlift.gif",
  "Shoulder Press": "shoulder-press.gif",
  "Bicep Curls": "bicep-curls.gif",
  "Tricep Dips": "tricep-dips.gif",
  "Lat Pulldown": "lat-pulldown.gif",
  "Leg Press": "leg-press.gif",
  "Chest Fly": "chest-fly.gif",
  "Russian Twists": "russian-twists.gif",
  "Leg Raises": "leg-raises.gif",
  "Bicycle Crunches": "bicycle-crunches.gif",
  "Pull-ups": "pullups.gif",
  "Dumbbell Rows": "dumbbell-rows.gif",
};

export const YOGA_GIFS: Record<string, string> = {
  // Yoga Poses
  "Downward Dog": "downward-dog.gif",
  "Warrior I": "warrior-1.gif",
  "Warrior II": "warrior-2.gif",
  "Tree Pose": "tree-pose.gif",
  "Child's Pose": "childs-pose.gif",
  "Cat-Cow Stretch": "cat-cow.gif",
  "Cobra Pose": "cobra.gif",
  "Pigeon Pose": "pigeon.gif",
  "Triangle Pose": "triangle.gif",
  "Bridge Pose": "bridge.gif",
  "Seated Forward Bend": "seated-forward-bend.gif",
  "Corpse Pose": "corpse-pose.gif",
  "Plank Pose": "plank-yoga.gif",
  "Boat Pose": "boat-pose.gif",
  "Eagle Pose": "eagle.gif",
  "Half Moon Pose": "half-moon.gif",
  "Camel Pose": "camel.gif",
  "Fish Pose": "fish.gif",
  "Crow Pose": "crow.gif",
  "Mountain Pose": "mountain-pose.gif",
};

export const PILATES_GIFS: Record<string, string> = {
  // Pilates Exercises
  "The Hundred": "hundred.gif",
  "Roll Up": "roll-up.gif",
  "Single Leg Circle": "leg-circle.gif",
  "Rolling Like a Ball": "rolling-ball.gif",
  "Single Leg Stretch": "single-leg-stretch.gif",
  "Double Leg Stretch": "double-leg-stretch.gif",
  "Spine Stretch Forward": "spine-stretch.gif",
  "Swan Dive": "swan-dive.gif",
  "Single Straight Leg": "straight-leg.gif",
  "Criss Cross": "criss-cross.gif",
  "Teaser": "teaser.gif",
  "Swimming": "swimming-pilates.gif",
  "Leg Pull Front": "leg-pull-front.gif",
  "Side Kick Series": "side-kick.gif",
  "Seal": "seal.gif",
  "Shoulder Bridge": "shoulder-bridge.gif",
  "Scissors": "scissors.gif",
  "Mermaid": "mermaid.gif",
  "Side Plank": "side-plank.gif",
  "Corkscrew": "corkscrew.gif",
};

/**
 * Get the public URL for a workout GIF from Supabase Storage or local fallback
 * @param gifFileName - The filename from the mapping (e.g., "pushups.gif")
 * @returns Public URL of the GIF or local path
 */
export const getWorkoutGifUrl = (gifFileName: string): string | null => {
  if (!gifFileName) return null;
  
  // First try Supabase Storage
  const { data } = supabase.storage
    .from('workout-gifs')
    .getPublicUrl(gifFileName);
  
  if (data?.publicUrl) {
    return data.publicUrl;
  }
  
  // Fallback to local public folder
  // Convert .gif extension to .png for local files
  const localFileName = gifFileName.replace('.gif', '.png');
  return `/workout-gifs/${localFileName}`;
};

/**
 * Find GIF URL by exercise name
 * @param exerciseName - The name of the exercise
 * @param type - Type of workout (exercise, yoga, pilates)
 * @returns Public URL of the GIF or null
 */
export const findGifByName = (
  exerciseName: string, 
  type: 'exercise' | 'yoga' | 'pilates' = 'exercise'
): string | null => {
  const mapping = type === 'yoga' 
    ? YOGA_GIFS 
    : type === 'pilates' 
    ? PILATES_GIFS 
    : EXERCISE_GIFS;
  
  const gifFileName = mapping[exerciseName];
  return gifFileName ? getWorkoutGifUrl(gifFileName) : null;
};

// List of all available exercise names (for AI prompt guidance)
export const AVAILABLE_EXERCISES = Object.keys(EXERCISE_GIFS);
export const AVAILABLE_YOGA = Object.keys(YOGA_GIFS);
export const AVAILABLE_PILATES = Object.keys(PILATES_GIFS);
