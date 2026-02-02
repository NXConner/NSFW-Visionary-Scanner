import { useMemo, useState } from "react";
import { MessageSquareText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { FeedbackHubForm } from "@/components/settings/feedback/FeedbackHubForm";
import { FeedbackHubMySubmissions } from "@/components/settings/feedback/FeedbackHubMySubmissions";
import { FeedbackHubStatus } from "@/components/settings/feedback/FeedbackHubStatus";
import { useFeedbackHub } from "@/components/settings/feedback/useFeedbackHub";

export function FeedbackHubCard() {
  const hub = useFeedbackHub();
  const [refreshKey, setRefreshKey] = useState(0);

  const localSavedCount = hub.localQueue.length;

  const onSendSaved = async () => {
    const res = await hub.trySendLocalQueue();
    if (res.sent || res.queued) setRefreshKey(k => k + 1);
  };

  const onSubmitted = () => setRefreshKey(k => k + 1);

  const description = useMemo(
    () =>
      "Request changes, propose new features/expansions, report bugs/glitches, or tell us what you love (or don’t).",
    [],
  );

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareText className="w-5 h-5" />
          Feedback Hub
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">{description}</p>

        <FeedbackHubStatus
          user={hub.user}
          isOnline={hub.offline.isOnline}
          isSyncing={hub.offline.isSyncing}
          pendingCount={hub.offline.pendingCount}
          feedbackPending={hub.feedbackPending}
          localSavedCount={localSavedCount}
          submitting={hub.submitting}
          onSendSaved={onSendSaved}
          onClearSaved={hub.clearLocalSaved}
        />

        <Separator />

        <FeedbackHubForm hub={hub} onSubmitted={onSubmitted} />

        <Separator />

        <FeedbackHubMySubmissions refreshKey={refreshKey} />
      </CardContent>
    </Card>
  );
}
