import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Apple } from 'lucide-react';

interface SignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignupSuccess: () => void;
  cardSource?: string;
}

export const SignupModal = ({ open, onOpenChange, onSignupSuccess, cardSource }: SignupModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) throw error;

      // Get onboarding data from session storage
      const height = sessionStorage.getItem('height');
      const weight = sessionStorage.getItem('weight');
      const gender = sessionStorage.getItem('gender');
      const targetWeight = sessionStorage.getItem('targetWeight');
      const age = sessionStorage.getItem('age');
      const goal = sessionStorage.getItem('goal');
      const workoutMode = sessionStorage.getItem('workoutMode');

      // Wait for auth to complete and get user
      let user = null;
      let attempts = 0;
      while (!user && attempts < 5) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const { data } = await supabase.auth.getUser();
        user = data.user;
        attempts++;
      }

      if (!user) {
        throw new Error('Authentication failed. Please try again.');
      }

      if (height && weight && gender && targetWeight && age && goal && workoutMode) {
        // Calculate BMR, TDEE, and targets
        const weightNum = parseFloat(weight);
        const heightNum = parseFloat(height);
        const ageNum = parseInt(age);
        const targetWeightNum = parseFloat(targetWeight);
        
        // BMR calculation
        let bmr;
        if (gender === 'male') {
          bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
        } else {
          bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
        }
        
        // TDEE calculation
        const activityFactor = workoutMode === 'home' ? 1.45 : 1.55;
        const tdee = bmr * activityFactor;
        
        // Daily calorie target
        const daily_calories = Math.round(tdee - 350);
        
        // Protein target
        const protein_target = Math.round(targetWeightNum * 2);

        // Upsert profile with onboarding data
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            height: heightNum,
            weight: weightNum,
            gender: gender,
            target_weight_kg: targetWeightNum,
            age: ageNum,
            goal,
            workout_mode: workoutMode,
            daily_calories,
            protein_target
          }, {
            onConflict: 'user_id'
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error('Failed to save your profile');
        }

        // Wait a bit more to ensure profile is committed
        await new Promise(resolve => setTimeout(resolve, 500));

        // Generate daily plan
        try {
          const { error: planError } = await supabase.functions.invoke('generateDailyPlan');
          
          if (planError) {
            console.error('Daily plan generation failed:', planError);
            toast({
              title: "Almost there!",
              description: "Your account is ready. Your plan will be generated when you reach the dashboard.",
            });
          } else {
            toast({
              title: "Welcome!",
              description: "Your personalized plan is ready.",
            });
          }
        } catch (planError: any) {
          console.error('Daily plan generation error:', planError);
          toast({
            title: "Almost there!",
            description: "Your account is ready. Your plan will be generated when you reach the dashboard.",
          });
        }
      }

      console.log('signup_completed');
      
      // Clear onboarding data from session
      sessionStorage.removeItem('height');
      sessionStorage.removeItem('weight');
      sessionStorage.removeItem('gender');
      sessionStorage.removeItem('targetWeight');
      sessionStorage.removeItem('age');
      sessionStorage.removeItem('goal');
      sessionStorage.removeItem('workoutMode');
      sessionStorage.removeItem('onboardingComplete');
      
      onSignupSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Signup failed",
        description: error.message || 'An error occurred during signup',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      console.log('signup_cancelled');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Create your free account</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
            disabled
          >
            <Apple className="mr-2 h-4 w-4" />
            Continue with Apple
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By creating an account you agree to our Terms
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};
