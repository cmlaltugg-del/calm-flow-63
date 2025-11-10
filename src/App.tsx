import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import HeightWeight from "./pages/onboarding/HeightWeight";
import Goals from "./pages/onboarding/Goals";
import WorkoutMode from "./pages/onboarding/WorkoutMode";
import WaterPreview from "./pages/onboarding/WaterPreview";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/onboarding/height-weight" element={<HeightWeight />} />
          <Route path="/onboarding/goals" element={<Goals />} />
          <Route path="/onboarding/workout-mode" element={<WorkoutMode />} />
          <Route path="/onboarding/water-preview" element={<WaterPreview />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
