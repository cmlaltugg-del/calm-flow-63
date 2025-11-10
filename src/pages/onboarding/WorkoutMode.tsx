import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Home, Dumbbell } from "lucide-react";

const modes = [
  { id: "home", label: "Home", subtitle: "No Equipment", Icon: Home },
  { id: "gym", label: "Gym", subtitle: "With Equipment", Icon: Dumbbell },
];

const WorkoutMode = () => {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<string>("");

  const handleContinue = () => {
    localStorage.setItem("workoutMode", selectedMode);
    navigate("/onboarding/water-preview");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-12">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-light text-foreground">Where will you work out?</h2>
            <p className="text-muted-foreground font-light">We'll customize exercises for you</p>
          </div>

          <div className="space-y-3">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={cn(
                  "w-full p-6 rounded-2xl border-2 transition-all text-left flex items-center gap-2",
                  selectedMode === mode.id
                    ? "border-primary bg-accent"
                    : "border-border bg-card hover:border-muted-foreground/30"
                )}
              >
                <mode.Icon 
                  className={cn(
                    "h-6 w-6",
                    selectedMode === mode.id ? "text-primary" : "text-[#4A4A4A]"
                  )} 
                />
                <div className="flex-1">
                  <div className="text-lg font-medium">{mode.label}</div>
                  <div className="text-sm text-muted-foreground">{mode.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleContinue}
          disabled={!selectedMode}
          size="lg"
          className="w-full rounded-full h-14 text-base font-medium"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default WorkoutMode;
