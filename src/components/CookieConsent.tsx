import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkConsent = async () => {
      // Check localStorage first for non-authenticated users
      const localConsent = localStorage.getItem('cookie_consent');
      
      if (user) {
        // For authenticated users, check database
        const { data: profile } = await supabase
          .from('profiles')
          .select('cookie_consent')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.cookie_consent === null) {
          setShowBanner(true);
        }
      } else if (!localConsent) {
        // For non-authenticated users, check localStorage
        setShowBanner(true);
      }
    };

    checkConsent();
  }, [user]);

  const handleAccept = async () => {
    localStorage.setItem('cookie_consent', 'accepted');
    
    if (user) {
      await supabase
        .from('profiles')
        .update({
          cookie_consent: true,
          cookie_consent_date: new Date().toISOString()
        })
        .eq('user_id', user.id);
    }
    
    setShowBanner(false);
  };

  const handleReject = async () => {
    localStorage.setItem('cookie_consent', 'rejected');
    
    if (user) {
      await supabase
        .from('profiles')
        .update({
          cookie_consent: false,
          cookie_consent_date: new Date().toISOString()
        })
        .eq('user_id', user.id);
    }
    
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-20 md:pb-4">
      <Card className="max-w-3xl mx-auto p-6 bg-background/95 backdrop-blur-sm border-border shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Cookie Consent</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We use cookies for authentication and to improve your experience. 
              By accepting, you agree to our use of cookies as described in our{' '}
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleAccept} size="sm">
                Accept All
              </Button>
              <Button onClick={handleReject} variant="outline" size="sm">
                Reject Non-Essential
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReject}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
