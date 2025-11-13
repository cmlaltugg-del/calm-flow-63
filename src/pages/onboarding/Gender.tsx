import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import OnboardingHeader from "@/components/OnboardingHeader";

const genderOptions = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
];

const Gender = () => {
  const navigate = useNavigate();
  const [selectedGender, setSelectedGender] = useState<string>("");

  const handleContinue = () => {
    sessionStorage.setItem("gender", selectedGender);
    navigate("/onboarding/target-weight");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-12">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
        <OnboardingHeader />
        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-light text-foreground">What's your gender?</h2>
            <p className="text-muted-foreground font-light">This helps us calculate your calorie needs</p>
          </div>

          <div className="space-y-3">
            {genderOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedGender(option.id)}
                className={cn(
                  "w-full p-6 rounded-2xl border-2 transition-all text-left flex items-center gap-2",
                  selectedGender === option.id
                    ? "border-primary bg-accent"
                    : "border-border bg-card hover:border-muted-foreground/30"
                )}
              >
                <User 
                  className={cn(
                    "h-6 w-6",
                    selectedGender === option.id ? "text-primary" : "text-[#4A4A4A]"
                  )} 
                />
                <span className="text-lg font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleContinue}
          disabled={!selectedGender}
          size="lg"
          className="w-full rounded-full h-14 text-base font-medium"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default Gender;
