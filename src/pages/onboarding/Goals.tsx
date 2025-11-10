import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const goals = [
  { id: "lose", label: "Lose Weight", icon: "📉" },
  { id: "gain", label: "Gain Muscle", icon: "💪" },
  { id: "maintain", label: "Maintain", icon: "⚖️" },
];

const Goals = () => {
  const navigate = useNavigate();
  const [selectedGoal, setSelectedGoal] = useState<string>("");

  const handleContinue = () => {
    localStorage.setItem("userGoal", selectedGoal);
    navigate("/onboarding/workout-mode");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-12">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
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
                  "w-full p-6 rounded-2xl border-2 transition-all text-left flex items-center gap-4",
                  selectedGoal === goal.id
                    ? "border-primary bg-accent"
                    : "border-border bg-card hover:border-muted-foreground/30"
                )}
              >
                <span className="text-3xl">{goal.icon}</span>
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
