import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-wellness-gradient-start to-wellness-gradient-end flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground">
            Your Daily Wellness Routine
          </h1>
          <p className="text-lg text-muted-foreground font-light">
            Small steps. Every day.
          </p>
        </div>
        
        <Button 
          onClick={() => navigate("/onboarding/training-style")}
          size="lg"
          className="w-full max-w-xs rounded-full h-14 text-base font-medium shadow-wellness"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default Welcome;
