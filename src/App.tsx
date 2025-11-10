import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Welcome from "./pages/Welcome";
import HeightWeight from "./pages/onboarding/HeightWeight";
import Gender from "./pages/onboarding/Gender";
import TargetWeight from "./pages/onboarding/TargetWeight";
import Age from "./pages/onboarding/Age";
import Goals from "./pages/onboarding/Goals";
import WorkoutMode from "./pages/onboarding/WorkoutMode";
import WaterPreview from "./pages/onboarding/WaterPreview";
import Dashboard from "./pages/Dashboard";
import ExerciseDetail from "./pages/ExerciseDetail";
import YogaDetail from "./pages/YogaDetail";
import MealDetail from "./pages/MealDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/onboarding/height-weight" element={<HeightWeight />} />
            <Route path="/onboarding/gender" element={<Gender />} />
            <Route path="/onboarding/target-weight" element={<TargetWeight />} />
            <Route path="/onboarding/age" element={<Age />} />
            <Route path="/onboarding/goals" element={<Goals />} />
            <Route path="/onboarding/workout-mode" element={<WorkoutMode />} />
            <Route path="/onboarding/water-preview" element={<WaterPreview />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/exercise-detail" element={<ExerciseDetail />} />
            <Route path="/yoga-detail" element={<YogaDetail />} />
            <Route path="/meal-detail" element={<MealDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
