import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Flame, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getWeeklyEncouragement } from "@/lib/greetings";

interface WeeklySummaryCardProps {
  weeklyWorkouts: number;
  weeklyCalories: number;
  weeklyGoalPercentage: number;
}

export const WeeklySummaryCard = ({ 
  weeklyWorkouts, 
  weeklyCalories, 
  weeklyGoalPercentage 
}: WeeklySummaryCardProps) => {
  const encouragement = getWeeklyEncouragement(weeklyWorkouts, weeklyGoalPercentage);
  
  return (
    <Card className="bg-gradient-to-br from-info/5 to-info/10 border-info/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-info" />
          This Week's Stats
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">{encouragement}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-1">
            <Dumbbell className="w-5 h-5 text-muted-foreground mx-auto" />
            <p className="text-2xl font-bold text-foreground">{weeklyWorkouts}</p>
            <p className="text-xs text-muted-foreground">Workouts</p>
          </div>
          <div className="text-center space-y-1">
            <Flame className="w-5 h-5 text-warning mx-auto" />
            <p className="text-2xl font-bold text-foreground">{weeklyCalories}</p>
            <p className="text-xs text-muted-foreground">Calories</p>
          </div>
          <div className="text-center space-y-1">
            <Trophy className="w-5 h-5 text-success mx-auto" />
            <p className="text-2xl font-bold text-foreground">{weeklyGoalPercentage}%</p>
            <p className="text-xs text-muted-foreground">Goal</p>
          </div>
        </div>
        {weeklyGoalPercentage >= 100 && (
          <Badge className="w-full mt-4 justify-center bg-success hover:bg-success/90">
            🎉 Weekly Goal Achieved!
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};
