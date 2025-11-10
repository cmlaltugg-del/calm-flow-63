import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Droplet } from "lucide-react";

const WaterPreview = () => {
  const navigate = useNavigate();
  const weight = sessionStorage.getItem("weight") || "70";
  const dailyTarget = Math.round(parseInt(weight) * 0.033 * 10) / 10;

  const handleContinue = () => {
    sessionStorage.setItem("onboardingComplete", "true");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-12">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-light text-foreground">Daily water target</h2>
            <p className="text-muted-foreground font-light">Calculated automatically based on your weight</p>
          </div>

          <div className="bg-accent rounded-3xl p-8 text-center space-y-4">
            <div className="flex justify-center">
              <Droplet className="h-16 w-16 text-primary" />
            </div>
            <div className="space-y-1">
              <div className="text-5xl font-light text-primary">{dailyTarget}L</div>
              <div className="text-sm text-muted-foreground">per day</div>
            </div>
            <p className="text-sm text-muted-foreground pt-4">Stay hydrated throughout the day with gentle reminders</p>
          </div>
        </div>

        <Button
          onClick={handleContinue}
          size="lg"
          className="w-full rounded-full h-14 text-base font-medium"
        >
          Continue to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default WaterPreview;
