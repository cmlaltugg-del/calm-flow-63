import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const trainingOptions = [
  { id: "gym", label: "Gym", emoji: "🏋️" },
  { id: "home", label: "Home Workout", emoji: "🏠" },
  { id: "yoga", label: "Yoga", emoji: "🧘" },
  { id: "pilates", label: "Pilates", emoji: "🧎‍♀️" },
];

const TrainingStyle = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    sessionStorage.setItem("trainingStyles", JSON.stringify(selected));
    navigate("/onboarding/water-preview");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-12">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-light text-foreground">Choose your training styles</h2>
            <p className="text-muted-foreground font-light">
              You can select more than one
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {trainingOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => toggleSelection(opt.id)}
                className={cn(
                  "w-full h-28 flex flex-col justify-center items-center rounded-2xl border transition-all",
                  selected.includes(opt.id)
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-accent"
                )}
              >
                <div className="text-3xl">{opt.emoji}</div>
                <div className="font-medium mt-1">{opt.label}</div>
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleContinue}
          disabled={selected.length === 0}
          size="lg"
          className="w-full rounded-full h-14 text-base font-medium"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default TrainingStyle;
