import type { HealthTopic } from "@/components/educationCenter/types";

export const healthTopicsPart1: HealthTopic[] = [
  {
    id: "peyronies",
    title: "Peyronie's Disease",
    category: "curvature",
    severity: "moderate",
    overview:
      "Peyronie's disease is a condition where fibrous scar tissue (plaque) forms inside the penis, causing curved, painful erections. It affects approximately 5-10% of men, typically between ages 40-70, though it can occur at any age. The curvature can make sexual intercourse difficult or impossible and may cause significant emotional distress.",
    causes: [
      "Trauma or injury to the penis during sex, sports, or accidents",
      "Repeated minor injuries that go unnoticed",
      "Genetic predisposition - runs in families",
      "Connective tissue disorders (Dupuytren's contracture)",
      "Age-related changes in tissue elasticity",
      "Certain medications (beta-blockers, some epilepsy drugs)",
      "Low testosterone levels may be a contributing factor",
    ],
    symptoms: [
      "Noticeable curve in the penis when erect (can be upward, downward, or sideways)",
      "Hard lumps or bands of tissue under the skin (plaques)",
      "Pain during erection or intercourse",
      "Shortening of the penis",
      "Hourglass or indented shape during erection",
      "Erectile dysfunction",
      "Difficulty achieving or maintaining erection",
    ],
    diagnosis:
      "Diagnosis typically involves a physical examination where the doctor feels for plaque formations. An ultrasound may be used to examine blood flow and identify scar tissue location. You may be asked to bring photos of your erect penis showing the curvature angle. In some cases, injection of medication to induce erection may be used during examination.",
    treatment: [
      "Observation - Mild cases may stabilize or improve without treatment",
      "Oral medications - Pentoxifylline, Vitamin E, Potassium para-aminobenzoate (Potaba)",
      "Injection therapy - Collagenase clostridium histolyticum (Xiaflex) to break down plaque",
      "Intralesional verapamil or interferon injections",
      "Penile traction therapy - Stretching devices worn daily",
      "Shockwave therapy (ESWT) - Sound waves to break down plaque",
      "Surgery - For severe cases: plication, grafting, or penile implants",
    ],
    prevention: [
      "Be careful during sexual activity to avoid injury",
      "Use adequate lubrication during intercourse",
      "Avoid aggressive masturbation techniques",
      "Address erectile dysfunction early to prevent compensatory behaviors",
      "Maintain overall cardiovascular health",
      "Don't ignore early symptoms - seek evaluation promptly",
    ],
    whenToSeeDoctor: [
      "You notice a new curve in your erections",
      "You feel hard lumps or bands in your penis",
      "Erections become painful",
      "The curve is getting worse over time",
      "You have difficulty with intercourse",
      "You experience erectile dysfunction",
      "You notice shortening of your penis",
    ],
    faqs: [
      {
        question: "Can Peyronie's disease go away on its own?",
        answer:
          "In about 12-13% of cases, the condition may improve without treatment. However, in most cases it stabilizes or worsens. Early treatment often yields better outcomes.",
      },
      {
        question: "Is Peyronie's disease contagious?",
        answer:
          "No, Peyronie's disease is not contagious or sexually transmitted. It's caused by scar tissue formation inside the penis.",
      },
      {
        question: "Will Peyronie's disease affect my fertility?",
        answer:
          "Peyronie's disease itself does not affect fertility or sperm production. However, if it causes significant erectile dysfunction, it may make conception more difficult.",
      },
      {
        question: "How long does treatment take?",
        answer:
          "Treatment duration varies. Injection therapy typically takes 6-8 weeks. Traction devices are worn for 6-12 months. Surgery provides immediate correction but requires recovery time.",
      },
    ],
  },
  {
    id: "chlamydia",
    title: "Chlamydia",
    category: "sti",
    severity: "moderate",
    overview:
      "Chlamydia is one of the most common sexually transmitted infections caused by the bacterium Chlamydia trachomatis. It often has no symptoms, which makes it easy to spread unknowingly. If left untreated, it can cause serious complications including infertility.",
    causes: [
      "Unprotected vaginal, anal, or oral sex with an infected partner",
      "Sharing sex toys with someone who is infected",
      "Can be passed from mother to baby during childbirth",
    ],
    symptoms: [
      "Discharge from the penis (clear or cloudy)",
      "Burning sensation during urination",
      "Pain and swelling in the testicles",
      "Rectal pain, discharge, or bleeding (if rectum is infected)",
      "Many people have NO symptoms at all",
    ],
    diagnosis:
      "Chlamydia is diagnosed through urine tests or swab samples from the urethra. Testing is simple, quick, and widely available at clinics, doctor's offices, and through home testing kits.",
    treatment: [
      "Single dose of azithromycin (Zithromax) antibiotics",
      "Week-long course of doxycycline twice daily",
      "Sexual partners should also be treated",
      "Avoid sex for 7 days after completing treatment",
      "Re-testing recommended 3 months after treatment",
    ],
    prevention: [
      "Use condoms consistently and correctly",
      "Limit number of sexual partners",
      "Get tested regularly if sexually active",
      "Mutual monogamy with a tested partner",
      "Avoid sharing sex toys or clean them between uses",
    ],
    whenToSeeDoctor: [
      "You have unusual discharge from your penis",
      "Burning or pain during urination",
      "A sexual partner tells you they have chlamydia",
      "You've had unprotected sex with a new partner",
      "Routine STI screening is recommended annually",
    ],
    faqs: [
      {
        question: "Can I have chlamydia without knowing?",
        answer:
          "Yes, up to 50% of men with chlamydia have no symptoms. Regular testing is important for sexually active individuals.",
      },
      {
        question: "Will chlamydia go away without treatment?",
        answer:
          "No. Without antibiotic treatment, chlamydia can persist and cause complications. However, it is easily cured with proper medication.",
      },
    ],
  },
  {
    id: "gonorrhea",
    title: "Gonorrhea",
    category: "sti",
    severity: "moderate",
    overview:
      "Gonorrhea is a sexually transmitted infection caused by Neisseria gonorrhoeae bacteria. It can infect the genitals, rectum, and throat. Antibiotic-resistant strains are becoming more common, making treatment increasingly challenging.",
    causes: [
      "Unprotected vaginal, anal, or oral sex",
      "Contact with infected bodily fluids",
      "Can be transmitted even without ejaculation",
    ],
    symptoms: [
      "Thick, cloudy, or bloody discharge from the penis",
      "Painful or burning urination",
      "Swollen or painful testicles",
      "Sore throat (if throat is infected)",
      "Rectal discharge, itching, or bleeding",
    ],
    diagnosis:
      "Diagnosed through urine tests or swab samples. Testing may need to include throat and rectal swabs depending on sexual practices.",
    treatment: [
      "Dual antibiotic therapy (usually ceftriaxone injection plus azithromycin)",
      "All recent sexual partners need treatment",
      "Follow-up testing to confirm cure",
      "Report to doctor if symptoms persist",
    ],
    prevention: [
      "Consistent condom use",
      "Regular STI testing",
      "Open communication with partners",
      "Limiting number of sexual partners",
    ],
    whenToSeeDoctor: [
      "Unusual discharge from penis",
      "Pain during urination",
      "Swelling in testicles",
      "A partner has been diagnosed with gonorrhea",
    ],
    faqs: [
      {
        question: "Can gonorrhea be cured?",
        answer:
          "Yes, with proper antibiotic treatment. However, drug-resistant strains are emerging, making correct treatment important.",
      },
      {
        question: "Can I get gonorrhea from oral sex?",
        answer:
          "Yes, gonorrhea can infect the throat through oral sex, though it's often asymptomatic in this location.",
      },
    ],
  },
  {
    id: "herpes",
    title: "Genital Herpes (HSV)",
    category: "sti",
    severity: "moderate",
    overview:
      "Genital herpes is caused by herpes simplex virus (HSV-1 or HSV-2). It's a lifelong infection that causes periodic outbreaks of painful sores. While there's no cure, medication can manage symptoms and reduce transmission risk.",
    causes: [
      "Sexual contact with someone who has herpes",
      "Can be transmitted even when no sores are visible",
      "Oral sex can transmit HSV-1 to genitals",
      "Skin-to-skin contact during outbreaks",
    ],
    symptoms: [
      "Painful blisters or sores on genitals, buttocks, or thighs",
      "Tingling, itching, or burning before sores appear",
      "Flu-like symptoms during first outbreak",
      "Painful urination",
      "Many people have mild or no symptoms",
    ],
    diagnosis:
      "Diagnosed by visual examination of sores, viral culture from active sores, or blood tests for HSV antibodies.",
    treatment: [
      "Antiviral medications (acyclovir, valacyclovir, famciclovir)",
      "Episodic treatment for outbreaks",
      "Suppressive daily therapy to reduce outbreaks",
      "Pain relief medications as needed",
    ],
    prevention: [
      "Use condoms (reduces but doesn't eliminate risk)",
      "Avoid sex during outbreaks",
      "Daily suppressive therapy reduces transmission",
      "Honest communication with partners",
    ],
    whenToSeeDoctor: [
      "You develop genital sores or blisters",
      "Frequent or severe outbreaks",
      "Difficulty urinating during outbreak",
      "Considering suppressive therapy",
    ],
    faqs: [
      {
        question: "Is herpes curable?",
        answer:
          "No, herpes is a lifelong infection. However, antiviral medications can effectively manage symptoms and reduce outbreaks.",
      },
      {
        question: "Can I still have a normal sex life with herpes?",
        answer:
          "Yes. With proper management, communication, and precautions, people with herpes can have fulfilling sexual relationships.",
      },
    ],
  },
  {
    id: "syphilis",
    title: "Syphilis",
    category: "sti",
    severity: "serious",
    overview:
      "Syphilis is a bacterial STI that progresses through stages if untreated. Early stages are highly treatable, but advanced syphilis can cause serious damage to the heart, brain, and other organs.",
    causes: [
      "Direct contact with syphilis sores during vaginal, anal, or oral sex",
      "Can be transmitted during any stage",
      "Mother to baby during pregnancy or birth",
    ],
    symptoms: [
      "Primary: Painless sore (chancre) at infection site",
      "Secondary: Skin rashes, mucous membrane lesions, fever, swollen lymph nodes",
      "Latent: No symptoms but still infected",
      "Tertiary: Serious organ damage (rare with modern treatment)",
    ],
    diagnosis:
      "Blood tests detect antibodies. Direct examination of sore fluid under microscope can identify bacteria.",
    treatment: [
      "Penicillin injection is the primary treatment",
      "Alternative antibiotics for penicillin-allergic patients",
      "Early treatment prevents progression",
      "Partners need testing and treatment",
    ],
    prevention: [
      "Consistent condom use",
      "Regular STI testing",
      "Avoiding contact with syphilis sores",
      "Prenatal screening for pregnant women",
    ],
    whenToSeeDoctor: [
      "You notice any genital sores",
      "Unexplained rash on body",
      "A partner has been diagnosed with syphilis",
      "Regular screening if at higher risk",
    ],
    faqs: [
      {
        question: "Can syphilis be cured?",
        answer:
          "Yes, early-stage syphilis is easily cured with antibiotics. However, treatment cannot reverse damage already done in late stages.",
      },
      {
        question: "How long do syphilis sores last?",
        answer:
          "Primary sores (chancres) heal on their own in 3-6 weeks, but the infection remains and progresses without treatment.",
      },
    ],
  },
  {
    id: "hpv",
    title: "HPV (Genital Warts)",
    category: "sti",
    severity: "mild",
    overview:
      "Human papillomavirus (HPV) is the most common STI. Most infections clear on their own, but some strains cause genital warts while others can lead to cancer. Vaccines are highly effective at prevention.",
    causes: [
      "Skin-to-skin contact during sex",
      "Can spread even without penetration",
      "Condoms reduce but don't eliminate risk",
    ],
    symptoms: [
      "Genital warts (flesh-colored bumps)",
      "Warts may be flat, raised, or cauliflower-like",
      "Many HPV infections have no symptoms",
      "Some strains cause no warts but cancer risk",
    ],
    diagnosis:
      "Genital warts diagnosed by visual examination. No routine HPV test for men, but warts can be biopsied if needed.",
    treatment: [
      "Many HPV infections clear without treatment",
      "Warts can be removed by freezing, burning, or surgery",
      "Topical medications (imiquimod, podofilox)",
      "Warts may recur after treatment",
    ],
    prevention: [
      "HPV vaccination (recommended up to age 45)",
      "Condom use (partial protection)",
      "Limiting sexual partners",
      "Regular check-ups",
    ],
    whenToSeeDoctor: [
      "You notice any growths on genitals",
      "Warts are spreading or causing discomfort",
      "Discuss HPV vaccination with your doctor",
    ],
    faqs: [
      {
        question: "Can men get the HPV vaccine?",
        answer:
          "Yes, HPV vaccination is recommended for men up to age 45 and is highly effective at preventing warts and HPV-related cancers.",
      },
      {
        question: "Will genital warts go away?",
        answer:
          "Visible warts may be treated, but the virus can remain in your body. Many people's immune systems eventually clear HPV infections.",
      },
    ],
  },
];
