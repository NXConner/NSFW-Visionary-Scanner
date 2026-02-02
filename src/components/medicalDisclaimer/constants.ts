export const DISCLAIMER_KEY = "morphoscan_disclaimer_accepted";
export const DISCLAIMER_DATE_KEY = "morphoscan_disclaimer_date";

export const TAGLINE = "We're a tool, for your tool. Don't be a fool—we're not a doctor.";

export interface DisclaimerVersion {
  id: number;
  title: string;
  content: string;
  tone: string;
}

export const disclaimerVersions: DisclaimerVersion[] = [
  {
    id: 1,
    title: "Professional & Empathetic",
    tone: "professional",
    content: `This app is designed to be your health companion—not a replacement for professional medical care.

We understand that discussing penis health with a doctor can feel uncomfortable due to stigma, embarrassment, or insecurity. Many men avoid these conversations, hoping problems will resolve on their own. Unfortunately, delay often leads to worsening conditions that become harder—or impossible—to reverse.

This tool empowers you with knowledge and awareness about your health, but it cannot diagnose or treat medical conditions. If you notice any concerning symptoms, please seek professional care. Early intervention can make all the difference.`,
  },
  {
    id: 2,
    title: "Direct & Clear",
    tone: "direct",
    content: `Important: This is an educational and tracking tool, not a medical device.

Information provided should never replace consultation with qualified healthcare professionals. Self-diagnosis and self-treatment can be dangerous.

We encourage you to use this app to become informed about your health, track changes, and recognize when it's time to seek professional help. The data you collect here can be valuable when discussing concerns with your doctor.`,
  },
  {
    id: 3,
    title: "Understanding & Supportive",
    tone: "supportive",
    content: `We get it—talking about penis health isn't easy.

Social stigma makes many men suffer in silence, watching problems worsen when early treatment could have helped. This app gives you private, judgment-free tools to understand and monitor your health.

But remember: awareness is just the first step. For diagnosis, treatment, or any medical concerns, please consult a healthcare provider. You deserve proper care, and seeking help is a sign of strength, not weakness.`,
  },
];
