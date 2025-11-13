import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import niaLogo from "@/assets/nia-logo.png";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-wellness-gradient-start to-wellness-gradient-end flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src={niaLogo} 
              alt="NIA Logo" 
              className="w-24 h-24 object-contain drop-shadow-2xl"
            />
          </div>
          
          <div className="space-y-3">
            <p className="text-xl md:text-2xl text-muted-foreground font-light tracking-wide">
              Neural Intelligent Athlete
            </p>
            <p className="text-lg text-muted-foreground font-light italic">
              Train Smarter, Not Harder
            </p>
          </div>
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
