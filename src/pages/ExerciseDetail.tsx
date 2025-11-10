import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const ExerciseDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { title, instructions, duration } = location.state || {};

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
          <h1 className="text-3xl font-light text-foreground">{title || "Exercise"}</h1>
          <p className="text-muted-foreground">{duration}</p>
        </div>

        <Card className="p-6 rounded-3xl shadow-wellness border-border/50 space-y-4">
          <h2 className="text-xl font-medium">Instructions</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {instructions || "No instructions available."}
          </p>
        </Card>

        <Button className="w-full rounded-full h-12">Mark as Complete</Button>
      </div>
    </div>
  );
};

export default ExerciseDetail;
