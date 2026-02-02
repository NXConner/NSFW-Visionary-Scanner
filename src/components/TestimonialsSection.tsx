import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MeshGradient, PageTransition, Reveal, TiltCard, TiltLayer } from "@/components/premium";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { hapticLight } from "@/lib/haptics";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
}

export const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const premiumMesh = useFeatureFlag("premium_mesh");

  const testimonials: Testimonial[] = [
    {
      id: "1",
      name: "Anonymous User",
      role: "Verified User",
      avatar: "AU",
      content:
        "Finally an app that takes my privacy seriously. The measurement accuracy is incredible and I can track my progress without worrying about my data being shared.",
      rating: 5,
    },
    {
      id: "2",
      name: "Health Enthusiast",
      role: "PE Community Member",
      avatar: "HE",
      content:
        "The pumping tracker has been a game-changer for my routine. I can see exactly what works and the AI predictions keep me motivated.",
      rating: 5,
    },
    {
      id: "3",
      name: "Wellness Advocate",
      role: "Long-term User",
      avatar: "WA",
      content:
        "The educational content is top-notch. I learned so much about safe practices and proper techniques. This app genuinely cares about user safety.",
      rating: 5,
    },
    {
      id: "4",
      name: "Fitness Fan",
      role: "Active Tracker",
      avatar: "FF",
      content:
        "I have been tracking for 6 months now and the progress charts clearly show my gains. The calibration feature ensures accurate measurements every time.",
      rating: 5,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const nextTestimonial = () => {
    hapticLight();
    setActiveIndex(prev => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    hapticLight();
    setActiveIndex(prev => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        {premiumMesh && <MeshGradient variant="hero" intensity="subtle" />}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto max-w-4xl relative z-10">
        <Reveal variant="wipe" className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Our <span className="gradient-text">Community</span> Says
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of men who trust this app for their personal growth tracking and health
            monitoring.
          </p>
        </Reveal>

        <div className="relative">
          <Reveal variant="fade-up">
            <TiltCard variant="glass" className="p-8 md:p-12" glow>
              <CardContent className="p-0">
                <PageTransition transitionKey={testimonials[activeIndex].id} variant="fade-slide">
                  <div className="flex flex-col items-center text-center">
                    <TiltLayer depth={10} z={10} className="inline-block">
                      <Quote className="w-12 h-12 text-primary/30 mb-6" />
                    </TiltLayer>

                    <p className="text-xl md:text-2xl font-medium mb-8 leading-relaxed">
                      "{testimonials[activeIndex].content}"
                    </p>

                    <div
                      className="flex items-center gap-1 mb-4"
                      aria-label={`Rating: ${testimonials[activeIndex].rating} out of 5`}
                    >
                      {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-warning fill-warning" />
                      ))}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                        <span className="font-bold text-primary-foreground">
                          {testimonials[activeIndex].avatar}
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">{testimonials[activeIndex].name}</p>
                        <p className="text-sm text-muted-foreground">
                          {testimonials[activeIndex].role}
                        </p>
                      </div>
                    </div>
                  </div>
                </PageTransition>
              </CardContent>
            </TiltCard>
          </Reveal>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button variant="ghost" size="icon" onClick={prevTestimonial}>
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex gap-2">
              {testimonials.map((testimonial, testimonialIndex) => (
                <button
                  key={testimonial.name}
                  onClick={() => {
                    hapticLight();
                    setActiveIndex(testimonialIndex);
                  }}
                  aria-label={`Go to testimonial ${testimonialIndex + 1}`}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    testimonialIndex === activeIndex ? "w-8 bg-primary" : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>

            <Button variant="ghost" size="icon" onClick={nextTestimonial}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
