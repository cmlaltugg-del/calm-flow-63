import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplets, Loader2, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface WaterProgressBarProps {
  waterIntake: number;
  dailyTarget: number;
  onAddWater: () => void;
  loading?: boolean;
  isPreview?: boolean;
}

export const WaterProgressBar = ({ 
  waterIntake, 
  dailyTarget, 
  onAddWater, 
  loading = false,
  isPreview = false 
}: WaterProgressBarProps) => {
  const progress = (waterIntake / dailyTarget) * 100;
  const isCompleted = waterIntake >= dailyTarget;

  return (
    <Card className={isCompleted ? "bg-gradient-to-br from-info/10 to-info/5 border-info/30" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Droplets className={`w-5 h-5 ${isCompleted ? 'text-info' : 'text-muted-foreground'}`} />
            Water Intake
          </div>
          <span className="text-sm font-normal text-muted-foreground">
            {waterIntake.toFixed(1)}L / {dailyTarget}L
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Progress value={Math.min(progress, 100)} className="h-4" />
          {isCompleted && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-info-foreground">✓ Goal Reached!</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onAddWater}
              disabled={loading || isPreview}
              className="gap-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add 250ml
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {Math.round(progress)}% complete
          </p>
        </div>
        
        {isCompleted && (
          <p className="text-xs text-center text-info font-medium">
            💧 Excellent hydration today!
          </p>
        )}
      </CardContent>
    </Card>
  );
};
