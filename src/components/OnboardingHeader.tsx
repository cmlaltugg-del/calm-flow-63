import niaLogo from "@/assets/nia-logo.png";

const OnboardingHeader = () => {
  return (
    <div className="flex items-center gap-3 mb-8">
      <img 
        src={niaLogo} 
        alt="NIA Logo" 
        className="w-10 h-10 object-contain"
      />
      <div className="flex flex-col -space-y-1">
        <span className="text-lg font-bold bg-gradient-to-r from-primary via-purple-500 to-orange-500 bg-clip-text text-transparent">NIA</span>
        <span className="text-[10px] text-muted-foreground font-medium">Neural Intelligent Athlete</span>
      </div>
    </div>
  );
};

export default OnboardingHeader;
