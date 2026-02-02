/**
 * Enhanced Export & Import System
 * UI component for exporting data (Excel, PDF, CSV, cloud) and importing data from various sources
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  createExportJob,
  getExportJobs,
  createImportJob,
  getImportJobs,
  getCloudServiceConnections,
  connectCloudService,
  type ExportJob,
  type ImportJob,
  type CloudServiceConnection,
} from "@/lib/exportImportSystem";
import { supabase } from "@/integrations/supabase/client";
import {
  Download,
  Upload,
  FileText,
  FileSpreadsheet,
  File,
  Loader2,
  CheckCircle2,
  XCircle,
  Cloud,
} from "lucide-react";
import { toast } from "sonner";

const exportTypes: ExportJob["export_type"][] = [
  "pdf",
  "excel",
  "csv",
  "json",
  "google_sheets",
  "onedrive",
  "dropbox",
  "email",
  "hl7_fhir",
];

const importTypes: ImportJob["import_type"][] = ["csv", "excel", "json", "other_app", "bulk"];

export const ExportImportSystem = () => {
  const [activeTab, setActiveTab] = useState("export");
  const [loading, setLoading] = useState(false);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [cloudConnections, setCloudConnections] = useState<CloudServiceConnection[]>([]);
  const [showExportForm, setShowExportForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [exportType, setExportType] = useState<ExportJob["export_type"]>("pdf");
  const [exportName, setExportName] = useState("");
  const [importType, setImportType] = useState<ImportJob["import_type"]>("csv");
  const [importName, setImportName] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "export") {
        const jobs = await getExportJobs();
        setExportJobs(jobs);
        const connections = await getCloudServiceConnections();
        setCloudConnections(connections);
      } else {
        const jobs = await getImportJobs();
        setImportJobs(jobs);
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleExport = async () => {
    if (!exportName.trim()) {
      toast.error("Please enter an export name");
      return;
    }

    try {
      const job = await createExportJob(
        exportType,
        exportName,
        { date_range: "all", include_metadata: true },
        ["scans", "diary", "analytics"],
      );
      if (job) {
        setExportName("");
        setShowExportForm(false);
        await loadData();
      }
    } catch (error) {
      toast.error("Failed to create export job");
    }
  };

  const handleImport = async () => {
    if (!importName.trim() || !importFile) {
      toast.error("Please fill in all fields and select a file");
      return;
    }

    try {
      // Get current user for secure file path
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to import files");
        return;
      }

      // Upload file with user-specific path for RLS security
      const fileExt = importFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/imports/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("user-uploads")
        .upload(filePath, importFile);

      if (uploadError) {
        toast.error("Failed to upload file");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("user-uploads").getPublicUrl(filePath);

      const job = await createImportJob(importType, importName, publicUrl, {
        file_format: fileExt,
        auto_map: true,
      });
      if (job) {
        setImportName("");
        setImportFile(null);
        setShowImportForm(false);
        await loadData();
      }
    } catch (error) {
      toast.error("Failed to create import job");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "processing":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      default:
        return null;
    }
  };

  const getExportIcon = (type: string) => {
    switch (type) {
      case "excel":
      case "csv":
        return <FileSpreadsheet className="w-4 h-4" />;
      case "pdf":
        return <FileText className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-6 h-6" />
            Export & Import System
          </CardTitle>
          <CardDescription>
            Export your data in various formats or import data from other sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="export">Export</TabsTrigger>
              <TabsTrigger value="import">Import</TabsTrigger>
            </TabsList>

            <TabsContent value="export" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Export Jobs</h3>
                <Button size="sm" onClick={() => setShowExportForm(!showExportForm)}>
                  <Download className="w-4 h-4 mr-2" />
                  New Export
                </Button>
              </div>

              {showExportForm && (
                <Card className="glass-card border-border/50">
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <Label>Export Name</Label>
                      <Input
                        value={exportName}
                        onChange={e => setExportName(e.target.value)}
                        placeholder="My Export"
                      />
                    </div>
                    <div>
                      <Label>Export Format</Label>
                      <Select
                        value={exportType}
                        onValueChange={value => {
                          const v = value as ExportJob["export_type"];
                          if (exportTypes.includes(v)) setExportType(v);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="google_sheets">Google Sheets</SelectItem>
                          <SelectItem value="onedrive">OneDrive</SelectItem>
                          <SelectItem value="dropbox">Dropbox</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleExport} className="flex-1">
                        Create Export
                      </Button>
                      <Button variant="outline" onClick={() => setShowExportForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {exportJobs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No export jobs yet. Create one to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {exportJobs.map(job => (
                    <Card key={job.id} className="glass-card border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            {getExportIcon(job.export_type)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{job.export_name}</h4>
                                <Badge variant="secondary">{job.export_type}</Badge>
                                {getStatusIcon(job.export_status)}
                              </div>
                              {job.export_status === "processing" && (
                                <Progress value={job.progress_percentage} className="w-full mb-2" />
                              )}
                              {job.file_url && (
                                <a
                                  href={job.file_url}
                                  download
                                  className="text-sm text-primary hover:underline"
                                >
                                  Download
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="import" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Import Jobs</h3>
                <Button size="sm" onClick={() => setShowImportForm(!showImportForm)}>
                  <Upload className="w-4 h-4 mr-2" />
                  New Import
                </Button>
              </div>

              {showImportForm && (
                <Card className="glass-card border-border/50">
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <Label>Import Name</Label>
                      <Input
                        value={importName}
                        onChange={e => setImportName(e.target.value)}
                        placeholder="My Import"
                      />
                    </div>
                    <div>
                      <Label>Import Format</Label>
                      <Select
                        value={importType}
                        onValueChange={value => {
                          const v = value as ImportJob["import_type"];
                          if (importTypes.includes(v)) setImportType(v);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="other_app">Other App</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>File</Label>
                      <Input
                        type="file"
                        accept=".csv,.xlsx,.xls,.json"
                        onChange={e => setImportFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleImport} className="flex-1">
                        Start Import
                      </Button>
                      <Button variant="outline" onClick={() => setShowImportForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {importJobs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No import jobs yet. Create one to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {importJobs.map(job => (
                    <Card key={job.id} className="glass-card border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{job.import_name}</h4>
                              <Badge variant="secondary">{job.import_type}</Badge>
                              {getStatusIcon(job.import_status)}
                            </div>
                            {job.import_status === "processing" && (
                              <Progress value={job.progress_percentage} className="w-full mb-2" />
                            )}
                            {job.import_status === "completed" && (
                              <p className="text-sm text-muted-foreground">
                                {job.records_imported} of {job.records_total} records imported
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
