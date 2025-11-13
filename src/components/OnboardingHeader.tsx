const OnboardingHeader = () => {
  return (
    <div className="flex items-center gap-2 mb-8">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
        <span className="text-primary-foreground font-bold text-sm">N</span>
      </div>
      <span className="text-base font-bold text-primary">NIA</span>
    </div>
  );
};

export default OnboardingHeader;
