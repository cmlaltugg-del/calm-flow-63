import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Activity, Droplet, Utensils, Sparkles } from "lucide-react";

const Dashboard = () => {
  const [waterIntake, setWaterIntake] = useState(0);
  const userName = "Friend";
  const weight = localStorage.getItem("userWeight") || "70";
  const dailyWaterTarget = Math.round(parseInt(weight) * 0.033 * 10) / 10;
  const waterProgress = Math.min((waterIntake / dailyWaterTarget) * 100, 100);

  // Mock data - will be replaced with real data from backend
  const todayExercise = {
    title: "Morning Stretch",
    duration: "15 minutes",
  };

  const todayMeal = {
    title: "Protein Bowl",
    image: "🥗",
  };

  const todayYoga = {
    title: "Gentle Stretch Flow",
    duration: "10 minutes",
  };

  const addWater = () => {
    setWaterIntake((prev) => Math.min(prev + 0.25, dailyWaterTarget));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Greeting */}
        <div className="space-y-1">
          <h1 className="text-3xl font-light text-foreground">Hi 👋</h1>
          <p className="text-muted-foreground font-light">{userName}</p>
        </div>

        {/* Daily Progress Ring */}
        <Card className="p-6 rounded-3xl shadow-wellness border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PieChart className="h-6 w-6 text-[#4A4A4A]" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Daily Progress</p>
                <p className="text-2xl font-light">45%</p>
              </div>
            </div>
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-wellness-progress"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray="226"
                  strokeDashoffset="102"
                  strokeLinecap="round"
                  className="text-primary"
                />
              </svg>
            </div>
          </div>
        </Card>

        {/* Exercise Card */}
        <Card className="p-6 rounded-3xl shadow-wellness border-border/50 space-y-4">
          <div className="flex items-start gap-3">
            <Activity className="h-6 w-6 text-[#4A4A4A] mt-1" />
            <div className="flex-1 space-y-1">
              <p className="text-sm text-muted-foreground">Today's Exercise</p>
              <h3 className="text-xl font-medium">{todayExercise.title}</h3>
              <p className="text-muted-foreground">{todayExercise.duration}</p>
            </div>
          </div>
          <Button className="w-full rounded-full h-12">Start</Button>
        </Card>

        {/* Water Tracker */}
        <Card className="p-6 rounded-3xl shadow-wellness border-border/50 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplet className="h-6 w-6 text-primary" />
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Water Intake</p>
                  <p className="text-lg font-medium">
                    {waterIntake.toFixed(2)}L / {dailyWaterTarget}L
                  </p>
                </div>
              </div>
            </div>
            <Progress value={waterProgress} className="h-2" />
          </div>
          <Button
            onClick={addWater}
            variant="outline"
            className="w-full rounded-full h-12"
            disabled={waterIntake >= dailyWaterTarget}
          >
            + 0.25L
          </Button>
        </Card>

        {/* Meal Card */}
        <Card className="p-6 rounded-3xl shadow-wellness border-border/50 space-y-4">
          <div className="flex items-center gap-3">
            <Utensils className="h-6 w-6 text-[#4A4A4A]" />
            <div className="flex-1 space-y-1">
              <p className="text-sm text-muted-foreground">Today's Meal</p>
              <h3 className="text-xl font-medium">{todayMeal.title}</h3>
            </div>
          </div>
          <Button variant="outline" className="w-full rounded-full h-12">
            View Meal
          </Button>
        </Card>

        {/* Yoga Card */}
        <Card className="p-6 rounded-3xl shadow-wellness border-border/50 space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-[#4A4A4A]" />
            <div className="flex-1 space-y-1">
              <p className="text-sm text-muted-foreground">Today's Yoga</p>
              <h3 className="text-xl font-medium">{todayYoga.title}</h3>
              <p className="text-muted-foreground">{todayYoga.duration}</p>
            </div>
          </div>
          <Button className="w-full rounded-full h-12">Start Yoga</Button>
        </Card>

        {/* Footer Message */}
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground font-light italic">
            One small step is enough today.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
