import { Heart, Shield, Lock, Mail, AlertTriangle, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { APP_NAME, APP_TAGLINE } from "@/config/brand";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    features: [
      { label: "Scanner", href: "#" },
      { label: "Pumping Tracker", href: "#" },
      { label: "Health Diary", href: "#" },
      { label: "Progress Photos", href: "#" },
    ],
    resources: [
      { label: "Education", href: "#" },
      { label: "Safety Guide", href: "#" },
      { label: "FAQ", href: "#" },
      { label: "Find Specialists", href: "#" },
      { label: "Credits & Resources", href: "/credits", isRoute: true },
    ],
    legal: [
      { label: "Privacy Policy", href: "/privacy", isRoute: true },
      { label: "Terms of Service", href: "/terms", isRoute: true },
      { label: "Credits & Resources", href: "/credits", isRoute: true },
      { label: "Data Security", href: "#" },
      { label: "Medical Disclaimer", href: "#" },
    ],
  };

  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary-foreground" />
                <div className="absolute inset-0 rounded-xl gradient-primary opacity-50 blur-lg" />
              </div>
              <div>
                <h3 className="text-lg font-bold gradient-text">{APP_NAME}</h3>
                <p className="text-[10px] text-muted-foreground -mt-1">{APP_TAGLINE}</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm max-w-xs mb-6">
              Your private companion for tracking growth, health, and wellness. 100% local, 100%
              private.
            </p>
            <div className="flex gap-3 items-center text-xs text-muted-foreground">
              <Shield className="w-4 h-4 text-success" />
              <span>All data stays on your device</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Features</h4>
            <ul className="space-y-3">
              {footerLinks.features.map(link => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map(link => (
                <li key={link.label}>
                  {"isRoute" in link && link.isRoute ? (
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map(link => (
                <li key={link.label}>
                  {link.isRoute ? (
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div className="pt-6 border-t border-border/50">
          <div className="p-4 rounded-lg bg-warning/5 border border-warning/20">
            <div className="flex items-start gap-3">
              <Stethoscope className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-warning mb-1">Medical Disclaimer</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                  This app is for educational and tracking purposes only. It is not a medical device
                  and does not provide medical diagnoses. Always consult a qualified healthcare
                  provider for medical advice, diagnosis, or treatment.
                </p>
                <p className="text-[11px] font-medium text-primary italic">
                  "We're a tool, for your tool. Don't be a fool—we're not a doctor."
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} {APP_NAME}. Personal use only.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              Encrypted & Secure
            </span>
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-success" />
              100% Private
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
