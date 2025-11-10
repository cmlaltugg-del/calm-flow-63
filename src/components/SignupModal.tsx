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

      // Wait for auth to complete
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Authentication failed. Please try again.');
      }

      if (height && weight && gender && targetWeight && age && goal && workoutMode) {
        // Upsert profile with onboarding data
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            height: parseFloat(height),
            weight: parseFloat(weight),
            gender: gender,
            target_weight_kg: parseFloat(targetWeight),
            age: parseInt(age),
            goal,
            workout_mode: workoutMode
          }, {
            onConflict: 'user_id'
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error('Failed to save your profile');
        }

        // Generate daily plan with retry logic
        let planGenerated = false;
        let retryCount = 0;
        const maxRetries = 1;

        while (!planGenerated && retryCount <= maxRetries) {
          try {
            const { data: planData, error: planError } = await supabase.functions.invoke('generateDailyPlan');
            
            if (planError) throw planError;
            
            planGenerated = true;
            
            toast({
              title: "Welcome!",
              description: "Your personalized plan is ready.",
            });
          } catch (planError: any) {
            console.error(`Daily plan generation attempt ${retryCount + 1} failed:`, planError);
            retryCount++;
            
            if (retryCount > maxRetries) {
              toast({
                title: "Almost there!",
                description: "We couldn't prepare your plan yet. Try again in a moment.",
              });
            } else {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
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
