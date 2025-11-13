import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";
import { getMotivationalMessage } from "@/lib/greetings";

interface DailyProgressCardProps {
  completedCount: number;
  totalCount: number;
  isPreview?: boolean;
  currentStreak?: number;
}

export const DailyProgressCard = ({ completedCount, totalCount, isPreview, currentStreak = 0 }: DailyProgressCardProps) => {
  const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  
  const message = isPreview 
    ? "Complete your signup to track progress!"
    : getMotivationalMessage(currentStreak, percentage);

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Today's Progress</span>
          <span className="text-2xl font-bold text-primary">{completedCount}/{totalCount}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={percentage} className="h-3" />
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span>{completedCount} completed</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Circle className="w-3.5 h-3.5" />
            <span>{totalCount - completedCount} remaining</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
