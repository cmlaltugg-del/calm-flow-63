import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Zap, Activity, Flame } from "lucide-react";

const intensityLevels = [
  { id: "low", label: "Low", subtitle: "Gentle & Relaxing", Icon: Zap },
  { id: "medium", label: "Medium", subtitle: "Balanced Effort", Icon: Activity },
  { id: "high", label: "High", subtitle: "Challenging & Intense", Icon: Flame },
];

const Intensity = () => {
  const navigate = useNavigate();
  const [selectedIntensity, setSelectedIntensity] = useState<string>("");

  const handleContinue = () => {
    sessionStorage.setItem("intensity", selectedIntensity);
    navigate("/onboarding/water-preview");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-12">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-light text-foreground">How intense should your sessions be?</h2>
            <p className="text-muted-foreground font-light">Choose your preferred difficulty level</p>
          </div>

          <div className="space-y-3">
            {intensityLevels.map((level) => (
              <button
                key={level.id}
                onClick={() => setSelectedIntensity(level.id)}
                className={cn(
                  "w-full p-6 rounded-2xl border-2 transition-all text-left flex items-center gap-2",
                  selectedIntensity === level.id
                    ? "border-primary bg-accent"
                    : "border-border bg-card hover:border-muted-foreground/30"
                )}
              >
                <level.Icon 
                  className={cn(
                    "h-6 w-6",
                    selectedIntensity === level.id ? "text-primary" : "text-[#4A4A4A]"
                  )} 
                />
                <div className="flex-1">
                  <div className="text-lg font-medium">{level.label}</div>
                  <div className="text-sm text-muted-foreground">{level.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleContinue}
          disabled={!selectedIntensity}
          size="lg"
          className="w-full rounded-full h-14 text-base font-medium"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default Intensity;
