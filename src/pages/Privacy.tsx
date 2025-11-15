import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
              <p className="text-muted-foreground">
                This Privacy Policy explains how we collect, use, disclose, and safeguard 
                your information when you use our fitness application. This policy complies 
                with GDPR, CCPA, and other applicable data protection regulations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">2. Data We Collect</h2>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Personal Information:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Email address (for authentication)</li>
                  <li>Name (optional)</li>
                  <li>Profile data (height, weight, age, gender)</li>
                  <li>Fitness goals and preferences</li>
                </ul>
                <p className="mt-4"><strong>Usage Data:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Workout completion history</li>
                  <li>Daily plan generations</li>
                  <li>Water intake tracking</li>
                  <li>App usage statistics</li>
                </ul>
                <p className="mt-4"><strong>Technical Data:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Device information</li>
                  <li>IP address</li>
                  <li>Browser type and version</li>
                  <li>Authentication cookies</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">3. How We Use Your Data</h2>
              <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground">
                <li>To provide personalized fitness and meal plans</li>
                <li>To track your progress and achievements</li>
                <li>To authenticate and secure your account</li>
                <li>To improve our services and user experience</li>
                <li>To send service-related notifications (if consented)</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">4. Data Storage and Security</h2>
              <p className="text-muted-foreground">
                Your data is stored securely using industry-standard encryption. We use 
                secure cloud infrastructure with regular backups and strict access controls. 
                All data transmissions are encrypted using TLS/SSL protocols.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">5. Your Rights (GDPR)</h2>
              <p className="text-muted-foreground mb-2">
                Under GDPR and similar regulations, you have the following rights:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground">
                <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your data</li>
                <li><strong>Right to Data Portability:</strong> Receive your data in a structured format</li>
                <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                <li><strong>Right to Object:</strong> Object to certain data processing activities</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                To exercise these rights, visit your Settings page or contact us directly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">6. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your personal data only as long as necessary to provide our services 
                or as required by law. Upon account deletion, your data is permanently removed 
                within 30 days, except where retention is legally required.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">7. Cookies</h2>
              <p className="text-muted-foreground">
                We use essential cookies for authentication and session management. You can 
                manage cookie preferences through the cookie consent banner or your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">8. Third-Party Services</h2>
              <p className="text-muted-foreground">
                We may use third-party services for analytics and infrastructure. These 
                services are GDPR-compliant and process data according to their privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">9. Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our service is not intended for users under 13 years of age. We do not 
                knowingly collect data from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">10. International Data Transfers</h2>
              <p className="text-muted-foreground">
                Your data may be transferred and processed in countries outside your residence. 
                We ensure appropriate safeguards are in place for such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">11. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy periodically. Changes will be posted on this 
                page with an updated revision date. Continued use constitutes acceptance of changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">12. Contact Us</h2>
              <p className="text-muted-foreground">
                For privacy-related questions or to exercise your rights, please contact us at:
                <br />
                <strong>Email:</strong> privacy@yourapp.com
                <br />
                <strong>Data Protection Officer:</strong> dpo@yourapp.com
              </p>
            </section>

            <div className="pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground italic">
                This privacy policy is designed to be GDPR, CCPA, and international data 
                protection regulation compliant. For jurisdiction-specific inquiries, please 
                contact our Data Protection Officer.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;
