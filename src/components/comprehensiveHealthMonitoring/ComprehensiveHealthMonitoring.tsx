/**
 * Comprehensive Health Monitoring Component
 * Tracks prostate, testicular, sexual health, hormones, and urinary health
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  getHealthAlerts,
  getHealthRiskFactors,
  getWellnessScores,
  markAlertRead,
  saveHormoneLevels,
  saveProstateHealthEntry,
  saveSexualHealthEntry,
  saveTesticularHealthEntry,
  saveUrinaryHealthEntry,
} from "@/lib/healthMonitoring";

import type {
  HealthAlert,
  HealthRiskFactor,
  HormoneLevel,
  ProstateHealthEntry,
  SexualHealthEntry,
  SexualWellnessScore,
  TesticularHealthEntry,
  UrinaryHealthEntry,
} from "@/components/comprehensiveHealthMonitoring/types";

import {
  HormonesTab,
  OverviewTab,
  ProstateTab,
  SexualTab,
  TesticularTab,
  UrinaryTab,
} from "@/components/comprehensiveHealthMonitoring/components";

type HealthTab = "overview" | "prostate" | "testicular" | "sexual" | "hormones" | "urinary";

export const ComprehensiveHealthMonitoring = () => {
  const [activeTab, setActiveTab] = useState<HealthTab>("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [wellnessScores, setWellnessScores] = useState<SexualWellnessScore[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [riskFactors, setRiskFactors] = useState<HealthRiskFactor[]>([]);

  // Form states
  const [prostateForm, setProstateForm] = useState<Partial<ProstateHealthEntry>>({});
  const [testicularForm, setTesticularForm] = useState<Partial<TesticularHealthEntry>>({});
  const [sexualForm, setSexualForm] = useState<Partial<SexualHealthEntry>>({});
  const [hormoneForm, setHormoneForm] = useState<Partial<HormoneLevel>>({});
  const [urinaryForm, setUrinaryForm] = useState<Partial<UrinaryHealthEntry>>({});

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [scores, alertsData, risks] = await Promise.all([
        getWellnessScores(7),
        getHealthAlerts(true),
        getHealthRiskFactors(),
      ]);
      setWellnessScores(scores);
      setAlerts(alertsData);
      setRiskFactors(risks);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSaveProstate = useCallback(async () => {
    setIsLoading(true);
    try {
      const success = await saveProstateHealthEntry(prostateForm);
      if (success) setProstateForm({});
      await loadData();
    } finally {
      setIsLoading(false);
    }
  }, [loadData, prostateForm]);

  const handleSaveTesticular = useCallback(async () => {
    setIsLoading(true);
    try {
      const success = await saveTesticularHealthEntry(testicularForm);
      if (success) setTesticularForm({});
      await loadData();
    } finally {
      setIsLoading(false);
    }
  }, [loadData, testicularForm]);

  const handleSaveSexual = useCallback(async () => {
    setIsLoading(true);
    try {
      const success = await saveSexualHealthEntry(sexualForm);
      if (success) setSexualForm({});
      await loadData();
    } finally {
      setIsLoading(false);
    }
  }, [loadData, sexualForm]);

  const handleSaveHormone = useCallback(async () => {
    setIsLoading(true);
    try {
      const success = await saveHormoneLevels(hormoneForm);
      if (success) setHormoneForm({});
      await loadData();
    } finally {
      setIsLoading(false);
    }
  }, [hormoneForm, loadData]);

  const handleSaveUrinary = useCallback(async () => {
    setIsLoading(true);
    try {
      const success = await saveUrinaryHealthEntry(urinaryForm);
      if (success) setUrinaryForm({});
      await loadData();
    } finally {
      setIsLoading(false);
    }
  }, [loadData, urinaryForm]);

  const handleMarkAlertRead = useCallback(
    async (alertId: string) => {
      await markAlertRead(alertId);
      await loadData();
    },
    [loadData],
  );

  const latestScore = wellnessScores[0];
  const unreadAlerts = useMemo(() => alerts.filter(a => !a.is_read), [alerts]);

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={v => setActiveTab(v as HealthTab)}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="prostate">Prostate</TabsTrigger>
          <TabsTrigger value="testicular">Testicular</TabsTrigger>
          <TabsTrigger value="sexual">Sexual</TabsTrigger>
          <TabsTrigger value="hormones">Hormones</TabsTrigger>
          <TabsTrigger value="urinary">Urinary</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab
            latestScore={latestScore}
            unreadAlerts={unreadAlerts}
            riskFactors={riskFactors}
            onDismissAlert={handleMarkAlertRead}
          />
        </TabsContent>

        <TabsContent value="prostate" className="space-y-4">
          <ProstateTab
            form={prostateForm}
            setForm={setProstateForm}
            isLoading={isLoading}
            onSave={handleSaveProstate}
          />
        </TabsContent>

        <TabsContent value="testicular" className="space-y-4">
          <TesticularTab
            form={testicularForm}
            setForm={setTesticularForm}
            isLoading={isLoading}
            onSave={handleSaveTesticular}
          />
        </TabsContent>

        <TabsContent value="sexual" className="space-y-4">
          <SexualTab
            form={sexualForm}
            setForm={setSexualForm}
            isLoading={isLoading}
            onSave={handleSaveSexual}
          />
        </TabsContent>

        <TabsContent value="hormones" className="space-y-4">
          <HormonesTab
            form={hormoneForm}
            setForm={setHormoneForm}
            isLoading={isLoading}
            onSave={handleSaveHormone}
          />
        </TabsContent>

        <TabsContent value="urinary" className="space-y-4">
          <UrinaryTab
            form={urinaryForm}
            setForm={setUrinaryForm}
            isLoading={isLoading}
            onSave={handleSaveUrinary}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComprehensiveHealthMonitoring;
