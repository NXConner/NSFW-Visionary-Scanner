import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Lock, Database, Eye, Trash2, Mail, Globe } from "lucide-react";
import { APP_NAME, PRIVACY_CONTACT_EMAIL, DPO_CONTACT_EMAIL, isLikelyEmail } from "@/config/brand";
import { RouteTopNav } from "@/components/navigation/RouteTopNav";

const PrivacyPolicy = () => {
  const lastUpdated = "December 4, 2024";

  return (
    <div className="min-h-screen bg-background">
      <RouteTopNav
        title="Privacy Policy"
        backTo="/"
        backLabel="Home"
        showFullNavigation={true}
        actions={[
          {
            key: "icon",
            kind: "custom",
            node: (
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-primary" />
                <span>{APP_NAME}</span>
              </div>
            ),
          },
        ]}
      />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="sr-only">Privacy Policy</h1>
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-6 h-6 text-primary" />
              {APP_NAME} Privacy Policy
            </CardTitle>
            <p className="text-sm text-muted-foreground">Last Updated: {lastUpdated}</p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-8 text-sm leading-relaxed">
                <section className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                  <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Our Privacy Commitment
                  </h2>
                  <p className="text-muted-foreground">
                    {APP_NAME} is designed with privacy as a core principle. Your sensitive health
                    data is stored{" "}
                    <strong className="text-foreground">locally on your device</strong> with AES-256
                    encryption. We do not sell, share, or monetize your personal health information.
                    You have complete control over your data.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground">1. Introduction</h2>
                  <p className="text-muted-foreground">
                    This Privacy Policy explains how {APP_NAME} ("we," "us," or "our") collects,
                    uses, stores, and protects your information when you use our mobile application
                    ("App"). We are committed to protecting your privacy and ensuring the security
                    of your personal health information.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    2. Information We Collect
                  </h2>

                  <h3 className="font-medium text-foreground mt-4 mb-2">
                    2.1 Information You Provide
                  </h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Account information (email address, password)</li>
                    <li>Profile information (display name)</li>
                    <li>Health measurements and tracking data</li>
                    <li>Health diary entries and notes</li>
                    <li>Photos uploaded for progress tracking</li>
                    <li>Preferences and settings</li>
                  </ul>

                  <h3 className="font-medium text-foreground mt-4 mb-2">
                    2.2 Automatically Collected Information
                  </h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Device information (device type, operating system)</li>
                    <li>App usage analytics (feature usage, session duration)</li>
                    <li>Crash reports and error logs</li>
                  </ul>

                  <h3 className="font-medium text-foreground mt-4 mb-2">
                    2.3 Information We Do NOT Collect
                  </h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Location data</li>
                    <li>Contact lists</li>
                    <li>Call logs or messages</li>
                    <li>Browsing history</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    3. Data Storage and Security
                  </h2>

                  <h3 className="font-medium text-foreground mt-4 mb-2">
                    3.1 Local Storage (Default)
                  </h3>
                  <p className="text-muted-foreground mb-3">
                    By default, all sensitive health data is stored locally on your device using
                    AES-256-GCM encryption. This means:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>
                      Your health data never leaves your device unless you choose to export it
                    </li>
                    <li>We cannot access your health measurements or photos</li>
                    <li>Data is encrypted at rest on your device</li>
                    <li>Deleting the app removes all local data</li>
                  </ul>

                  <h3 className="font-medium text-foreground mt-4 mb-2">
                    3.2 Cloud Backup (Optional - Pro/Premium)
                  </h3>
                  <p className="text-muted-foreground mb-3">If you enable cloud backup:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Data is encrypted before transmission</li>
                    <li>Stored on secure servers with encryption at rest</li>
                    <li>Only accessible with your account credentials</li>
                    <li>You can delete cloud data at any time</li>
                  </ul>

                  <h3 className="font-medium text-foreground mt-4 mb-2">3.3 Security Measures</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>AES-256-GCM encryption for all health data</li>
                    <li>Secure authentication with password hashing</li>
                    <li>Optional biometric authentication (Face ID/Touch ID)</li>
                    <li>App lock with PIN protection</li>
                    <li>Secure HTTPS connections for all network requests</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" />
                    4. How We Use Your Information
                  </h2>
                  <p className="text-muted-foreground mb-3">We use your information to:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Provide and maintain the App's functionality</li>
                    <li>Process your health tracking and measurements</li>
                    <li>Generate analytics and progress reports</li>
                    <li>Provide AI-powered insights (Premium tier)</li>
                    <li>Send notifications you've requested</li>
                    <li>Improve the App based on usage patterns</li>
                    <li>Provide customer support</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground">5. Data Sharing</h2>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">
                      We do NOT sell your personal information.
                    </strong>{" "}
                    We may share limited data only in these circumstances:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>
                      <strong>Service Providers:</strong> Trusted partners who help operate our
                      services (cloud hosting, analytics), bound by confidentiality agreements
                    </li>
                    <li>
                      <strong>Legal Requirements:</strong> When required by law or to protect rights
                      and safety
                    </li>
                    <li>
                      <strong>With Your Consent:</strong> When you explicitly choose to share (e.g.,
                      exporting data to a doctor)
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground">
                    6. AI Features and Data Processing
                  </h2>
                  <p className="text-muted-foreground mb-3">
                    Our AI features (available in Premium tier) process your data as follows:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>AI analysis is performed using secure, encrypted connections</li>
                    <li>Images sent for AI analysis are not stored on external servers</li>
                    <li>AI insights are generated in real-time and not retained</li>
                    <li>You can use the App without AI features enabled</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-primary" />
                    7. Your Rights and Choices
                  </h2>
                  <p className="text-muted-foreground mb-3">You have the right to:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>
                      <strong>Access:</strong> View all data we have about you
                    </li>
                    <li>
                      <strong>Export:</strong> Download your data in standard formats (JSON, PDF,
                      HL7 FHIR)
                    </li>
                    <li>
                      <strong>Delete:</strong> Remove your data from the App and our servers
                    </li>
                    <li>
                      <strong>Correct:</strong> Update inaccurate information
                    </li>
                    <li>
                      <strong>Opt-out:</strong> Disable optional features like cloud backup or
                      analytics
                    </li>
                    <li>
                      <strong>Withdraw Consent:</strong> Revoke permissions at any time
                    </li>
                  </ul>
                  <p className="text-muted-foreground mt-3">
                    To exercise these rights, use the Privacy Dashboard in App settings or contact
                    us.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground">8. Data Retention</h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Local data is retained until you delete it or uninstall the App</li>
                    <li>Account data is retained while your account is active</li>
                    <li>Upon account deletion, all associated data is removed within 30 days</li>
                    <li>Anonymized analytics may be retained for product improvement</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground">
                    9. Children's Privacy
                  </h2>
                  <p className="text-muted-foreground">
                    {APP_NAME} is intended for adults 18 years and older. We do not knowingly
                    collect information from children under 18. If we become aware of such
                    collection, we will delete the information immediately.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    10. International Data Transfers
                  </h2>
                  <p className="text-muted-foreground">
                    If you use our cloud features, your data may be transferred to and processed in
                    countries outside your residence. We ensure appropriate safeguards are in place,
                    including encryption and compliance with applicable data protection laws (GDPR,
                    CCPA).
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground">
                    11. California Privacy Rights (CCPA)
                  </h2>
                  <p className="text-muted-foreground">
                    California residents have additional rights under CCPA, including the right to
                    know what personal information is collected, the right to delete, and the right
                    to opt-out of sale (we do not sell personal information). Contact us to exercise
                    these rights.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground">
                    12. European Privacy Rights (GDPR)
                  </h2>
                  <p className="text-muted-foreground">
                    If you are in the European Economic Area, you have rights under GDPR including
                    access, rectification, erasure, restriction, portability, and objection. Our
                    legal basis for processing is your consent and our legitimate interests in
                    providing the App.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground">
                    13. Changes to This Policy
                  </h2>
                  <p className="text-muted-foreground">
                    We may update this Privacy Policy periodically. We will notify you of material
                    changes through the App or via email. Your continued use of the App after
                    changes constitutes acceptance of the updated policy.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    14. Contact Us
                  </h2>
                  <p className="text-muted-foreground">
                    If you have questions about this Privacy Policy or your data:
                  </p>
                  <div className="mt-3 p-4 bg-muted/30 rounded-lg">
                    <p className="text-foreground font-medium">{APP_NAME} Privacy Team</p>
                    <p className="text-muted-foreground">
                      Email:{" "}
                      {isLikelyEmail(PRIVACY_CONTACT_EMAIL)
                        ? PRIVACY_CONTACT_EMAIL
                        : "Not configured (set VITE_PRIVACY_CONTACT_EMAIL)"}
                    </p>
                    <p className="text-muted-foreground">
                      Data Protection Officer:{" "}
                      {isLikelyEmail(DPO_CONTACT_EMAIL)
                        ? DPO_CONTACT_EMAIL
                        : "Not configured (set VITE_DPO_CONTACT_EMAIL)"}
                    </p>
                  </div>
                </section>

                <section className="border-t border-border pt-6">
                  <p className="text-center text-muted-foreground text-xs">
                    By using {APP_NAME}, you acknowledge that you have read and understood this
                    Privacy Policy.
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

export default PrivacyPolicy;
