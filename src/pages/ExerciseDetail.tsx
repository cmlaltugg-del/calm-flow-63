import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { triggerCelebration } from "@/lib/celebration";

const ExerciseDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { title, instructions, duration, planId, exercises, totalCalories } = location.state || {};
  const { toast } = useToast();
  const [isCompleting, setIsCompleting] = useState(false);

  // Use exercises array if available, otherwise fall back to single exercise
  const exercisesList = exercises || [{ title, instructions, reps_or_duration: duration, calories: 0 }];

  const handleMarkComplete = async () => {
    if (!planId) {
      toast({
        title: "Error",
        description: "Unable to mark as complete. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsCompleting(true);
    try {
      const { error } = await supabase
        .from('daily_plans')
        .update({ is_completed_exercise: true })
        .eq('id', planId);

      if (error) throw error;

      // Trigger celebration animation
      triggerCelebration('workout');

      toast({
        title: "Awesome! 🎉",
        description: "Exercise completed! Great job!",
      });

      // Small delay to show confetti before navigation
      setTimeout(() => navigate("/dashboard"), 500);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update completion status.",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="space-y-2">
          <h1 className="text-3xl font-light text-foreground">Today's Workout</h1>
          <div className="flex gap-2">
            <p className="text-muted-foreground">{exercisesList.length} exercises</p>
            {totalCalories && <p className="text-muted-foreground">• {totalCalories} cal total</p>}
          </div>
        </div>

        <div className="space-y-4">
          {exercisesList.map((exercise: any, index: number) => (
            <Card key={index} className="p-6 rounded-3xl shadow-wellness border-border/50 space-y-3">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-medium">{exercise.title}</h2>
                {exercise.calories > 0 && (
                  <Badge variant="secondary">{exercise.calories} cal</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{exercise.reps_or_duration}</p>
              {exercise.instructions && (
                <p className="text-muted-foreground whitespace-pre-wrap">{exercise.instructions}</p>
              )}
            </Card>
          ))}
        </div>

        <Button 
          className="w-full rounded-full h-12"
          onClick={handleMarkComplete}
          disabled={isCompleting}
        >
          {isCompleting ? "Marking..." : "Mark as Complete"}
        </Button>
      </div>
    </div>
  );
};

export default ExerciseDetail;
