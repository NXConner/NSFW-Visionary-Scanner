/**
 * Expert Profile Card Component
 * Reusable card for displaying expert profiles
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, DollarSign, Users, Calendar, MessageSquare } from "lucide-react";
import { type ExpertProfile } from "@/lib/expertContent";
import { formatExpertRating, getExpertAvailability } from "@/lib/expertUtils";

interface ExpertProfileCardProps {
  expert: ExpertProfile;
  onBookConsultation?: (expert: ExpertProfile) => void;
  onAskQuestion?: (expert: ExpertProfile) => void;
  showActions?: boolean;
}

export const ExpertProfileCard = ({
  expert,
  onBookConsultation,
  onAskQuestion,
  showActions = true,
}: ExpertProfileCardProps) => {
  const availability = getExpertAvailability(expert);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {expert.profile_image_url && (
            <img
              src={expert.profile_image_url}
              alt={expert.display_name}
              className="w-16 h-16 rounded-full object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg">{expert.display_name}</h3>
                {expert.is_verified && (
                  <Badge variant="default" className="mt-1">
                    Verified
                  </Badge>
                )}
              </div>
              <Badge
                variant={
                  availability === "available"
                    ? "default"
                    : availability === "busy"
                      ? "secondary"
                      : "outline"
                }
              >
                {availability}
              </Badge>
            </div>

            {expert.bio && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{expert.bio}</p>
            )}

            <div className="flex items-center gap-4 mb-3 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{expert.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">({expert.review_count})</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span>${expert.consultation_rate_per_hour}/hr</span>
              </div>
              {expert.years_experience > 0 && (
                <span className="text-muted-foreground">{expert.years_experience} years exp.</span>
              )}
            </div>

            {expert.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {expert.specialties.slice(0, 3).map(specialty => (
                  <Badge key={specialty} variant="outline" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
                {expert.specialties.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{expert.specialties.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {showActions && (
              <div className="flex gap-2">
                {onBookConsultation && (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => onBookConsultation(expert)}
                    disabled={availability === "unavailable"}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book
                  </Button>
                )}
                {onAskQuestion && (
                  <Button size="sm" variant="outline" onClick={() => onAskQuestion(expert)}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Ask
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
