import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, FileText, Shield, Scale, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfServicePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Terms of Service - GrowthTracker";
  }, []);

  return (
    <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="ml-4 text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Terms of Service
            </h1>
          </div>
        </header>

        <main className="container max-w-4xl py-8 px-4">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-6 w-6 text-primary" />
                GrowthTracker Terms of Service
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Last updated: December 2024
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[70vh] pr-4">
                <div className="space-y-6 text-sm">
                  {/* Important Notice */}
                  <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-warning mb-1">Important Medical Disclaimer</h3>
                        <p className="text-muted-foreground">
                          GrowthTracker is NOT a medical device and is NOT intended to diagnose, treat, cure, 
                          or prevent any disease or medical condition. Always consult with a qualified healthcare 
                          provider for medical advice.
                        </p>
                      </div>
                    </div>
                  </div>

                  <section>
                    <h2 className="text-lg font-semibold mb-3">1. Acceptance of Terms</h2>
                    <p className="text-muted-foreground mb-2">
                      By accessing or using GrowthTracker ("the App"), you agree to be bound by these Terms of Service 
                      ("Terms"). If you do not agree to these Terms, do not use the App.
                    </p>
                    <p className="text-muted-foreground">
                      These Terms constitute a legally binding agreement between you and GrowthTracker regarding your 
                      use of the App and any related services.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-lg font-semibold mb-3">2. Description of Service</h2>
                    <p className="text-muted-foreground mb-2">
                      GrowthTracker is a personal health tracking application designed for adult men to:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Track personal health measurements and progress</li>
                      <li>Access educational content about men's health</li>
                      <li>Use scanning features for measurement assistance</li>
                      <li>Maintain a private health diary</li>
                      <li>Access AI-powered health insights (where available)</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-lg font-semibold mb-3">3. Medical Disclaimer</h2>
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 mb-3">
                      <p className="text-muted-foreground font-medium">
                        THE APP IS NOT A SUBSTITUTE FOR PROFESSIONAL MEDICAL ADVICE, DIAGNOSIS, OR TREATMENT.
                      </p>
                    </div>
                    <p className="text-muted-foreground mb-2">
                      The App provides general health information for educational purposes only. You should:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Never disregard professional medical advice because of information from the App</li>
                      <li>Always seek the advice of qualified health providers with any questions</li>
                      <li>Contact emergency services immediately for any medical emergency</li>
                      <li>Not rely on the App for medical decisions</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-lg font-semibold mb-3">4. User Eligibility</h2>
                    <p className="text-muted-foreground mb-2">
                      To use GrowthTracker, you must:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Be at least 18 years of age</li>
                      <li>Have the legal capacity to enter into binding agreements</li>
                      <li>Not be prohibited from using the App under applicable laws</li>
                      <li>Provide accurate and complete information when creating an account</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-lg font-semibold mb-3">5. Privacy and Data Protection</h2>
                    <p className="text-muted-foreground mb-2">
                      Your privacy is paramount. GrowthTracker is designed with privacy-first principles:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>All sensitive health data is stored locally on your device by default</li>
                      <li>Data is encrypted using AES-256 encryption</li>
                      <li>We do not sell or share your personal health information</li>
                      <li>Cloud sync is optional and user-controlled</li>
                      <li>You can export or delete your data at any time</li>
                    </ul>
                    <p className="text-muted-foreground mt-2">
                      Please review our Privacy Policy for complete details on data handling practices.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-lg font-semibold mb-3">6. Account Responsibilities</h2>
                    <p className="text-muted-foreground mb-2">
                      You are responsible for:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Maintaining the confidentiality of your account credentials</li>
                      <li>All activities that occur under your account</li>
                      <li>Notifying us immediately of any unauthorized access</li>
                      <li>Ensuring your device security (PIN, biometric locks, etc.)</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-lg font-semibold mb-3">7. Acceptable Use</h2>
                    <p className="text-muted-foreground mb-2">
                      You agree NOT to:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Use the App for any unlawful purpose</li>
                      <li>Attempt to gain unauthorized access to any systems</li>
                      <li>Distribute malware or harmful code</li>
                      <li>Reverse engineer or decompile the App</li>
                      <li>Use the App to track or store information about others without consent</li>
                      <li>Misrepresent your identity or affiliation</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-lg font-semibold mb-3">8. Subscription and Payments</h2>
                    <p className="text-muted-foreground mb-2">
                      GrowthTracker offers both free and premium subscription tiers:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Free tier includes basic scanning, diary, and educational features</li>
                      <li>Premium features require an active subscription</li>
                      <li>Subscriptions auto-renew unless cancelled before the renewal date</li>
                      <li>Refunds are handled according to app store policies</li>
                      <li>Prices may change with reasonable notice</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-lg font-semibold mb-3">9. Intellectual Property</h2>
                    <p className="text-muted-foreground">
                      All content, features, and functionality of the App are owned by GrowthTracker and are 
                      protected by international copyright, trademark, and other intellectual property laws. 
                      You may not copy, modify, distribute, or create derivative works without express permission.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-lg font-semibold mb-3">10. Limitation of Liability</h2>
                    <p className="text-muted-foreground mb-2">
                      TO THE MAXIMUM EXTENT PERMITTED BY LAW:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>The App is provided "AS IS" without warranties of any kind</li>
                      <li>We are not liable for any indirect, incidental, or consequential damages</li>
                      <li>We are not responsible for health decisions made based on App information</li>
                      <li>Total liability is limited to the amount paid for the service</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-lg font-semibold mb-3">11. Indemnification</h2>
                    <p className="text-muted-foreground">
                      You agree to indemnify and hold harmless GrowthTracker, its affiliates, officers, employees, 
                      and agents from any claims, damages, or expenses arising from your use of the App, violation 
                      of these Terms, or infringement of any rights of another party.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-lg font-semibold mb-3">12. Termination</h2>
                    <p className="text-muted-foreground mb-2">
                      We may terminate or suspend your access to the App:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>For violation of these Terms</li>
                      <li>For any conduct we deem harmful or inappropriate</li>
                      <li>At our discretion with or without notice</li>
                    </ul>
                    <p className="text-muted-foreground mt-2">
                      Upon termination, your right to use the App ceases immediately. Data stored locally 
                      on your device remains accessible to you.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-lg font-semibold mb-3">13. Changes to Terms</h2>
                    <p className="text-muted-foreground">
                      We reserve the right to modify these Terms at any time. We will notify users of significant 
                      changes through the App or via email. Continued use of the App after changes constitutes 
                      acceptance of the modified Terms.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-lg font-semibold mb-3">14. Governing Law</h2>
                    <p className="text-muted-foreground">
                      These Terms shall be governed by and construed in accordance with applicable laws, 
                      without regard to conflict of law principles. Any disputes arising from these Terms 
                      shall be resolved through binding arbitration.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-lg font-semibold mb-3">15. Contact Information</h2>
                    <p className="text-muted-foreground mb-2">
                      For questions about these Terms, please contact us:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Email: support@growthtracker.app</li>
                      <li>In-App: Settings → Support</li>
                    </ul>
                  </section>

                  <section className="pt-6 border-t">
                    <p className="text-muted-foreground italic text-center">
                      By using GrowthTracker, you acknowledge that you have read, understood, and agree 
                      to be bound by these Terms of Service.
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

export default TermsOfServicePage;
