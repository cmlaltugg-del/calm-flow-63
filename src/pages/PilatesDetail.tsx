import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { triggerCelebration } from "@/lib/celebration";
import { triggerHaptic } from "@/lib/haptics";

const PilatesDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { title, instructions, duration, planId, exercises } = location.state || {};
  const { toast } = useToast();
  const [isCompleting, setIsCompleting] = useState(false);

  // Use exercises array if available, otherwise fall back to instructions
  const exercisesList = exercises || [{ title: 'Full Session', instructions: instructions || 'No instructions available', duration_minutes: 0 }];

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
        .update({ is_completed_pilates: true })
        .eq('id', planId);

      if (error) throw error;

      // Trigger celebration animation
      triggerCelebration('workout');
      triggerHaptic('success');

      toast({
        title: "Excellent! 🎉",
        description: "Pilates session completed! Amazing work!",
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
    <div className="min-h-screen bg-background pb-20 mb-safe">
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
          <h1 className="text-3xl font-light text-foreground">{title || "Pilates Session"}</h1>
          <p className="text-muted-foreground">{duration} • {exercisesList.length} {exercisesList.length === 1 ? 'exercise' : 'exercises'}</p>
        </div>

        <div className="space-y-4">
          {exercisesList.map((exercise: any, index: number) => (
            <Card key={index} className="p-6 rounded-3xl shadow-wellness border-border/50 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-medium">{exercise.title}</h2>
                    {exercise.duration_minutes > 0 && (
                      <span className="text-sm text-muted-foreground">{exercise.duration_minutes} min</span>
                    )}
                  </div>
                </div>
              </div>

              {exercise.gif_url && (
                <div className="rounded-2xl overflow-hidden bg-muted/30 aspect-video flex items-center justify-center">
                  <img
                    src={exercise.gif_url}
                    alt={`${exercise.title} demonstration`}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">How to Perform:</h3>
                <p className="text-foreground leading-relaxed">{exercise.instructions}</p>
              </div>
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

export default PilatesDetail;
