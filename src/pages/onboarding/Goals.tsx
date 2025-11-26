import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Scale, Activity, Heart } from "lucide-react";
import OnboardingHeader from "@/components/OnboardingHeader";

const Goals = () => {
  const navigate = useNavigate();
  const [selectedGoal, setSelectedGoal] = useState<string>("");

  // Check training styles to determine which goals to show
  const trainingStyles = JSON.parse(sessionStorage.getItem("trainingStyles") || "[]");
  const hasGymOrHome = trainingStyles.includes("gym") || trainingStyles.includes("home");
  const isYogaPilatesOnly = !hasGymOrHome && (trainingStyles.includes("yoga") || trainingStyles.includes("pilates"));

  // Dynamic goals based on training style
  const goals = isYogaPilatesOnly ? [
    { id: "lose_weight", label: "Lose Weight", Icon: Scale },
    { id: "tone_flexibility", label: "Tone & Flexibility", Icon: Activity },
    { id: "maintain", label: "Maintain", Icon: Heart },
  ] : [
    { id: "lose_weight", label: "Lose Weight", Icon: Scale },
    { id: "gain_muscle", label: "Gain Muscle", Icon: Activity },
    { id: "maintain", label: "Maintain", Icon: Heart },
  ];

  const handleContinue = () => {
    sessionStorage.setItem("goal", selectedGoal);

    if (hasGymOrHome) {
      // Users with gym/home workout continue to workout mode
      navigate("/onboarding/workout-mode");
    } else {
      // Yoga/Pilates only users set a home workout mode and choose intensity
      sessionStorage.setItem("workoutMode", "home");
      navigate("/onboarding/intensity");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-12">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
        <OnboardingHeader />
        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-light text-foreground">What's your goal?</h2>
            <p className="text-muted-foreground font-light">Choose what matters most to you</p>
          </div>

          <div className="space-y-3">
            {goals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => setSelectedGoal(goal.id)}
                className={cn(
                  "w-full p-6 rounded-2xl border-2 transition-all text-left flex items-center gap-2",
                  selectedGoal === goal.id
                    ? "border-primary bg-accent"
                    : "border-border bg-card hover:border-muted-foreground/30"
                )}
              >
                <goal.Icon 
                  className={cn(
                    "h-6 w-6",
                    selectedGoal === goal.id ? "text-primary" : "text-[#4A4A4A]"
                  )} 
                />
                <span className="text-lg font-medium">{goal.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleContinue}
          disabled={!selectedGoal}
          size="lg"
          className="w-full rounded-full h-14 text-base font-medium"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default Goals;
