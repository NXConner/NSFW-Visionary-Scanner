export interface ExportJob {
  id: string;
  user_id: string;
  export_type:
    | "excel"
    | "pdf"
    | "csv"
    | "json"
    | "hl7_fhir"
    | "google_sheets"
    | "onedrive"
    | "dropbox"
    | "email";
  export_name: string;
  export_status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  progress_percentage: number;
  file_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImportJob {
  id: string;
  user_id: string;
  import_type: "csv" | "excel" | "json" | "other_app" | "bulk";
  import_name: string;
  import_status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  progress_percentage: number;
  records_total: number;
  records_imported: number;
  created_at: string;
  updated_at: string;
}

export interface CloudServiceConnection {
  id: string;
  user_id: string;
  service_type: "google_drive" | "google_sheets" | "onedrive" | "dropbox" | "other";
  service_name: string;
  is_connected: boolean;
  connection_status: string;
  created_at: string;
  updated_at: string;
}
