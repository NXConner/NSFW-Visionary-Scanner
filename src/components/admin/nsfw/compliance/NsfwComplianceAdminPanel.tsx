import { useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  Nsfw2257Custodian,
  Nsfw2257Record,
  NsfwContentPerformer,
  NsfwPerformerRecord,
  NsfwVideoOption,
} from "@/lib/nsfwCompliance/types";
import {
  listContentPerformers,
  listCustodians,
  listPerformers,
  listRecords,
  listVideoOptions,
} from "@/lib/nsfwCompliance/api";
import { CustodianManager } from "./CustodianManager";
import { PerformerManager } from "./PerformerManager";
import { RecordsManager } from "./RecordsManager";
import { ContentPerformersManager } from "./ContentPerformersManager";

export function NsfwComplianceAdminPanel(): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [custodians, setCustodians] = useState<Nsfw2257Custodian[]>([]);
  const [performers, setPerformers] = useState<NsfwPerformerRecord[]>([]);
  const [records, setRecords] = useState<Nsfw2257Record[]>([]);
  const [links, setLinks] = useState<NsfwContentPerformer[]>([]);
  const [videos, setVideos] = useState<NsfwVideoOption[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [custodianRows, performerRows, recordRows, linkRows, videoRows] = await Promise.all([
      listCustodians(),
      listPerformers(),
      listRecords(),
      listContentPerformers(),
      listVideoOptions(),
    ]);
    setCustodians(custodianRows);
    setPerformers(performerRows);
    setRecords(recordRows);
    setLinks(linkRows);
    setVideos(videoRows);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Tabs defaultValue="custodians" className="space-y-4">
      <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
        <TabsTrigger value="custodians">Custodians</TabsTrigger>
        <TabsTrigger value="performers">Performers</TabsTrigger>
        <TabsTrigger value="records">2257 Records</TabsTrigger>
        <TabsTrigger value="links">Content Links</TabsTrigger>
      </TabsList>
      <TabsContent value="custodians">
        <CustodianManager rows={custodians} loading={loading} onRefresh={load} />
      </TabsContent>
      <TabsContent value="performers">
        <PerformerManager rows={performers} loading={loading} onRefresh={load} />
      </TabsContent>
      <TabsContent value="records">
        <RecordsManager
          rows={records}
          custodians={custodians}
          videos={videos}
          loading={loading}
          onRefresh={load}
        />
      </TabsContent>
      <TabsContent value="links">
        <ContentPerformersManager
          rows={links}
          performers={performers}
          videos={videos}
          loading={loading}
          onRefresh={load}
        />
      </TabsContent>
    </Tabs>
  );
}
