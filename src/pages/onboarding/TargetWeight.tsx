import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TargetWeight = () => {
  const navigate = useNavigate();
  const [targetWeight, setTargetWeight] = useState("");

  const handleContinue = () => {
    sessionStorage.setItem("targetWeight", targetWeight);
    navigate("/onboarding/age");
  };

  const isValid = targetWeight && parseFloat(targetWeight) > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-12">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-light text-foreground">What's your target weight?</h2>
            <p className="text-muted-foreground font-light">
              This helps us personalize your calorie and protein goals
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetWeight" className="text-base">Target Weight (kg)</Label>
              <Input
                id="targetWeight"
                type="number"
                placeholder="e.g., 70"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                className="h-14 text-base"
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handleContinue}
          disabled={!isValid}
          size="lg"
          className="w-full rounded-full h-14 text-base font-medium"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default TargetWeight;
