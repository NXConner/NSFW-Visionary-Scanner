/**
 * Testimonials Display Component
 * Shows user testimonials, reviews, success stories, and trust badges
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Star,
  ThumbsUp,
  MessageSquare,
  Award,
  Shield,
  CheckCircle2,
  Loader2,
  EyeOff,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Testimonial {
  id: string;
  display_name: string | null;
  is_anonymous: boolean | null;
  rating: number;
  title: string;
  content: string;
  category: string | null;
  verified: boolean | null;
  featured: boolean | null;
  helpful_count: number | null;
  created_at: string | null;
}

interface SuccessStory {
  id: string;
  display_name: string | null;
  is_anonymous: boolean | null;
  title: string;
  story: string;
  duration_weeks: number | null;
  verified: boolean | null;
  featured: boolean | null;
  created_at: string | null;
}

interface TrustBadge {
  id: string;
  badge_name: string;
  badge_type: string;
  icon_url: string | null;
  description: string | null;
  link_url: string | null;
}

export const TestimonialsDisplay = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [successStories, setSuccessStories] = useState<SuccessStory[]>([]);
  const [trustBadges, setTrustBadges] = useState<TrustBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    rating: 5,
    category: "general",
    is_anonymous: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [testimonialsData, storiesData, badgesData] = await Promise.all([
        supabase
          .from("testimonials")
          .select("*")
          .eq("verified", true)
          .order("featured", { ascending: false })
          .order("helpful_count", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("success_stories")
          .select("*")
          .eq("verified", true)
          .order("featured", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("trust_badges")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ]);

      setTestimonials((testimonialsData.data || []) as unknown as Testimonial[]);
      setSuccessStories((storiesData.data || []) as unknown as SuccessStory[]);
      setTrustBadges((badgesData.data || []) as unknown as TrustBadge[]);
    } catch (error) {
      // Error silently handled
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitTestimonial = async () => {
    if (!formData.title || !formData.content) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const payload = {
        user_id: user?.id || null,
        display_name: formData.is_anonymous ? `User${user?.id?.slice(0, 8) || "Anonymous"}` : null,
        is_anonymous: formData.is_anonymous,
        rating: formData.rating,
        title: formData.title,
        content: formData.content,
        category: formData.category,
      };
      const { error } = await supabase.from("testimonials").insert(payload);

      if (error) throw error;

      toast.success("Thank you! Your testimonial is pending approval.");
      setShowSubmitDialog(false);
      setFormData({
        title: "",
        content: "",
        rating: 5,
        category: "general",
        is_anonymous: true,
      });
      await loadData();
    } catch (error) {
      toast.error("Failed to submit testimonial");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoteHelpful = async (testimonialId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to vote");
        return;
      }

      const { error } = await supabase.from("testimonial_votes").upsert(
        {
          testimonial_id: testimonialId,
          user_id: user.id,
          vote_type: "helpful",
        },
        {
          onConflict: "testimonial_id,user_id",
        },
      );

      if (error) throw error;

      await loadData();
      toast.success("Thank you for your feedback!");
    } catch (error) {
      // Error silently handled
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trust Badges */}
      {trustBadges.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Trust & Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 justify-center">
              {trustBadges.map(badge => (
                <button
                  key={badge.id}
                  type="button"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => badge.link_url && window.open(badge.link_url, "_blank")}
                  disabled={!badge.link_url}
                  aria-label={
                    badge.link_url ? `Open ${badge.badge_name} in new tab` : badge.badge_name
                  }
                >
                  {badge.icon_url ? (
                    <img src={badge.icon_url} alt={badge.badge_name} className="w-12 h-12" />
                  ) : (
                    <Shield className="w-12 h-12 text-primary" />
                  )}
                  <div className="text-sm font-medium text-center">{badge.badge_name}</div>
                  {badge.description && (
                    <div className="text-xs text-muted-foreground text-center max-w-[150px]">
                      {badge.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="testimonials" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="stories">Success Stories</TabsTrigger>
          </TabsList>
          <Button onClick={() => setShowSubmitDialog(true)} variant="outline">
            <MessageSquare className="w-4 h-4 mr-2" />
            Share Your Story
          </Button>
        </div>

        <TabsContent value="testimonials" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>What Our Users Say</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {testimonials.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No testimonials yet. Be the first to share!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {testimonials.map(testimonial => (
                      <Card key={testimonial.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{testimonial.title}</h3>
                                {testimonial.featured && (
                                  <Badge variant="default" className="text-xs">
                                    Featured
                                  </Badge>
                                )}
                                {testimonial.verified && (
                                  <Badge variant="outline" className="text-xs">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < testimonial.rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-muted"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {testimonial.display_name}
                                </span>
                                {testimonial.is_anonymous && (
                                  <EyeOff className="w-3 h-3 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {testimonial.content}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {testimonial.category}
                            </Badge>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVoteHelpful(testimonial.id)}
                              >
                                <ThumbsUp className="w-4 h-4 mr-1" />
                                {testimonial.helpful_count || 0}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stories" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Success Stories</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {successStories.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No success stories yet. Share yours!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {successStories.map(story => (
                      <Card key={story.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{story.title}</h3>
                                {story.featured && (
                                  <Badge variant="default" className="text-xs">
                                    Featured
                                  </Badge>
                                )}
                                {story.verified && (
                                  <Badge variant="outline" className="text-xs">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mb-2">
                                {story.display_name}
                                {story.duration_weeks && ` • ${story.duration_weeks} weeks`}
                                {story.is_anonymous && <EyeOff className="w-3 h-3 inline ml-1" />}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{story.story}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Testimonial Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Share Your Experience</DialogTitle>
            <DialogDescription>
              Help others by sharing your story. All submissions are moderated.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="testimonial-rating">
                Rating
              </label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating })}
                    className="focus:outline-none"
                    aria-label={`Set rating to ${rating}`}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        rating <= formData.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <input id="testimonial-rating" className="sr-only" readOnly value={formData.rating} />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="testimonial-title">
                Title
              </label>
              <Input
                id="testimonial-title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief title for your testimonial"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="testimonial-content">
                Your Story
              </label>
              <Textarea
                id="testimonial-content"
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                placeholder="Share your experience..."
                className="mt-1 min-h-[100px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="testimonial-category">
                Category
              </label>
              <Select
                name="testimonial-category"
                value={formData.category}
                onValueChange={value => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="mt-1" id="testimonial-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={formData.is_anonymous}
                onChange={e => setFormData({ ...formData, is_anonymous: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="anonymous" className="text-sm">
                Post anonymously
              </label>
            </div>

            <Button onClick={handleSubmitTestimonial} className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Submit Testimonial
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
