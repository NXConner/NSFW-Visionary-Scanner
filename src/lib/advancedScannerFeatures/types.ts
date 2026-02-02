export interface MultiAngleScanSession {
  id: string;
  user_id: string;
  session_name: string | null;
  scan_type: "3d_reconstruction" | "time_lapse" | "batch_scan";
  target_angles: number;
  angles_captured: number;
  is_complete: boolean;
  processing_status: "pending" | "processing" | "completed" | "failed";
  processing_started_at: string | null;
  processing_completed_at: string | null;
  processing_error: string | null;
  reconstructed_3d_model_url: string | null;
  model_format: "obj" | "stl" | "ply" | "gltf" | null;
  point_cloud_url: string | null;
  texture_map_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MultiAngleScanImage {
  id: string;
  session_id: string;
  angle_index: number;
  angle_degrees: number | null;
  image_url: string;
  thumbnail_url: string | null;
  camera_position: unknown;
  camera_rotation: unknown;
  focal_length: number | null;
  lighting_quality: number | null;
  sharpness_score: number | null;
  contrast_score: number | null;
  measurements: unknown;
  created_at: string;
}

export interface TimeLapseComparison {
  id: string;
  user_id: string;
  comparison_name: string | null;
  start_scan_id: string | null;
  end_scan_id: string | null;
  length_change: number | null;
  circumference_change: number | null;
  curvature_change: number | null;
  time_period_days: number | null;
  comparison_image_url: string | null;
  overlay_image_url: string | null;
  slider_image_url: string | null;
  animated_gif_url: string | null;
  growth_rate_per_month: number | null;
  growth_percentage: number | null;
  created_at: string;
}

export interface MeasurementTemplate {
  id: string;
  user_id: string;
  template_name: string;
  description: string | null;
  measurement_points: unknown;
  reference_object_size: number | null;
  calibration_data: unknown;
  auto_capture_enabled: boolean;
  quality_threshold: number;
  angle_requirements: unknown;
  is_default: boolean;
  is_shared: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface BatchScanSession {
  id: string;
  user_id: string;
  session_name: string | null;
  batch_type: "daily" | "weekly" | "custom" | "routine";
  target_count: number | null;
  scans_captured: number;
  is_complete: boolean;
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
  interval_minutes: number | null;
  average_measurements: unknown;
  measurement_variance: unknown;
  created_at: string;
  updated_at: string;
}

export interface Exported3DModel {
  id: string;
  user_id: string;
  session_id: string | null;
  export_format: "obj" | "stl" | "ply" | "gltf" | "fbx";
  file_url: string;
  file_size_bytes: number | null;
  include_texture: boolean;
  include_measurements: boolean;
  quality_level: "low" | "medium" | "high" | "ultra";
  download_count: number;
  last_downloaded_at: string | null;
  created_at: string;
}
