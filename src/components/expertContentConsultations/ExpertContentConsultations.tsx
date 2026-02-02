/**
 * Expert Content & Consultations System
 * UI component for expert profiles, articles, videos, Q&A, consultations, workshops, and ratings
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap } from "lucide-react";
import type { ExpertProfile } from "@/lib/expertContentConsultations";
import type { ExpertTabKey } from "./types";
import { ExpertsTab } from "./tabs/ExpertsTab";
import { ContentTab } from "./tabs/ContentTab";
import { ConsultationsTab } from "./tabs/ConsultationsTab";
import { QATab } from "./tabs/QATab";
import { RatingsTab } from "./tabs/RatingsTab";

export const ExpertContentConsultations = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState<ExpertTabKey>("experts");
  const [selectedExpert, setSelectedExpert] = useState<ExpertProfile | null>(null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Expert Content &amp; Consultations
          </CardTitle>
          <CardDescription>
            Access expert advice, articles, videos, and book consultations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as ExpertTabKey)}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="experts">Experts</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="consultations">Consultations</TabsTrigger>
              <TabsTrigger value="qa">Q&amp;A</TabsTrigger>
              <TabsTrigger value="ratings">Ratings</TabsTrigger>
            </TabsList>

            <TabsContent value="experts" className="space-y-4">
              <ExpertsTab
                isActive={activeTab === "experts"}
                selectedExpert={selectedExpert}
                onSelectExpert={setSelectedExpert}
              />
            </TabsContent>
            <TabsContent value="content" className="space-y-4">
              <ContentTab isActive={activeTab === "content"} expert={selectedExpert} />
            </TabsContent>
            <TabsContent value="consultations" className="space-y-4">
              <ConsultationsTab isActive={activeTab === "consultations"} expert={selectedExpert} />
            </TabsContent>
            <TabsContent value="qa" className="space-y-4">
              <QATab isActive={activeTab === "qa"} expert={selectedExpert} />
            </TabsContent>
            <TabsContent value="ratings" className="space-y-4">
              <RatingsTab isActive={activeTab === "ratings"} expert={selectedExpert} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
