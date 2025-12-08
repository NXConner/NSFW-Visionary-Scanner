import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, FileText, Shield, AlertTriangle, Scale, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfService = () => {
  const navigate = useNavigate();
  const lastUpdated = "December 4, 2024";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/50 p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Terms of Service</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-6 h-6 text-primary" />
              GrowthTracker Terms of Service
            </CardTitle>
            <p className="text-sm text-muted-foreground">Last Updated: {lastUpdated}</p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-8 text-sm leading-relaxed">
                
                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground">1. Acceptance of Terms</h2>
                  <p className="text-muted-foreground">
                    By downloading, installing, or using the GrowthTracker application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App. We reserve the right to modify these Terms at any time, and your continued use of the App constitutes acceptance of any modifications.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground">2. Description of Service</h2>
                  <p className="text-muted-foreground mb-3">
                    GrowthTracker is a personal health tracking and wellness application designed to help users monitor and track personal health metrics. The App provides:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Personal measurement tracking and logging</li>
                    <li>Health diary and calendar features</li>
                    <li>Educational health content</li>
                    <li>Progress visualization and analytics</li>
                    <li>AI-powered health insights (Premium tier)</li>
                  </ul>
                </section>

                <section className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                  <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    3. Medical Disclaimer
                  </h2>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">IMPORTANT:</strong> GrowthTracker is NOT a medical device and is NOT intended to diagnose, treat, cure, or prevent any disease or medical condition.
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>The App is for informational and personal tracking purposes only</li>
                    <li>Always consult a qualified healthcare professional for medical advice</li>
                    <li>Do not delay seeking medical attention based on information from this App</li>
                    <li>AI-generated insights are not medical diagnoses</li>
                    <li>The App cannot replace professional medical examination</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground">4. User Eligibility</h2>
                  <p className="text-muted-foreground">
                    You must be at least 18 years of age to use this App. By using the App, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into these Terms. This App contains adult health content and is not intended for minors.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground">5. User Account</h2>
                  <p className="text-muted-foreground">
                    You may need to create an account to access certain features. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You agree to provide accurate information and to update it as necessary. We reserve the right to suspend or terminate accounts that violate these Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground">6. Subscription Tiers and Payments</h2>
                  <p className="text-muted-foreground mb-3">The App offers the following subscription tiers:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li><strong>Free:</strong> Basic features at no cost</li>
                    <li><strong>Pro ($9.99/month):</strong> Enhanced tracking and analytics features</li>
                    <li><strong>Premium ($19.99/month):</strong> Full access including AI features</li>
                  </ul>
                  <p className="text-muted-foreground mt-3">
                    Subscriptions auto-renew unless cancelled 24 hours before the renewal date. Refunds are subject to the policies of Apple App Store or Google Play Store.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground">7. User Content and Data</h2>
                  <p className="text-muted-foreground">
                    You retain ownership of all content you create or upload to the App. By using the App, you grant us a limited license to process your data solely for providing the App's services. Your health data is stored locally on your device with encryption. Cloud backup features (when enabled) use end-to-end encryption.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground">8. Prohibited Uses</h2>
                  <p className="text-muted-foreground mb-3">You agree not to:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Use the App for any illegal purpose</li>
                    <li>Share your account with others</li>
                    <li>Attempt to reverse engineer or modify the App</li>
                    <li>Use the App to collect data about other users</li>
                    <li>Circumvent any security features of the App</li>
                    <li>Use the App to distribute malware or harmful content</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground">9. Intellectual Property</h2>
                  <p className="text-muted-foreground">
                    All content, features, and functionality of the App (excluding user-generated content) are owned by GrowthTracker and are protected by international copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written permission.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground">10. Limitation of Liability</h2>
                  <p className="text-muted-foreground">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, GROWTHTRACKER AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE APP.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground">11. Indemnification</h2>
                  <p className="text-muted-foreground">
                    You agree to indemnify and hold harmless GrowthTracker and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, and expenses arising from your use of the App or violation of these Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground">12. Termination</h2>
                  <p className="text-muted-foreground">
                    We may terminate or suspend your access to the App immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the App ceases immediately. You may delete your account and data at any time through the App settings.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground">13. Changes to Terms</h2>
                  <p className="text-muted-foreground">
                    We reserve the right to modify these Terms at any time. We will notify users of material changes through the App or via email. Your continued use of the App after changes constitutes acceptance of the modified Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground">14. Governing Law</h2>
                  <p className="text-muted-foreground">
                    These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be resolved in the courts of competent jurisdiction.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    15. Contact Information
                  </h2>
                  <p className="text-muted-foreground">
                    If you have any questions about these Terms, please contact us at:
                  </p>
                  <div className="mt-3 p-4 bg-muted/30 rounded-lg">
                    <p className="text-foreground font-medium">GrowthTracker Support</p>
                    <p className="text-muted-foreground">Email: support@growthtracker.app</p>
                  </div>
                </section>

                <section className="border-t border-border pt-6">
                  <p className="text-center text-muted-foreground text-xs">
                    By using GrowthTracker, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                  </p>
                </section>

              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TermsOfService;
