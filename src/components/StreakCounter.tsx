import { Badge } from "@/components/ui/badge";
import { Flame } from "lucide-react";

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
}

export const StreakCounter = ({ currentStreak, longestStreak }: StreakCounterProps) => {
  if (currentStreak === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="outline" 
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-warning/10 to-streak-fire/10 border-warning/30"
      >
        <Flame className="w-4 h-4 text-streak-fire" />
        <span className="font-semibold text-foreground">{currentStreak} Day Streak</span>
      </Badge>
      {longestStreak > currentStreak && (
        <span className="text-xs text-muted-foreground">
          Best: {longestStreak}
        </span>
      )}
    </div>
  );
};
