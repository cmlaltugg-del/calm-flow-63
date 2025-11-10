import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const MealDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { title, instructions, ingredients, calories, planId } = location.state || {};
  const { toast } = useToast();
  const [isCompleting, setIsCompleting] = useState(false);

  const handleMarkEaten = async () => {
    if (!planId) {
      toast({
        title: "Error",
        description: "Unable to mark as eaten. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsCompleting(true);
    try {
      const { error } = await supabase
        .from('daily_plans')
        .update({ is_completed_meal: true })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Delicious!",
        description: "Meal marked as eaten.",
      });

      navigate("/dashboard");
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
          <h1 className="text-3xl font-light text-foreground">{title || "Today's Meal"}</h1>
          {calories && (
            <Badge variant="secondary" className="rounded-full">
              {calories} calories
            </Badge>
          )}
        </div>

        {ingredients && (
          <Card className="p-6 rounded-3xl shadow-wellness border-border/50 space-y-4">
            <h2 className="text-xl font-medium">Ingredients</h2>
            <ul className="text-muted-foreground space-y-2">
              {ingredients.split('\n').filter((item: string) => item.trim()).map((item: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{item.trim()}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card className="p-6 rounded-3xl shadow-wellness border-border/50 space-y-4">
          <h2 className="text-xl font-medium">How to Prepare</h2>
          
          <div className="mt-6 space-y-3">
            {instructions?.split('.').filter((step: string) => step.trim()).map((step: string, idx: number) => (
              <div key={idx} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-medium">
                  {idx + 1}
                </div>
                <p className="flex-1 text-muted-foreground">{step.trim()}</p>
              </div>
            )) || <p className="text-muted-foreground">No instructions available.</p>}
          </div>
        </Card>

        <Button 
          className="w-full rounded-full h-12"
          onClick={handleMarkEaten}
          disabled={isCompleting}
        >
          {isCompleting ? "Marking..." : "Mark as Eaten"}
        </Button>
      </div>
    </div>
  );
};

export default MealDetail;
