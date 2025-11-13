import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dumbbell, Home, Flower2, Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const trainingOptions: { 
  id: string; 
  label: string; 
  icon: LucideIcon;
  gradient: string;
  iconColor: string;
}[] = [
  { 
    id: "gym", 
    label: "Gym", 
    icon: Dumbbell,
    gradient: "from-orange-500 to-red-500",
    iconColor: "text-white"
  },
  { 
    id: "home", 
    label: "Home Workout", 
    icon: Home,
    gradient: "from-blue-500 to-cyan-500",
    iconColor: "text-white"
  },
  { 
    id: "yoga", 
    label: "Yoga", 
    icon: Flower2,
    gradient: "from-purple-500 to-pink-500",
    iconColor: "text-white"
  },
  { 
    id: "pilates", 
    label: "Pilates", 
    icon: Activity,
    gradient: "from-emerald-500 to-teal-500",
    iconColor: "text-white"
  },
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
    
    // If gym is selected, continue with height/weight flow
    if (selected.includes("gym")) {
      navigate("/onboarding/height-weight");
    } else {
      // For pilates/yoga only, skip to intensity selection
      navigate("/onboarding/intensity");
    }
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
            {trainingOptions.map((opt) => {
              const IconComponent = opt.icon;
              const isSelected = selected.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleSelection(opt.id)}
                  className={cn(
                    "w-full h-32 flex flex-col justify-center items-center rounded-3xl border-2 transition-all overflow-hidden relative group",
                    isSelected
                      ? "border-transparent shadow-lg scale-105"
                      : "border-border bg-card hover:scale-105 hover:shadow-md"
                  )}
                >
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300",
                    opt.gradient,
                    isSelected && "opacity-100"
                  )} />
                  
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center mb-2 transition-all",
                      isSelected 
                        ? "bg-white/20 backdrop-blur-sm" 
                        : cn("bg-gradient-to-br", opt.gradient)
                    )}>
                      <IconComponent 
                        className={cn(
                          "w-8 h-8 transition-all",
                          isSelected ? opt.iconColor : "text-white"
                        )} 
                        strokeWidth={2.5}
                      />
                    </div>
                    <div className={cn(
                      "font-semibold text-sm transition-colors",
                      isSelected ? "text-white" : "text-foreground"
                    )}>
                      {opt.label}
                    </div>
                  </div>
                </button>
              );
            })}
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
