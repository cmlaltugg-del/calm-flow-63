import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Activity } from "lucide-react";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-wellness-gradient-start to-wellness-gradient-end flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-orange-500 flex items-center justify-center overflow-hidden shadow-lg">
              {/* Neural network pattern background */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-3 left-3 w-2 h-2 bg-white rounded-full"></div>
                <div className="absolute top-3 right-3 w-2 h-2 bg-white rounded-full"></div>
                <div className="absolute bottom-3 left-3 w-2 h-2 bg-white rounded-full"></div>
                <div className="absolute bottom-3 right-3 w-2 h-2 bg-white rounded-full"></div>
                <svg className="absolute inset-0" viewBox="0 0 96 96">
                  <line x1="12" y1="12" x2="84" y2="84" stroke="white" strokeWidth="1.5" />
                  <line x1="84" y1="12" x2="12" y2="84" stroke="white" strokeWidth="1.5" />
                </svg>
              </div>
              {/* Main N letter */}
              <span className="relative text-white font-bold text-5xl z-10">N</span>
              {/* Subtle icons */}
              <BrainCircuit className="absolute top-2 right-2 w-6 h-6 text-white/30" />
              <Activity className="absolute bottom-2 left-2 w-6 h-6 text-white/30" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-foreground">
              NIA
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-light tracking-wide">
              Neural Intelligent Athlete
            </p>
          </div>
          <p className="text-lg text-muted-foreground font-light italic">
            Train Smarter, Not Harder
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
