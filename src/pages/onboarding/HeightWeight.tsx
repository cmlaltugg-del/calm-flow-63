import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const HeightWeight = () => {
  const navigate = useNavigate();
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const handleContinue = () => {
    sessionStorage.setItem("height", height);
    sessionStorage.setItem("weight", weight);
    navigate("/onboarding/gender");
  };

  const isValid = height && weight;

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-12">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-light text-foreground">Let's get to know you</h2>
            <p className="text-muted-foreground font-light">This helps us personalize your experience</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="height" className="text-sm font-medium">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                placeholder="175"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="h-14 rounded-2xl text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight" className="text-sm font-medium">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="70"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="h-14 rounded-2xl text-base"
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

export default HeightWeight;
