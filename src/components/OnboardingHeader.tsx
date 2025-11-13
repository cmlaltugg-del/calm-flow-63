import { BrainCircuit, Activity } from "lucide-react";

const OnboardingHeader = () => {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-orange-500 flex items-center justify-center overflow-hidden">
        {/* Neural network pattern background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full"></div>
          <div className="absolute top-1 right-1 w-1 h-1 bg-white rounded-full"></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-white rounded-full"></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-white rounded-full"></div>
          <svg className="absolute inset-0" viewBox="0 0 40 40">
            <line x1="4" y1="4" x2="36" y2="36" stroke="white" strokeWidth="0.5" />
            <line x1="36" y1="4" x2="4" y2="36" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>
        {/* Main N letter */}
        <span className="relative text-white font-bold text-lg z-10">N</span>
        {/* Subtle icons */}
        <BrainCircuit className="absolute top-0.5 right-0.5 w-3 h-3 text-white/30" />
        <Activity className="absolute bottom-0.5 left-0.5 w-3 h-3 text-white/30" />
      </div>
      <div className="flex flex-col -space-y-1">
        <span className="text-lg font-bold bg-gradient-to-r from-primary via-purple-500 to-orange-500 bg-clip-text text-transparent">NIA</span>
        <span className="text-[10px] text-muted-foreground font-medium">Neural Intelligent Athlete</span>
      </div>
    </div>
  );
};

export default OnboardingHeader;
