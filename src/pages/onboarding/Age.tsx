import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import OnboardingHeader from "@/components/OnboardingHeader";

const Age = () => {
  const navigate = useNavigate();
  const [age, setAge] = useState("");

  const handleContinue = () => {
    sessionStorage.setItem("age", age);
    navigate("/onboarding/goals");
  };

  const isValid = age && parseInt(age) > 0 && parseInt(age) < 120;

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-12">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
        <OnboardingHeader />
        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-light text-foreground">What's your age?</h2>
            <p className="text-muted-foreground font-light">
              This helps us calculate your daily calorie needs
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="age" className="text-base">Age (years)</Label>
              <Input
                id="age"
                type="number"
                placeholder="e.g., 25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
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

export default Age;
