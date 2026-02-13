export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievement_definitions: {
        Row: {
          badge_color: string
          category: string
          code: string
          created_at: string | null
          description: string
          icon_name: string | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          name: string
          points: number
          requirement_data: Json | null
          requirement_type: string
          requirement_value: number | null
          updated_at: string | null
        }
        Insert: {
          badge_color?: string
          category: string
          code: string
          created_at?: string | null
          description: string
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          name: string
          points?: number
          requirement_data?: Json | null
          requirement_type: string
          requirement_value?: number | null
          updated_at?: string | null
        }
        Update: {
          badge_color?: string
          category?: string
          code?: string
          created_at?: string | null
          description?: string
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          name?: string
          points?: number
          requirement_data?: Json | null
          requirement_type?: string
          requirement_value?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      active_sessions: {
        Row: {
          created_at: string | null
          device_name: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_active_at: string | null
          revoked_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_name?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_active_at?: string | null
          revoked_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_name?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_active_at?: string | null
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      adaptive_routines: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          routine_data: Json | null
          routine_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          routine_data?: Json | null
          routine_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          routine_data?: Json | null
          routine_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      addon_usage_tracking: {
        Row: {
          addon_id: string
          created_at: string | null
          id: string
          period_end: string
          period_start: string
          tracked_at: string | null
          usage_limit: number | null
          usage_type: string
          usage_value: number
          user_id: string
        }
        Insert: {
          addon_id: string
          created_at?: string | null
          id?: string
          period_end: string
          period_start: string
          tracked_at?: string | null
          usage_limit?: number | null
          usage_type: string
          usage_value: number
          user_id: string
        }
        Update: {
          addon_id?: string
          created_at?: string | null
          id?: string
          period_end?: string
          period_start?: string
          tracked_at?: string | null
          usage_limit?: number | null
          usage_type?: string
          usage_value?: number
          user_id?: string
        }
        Relationships: []
      }
      admin_dlc_package_toggles: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          package_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          package_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          package_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_contextual_memory: {
        Row: {
          context_type: string | null
          created_at: string | null
          id: string
          memory_key: string
          memory_value: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          context_type?: string | null
          created_at?: string | null
          id?: string
          memory_key: string
          memory_value?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          context_type?: string | null
          created_at?: string | null
          id?: string
          memory_key?: string
          memory_value?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_conversation_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversation_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversation_sessions: {
        Row: {
          context_type: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          session_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          context_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          session_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          context_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          session_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_proactive_suggestions: {
        Row: {
          created_at: string | null
          id: string
          is_dismissed: boolean | null
          suggestion_text: string
          suggestion_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          suggestion_text: string
          suggestion_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          suggestion_text?: string
          suggestion_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_scan_analysis: {
        Row: {
          ai_model_confidence: number | null
          ai_model_version: string | null
          analysis_type: string
          analyzed_at: string | null
          anomalies_detected: Json | null
          anomaly_confidence: number | null
          comparison_results: Json | null
          created_at: string | null
          detected_conditions: Json | null
          health_alerts: Json | null
          id: string
          measurement_confidence: number | null
          measurement_reasoning: string | null
          overall_quality_score: number | null
          previous_scan_id: string | null
          processing_time_ms: number | null
          quality_breakdown: Json | null
          quality_recommendations: string[] | null
          risk_factors: Json | null
          scan_id: string | null
          suggested_measurements: Json | null
          trend_data: Json | null
          trend_direction: string | null
          user_id: string
          visualization_url: string | null
        }
        Insert: {
          ai_model_confidence?: number | null
          ai_model_version?: string | null
          analysis_type?: string
          analyzed_at?: string | null
          anomalies_detected?: Json | null
          anomaly_confidence?: number | null
          comparison_results?: Json | null
          created_at?: string | null
          detected_conditions?: Json | null
          health_alerts?: Json | null
          id?: string
          measurement_confidence?: number | null
          measurement_reasoning?: string | null
          overall_quality_score?: number | null
          previous_scan_id?: string | null
          processing_time_ms?: number | null
          quality_breakdown?: Json | null
          quality_recommendations?: string[] | null
          risk_factors?: Json | null
          scan_id?: string | null
          suggested_measurements?: Json | null
          trend_data?: Json | null
          trend_direction?: string | null
          user_id: string
          visualization_url?: string | null
        }
        Update: {
          ai_model_confidence?: number | null
          ai_model_version?: string | null
          analysis_type?: string
          analyzed_at?: string | null
          anomalies_detected?: Json | null
          anomaly_confidence?: number | null
          comparison_results?: Json | null
          created_at?: string | null
          detected_conditions?: Json | null
          health_alerts?: Json | null
          id?: string
          measurement_confidence?: number | null
          measurement_reasoning?: string | null
          overall_quality_score?: number | null
          previous_scan_id?: string | null
          processing_time_ms?: number | null
          quality_breakdown?: Json | null
          quality_recommendations?: string[] | null
          risk_factors?: Json | null
          scan_id?: string | null
          suggested_measurements?: Json | null
          trend_data?: Json | null
          trend_direction?: string | null
          user_id?: string
          visualization_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_scan_analysis_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      anomaly_detection_log: {
        Row: {
          affected_measurements: string[] | null
          anomaly_type: string
          compared_to_previous: boolean | null
          confidence: number
          created_at: string | null
          description: string
          detected_at: string | null
          deviation_amount: number | null
          id: string
          is_reviewed: boolean | null
          location: Json | null
          previous_scan_id: string | null
          recommendation: string | null
          requires_attention: boolean | null
          review_notes: string | null
          reviewed_at: string | null
          scan_id: string | null
          severity: string
          user_id: string
        }
        Insert: {
          affected_measurements?: string[] | null
          anomaly_type: string
          compared_to_previous?: boolean | null
          confidence: number
          created_at?: string | null
          description: string
          detected_at?: string | null
          deviation_amount?: number | null
          id?: string
          is_reviewed?: boolean | null
          location?: Json | null
          previous_scan_id?: string | null
          recommendation?: string | null
          requires_attention?: boolean | null
          review_notes?: string | null
          reviewed_at?: string | null
          scan_id?: string | null
          severity?: string
          user_id: string
        }
        Update: {
          affected_measurements?: string[] | null
          anomaly_type?: string
          compared_to_previous?: boolean | null
          confidence?: number
          created_at?: string | null
          description?: string
          detected_at?: string | null
          deviation_amount?: number | null
          id?: string
          is_reviewed?: boolean | null
          location?: Json | null
          previous_scan_id?: string | null
          recommendation?: string | null
          requires_attention?: boolean | null
          review_notes?: string | null
          reviewed_at?: string | null
          scan_id?: string | null
          severity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anomaly_detection_log_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_name: string
          key_prefix: string
          last_used_at: string | null
          permissions: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_name: string
          key_prefix: string
          last_used_at?: string | null
          permissions?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_name?: string
          key_prefix?: string
          last_used_at?: string | null
          permissions?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      app_analytics_events: {
        Row: {
          app_build: string | null
          app_version: string | null
          created_at: string
          device_platform: string | null
          distribution_channel: string | null
          event_action: string | null
          event_category: string | null
          event_label: string | null
          event_name: string
          event_value: number | null
          id: string
          page_path: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          app_build?: string | null
          app_version?: string | null
          created_at?: string
          device_platform?: string | null
          distribution_channel?: string | null
          event_action?: string | null
          event_category?: string | null
          event_label?: string | null
          event_name: string
          event_value?: number | null
          id?: string
          page_path?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          app_build?: string | null
          app_version?: string | null
          created_at?: string
          device_platform?: string | null
          distribution_channel?: string | null
          event_action?: string | null
          event_category?: string | null
          event_label?: string | null
          event_name?: string
          event_value?: number | null
          id?: string
          page_path?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      batch_scan_sessions: {
        Row: {
          batch_name: string | null
          created_at: string | null
          id: string
          scan_count: number | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          batch_name?: string | null
          created_at?: string | null
          id?: string
          scan_count?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          batch_name?: string | null
          created_at?: string | null
          id?: string
          scan_count?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      beta_testers: {
        Row: {
          created_at: string
          email: string
          enabled: boolean
          expires_at: string | null
          granted_by: string | null
          id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          enabled?: boolean
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          enabled?: boolean
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      camera_streams: {
        Row: {
          camera_index: number
          camera_name: string | null
          codec: string | null
          created_at: string | null
          device_id: string | null
          device_type: string | null
          fps: number | null
          id: string
          is_active: boolean | null
          is_recording: boolean | null
          resolution_height: number | null
          resolution_width: number | null
          session_id: string
          started_at: string | null
          stopped_at: string | null
          updated_at: string | null
          user_id: string
          video_duration_seconds: number | null
          video_size_bytes: number | null
          video_storage_path: string | null
          video_url: string | null
        }
        Insert: {
          camera_index: number
          camera_name?: string | null
          codec?: string | null
          created_at?: string | null
          device_id?: string | null
          device_type?: string | null
          fps?: number | null
          id?: string
          is_active?: boolean | null
          is_recording?: boolean | null
          resolution_height?: number | null
          resolution_width?: number | null
          session_id: string
          started_at?: string | null
          stopped_at?: string | null
          updated_at?: string | null
          user_id: string
          video_duration_seconds?: number | null
          video_size_bytes?: number | null
          video_storage_path?: string | null
          video_url?: string | null
        }
        Update: {
          camera_index?: number
          camera_name?: string | null
          codec?: string | null
          created_at?: string | null
          device_id?: string | null
          device_type?: string | null
          fps?: number | null
          id?: string
          is_active?: boolean | null
          is_recording?: boolean | null
          resolution_height?: number | null
          resolution_width?: number | null
          session_id?: string
          started_at?: string | null
          stopped_at?: string | null
          updated_at?: string | null
          user_id?: string
          video_duration_seconds?: number | null
          video_size_bytes?: number | null
          video_storage_path?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "camera_streams_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "multi_camera_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_checkins: {
        Row: {
          challenge_id: string | null
          checkin_data: Json | null
          created_at: string | null
          id: string
          participant_id: string | null
          user_id: string
        }
        Insert: {
          challenge_id?: string | null
          checkin_data?: Json | null
          created_at?: string | null
          id?: string
          participant_id?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string | null
          checkin_data?: Json | null
          created_at?: string | null
          id?: string
          participant_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          challenge_id: string | null
          id: string
          joined_at: string | null
          progress: number | null
          user_id: string
        }
        Insert: {
          challenge_id?: string | null
          id?: string
          joined_at?: string | null
          progress?: number | null
          user_id: string
        }
        Update: {
          challenge_id?: string | null
          id?: string
          joined_at?: string | null
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          challenge_type: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          participant_count: number | null
          start_date: string | null
          title: string
        }
        Insert: {
          challenge_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          participant_count?: number | null
          start_date?: string | null
          title: string
        }
        Update: {
          challenge_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          participant_count?: number | null
          start_date?: string | null
          title?: string
        }
        Relationships: []
      }
      cloud_processing_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          input_data: Json | null
          job_type: string
          output_data: Json | null
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          job_type: string
          output_data?: Json | null
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          job_type?: string
          output_data?: Json | null
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cloud_service_connections: {
        Row: {
          connection_status: string | null
          created_at: string | null
          id: string
          is_connected: boolean | null
          service_name: string
          service_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          connection_status?: string | null
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          service_name: string
          service_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          connection_status?: string | null
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          service_name?: string
          service_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      consultation_bookings: {
        Row: {
          consultation_type: string | null
          created_at: string | null
          duration_minutes: number | null
          expert_id: string | null
          id: string
          meeting_url: string | null
          notes: string | null
          payment_amount: number | null
          payment_status: string | null
          rating: number | null
          review: string | null
          scheduled_at: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          consultation_type?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          expert_id?: string | null
          id?: string
          meeting_url?: string | null
          notes?: string | null
          payment_amount?: number | null
          payment_status?: string | null
          rating?: number | null
          review?: string | null
          scheduled_at: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          consultation_type?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          expert_id?: string | null
          id?: string
          meeting_url?: string | null
          notes?: string | null
          payment_amount?: number | null
          payment_status?: string | null
          rating?: number | null
          review?: string | null
          scheduled_at?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string | null
          device_name: string | null
          id: string
          is_active: boolean | null
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_name?: string | null
          id?: string
          is_active?: boolean | null
          platform: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_name?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      diary_analytics: {
        Row: {
          analytics_type: string | null
          created_at: string | null
          data: Json | null
          id: string
          period_end: string | null
          period_start: string | null
          user_id: string
        }
        Insert: {
          analytics_type?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          user_id: string
        }
        Update: {
          analytics_type?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          user_id?: string
        }
        Relationships: []
      }
      diary_search_index: {
        Row: {
          created_at: string | null
          entry_id: string | null
          id: string
          search_text: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entry_id?: string | null
          id?: string
          search_text?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          entry_id?: string | null
          id?: string
          search_text?: string | null
          user_id?: string
        }
        Relationships: []
      }
      diary_templates: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          template_content: string | null
          template_name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          template_content?: string | null
          template_name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          template_content?: string | null
          template_name?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      dlc_age_verifications: {
        Row: {
          adult_content_consent: boolean | null
          expires_at: string | null
          id: string
          is_verified: boolean | null
          metadata: Json | null
          terms_accepted: boolean | null
          user_id: string
          verification_method: string
          verified_at: string | null
        }
        Insert: {
          adult_content_consent?: boolean | null
          expires_at?: string | null
          id?: string
          is_verified?: boolean | null
          metadata?: Json | null
          terms_accepted?: boolean | null
          user_id: string
          verification_method: string
          verified_at?: string | null
        }
        Update: {
          adult_content_consent?: boolean | null
          expires_at?: string | null
          id?: string
          is_verified?: boolean | null
          metadata?: Json | null
          terms_accepted?: boolean | null
          user_id?: string
          verification_method?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      dlc_bundles: {
        Row: {
          bundle_name: string
          bundle_price: number
          created_at: string | null
          description: string
          discount_percentage: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_limited_time: boolean | null
          original_price: number | null
          pack_count: number
          pack_ids: string[]
          preview_description: string | null
          preview_image_url: string | null
          revenue_total: number | null
          sales_count: number | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string | null
        }
        Insert: {
          bundle_name: string
          bundle_price: number
          created_at?: string | null
          description: string
          discount_percentage?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_limited_time?: boolean | null
          original_price?: number | null
          pack_count?: number
          pack_ids?: string[]
          preview_description?: string | null
          preview_image_url?: string | null
          revenue_total?: number | null
          sales_count?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bundle_name?: string
          bundle_price?: number
          created_at?: string | null
          description?: string
          discount_percentage?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_limited_time?: boolean | null
          original_price?: number | null
          pack_count?: number
          pack_ids?: string[]
          preview_description?: string | null
          preview_image_url?: string | null
          revenue_total?: number | null
          sales_count?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dlc_content_items: {
        Row: {
          content_description: string | null
          content_name: string
          content_type: string
          created_at: string | null
          download_count: number | null
          file_size_bytes: number | null
          file_url: string | null
          id: string
          is_active: boolean | null
          is_downloadable: boolean | null
          is_preview_available: boolean | null
          is_streamable: boolean | null
          metadata: Json | null
          pack_id: string
          preview_url: string | null
          sort_order: number | null
          thumbnail_url: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          content_description?: string | null
          content_name: string
          content_type: string
          created_at?: string | null
          download_count?: number | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          is_downloadable?: boolean | null
          is_preview_available?: boolean | null
          is_streamable?: boolean | null
          metadata?: Json | null
          pack_id: string
          preview_url?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          content_description?: string | null
          content_name?: string
          content_type?: string
          created_at?: string | null
          download_count?: number | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          is_downloadable?: boolean | null
          is_preview_available?: boolean | null
          is_streamable?: boolean | null
          metadata?: Json | null
          pack_id?: string
          preview_url?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dlc_content_items_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "dlc_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      dlc_download_queue: {
        Row: {
          completed_at: string | null
          content_item_id: string
          content_type: string
          created_at: string | null
          download_priority: number | null
          download_progress: number | null
          download_speed_bytes_per_sec: number | null
          download_status: string | null
          downloaded_bytes: number | null
          error_message: string | null
          estimated_time_remaining_seconds: number | null
          failed_at: string | null
          file_size_bytes: number | null
          file_url: string
          id: string
          max_retries: number | null
          purchase_id: string
          queued_at: string | null
          retry_count: number | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          content_item_id: string
          content_type: string
          created_at?: string | null
          download_priority?: number | null
          download_progress?: number | null
          download_speed_bytes_per_sec?: number | null
          download_status?: string | null
          downloaded_bytes?: number | null
          error_message?: string | null
          estimated_time_remaining_seconds?: number | null
          failed_at?: string | null
          file_size_bytes?: number | null
          file_url: string
          id?: string
          max_retries?: number | null
          purchase_id: string
          queued_at?: string | null
          retry_count?: number | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          content_item_id?: string
          content_type?: string
          created_at?: string | null
          download_priority?: number | null
          download_progress?: number | null
          download_speed_bytes_per_sec?: number | null
          download_status?: string | null
          downloaded_bytes?: number | null
          error_message?: string | null
          estimated_time_remaining_seconds?: number | null
          failed_at?: string | null
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          max_retries?: number | null
          purchase_id?: string
          queued_at?: string | null
          retry_count?: number | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dlc_download_queue_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "dlc_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      dlc_gift_codes: {
        Row: {
          bundle_id: string | null
          code: string
          created_at: string | null
          expires_at: string | null
          gift_message: string | null
          id: string
          is_redeemed: boolean | null
          pack_id: string | null
          recipient_email: string | null
          recipient_name: string | null
          redeemed_at: string | null
          redeemed_by: string | null
          sender_email: string | null
          sender_id: string | null
          sender_name: string | null
          value_amount: number | null
        }
        Insert: {
          bundle_id?: string | null
          code: string
          created_at?: string | null
          expires_at?: string | null
          gift_message?: string | null
          id?: string
          is_redeemed?: boolean | null
          pack_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          sender_email?: string | null
          sender_id?: string | null
          sender_name?: string | null
          value_amount?: number | null
        }
        Update: {
          bundle_id?: string | null
          code?: string
          created_at?: string | null
          expires_at?: string | null
          gift_message?: string | null
          id?: string
          is_redeemed?: boolean | null
          pack_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          sender_email?: string | null
          sender_id?: string | null
          sender_name?: string | null
          value_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dlc_gift_codes_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "dlc_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dlc_gift_codes_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "dlc_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      dlc_installations: {
        Row: {
          app_version: string | null
          checksum: string | null
          content_version: string | null
          device_id: string | null
          device_platform: string | null
          file_size_bytes: number | null
          id: string
          install_date: string | null
          install_path: string | null
          install_source: string | null
          installed_at: string | null
          installed_version: string
          is_corrupted: boolean | null
          is_installed: boolean | null
          is_valid: boolean | null
          last_integrity_check: string | null
          last_verified_at: string | null
          license_id: string | null
          package_id: string
          purchase_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          app_version?: string | null
          checksum?: string | null
          content_version?: string | null
          device_id?: string | null
          device_platform?: string | null
          file_size_bytes?: number | null
          id?: string
          install_date?: string | null
          install_path?: string | null
          install_source?: string | null
          installed_at?: string | null
          installed_version: string
          is_corrupted?: boolean | null
          is_installed?: boolean | null
          is_valid?: boolean | null
          last_integrity_check?: string | null
          last_verified_at?: string | null
          license_id?: string | null
          package_id: string
          purchase_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          app_version?: string | null
          checksum?: string | null
          content_version?: string | null
          device_id?: string | null
          device_platform?: string | null
          file_size_bytes?: number | null
          id?: string
          install_date?: string | null
          install_path?: string | null
          install_source?: string | null
          installed_at?: string | null
          installed_version?: string
          is_corrupted?: boolean | null
          is_installed?: boolean | null
          is_valid?: boolean | null
          last_integrity_check?: string | null
          last_verified_at?: string | null
          license_id?: string | null
          package_id?: string
          purchase_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dlc_installations_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "dlc_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dlc_installations_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "dlc_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dlc_installations_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "dlc_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      dlc_installed_content: {
        Row: {
          checksum: string | null
          content_item_id: string | null
          file_path: string | null
          file_size_bytes: number | null
          id: string
          installed_at: string | null
          installed_version: string
          is_valid: boolean | null
          last_verified_at: string | null
          pack_id: string
          purchase_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          checksum?: string | null
          content_item_id?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          installed_at?: string | null
          installed_version: string
          is_valid?: boolean | null
          last_verified_at?: string | null
          pack_id: string
          purchase_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          checksum?: string | null
          content_item_id?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          installed_at?: string | null
          installed_version?: string
          is_valid?: boolean | null
          last_verified_at?: string | null
          pack_id?: string
          purchase_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dlc_installed_content_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "dlc_content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dlc_installed_content_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "dlc_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dlc_installed_content_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "dlc_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      dlc_license_devices: {
        Row: {
          activated_at: string | null
          device_id: string
          device_name: string | null
          device_type: string | null
          id: string
          is_active: boolean | null
          last_seen_at: string | null
          license_id: string
          platform: string | null
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          device_id: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          last_seen_at?: string | null
          license_id: string
          platform?: string | null
          user_id: string
        }
        Update: {
          activated_at?: string | null
          device_id?: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          last_seen_at?: string | null
          license_id?: string
          platform?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dlc_license_devices_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "dlc_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      dlc_licenses: {
        Row: {
          activated_at: string | null
          content_version: string | null
          created_at: string | null
          device_id: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_verified_at: string | null
          license_key: string
          purchase_id: string | null
          signature: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          content_version?: string | null
          created_at?: string | null
          device_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_verified_at?: string | null
          license_key: string
          purchase_id?: string | null
          signature?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activated_at?: string | null
          content_version?: string | null
          created_at?: string | null
          device_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_verified_at?: string | null
          license_key?: string
          purchase_id?: string | null
          signature?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dlc_licenses_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "dlc_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      dlc_packages: {
        Row: {
          base_pack_id: string | null
          category: string | null
          content_items: Json | null
          created_at: string | null
          currency: string
          description: string | null
          features: Json | null
          id: string
          included_packages: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          item_count: number | null
          name: string
          pack_type: string
          package_id: string
          preview_images: string[] | null
          preview_video_url: string | null
          price: number
          requires_base_pack: boolean | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          tags: string[] | null
          updated_at: string | null
          version: string
        }
        Insert: {
          base_pack_id?: string | null
          category?: string | null
          content_items?: Json | null
          created_at?: string | null
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          included_packages?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          item_count?: number | null
          name: string
          pack_type?: string
          package_id: string
          preview_images?: string[] | null
          preview_video_url?: string | null
          price?: number
          requires_base_pack?: boolean | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
          version?: string
        }
        Update: {
          base_pack_id?: string | null
          category?: string | null
          content_items?: Json | null
          created_at?: string | null
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          included_packages?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          item_count?: number | null
          name?: string
          pack_type?: string
          package_id?: string
          preview_images?: string[] | null
          preview_video_url?: string | null
          price?: number
          requires_base_pack?: boolean | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "dlc_packages_base_pack_id_fkey"
            columns: ["base_pack_id"]
            isOneToOne: false
            referencedRelation: "dlc_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      dlc_packs: {
        Row: {
          average_rating: number | null
          base_pack_id: string | null
          category: string | null
          content_items: Json | null
          content_rating: string | null
          created_at: string | null
          currency: string
          description: string
          difficulty_level: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_standalone: boolean | null
          is_subscription: boolean | null
          item_count: number
          pack_name: string
          pack_type: string
          preview_description: string | null
          preview_images: string[] | null
          preview_video_url: string | null
          price: number
          rating_count: number | null
          release_date: string | null
          requires_base_pack: boolean | null
          revenue_total: number | null
          sales_count: number | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          subscription_duration_days: number | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          average_rating?: number | null
          base_pack_id?: string | null
          category?: string | null
          content_items?: Json | null
          content_rating?: string | null
          created_at?: string | null
          currency?: string
          description: string
          difficulty_level?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_standalone?: boolean | null
          is_subscription?: boolean | null
          item_count?: number
          pack_name: string
          pack_type: string
          preview_description?: string | null
          preview_images?: string[] | null
          preview_video_url?: string | null
          price?: number
          rating_count?: number | null
          release_date?: string | null
          requires_base_pack?: boolean | null
          revenue_total?: number | null
          sales_count?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          subscription_duration_days?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          average_rating?: number | null
          base_pack_id?: string | null
          category?: string | null
          content_items?: Json | null
          content_rating?: string | null
          created_at?: string | null
          currency?: string
          description?: string
          difficulty_level?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_standalone?: boolean | null
          is_subscription?: boolean | null
          item_count?: number
          pack_name?: string
          pack_type?: string
          preview_description?: string | null
          preview_images?: string[] | null
          preview_video_url?: string | null
          price?: number
          rating_count?: number | null
          release_date?: string | null
          requires_base_pack?: boolean | null
          revenue_total?: number | null
          sales_count?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          subscription_duration_days?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dlc_packs_base_pack_id_fkey"
            columns: ["base_pack_id"]
            isOneToOne: false
            referencedRelation: "dlc_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      dlc_promo_code_usage: {
        Row: {
          discount_applied: number
          id: string
          promo_code_id: string
          purchase_id: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          discount_applied: number
          id?: string
          promo_code_id: string
          purchase_id?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          discount_applied?: number
          id?: string
          promo_code_id?: string
          purchase_id?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dlc_promo_code_usage_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "dlc_promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dlc_promo_code_usage_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "dlc_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      dlc_promo_codes: {
        Row: {
          applicable_bundle_ids: string[] | null
          applicable_pack_ids: string[] | null
          applies_to_all: boolean | null
          code: string
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          max_uses_per_user: number | null
          min_purchase_amount: number | null
          starts_at: string | null
          updated_at: string | null
        }
        Insert: {
          applicable_bundle_ids?: string[] | null
          applicable_pack_ids?: string[] | null
          applies_to_all?: boolean | null
          code: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          min_purchase_amount?: number | null
          starts_at?: string | null
          updated_at?: string | null
        }
        Update: {
          applicable_bundle_ids?: string[] | null
          applicable_pack_ids?: string[] | null
          applies_to_all?: boolean | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          min_purchase_amount?: number | null
          starts_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dlc_promo_redemptions: {
        Row: {
          discount_applied: number | null
          id: string
          promo_code_id: string | null
          redeemed_at: string | null
          user_id: string
        }
        Insert: {
          discount_applied?: number | null
          id?: string
          promo_code_id?: string | null
          redeemed_at?: string | null
          user_id: string
        }
        Update: {
          discount_applied?: number | null
          id?: string
          promo_code_id?: string | null
          redeemed_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      dlc_purchases: {
        Row: {
          access_expires_at: string | null
          access_granted_at: string | null
          bundle_id: string | null
          created_at: string | null
          currency: string | null
          download_enabled: boolean | null
          id: string
          is_active: boolean | null
          pack_id: string | null
          price_paid: number
          purchase_type: string
          purchased_at: string | null
          refunded_at: string | null
          stream_enabled: boolean | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          user_id: string
        }
        Insert: {
          access_expires_at?: string | null
          access_granted_at?: string | null
          bundle_id?: string | null
          created_at?: string | null
          currency?: string | null
          download_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          pack_id?: string | null
          price_paid: number
          purchase_type: string
          purchased_at?: string | null
          refunded_at?: string | null
          stream_enabled?: boolean | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          user_id: string
        }
        Update: {
          access_expires_at?: string | null
          access_granted_at?: string | null
          bundle_id?: string | null
          created_at?: string | null
          currency?: string | null
          download_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          pack_id?: string | null
          price_paid?: number
          purchase_type?: string
          purchased_at?: string | null
          refunded_at?: string | null
          stream_enabled?: boolean | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dlc_purchases_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "dlc_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dlc_purchases_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "dlc_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      dlc_ratings: {
        Row: {
          bundle_id: string | null
          created_at: string | null
          helpful_count: number | null
          id: string
          is_approved: boolean | null
          is_featured: boolean | null
          is_verified_purchase: boolean | null
          pack_id: string | null
          rating: number
          review_text: string | null
          review_title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bundle_id?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_verified_purchase?: boolean | null
          pack_id?: string | null
          rating: number
          review_text?: string | null
          review_title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bundle_id?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_verified_purchase?: boolean | null
          pack_id?: string | null
          rating?: number
          review_text?: string | null
          review_title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dlc_ratings_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "dlc_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dlc_ratings_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "dlc_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      dlc_updates: {
        Row: {
          changelog: string[] | null
          checksum: string | null
          created_at: string | null
          id: string
          is_available: boolean | null
          is_required: boolean | null
          modified_content_items: Json | null
          new_content_items: Json | null
          pack_id: string
          release_date: string | null
          removed_content_items: string[] | null
          update_file_size_bytes: number | null
          update_file_url: string | null
          update_type: string | null
          version_number: string
        }
        Insert: {
          changelog?: string[] | null
          checksum?: string | null
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          is_required?: boolean | null
          modified_content_items?: Json | null
          new_content_items?: Json | null
          pack_id: string
          release_date?: string | null
          removed_content_items?: string[] | null
          update_file_size_bytes?: number | null
          update_file_url?: string | null
          update_type?: string | null
          version_number: string
        }
        Update: {
          changelog?: string[] | null
          checksum?: string | null
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          is_required?: boolean | null
          modified_content_items?: Json | null
          new_content_items?: Json | null
          pack_id?: string
          release_date?: string | null
          removed_content_items?: string[] | null
          update_file_size_bytes?: number | null
          update_file_url?: string | null
          update_type?: string | null
          version_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "dlc_updates_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "dlc_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      dlc_wishlist: {
        Row: {
          added_at: string | null
          bundle_id: string | null
          id: string
          notes: string | null
          notify_on_release: boolean | null
          notify_on_sale: boolean | null
          pack_id: string | null
          priority: number | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          bundle_id?: string | null
          id?: string
          notes?: string | null
          notify_on_release?: boolean | null
          notify_on_sale?: boolean | null
          pack_id?: string | null
          priority?: number | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          bundle_id?: string | null
          id?: string
          notes?: string | null
          notify_on_release?: boolean | null
          notify_on_sale?: boolean | null
          pack_id?: string | null
          priority?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dlc_wishlist_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "dlc_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dlc_wishlist_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "dlc_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      dlc_wishlist_packages: {
        Row: {
          added_at: string | null
          id: string
          notes: string | null
          package_id: string | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          notes?: string | null
          package_id?: string | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          id?: string
          notes?: string | null
          package_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      education_bookmarks: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      education_expert_content: {
        Row: {
          category: string | null
          content: string
          content_type: string | null
          created_at: string | null
          expert_id: string | null
          id: string
          is_featured: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          category?: string | null
          content: string
          content_type?: string | null
          created_at?: string | null
          expert_id?: string | null
          id?: string
          is_featured?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string
          content_type?: string | null
          created_at?: string | null
          expert_id?: string | null
          id?: string
          is_featured?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      education_interactive_content: {
        Row: {
          content_data: Json | null
          content_type: string
          created_at: string | null
          id: string
          module_id: string | null
          order_index: number | null
        }
        Insert: {
          content_data?: Json | null
          content_type: string
          created_at?: string | null
          id?: string
          module_id?: string | null
          order_index?: number | null
        }
        Update: {
          content_data?: Json | null
          content_type?: string
          created_at?: string | null
          id?: string
          module_id?: string | null
          order_index?: number | null
        }
        Relationships: []
      }
      education_qa: {
        Row: {
          answer: string | null
          category: string | null
          created_at: string | null
          id: string
          is_answered: boolean | null
          question: string
          updated_at: string | null
          upvote_count: number | null
          user_id: string
        }
        Insert: {
          answer?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_answered?: boolean | null
          question: string
          updated_at?: string | null
          upvote_count?: number | null
          user_id: string
        }
        Update: {
          answer?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_answered?: boolean | null
          question?: string
          updated_at?: string | null
          upvote_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      education_qa_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string
          qa_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type: string
          qa_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string
          qa_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      education_research_updates: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          published_date: string | null
          source_url: string | null
          summary: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          published_date?: string | null
          source_url?: string | null
          summary?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          published_date?: string | null
          source_url?: string | null
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      education_user_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          module_id: string | null
          progress_percentage: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          module_id?: string | null
          progress_percentage?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          module_id?: string | null
          progress_percentage?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_send_events: {
        Row: {
          clicked_at: string | null
          created_at: string | null
          id: string
          opened_at: string | null
          recipient_email: string
          sent_at: string | null
          status: string | null
          template_id: string | null
          user_id: string | null
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string | null
          id?: string
          opened_at?: string | null
          recipient_email: string
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_at?: string | null
          created_at?: string | null
          id?: string
          opened_at?: string | null
          recipient_email?: string
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body_html: string | null
          body_text: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          subject: string
          template_name: string
          template_type: string | null
          updated_at: string | null
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          subject: string
          template_name: string
          template_type?: string | null
          updated_at?: string | null
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          subject?: string
          template_name?: string
          template_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      enhanced_diary_entries: {
        Row: {
          attachments: Json | null
          content: string | null
          created_at: string | null
          entry_date: string | null
          id: string
          is_private: boolean | null
          mood_score: number | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          content?: string | null
          created_at?: string | null
          entry_date?: string | null
          id?: string
          is_private?: boolean | null
          mood_score?: number | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string | null
          created_at?: string | null
          entry_date?: string | null
          id?: string
          is_private?: boolean | null
          mood_score?: number | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      expert_articles: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          expert_id: string
          id: string
          is_featured: boolean | null
          like_count: number | null
          published_at: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          expert_id: string
          id?: string
          is_featured?: boolean | null
          like_count?: number | null
          published_at?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          expert_id?: string
          id?: string
          is_featured?: boolean | null
          like_count?: number | null
          published_at?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_articles_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "expert_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_consultations: {
        Row: {
          consultation_type: string
          created_at: string | null
          duration_minutes: number
          expert_id: string
          id: string
          meeting_url: string | null
          notes: string | null
          payment_amount: number | null
          payment_status: string | null
          rating: number | null
          recording_url: string | null
          review: string | null
          scheduled_at: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          consultation_type: string
          created_at?: string | null
          duration_minutes?: number
          expert_id: string
          id?: string
          meeting_url?: string | null
          notes?: string | null
          payment_amount?: number | null
          payment_status?: string | null
          rating?: number | null
          recording_url?: string | null
          review?: string | null
          scheduled_at: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          consultation_type?: string
          created_at?: string | null
          duration_minutes?: number
          expert_id?: string
          id?: string
          meeting_url?: string | null
          notes?: string | null
          payment_amount?: number | null
          payment_status?: string | null
          rating?: number | null
          recording_url?: string | null
          review?: string | null
          scheduled_at?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_consultations_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "expert_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_group_workshops: {
        Row: {
          created_at: string | null
          current_participants: number | null
          description: string | null
          duration_minutes: number
          expert_id: string
          id: string
          max_participants: number | null
          meeting_url: string | null
          price_per_person: number
          recording_url: string | null
          scheduled_at: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_participants?: number | null
          description?: string | null
          duration_minutes?: number
          expert_id: string
          id?: string
          max_participants?: number | null
          meeting_url?: string | null
          price_per_person: number
          recording_url?: string | null
          scheduled_at: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_participants?: number | null
          description?: string | null
          duration_minutes?: number
          expert_id?: string
          id?: string
          max_participants?: number | null
          meeting_url?: string | null
          price_per_person?: number
          recording_url?: string | null
          scheduled_at?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_group_workshops_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "expert_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_profiles: {
        Row: {
          availability_schedule: Json | null
          bio: string | null
          consultation_rate_per_hour: number | null
          created_at: string | null
          credentials: string[] | null
          display_name: string
          group_workshop_rate_per_person: number | null
          id: string
          is_available: boolean | null
          is_verified: boolean | null
          profile_image_url: string | null
          rating: number | null
          review_count: number | null
          specialties: string[] | null
          updated_at: string | null
          user_id: string
          years_experience: number | null
        }
        Insert: {
          availability_schedule?: Json | null
          bio?: string | null
          consultation_rate_per_hour?: number | null
          created_at?: string | null
          credentials?: string[] | null
          display_name: string
          group_workshop_rate_per_person?: number | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          profile_image_url?: string | null
          rating?: number | null
          review_count?: number | null
          specialties?: string[] | null
          updated_at?: string | null
          user_id: string
          years_experience?: number | null
        }
        Update: {
          availability_schedule?: Json | null
          bio?: string | null
          consultation_rate_per_hour?: number | null
          created_at?: string | null
          credentials?: string[] | null
          display_name?: string
          group_workshop_rate_per_person?: number | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          profile_image_url?: string | null
          rating?: number | null
          review_count?: number | null
          specialties?: string[] | null
          updated_at?: string | null
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      expert_qa: {
        Row: {
          answer: string | null
          answered_at: string | null
          category: string | null
          created_at: string | null
          expert_id: string | null
          id: string
          question: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          category?: string | null
          created_at?: string | null
          expert_id?: string | null
          id?: string
          question: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          category?: string | null
          created_at?: string | null
          expert_id?: string | null
          id?: string
          question?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      expert_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          category: string | null
          created_at: string | null
          expert_id: string
          id: string
          question: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          category?: string | null
          created_at?: string | null
          expert_id: string
          id?: string
          question: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          category?: string | null
          created_at?: string | null
          expert_id?: string
          id?: string
          question?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_questions_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "expert_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_ratings: {
        Row: {
          consultation_id: string | null
          created_at: string | null
          expert_id: string | null
          helpful_count: number | null
          id: string
          is_approved: boolean | null
          rating: number
          review_text: string | null
          review_title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          consultation_id?: string | null
          created_at?: string | null
          expert_id?: string | null
          helpful_count?: number | null
          id?: string
          is_approved?: boolean | null
          rating: number
          review_text?: string | null
          review_title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          consultation_id?: string | null
          created_at?: string | null
          expert_id?: string | null
          helpful_count?: number | null
          id?: string
          is_approved?: boolean | null
          rating?: number
          review_text?: string | null
          review_title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      expert_videos: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          expert_id: string
          id: string
          is_featured: boolean | null
          like_count: number | null
          published_at: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_url: string
          view_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          expert_id: string
          id?: string
          is_featured?: boolean | null
          like_count?: number | null
          published_at?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_url: string
          view_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          expert_id?: string
          id?: string
          is_featured?: boolean | null
          like_count?: number | null
          published_at?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_videos_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "expert_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      export_jobs: {
        Row: {
          created_at: string | null
          export_name: string
          export_status: string | null
          export_type: string
          file_url: string | null
          id: string
          progress_percentage: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          export_name: string
          export_status?: string | null
          export_type: string
          file_url?: string | null
          id?: string
          progress_percentage?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          export_name?: string
          export_status?: string | null
          export_type?: string
          file_url?: string | null
          id?: string
          progress_percentage?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      exported_3d_models: {
        Row: {
          created_at: string | null
          file_size_bytes: number | null
          id: string
          model_format: string | null
          model_url: string | null
          scan_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_size_bytes?: number | null
          id?: string
          model_format?: string | null
          model_url?: string | null
          scan_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_size_bytes?: number | null
          id?: string
          model_format?: string | null
          model_url?: string | null
          scan_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      forum_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
          post_count: number | null
          thread_count: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
          post_count?: number | null
          thread_count?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          post_count?: number | null
          thread_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      forum_threads: {
        Row: {
          category_id: string | null
          content: string
          created_at: string
          id: string
          is_locked: boolean | null
          is_pinned: boolean | null
          last_reply_at: string | null
          last_reply_user_id: string | null
          reply_count: number | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          category_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          last_reply_at?: string | null
          last_reply_user_id?: string | null
          reply_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          category_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          last_reply_at?: string | null
          last_reply_user_id?: string | null
          reply_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_threads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_user_reputation: {
        Row: {
          badges: string[] | null
          created_at: string
          helpful_count: number | null
          id: string
          posts_count: number | null
          rank_title: string | null
          reputation_points: number | null
          threads_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          badges?: string[] | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          posts_count?: number | null
          rank_title?: string | null
          reputation_points?: number | null
          threads_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          badges?: string[] | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          posts_count?: number | null
          rank_title?: string | null
          reputation_points?: number | null
          threads_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      group_chat_members: {
        Row: {
          group_id: string | null
          id: string
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          group_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      group_chat_messages: {
        Row: {
          created_at: string | null
          group_id: string | null
          id: string
          message: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          group_id?: string | null
          id?: string
          message: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string | null
          id?: string
          message?: string
          sender_id?: string
        }
        Relationships: []
      }
      group_chats: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          member_count: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          member_count?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          member_count?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      growth_predictions: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          prediction_data: Json | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          prediction_data?: Json | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          prediction_data?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      habit_definitions: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          description: string | null
          frequency: string
          icon: string | null
          id: string
          is_active: boolean | null
          is_template: boolean | null
          linked_feature: string | null
          linked_routine_id: string | null
          name: string
          order_index: number | null
          reminder_days: number[] | null
          reminder_enabled: boolean | null
          reminder_times: string[] | null
          target_value: number | null
          unit: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          frequency?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          linked_feature?: string | null
          linked_routine_id?: string | null
          name: string
          order_index?: number | null
          reminder_days?: number[] | null
          reminder_enabled?: boolean | null
          reminder_times?: string[] | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          frequency?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          linked_feature?: string | null
          linked_routine_id?: string | null
          name?: string
          order_index?: number | null
          reminder_days?: number[] | null
          reminder_enabled?: boolean | null
          reminder_times?: string[] | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      habit_entries: {
        Row: {
          completed_at: string | null
          completed_value: number | null
          created_at: string
          difficulty_rating: number | null
          duration_minutes: number | null
          entry_date: string
          id: string
          mood: string | null
          notes: string | null
          target_value: number | null
          updated_at: string
          user_habit_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_value?: number | null
          created_at?: string
          difficulty_rating?: number | null
          duration_minutes?: number | null
          entry_date: string
          id?: string
          mood?: string | null
          notes?: string | null
          target_value?: number | null
          updated_at?: string
          user_habit_id: string
        }
        Update: {
          completed_at?: string | null
          completed_value?: number | null
          created_at?: string
          difficulty_rating?: number | null
          duration_minutes?: number | null
          entry_date?: string
          id?: string
          mood?: string | null
          notes?: string | null
          target_value?: number | null
          updated_at?: string
          user_habit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_entries_user_habit_id_fkey"
            columns: ["user_habit_id"]
            isOneToOne: false
            referencedRelation: "user_habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_streaks: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          streak_end_date: string | null
          streak_length: number | null
          streak_start_date: string
          updated_at: string
          user_habit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          streak_end_date?: string | null
          streak_length?: number | null
          streak_start_date: string
          updated_at?: string
          user_habit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          streak_end_date?: string | null
          streak_length?: number | null
          streak_start_date?: string
          updated_at?: string
          user_habit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_streaks_user_habit_id_fkey"
            columns: ["user_habit_id"]
            isOneToOne: false
            referencedRelation: "user_habits"
            referencedColumns: ["id"]
          },
        ]
      }
      health_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          severity: string | null
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          severity?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          severity?: string | null
          user_id?: string
        }
        Relationships: []
      }
      health_assessments: {
        Row: {
          assessment_name: string
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          questions: Json | null
        }
        Insert: {
          assessment_name: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          questions?: Json | null
        }
        Update: {
          assessment_name?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          questions?: Json | null
        }
        Relationships: []
      }
      health_diary: {
        Row: {
          circumference: number | null
          created_at: string
          curvature_angle: number | null
          curvature_direction: string | null
          entry_date: string
          id: string
          length: number | null
          notes: string | null
          pain_level: number | null
          symptoms: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          circumference?: number | null
          created_at?: string
          curvature_angle?: number | null
          curvature_direction?: string | null
          entry_date?: string
          id?: string
          length?: number | null
          notes?: string | null
          pain_level?: number | null
          symptoms?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          circumference?: number | null
          created_at?: string
          curvature_angle?: number | null
          curvature_direction?: string | null
          entry_date?: string
          id?: string
          length?: number | null
          notes?: string | null
          pain_level?: number | null
          symptoms?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_education_content: {
        Row: {
          category: string | null
          content: string | null
          content_type: string | null
          created_at: string | null
          difficulty_level: string | null
          id: string
          is_published: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          content_type?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          id?: string
          is_published?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string | null
          content_type?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          id?: string
          is_published?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      health_risk_factors: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          identified_at: string | null
          risk_factor: string
          severity: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          identified_at?: string | null
          risk_factor: string
          severity?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          identified_at?: string | null
          risk_factor?: string
          severity?: string | null
          user_id?: string
        }
        Relationships: []
      }
      health_risk_predictions: {
        Row: {
          created_at: string | null
          id: string
          risk_data: Json | null
          risk_level: string | null
          risk_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          risk_data?: Json | null
          risk_level?: string | null
          risk_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          risk_data?: Json | null
          risk_level?: string | null
          risk_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      health_trend_visualizations: {
        Row: {
          chart_config: Json | null
          chart_image_url: string | null
          created_at: string | null
          data_points: Json | null
          generated_at: string | null
          id: string
          insights: string[] | null
          predictions: Json | null
          time_period_days: number | null
          trend_data: Json
          user_id: string
          visualization_type: string
        }
        Insert: {
          chart_config?: Json | null
          chart_image_url?: string | null
          created_at?: string | null
          data_points?: Json | null
          generated_at?: string | null
          id?: string
          insights?: string[] | null
          predictions?: Json | null
          time_period_days?: number | null
          trend_data?: Json
          user_id: string
          visualization_type: string
        }
        Update: {
          chart_config?: Json | null
          chart_image_url?: string | null
          created_at?: string | null
          data_points?: Json | null
          generated_at?: string | null
          id?: string
          insights?: string[] | null
          predictions?: Json | null
          time_period_days?: number | null
          trend_data?: Json
          user_id?: string
          visualization_type?: string
        }
        Relationships: []
      }
      healthcare_providers: {
        Row: {
          address: string | null
          baa_signed: boolean | null
          baa_signed_date: string | null
          created_at: string
          credentials: string[] | null
          current_patient_count: number | null
          email: string
          hipaa_certification_date: string | null
          hipaa_compliant: boolean | null
          id: string
          is_active: boolean | null
          license_number: string | null
          license_state: string | null
          max_patients: number | null
          phone: string | null
          provider_name: string
          provider_type: string
          specialty: string[] | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          baa_signed?: boolean | null
          baa_signed_date?: string | null
          created_at?: string
          credentials?: string[] | null
          current_patient_count?: number | null
          email: string
          hipaa_certification_date?: string | null
          hipaa_compliant?: boolean | null
          id?: string
          is_active?: boolean | null
          license_number?: string | null
          license_state?: string | null
          max_patients?: number | null
          phone?: string | null
          provider_name: string
          provider_type?: string
          specialty?: string[] | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          baa_signed?: boolean | null
          baa_signed_date?: string | null
          created_at?: string
          credentials?: string[] | null
          current_patient_count?: number | null
          email?: string
          hipaa_certification_date?: string | null
          hipaa_compliant?: boolean | null
          id?: string
          is_active?: boolean | null
          license_number?: string | null
          license_state?: string | null
          max_patients?: number | null
          phone?: string | null
          provider_name?: string
          provider_type?: string
          specialty?: string[] | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      hipaa_audit_logs: {
        Row: {
          action_type: string
          created_at: string
          description: string | null
          id: string
          ip_address: string | null
          provider_id: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          provider_id?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          provider_id?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hormone_levels: {
        Row: {
          created_at: string | null
          hormone_type: string
          id: string
          level: number | null
          reference_range: string | null
          test_date: string | null
          unit: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          hormone_type: string
          id?: string
          level?: number | null
          reference_range?: string | null
          test_date?: string | null
          unit?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          hormone_type?: string
          id?: string
          level?: number | null
          reference_range?: string | null
          test_date?: string | null
          unit?: string | null
          user_id?: string
        }
        Relationships: []
      }
      import_jobs: {
        Row: {
          created_at: string | null
          id: string
          import_name: string
          import_status: string | null
          import_type: string
          progress_percentage: number | null
          records_imported: number | null
          records_total: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          import_name: string
          import_status?: string | null
          import_type: string
          progress_percentage?: number | null
          records_imported?: number | null
          records_total?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          import_name?: string
          import_status?: string | null
          import_type?: string
          progress_percentage?: number | null
          records_imported?: number | null
          records_total?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      intimate_date_aftercare_items: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          item_text: string
          order_index: number | null
          proposal_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          item_text: string
          order_index?: number | null
          proposal_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          item_text?: string
          order_index?: number | null
          proposal_id?: string | null
        }
        Relationships: []
      }
      intimate_date_checklist_items: {
        Row: {
          created_at: string | null
          id: string
          is_completed: boolean | null
          item_text: string
          order_index: number | null
          proposal_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          item_text: string
          order_index?: number | null
          proposal_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          item_text?: string
          order_index?: number | null
          proposal_id?: string | null
        }
        Relationships: []
      }
      intimate_date_distractions: {
        Row: {
          created_at: string | null
          description: string | null
          distraction_type: string | null
          id: string
          is_addressed: boolean | null
          proposal_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          distraction_type?: string | null
          id?: string
          is_addressed?: boolean | null
          proposal_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          distraction_type?: string | null
          id?: string
          is_addressed?: boolean | null
          proposal_id?: string | null
        }
        Relationships: []
      }
      intimate_date_itinerary_items: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string | null
          id: string
          order_index: number | null
          proposal_id: string | null
          start_time: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          order_index?: number | null
          proposal_id?: string | null
          start_time?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          order_index?: number | null
          proposal_id?: string | null
          start_time?: string | null
          title?: string
        }
        Relationships: []
      }
      intimate_date_packing_items: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_packed: boolean | null
          item_name: string
          proposal_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_packed?: boolean | null
          item_name: string
          proposal_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_packed?: boolean | null
          item_name?: string
          proposal_id?: string | null
        }
        Relationships: []
      }
      intimate_date_positions: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          order_index: number | null
          position_id: string | null
          proposal_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          order_index?: number | null
          position_id?: string | null
          proposal_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          order_index?: number | null
          position_id?: string | null
          proposal_id?: string | null
        }
        Relationships: []
      }
      intimate_date_proposals: {
        Row: {
          accepted_at: string | null
          activities: Json
          adult_emojis: string[] | null
          created_at: string | null
          creator_id: string
          duration_minutes: number | null
          gifs_urls: string[] | null
          id: string
          images_urls: string[] | null
          is_location_private: boolean | null
          links: string[] | null
          location_address: string | null
          location_name: string | null
          location_type: string | null
          partner_id: string
          partner_media_urls: string[] | null
          partner_modified_date: string | null
          partner_modified_time: string | null
          partner_response: string | null
          partner_suggestions: string | null
          proposal_status: string | null
          proposal_title: string
          proposal_type: string | null
          proposed_date: string
          proposed_time: string
          responded_at: string | null
          reviewed_at: string | null
          special_requests: string | null
          specialty_intimacy: string[] | null
          template_id: string | null
          text_message: string | null
          updated_at: string | null
          videos_urls: string[] | null
          voice_message_duration_seconds: number | null
          voice_message_url: string | null
        }
        Insert: {
          accepted_at?: string | null
          activities: Json
          adult_emojis?: string[] | null
          created_at?: string | null
          creator_id: string
          duration_minutes?: number | null
          gifs_urls?: string[] | null
          id?: string
          images_urls?: string[] | null
          is_location_private?: boolean | null
          links?: string[] | null
          location_address?: string | null
          location_name?: string | null
          location_type?: string | null
          partner_id: string
          partner_media_urls?: string[] | null
          partner_modified_date?: string | null
          partner_modified_time?: string | null
          partner_response?: string | null
          partner_suggestions?: string | null
          proposal_status?: string | null
          proposal_title: string
          proposal_type?: string | null
          proposed_date: string
          proposed_time: string
          responded_at?: string | null
          reviewed_at?: string | null
          special_requests?: string | null
          specialty_intimacy?: string[] | null
          template_id?: string | null
          text_message?: string | null
          updated_at?: string | null
          videos_urls?: string[] | null
          voice_message_duration_seconds?: number | null
          voice_message_url?: string | null
        }
        Update: {
          accepted_at?: string | null
          activities?: Json
          adult_emojis?: string[] | null
          created_at?: string | null
          creator_id?: string
          duration_minutes?: number | null
          gifs_urls?: string[] | null
          id?: string
          images_urls?: string[] | null
          is_location_private?: boolean | null
          links?: string[] | null
          location_address?: string | null
          location_name?: string | null
          location_type?: string | null
          partner_id?: string
          partner_media_urls?: string[] | null
          partner_modified_date?: string | null
          partner_modified_time?: string | null
          partner_response?: string | null
          partner_suggestions?: string | null
          proposal_status?: string | null
          proposal_title?: string
          proposal_type?: string | null
          proposed_date?: string
          proposed_time?: string
          responded_at?: string | null
          reviewed_at?: string | null
          special_requests?: string | null
          specialty_intimacy?: string[] | null
          template_id?: string | null
          text_message?: string | null
          updated_at?: string | null
          videos_urls?: string[] | null
          voice_message_duration_seconds?: number | null
          voice_message_url?: string | null
        }
        Relationships: []
      }
      intimate_date_reflections: {
        Row: {
          created_at: string | null
          highlights: string[] | null
          id: string
          improvements: string[] | null
          proposal_id: string | null
          rating: number | null
          reflection_text: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          highlights?: string[] | null
          id?: string
          improvements?: string[] | null
          proposal_id?: string | null
          rating?: number | null
          reflection_text?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          highlights?: string[] | null
          id?: string
          improvements?: string[] | null
          proposal_id?: string | null
          rating?: number | null
          reflection_text?: string | null
          user_id?: string
        }
        Relationships: []
      }
      intimate_date_reminders: {
        Row: {
          created_at: string | null
          id: string
          is_sent: boolean | null
          message: string | null
          proposal_id: string | null
          reminder_time: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_sent?: boolean | null
          message?: string | null
          proposal_id?: string | null
          reminder_time?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_sent?: boolean | null
          message?: string | null
          proposal_id?: string | null
          reminder_time?: string | null
          user_id?: string
        }
        Relationships: []
      }
      intimate_date_templates: {
        Row: {
          created_at: string | null
          default_activities: Json
          default_duration_minutes: number | null
          default_location_type: string | null
          default_message: string | null
          default_positions: string[] | null
          default_voice_script: string | null
          id: string
          is_public: boolean | null
          template_category: string | null
          template_name: string
          updated_at: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          default_activities: Json
          default_duration_minutes?: number | null
          default_location_type?: string | null
          default_message?: string | null
          default_positions?: string[] | null
          default_voice_script?: string | null
          id?: string
          is_public?: boolean | null
          template_category?: string | null
          template_name: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          default_activities?: Json
          default_duration_minutes?: number | null
          default_location_type?: string | null
          default_message?: string | null
          default_positions?: string[] | null
          default_voice_script?: string | null
          id?: string
          is_public?: boolean | null
          template_category?: string | null
          template_name?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      leaderboard_entries: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          leaderboard_id: string | null
          rank: number | null
          score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          leaderboard_id?: string | null
          rank?: number | null
          score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          leaderboard_id?: string | null
          rank?: number | null
          score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      leaderboards: {
        Row: {
          created_at: string | null
          display_name: string
          id: string
          is_anonymous: boolean | null
          leaderboard_type: string
          period: string
          rank: number | null
          score: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string
          id?: string
          is_anonymous?: boolean | null
          leaderboard_type: string
          period: string
          rank?: number | null
          score?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string
          id?: string
          is_anonymous?: boolean | null
          leaderboard_type?: string
          period?: string
          rank?: number | null
          score?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      learning_certificates: {
        Row: {
          certificate_data: Json | null
          certificate_number: string
          course_id: string
          created_at: string | null
          id: string
          issued_at: string | null
          user_id: string
        }
        Insert: {
          certificate_data?: Json | null
          certificate_number: string
          course_id: string
          created_at?: string | null
          id?: string
          issued_at?: string | null
          user_id: string
        }
        Update: {
          certificate_data?: Json | null
          certificate_number?: string
          course_id?: string
          created_at?: string | null
          id?: string
          issued_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learning_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_course_reviews: {
        Row: {
          course_id: string | null
          created_at: string | null
          id: string
          is_approved: boolean | null
          rating: number
          review_text: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          rating: number
          review_text?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          rating?: number
          review_text?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      learning_courses: {
        Row: {
          average_rating: number | null
          category: string | null
          completion_count: number | null
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          enrollment_count: number | null
          estimated_duration_minutes: number | null
          id: string
          intro_video_url: string | null
          is_featured: boolean | null
          is_premium: boolean | null
          is_published: boolean | null
          lesson_count: number | null
          module_count: number | null
          order_index: number | null
          rating_count: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          average_rating?: number | null
          category?: string | null
          completion_count?: number | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          enrollment_count?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          intro_video_url?: string | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          is_published?: boolean | null
          lesson_count?: number | null
          module_count?: number | null
          order_index?: number | null
          rating_count?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          average_rating?: number | null
          category?: string | null
          completion_count?: number | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          enrollment_count?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          intro_video_url?: string | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          is_published?: boolean | null
          lesson_count?: number | null
          module_count?: number | null
          order_index?: number | null
          rating_count?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      learning_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string | null
          current_lesson_id: string | null
          current_module_id: string | null
          id: string
          last_accessed_at: string | null
          progress_percentage: number | null
          started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          current_lesson_id?: string | null
          current_module_id?: string | null
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number | null
          started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          current_lesson_id?: string | null
          current_module_id?: string | null
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learning_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_enrollments_current_lesson_id_fkey"
            columns: ["current_lesson_id"]
            isOneToOne: false
            referencedRelation: "learning_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_enrollments_current_module_id_fkey"
            columns: ["current_module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_lesson_progress: {
        Row: {
          attempts: number | null
          completed_at: string | null
          completion_percentage: number | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          last_accessed_at: string | null
          lesson_id: string
          time_spent_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          last_accessed_at?: string | null
          lesson_id: string
          time_spent_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          last_accessed_at?: string | null
          lesson_id?: string
          time_spent_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "learning_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_lessons: {
        Row: {
          content_data: Json | null
          content_type: string
          created_at: string | null
          estimated_duration_minutes: number | null
          id: string
          module_id: string
          order_index: number | null
          requires_completion_of: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content_data?: Json | null
          content_type?: string
          created_at?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          module_id: string
          order_index?: number | null
          requires_completion_of?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content_data?: Json | null
          content_type?: string
          created_at?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          module_id?: string
          order_index?: number | null
          requires_completion_of?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_modules: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          lesson_count: number | null
          order_index: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          lesson_count?: number | null
          order_index?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          lesson_count?: number | null
          order_index?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learning_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          completed_at: string | null
          course_ids: string[] | null
          created_at: string | null
          current_course_index: number | null
          estimated_completion_date: string | null
          id: string
          path_name: string
          path_type: string
          progress_percentage: number | null
          started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_ids?: string[] | null
          created_at?: string | null
          current_course_index?: number | null
          estimated_completion_date?: string | null
          id?: string
          path_name: string
          path_type?: string
          progress_percentage?: number | null
          started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_ids?: string[] | null
          created_at?: string | null
          current_course_index?: number | null
          estimated_completion_date?: string | null
          id?: string
          path_name?: string
          path_type?: string
          progress_percentage?: number | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      learning_quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string | null
          created_at: string | null
          id: string
          passed: boolean | null
          quiz_id: string
          score: number | null
          started_at: string | null
          time_taken_minutes: number | null
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          created_at?: string | null
          id?: string
          passed?: boolean | null
          quiz_id: string
          score?: number | null
          started_at?: string | null
          time_taken_minutes?: number | null
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          created_at?: string | null
          id?: string
          passed?: boolean | null
          quiz_id?: string
          score?: number | null
          started_at?: string | null
          time_taken_minutes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "learning_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_quizzes: {
        Row: {
          attempt_limit: number | null
          course_id: string | null
          created_at: string | null
          description: string | null
          id: string
          lesson_id: string | null
          passing_score: number | null
          questions: Json
          quiz_type: string | null
          show_results_immediately: boolean | null
          time_limit_minutes: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          attempt_limit?: number | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          lesson_id?: string | null
          passing_score?: number | null
          questions?: Json
          quiz_type?: string | null
          show_results_immediately?: boolean | null
          time_limit_minutes?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          attempt_limit?: number | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          lesson_id?: string | null
          passing_score?: number | null
          questions?: Json
          quiz_type?: string | null
          show_results_immediately?: boolean | null
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learning_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "learning_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_recommendations: {
        Row: {
          confidence_score: number | null
          course_id: string | null
          created_at: string | null
          dismissed_at: string | null
          id: string
          is_dismissed: boolean | null
          priority: number | null
          recommendation_reason: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          course_id?: string | null
          created_at?: string | null
          dismissed_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          priority?: number | null
          recommendation_reason?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          course_id?: string | null
          created_at?: string | null
          dismissed_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          priority?: number | null
          recommendation_reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_recommendations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learning_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      live_camera_feeds: {
        Row: {
          camera_index: number
          camera_label: string | null
          created_at: string | null
          fps: number | null
          id: string
          is_active: boolean | null
          last_heartbeat: string | null
          resolution: string | null
          session_id: string
          stream_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          camera_index?: number
          camera_label?: string | null
          created_at?: string | null
          fps?: number | null
          id?: string
          is_active?: boolean | null
          last_heartbeat?: string | null
          resolution?: string | null
          session_id: string
          stream_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          camera_index?: number
          camera_label?: string | null
          created_at?: string | null
          fps?: number | null
          id?: string
          is_active?: boolean | null
          last_heartbeat?: string | null
          resolution?: string | null
          session_id?: string
          stream_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      login_history: {
        Row: {
          device_type: string | null
          id: string
          ip_address: string | null
          is_successful: boolean | null
          location: string | null
          login_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          device_type?: string | null
          id?: string
          ip_address?: string | null
          is_successful?: boolean | null
          location?: string | null
          login_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          device_type?: string | null
          id?: string
          ip_address?: string | null
          is_successful?: boolean | null
          location?: string | null
          login_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      long_term_health_forecasts: {
        Row: {
          confidence: number | null
          created_at: string | null
          forecast_data: Json | null
          forecast_date: string | null
          forecast_type: string | null
          id: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          forecast_data?: Json | null
          forecast_date?: string | null
          forecast_type?: string | null
          id?: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          forecast_data?: Json | null
          forecast_date?: string | null
          forecast_type?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_items: {
        Row: {
          average_rating: number | null
          category_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          is_featured: boolean | null
          item_type: string
          metadata: Json | null
          price: number
          purchase_count: number | null
          rating_count: number | null
          seller_id: string
          status: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          average_rating?: number | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          item_type: string
          metadata?: Json | null
          price?: number
          purchase_count?: number | null
          rating_count?: number | null
          seller_id: string
          status?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          average_rating?: number | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          item_type?: string
          metadata?: Json | null
          price?: number
          purchase_count?: number | null
          rating_count?: number | null
          seller_id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_purchases: {
        Row: {
          id: string
          item_id: string | null
          payment_status: string | null
          price_paid: number | null
          purchased_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          item_id?: string | null
          payment_status?: string | null
          price_paid?: number | null
          purchased_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          item_id?: string | null
          payment_status?: string | null
          price_paid?: number | null
          purchased_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      measurement_suggestions: {
        Row: {
          applied_at: string | null
          created_at: string | null
          current_value: number | null
          id: string
          improvement_expected: number
          is_applied: boolean | null
          priority: string
          reasoning: string | null
          scan_id: string | null
          suggested_value: number
          suggestion_type: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          improvement_expected: number
          is_applied?: boolean | null
          priority?: string
          reasoning?: string | null
          scan_id?: string | null
          suggested_value: number
          suggestion_type: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          improvement_expected?: number
          is_applied?: boolean | null
          priority?: string
          reasoning?: string | null
          scan_id?: string | null
          suggested_value?: number
          suggestion_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "measurement_suggestions_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      measurement_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          measurements: Json | null
          template_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          measurements?: Json | null
          template_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          measurements?: Json | null
          template_name?: string
        }
        Relationships: []
      }
      medication_log: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          schedule_id: string | null
          taken_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          schedule_id?: string | null
          taken_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          schedule_id?: string | null
          taken_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      medication_schedules: {
        Row: {
          created_at: string | null
          dosage: string | null
          end_date: string | null
          frequency: string | null
          id: string
          is_active: boolean | null
          medication_name: string
          start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          medication_name: string
          start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          medication_name?: string
          start_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      multi_angle_scan_images: {
        Row: {
          angle_label: string | null
          created_at: string | null
          id: string
          image_url: string | null
          order_index: number | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          angle_label?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          order_index?: number | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          angle_label?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          order_index?: number | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "multi_angle_scan_images_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "multi_angle_scan_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      multi_angle_scan_sessions: {
        Row: {
          angle_count: number | null
          created_at: string | null
          id: string
          session_name: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          angle_count?: number | null
          created_at?: string | null
          id?: string
          session_name?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          angle_count?: number | null
          created_at?: string | null
          id?: string
          session_name?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      multi_camera_sessions: {
        Row: {
          camera_count: number | null
          completed_at: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          is_private: boolean | null
          partner_id: string | null
          quality: string | null
          recording_status: string | null
          session_name: string
          session_type: string
          share_with_partner: boolean | null
          started_at: string | null
          sync_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          camera_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_private?: boolean | null
          partner_id?: string | null
          quality?: string | null
          recording_status?: string | null
          session_name: string
          session_type: string
          share_with_partner?: boolean | null
          started_at?: string | null
          sync_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          camera_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_private?: boolean | null
          partner_id?: string | null
          quality?: string | null
          recording_status?: string | null
          session_name?: string
          session_type?: string
          share_with_partner?: boolean | null
          started_at?: string | null
          sync_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      multi_week_programs: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          duration_weeks: number | null
          id: string
          is_public: boolean | null
          program_data: Json | null
          program_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_weeks?: number | null
          id?: string
          is_public?: boolean | null
          program_data?: Json | null
          program_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_weeks?: number | null
          id?: string
          is_public?: boolean | null
          program_data?: Json | null
          program_name?: string
        }
        Relationships: []
      }
      nsfw_ai_chat_sessions: {
        Row: {
          chat_type: string | null
          context_data: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_message_at: string | null
          message_count: number | null
          messages: Json | null
          preferences: Json | null
          session_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chat_type?: string | null
          context_data?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          message_count?: number | null
          messages?: Json | null
          preferences?: Json | null
          session_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chat_type?: string | null
          context_data?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          message_count?: number | null
          messages?: Json | null
          preferences?: Json | null
          session_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nsfw_challenge_participants: {
        Row: {
          challenge_id: string | null
          id: string
          joined_at: string | null
          progress: number | null
          user_id: string
        }
        Insert: {
          challenge_id?: string | null
          id?: string
          joined_at?: string | null
          progress?: number | null
          user_id: string
        }
        Update: {
          challenge_id?: string | null
          id?: string
          joined_at?: string | null
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nsfw_challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "nsfw_community_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      nsfw_community_challenges: {
        Row: {
          challenge_type: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          participant_count: number | null
          start_date: string | null
          title: string
        }
        Insert: {
          challenge_type?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          participant_count?: number | null
          start_date?: string | null
          title: string
        }
        Update: {
          challenge_type?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          participant_count?: number | null
          start_date?: string | null
          title?: string
        }
        Relationships: []
      }
      nsfw_consent_events: {
        Row: {
          consent_given: boolean
          consent_timestamp: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          policy_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_given: boolean
          consent_timestamp?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          policy_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_given?: boolean
          consent_timestamp?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          policy_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nsfw_consent_policies: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          policy_name: string
          policy_text: string
          policy_version: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          policy_name: string
          policy_text: string
          policy_version: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          policy_name?: string
          policy_text?: string
          policy_version?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      nsfw_detection_models: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          model_name: string
          model_type: string | null
          model_version: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          model_name: string
          model_type?: string | null
          model_version?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          model_name?: string
          model_type?: string | null
          model_version?: string | null
        }
        Relationships: []
      }
      nsfw_detection_results: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          image_url: string | null
          model_id: string | null
          result_data: Json | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          model_id?: string | null
          result_data?: Json | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          model_id?: string | null
          result_data?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      nsfw_ensemble_results: {
        Row: {
          confidence: number | null
          created_at: string | null
          ensemble_data: Json | null
          final_classification: string | null
          id: string
          scan_id: string | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          ensemble_data?: Json | null
          final_classification?: string | null
          id?: string
          scan_id?: string | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          ensemble_data?: Json | null
          final_classification?: string | null
          id?: string
          scan_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nsfw_expert_content: {
        Row: {
          average_rating: number | null
          category: string | null
          content_body: string | null
          content_type: string
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          dlc_pack_id: string | null
          estimated_duration_minutes: number | null
          expert_id: string | null
          id: string
          is_active: boolean | null
          is_approved: boolean | null
          is_featured: boolean | null
          is_premium: boolean | null
          like_count: number | null
          media_url: string | null
          published_at: string | null
          rating_count: number | null
          requires_dlc: boolean | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          average_rating?: number | null
          category?: string | null
          content_body?: string | null
          content_type: string
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          dlc_pack_id?: string | null
          estimated_duration_minutes?: number | null
          expert_id?: string | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          like_count?: number | null
          media_url?: string | null
          published_at?: string | null
          rating_count?: number | null
          requires_dlc?: boolean | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          average_rating?: number | null
          category?: string | null
          content_body?: string | null
          content_type?: string
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          dlc_pack_id?: string | null
          estimated_duration_minutes?: number | null
          expert_id?: string | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          like_count?: number | null
          media_url?: string | null
          published_at?: string | null
          rating_count?: number | null
          requires_dlc?: boolean | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nsfw_expert_content_dlc_pack_id_fkey"
            columns: ["dlc_pack_id"]
            isOneToOne: false
            referencedRelation: "dlc_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nsfw_expert_content_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "expert_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nsfw_forum_categories: {
        Row: {
          category_name: string
          created_at: string | null
          description: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          post_count: number | null
          sort_order: number | null
          thread_count: number | null
          updated_at: string | null
        }
        Insert: {
          category_name: string
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          post_count?: number | null
          sort_order?: number | null
          thread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          category_name?: string
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          post_count?: number | null
          sort_order?: number | null
          thread_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      nsfw_forum_posts: {
        Row: {
          created_at: string | null
          id: string
          is_anonymous: boolean | null
          is_approved: boolean | null
          like_count: number | null
          parent_post_id: string | null
          post_content: string
          thread_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_approved?: boolean | null
          like_count?: number | null
          parent_post_id?: string | null
          post_content: string
          thread_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_approved?: boolean | null
          like_count?: number | null
          parent_post_id?: string | null
          post_content?: string
          thread_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nsfw_forum_posts_parent_post_id_fkey"
            columns: ["parent_post_id"]
            isOneToOne: false
            referencedRelation: "nsfw_forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nsfw_forum_posts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "nsfw_forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      nsfw_forum_threads: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          is_anonymous: boolean | null
          is_approved: boolean | null
          is_locked: boolean | null
          is_pinned: boolean | null
          last_reply_at: string | null
          last_reply_user_id: string | null
          like_count: number | null
          reply_count: number | null
          thread_content: string
          thread_title: string
          updated_at: string | null
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_approved?: boolean | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          last_reply_at?: string | null
          last_reply_user_id?: string | null
          like_count?: number | null
          reply_count?: number | null
          thread_content: string
          thread_title: string
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_approved?: boolean | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          last_reply_at?: string | null
          last_reply_user_id?: string | null
          like_count?: number | null
          reply_count?: number | null
          thread_content?: string
          thread_title?: string
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nsfw_forum_threads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "nsfw_forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      nsfw_frequency_tracking: {
        Row: {
          average_per_month: number | null
          average_per_week: number | null
          created_at: string | null
          frequency_trend: string | null
          goal_achieved: boolean | null
          id: string
          partner_activity_count: number | null
          period_type: string | null
          solo_activity_count: number | null
          target_frequency_per_week: number | null
          total_activity_count: number | null
          tracking_period_end: string
          tracking_period_start: string
          trend_strength: number | null
          user_id: string
        }
        Insert: {
          average_per_month?: number | null
          average_per_week?: number | null
          created_at?: string | null
          frequency_trend?: string | null
          goal_achieved?: boolean | null
          id?: string
          partner_activity_count?: number | null
          period_type?: string | null
          solo_activity_count?: number | null
          target_frequency_per_week?: number | null
          total_activity_count?: number | null
          tracking_period_end: string
          tracking_period_start: string
          trend_strength?: number | null
          user_id: string
        }
        Update: {
          average_per_month?: number | null
          average_per_week?: number | null
          created_at?: string | null
          frequency_trend?: string | null
          goal_achieved?: boolean | null
          id?: string
          partner_activity_count?: number | null
          period_type?: string | null
          solo_activity_count?: number | null
          target_frequency_per_week?: number | null
          total_activity_count?: number | null
          tracking_period_end?: string
          tracking_period_start?: string
          trend_strength?: number | null
          user_id?: string
        }
        Relationships: []
      }
      nsfw_libido_tracking: {
        Row: {
          contributing_factors: Json | null
          created_at: string | null
          desire_frequency: string | null
          desire_intensity: number | null
          entry_date: string
          id: string
          inhibiting_factors: Json | null
          libido_direction: string | null
          libido_level: number
          notes: string | null
          user_id: string
        }
        Insert: {
          contributing_factors?: Json | null
          created_at?: string | null
          desire_frequency?: string | null
          desire_intensity?: number | null
          entry_date: string
          id?: string
          inhibiting_factors?: Json | null
          libido_direction?: string | null
          libido_level: number
          notes?: string | null
          user_id: string
        }
        Update: {
          contributing_factors?: Json | null
          created_at?: string | null
          desire_frequency?: string | null
          desire_intensity?: number | null
          entry_date?: string
          id?: string
          inhibiting_factors?: Json | null
          libido_direction?: string | null
          libido_level?: number
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nsfw_position_ratings: {
        Row: {
          created_at: string | null
          helpful_count: number | null
          id: string
          is_anonymous: boolean | null
          position_id: string
          rating: number
          review_text: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_anonymous?: boolean | null
          position_id: string
          rating: number
          review_text?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_anonymous?: boolean | null
          position_id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nsfw_position_ratings_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "nsfw_positions_gallery"
            referencedColumns: ["id"]
          },
        ]
      }
      nsfw_positions_favorites: {
        Row: {
          created_at: string | null
          id: string
          last_tried_at: string | null
          notes: string | null
          personal_rating: number | null
          position_id: string
          tried_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_tried_at?: string | null
          notes?: string | null
          personal_rating?: number | null
          position_id: string
          tried_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_tried_at?: string | null
          notes?: string | null
          personal_rating?: number | null
          position_id?: string
          tried_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nsfw_positions_favorites_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "nsfw_positions_gallery"
            referencedColumns: ["id"]
          },
        ]
      }
      nsfw_positions_gallery: {
        Row: {
          animation_url: string | null
          average_rating: number | null
          benefits: string[] | null
          best_for: string[] | null
          category: string
          created_at: string | null
          description: string
          detailed_instructions: string | null
          difficulty_level: string | null
          dlc_pack_id: string | null
          favorite_count: number | null
          id: string
          image_url: string | null
          image_url_illustrated: string | null
          intimacy_level: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_premium: boolean | null
          physical_intensity: string | null
          position_name: string
          position_slug: string
          rating_count: number | null
          recommended_duration_minutes: number | null
          related_position_ids: string[] | null
          required_flexibility: string | null
          requires_dlc: boolean | null
          sort_order: number | null
          tags: string[] | null
          thumbnail_url: string | null
          tips: string[] | null
          updated_at: string | null
          variations: string[] | null
          video_tutorial_url: string | null
          view_count: number | null
        }
        Insert: {
          animation_url?: string | null
          average_rating?: number | null
          benefits?: string[] | null
          best_for?: string[] | null
          category: string
          created_at?: string | null
          description: string
          detailed_instructions?: string | null
          difficulty_level?: string | null
          dlc_pack_id?: string | null
          favorite_count?: number | null
          id?: string
          image_url?: string | null
          image_url_illustrated?: string | null
          intimacy_level?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          physical_intensity?: string | null
          position_name: string
          position_slug: string
          rating_count?: number | null
          recommended_duration_minutes?: number | null
          related_position_ids?: string[] | null
          required_flexibility?: string | null
          requires_dlc?: boolean | null
          sort_order?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          tips?: string[] | null
          updated_at?: string | null
          variations?: string[] | null
          video_tutorial_url?: string | null
          view_count?: number | null
        }
        Update: {
          animation_url?: string | null
          average_rating?: number | null
          benefits?: string[] | null
          best_for?: string[] | null
          category?: string
          created_at?: string | null
          description?: string
          detailed_instructions?: string | null
          difficulty_level?: string | null
          dlc_pack_id?: string | null
          favorite_count?: number | null
          id?: string
          image_url?: string | null
          image_url_illustrated?: string | null
          intimacy_level?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          physical_intensity?: string | null
          position_name?: string
          position_slug?: string
          rating_count?: number | null
          recommended_duration_minutes?: number | null
          related_position_ids?: string[] | null
          required_flexibility?: string | null
          requires_dlc?: boolean | null
          sort_order?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          tips?: string[] | null
          updated_at?: string | null
          variations?: string[] | null
          video_tutorial_url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nsfw_positions_gallery_dlc_pack_id_fkey"
            columns: ["dlc_pack_id"]
            isOneToOne: false
            referencedRelation: "dlc_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      nsfw_satisfaction_tracking: {
        Row: {
          activity_type: string | null
          created_at: string | null
          dissatisfaction_factors: Json | null
          emotional_satisfaction: number | null
          entry_date: string
          id: string
          mutual_satisfaction: number | null
          notes: string | null
          overall_satisfaction: number
          partner_present: boolean | null
          partner_satisfaction: number | null
          physical_satisfaction: number | null
          satisfaction_factors: Json | null
          user_id: string
        }
        Insert: {
          activity_type?: string | null
          created_at?: string | null
          dissatisfaction_factors?: Json | null
          emotional_satisfaction?: number | null
          entry_date: string
          id?: string
          mutual_satisfaction?: number | null
          notes?: string | null
          overall_satisfaction: number
          partner_present?: boolean | null
          partner_satisfaction?: number | null
          physical_satisfaction?: number | null
          satisfaction_factors?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string | null
          created_at?: string | null
          dissatisfaction_factors?: Json | null
          emotional_satisfaction?: number | null
          entry_date?: string
          id?: string
          mutual_satisfaction?: number | null
          notes?: string | null
          overall_satisfaction?: number
          partner_present?: boolean | null
          partner_satisfaction?: number | null
          physical_satisfaction?: number | null
          satisfaction_factors?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      nsfw_sexual_function_tracking: {
        Row: {
          activity_type: string | null
          control_level: number | null
          created_at: string | null
          entry_date: string
          entry_time: string | null
          environment: string | null
          erectile_function_score: number | null
          erection_duration_minutes: number | null
          erection_quality: string | null
          erection_stability: number | null
          factors_affecting: Json | null
          id: string
          notes: string | null
          partner_present: boolean | null
          recovery_time_minutes: number | null
          stamina_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_type?: string | null
          control_level?: number | null
          created_at?: string | null
          entry_date: string
          entry_time?: string | null
          environment?: string | null
          erectile_function_score?: number | null
          erection_duration_minutes?: number | null
          erection_quality?: string | null
          erection_stability?: number | null
          factors_affecting?: Json | null
          id?: string
          notes?: string | null
          partner_present?: boolean | null
          recovery_time_minutes?: number | null
          stamina_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string | null
          control_level?: number | null
          created_at?: string | null
          entry_date?: string
          entry_time?: string | null
          environment?: string | null
          erectile_function_score?: number | null
          erection_duration_minutes?: number | null
          erection_quality?: string | null
          erection_stability?: number | null
          factors_affecting?: Json | null
          id?: string
          notes?: string | null
          partner_present?: boolean | null
          recovery_time_minutes?: number | null
          stamina_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nsfw_support_group_members: {
        Row: {
          group_id: string | null
          id: string
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          group_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nsfw_support_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "nsfw_support_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      nsfw_support_groups: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          member_count: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          member_count?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          member_count?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      nsfw_topic_library_items: {
        Row: {
          content: string | null
          content_type: string | null
          created_at: string | null
          id: string
          media_url: string | null
          order_index: number | null
          title: string
          topic_id: string | null
        }
        Insert: {
          content?: string | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          media_url?: string | null
          order_index?: number | null
          title: string
          topic_id?: string | null
        }
        Update: {
          content?: string | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          media_url?: string | null
          order_index?: number | null
          title?: string
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nsfw_topic_library_items_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "nsfw_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      nsfw_topics: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          topic_name: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          topic_name: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          topic_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      nsfw_video_bookmarks: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      nsfw_video_content: {
        Row: {
          average_rating: number | null
          category: string
          content_rating: string | null
          created_at: string | null
          description: string
          difficulty_level: string | null
          dlc_pack_id: string | null
          expert_credentials: string | null
          expert_id: string | null
          expert_name: string | null
          favorite_count: number | null
          id: string
          is_active: boolean | null
          is_approved: boolean | null
          is_featured: boolean | null
          is_premium: boolean | null
          key_points: string[] | null
          like_count: number | null
          prerequisites: string[] | null
          preview_gif_url: string | null
          rating_count: number | null
          requires_dlc: boolean | null
          share_count: number | null
          step_by_step_guide: Json | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_duration_seconds: number | null
          video_url_4k: string | null
          video_url_hd: string | null
          video_url_sd: string | null
          view_count: number | null
          warnings: string[] | null
        }
        Insert: {
          average_rating?: number | null
          category: string
          content_rating?: string | null
          created_at?: string | null
          description: string
          difficulty_level?: string | null
          dlc_pack_id?: string | null
          expert_credentials?: string | null
          expert_id?: string | null
          expert_name?: string | null
          favorite_count?: number | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          key_points?: string[] | null
          like_count?: number | null
          prerequisites?: string[] | null
          preview_gif_url?: string | null
          rating_count?: number | null
          requires_dlc?: boolean | null
          share_count?: number | null
          step_by_step_guide?: Json | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_duration_seconds?: number | null
          video_url_4k?: string | null
          video_url_hd?: string | null
          video_url_sd?: string | null
          view_count?: number | null
          warnings?: string[] | null
        }
        Update: {
          average_rating?: number | null
          category?: string
          content_rating?: string | null
          created_at?: string | null
          description?: string
          difficulty_level?: string | null
          dlc_pack_id?: string | null
          expert_credentials?: string | null
          expert_id?: string | null
          expert_name?: string | null
          favorite_count?: number | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          key_points?: string[] | null
          like_count?: number | null
          prerequisites?: string[] | null
          preview_gif_url?: string | null
          rating_count?: number | null
          requires_dlc?: boolean | null
          share_count?: number | null
          step_by_step_guide?: Json | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_duration_seconds?: number | null
          video_url_4k?: string | null
          video_url_hd?: string | null
          video_url_sd?: string | null
          view_count?: number | null
          warnings?: string[] | null
        }
        Relationships: []
      }
      nsfw_video_downloads: {
        Row: {
          completed_at: string | null
          created_at: string | null
          download_progress: number | null
          download_status: string | null
          downloaded_at: string | null
          downloaded_bytes: number | null
          expires_at: string | null
          file_path: string
          file_size_bytes: number | null
          id: string
          quality: string
          updated_at: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          download_progress?: number | null
          download_status?: string | null
          downloaded_at?: string | null
          downloaded_bytes?: number | null
          expires_at?: string | null
          file_path: string
          file_size_bytes?: number | null
          id?: string
          quality: string
          updated_at?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          download_progress?: number | null
          download_status?: string | null
          downloaded_at?: string | null
          downloaded_bytes?: number | null
          expires_at?: string | null
          file_path?: string
          file_size_bytes?: number | null
          id?: string
          quality?: string
          updated_at?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nsfw_video_downloads_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "nsfw_video_content"
            referencedColumns: ["id"]
          },
        ]
      }
      nsfw_video_playlists: {
        Row: {
          auto_play_next: boolean | null
          category: string | null
          copy_count: number | null
          created_at: string | null
          description: string | null
          id: string
          is_curated: boolean | null
          is_featured: boolean | null
          is_public: boolean | null
          like_count: number | null
          playlist_name: string
          shuffle_enabled: boolean | null
          total_duration_seconds: number | null
          updated_at: string | null
          user_id: string | null
          video_count: number | null
          video_ids: string[]
          view_count: number | null
        }
        Insert: {
          auto_play_next?: boolean | null
          category?: string | null
          copy_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_curated?: boolean | null
          is_featured?: boolean | null
          is_public?: boolean | null
          like_count?: number | null
          playlist_name: string
          shuffle_enabled?: boolean | null
          total_duration_seconds?: number | null
          updated_at?: string | null
          user_id?: string | null
          video_count?: number | null
          video_ids: string[]
          view_count?: number | null
        }
        Update: {
          auto_play_next?: boolean | null
          category?: string | null
          copy_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_curated?: boolean | null
          is_featured?: boolean | null
          is_public?: boolean | null
          like_count?: number | null
          playlist_name?: string
          shuffle_enabled?: boolean | null
          total_duration_seconds?: number | null
          updated_at?: string | null
          user_id?: string | null
          video_count?: number | null
          video_ids?: string[]
          view_count?: number | null
        }
        Relationships: []
      }
      nsfw_video_progress: {
        Row: {
          completed_at: string | null
          completion_percentage: number | null
          created_at: string | null
          current_position_seconds: number | null
          id: string
          is_completed: boolean | null
          last_position_updated_at: string | null
          playback_speed: number | null
          quality_preference: string | null
          updated_at: string | null
          user_id: string
          video_id: string
          watched_at: string | null
          watched_duration_seconds: number | null
        }
        Insert: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          current_position_seconds?: number | null
          id?: string
          is_completed?: boolean | null
          last_position_updated_at?: string | null
          playback_speed?: number | null
          quality_preference?: string | null
          updated_at?: string | null
          user_id: string
          video_id: string
          watched_at?: string | null
          watched_duration_seconds?: number | null
        }
        Update: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          current_position_seconds?: number | null
          id?: string
          is_completed?: boolean | null
          last_position_updated_at?: string | null
          playback_speed?: number | null
          quality_preference?: string | null
          updated_at?: string | null
          user_id?: string
          video_id?: string
          watched_at?: string | null
          watched_duration_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nsfw_video_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "nsfw_video_content"
            referencedColumns: ["id"]
          },
        ]
      }
      nsfw_video_reviews: {
        Row: {
          created_at: string | null
          helpful_count: number | null
          id: string
          is_approved: boolean | null
          rating: number
          review_text: string | null
          updated_at: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_approved?: boolean | null
          rating: number
          review_text?: string | null
          updated_at?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_approved?: boolean | null
          rating?: number
          review_text?: string | null
          updated_at?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nsfw_video_reviews_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "nsfw_video_content"
            referencedColumns: ["id"]
          },
        ]
      }
      nsfw_video_watch_history: {
        Row: {
          completion_percentage: number | null
          created_at: string | null
          id: string
          referrer_id: string | null
          user_id: string
          video_id: string
          watch_duration_seconds: number | null
          watch_source: string | null
          watched_at: string | null
        }
        Insert: {
          completion_percentage?: number | null
          created_at?: string | null
          id?: string
          referrer_id?: string | null
          user_id: string
          video_id: string
          watch_duration_seconds?: number | null
          watch_source?: string | null
          watched_at?: string | null
        }
        Update: {
          completion_percentage?: number | null
          created_at?: string | null
          id?: string
          referrer_id?: string | null
          user_id?: string
          video_id?: string
          watch_duration_seconds?: number | null
          watch_source?: string | null
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nsfw_video_watch_history_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "nsfw_video_content"
            referencedColumns: ["id"]
          },
        ]
      }
      nsfw_wellness_scores: {
        Row: {
          calculated_at: string | null
          calculation_date: string
          calculation_period_days: number | null
          created_at: string | null
          frequency_score: number | null
          function_score: number | null
          id: string
          insights: string[] | null
          libido_score: number | null
          overall_wellness_score: number
          recommendations: string[] | null
          relationship_score: number | null
          satisfaction_score: number | null
          score_change: number | null
          score_trend: string | null
          user_id: string
        }
        Insert: {
          calculated_at?: string | null
          calculation_date: string
          calculation_period_days?: number | null
          created_at?: string | null
          frequency_score?: number | null
          function_score?: number | null
          id?: string
          insights?: string[] | null
          libido_score?: number | null
          overall_wellness_score: number
          recommendations?: string[] | null
          relationship_score?: number | null
          satisfaction_score?: number | null
          score_change?: number | null
          score_trend?: string | null
          user_id: string
        }
        Update: {
          calculated_at?: string | null
          calculation_date?: string
          calculation_period_days?: number | null
          created_at?: string | null
          frequency_score?: number | null
          function_score?: number | null
          id?: string
          insights?: string[] | null
          libido_score?: number | null
          overall_wellness_score?: number
          recommendations?: string[] | null
          relationship_score?: number | null
          satisfaction_score?: number | null
          score_change?: number | null
          score_trend?: string | null
          user_id?: string
        }
        Relationships: []
      }
      outcome_simulations: {
        Row: {
          created_at: string | null
          id: string
          input_data: Json | null
          results: Json | null
          simulation_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          input_data?: Json | null
          results?: Json | null
          simulation_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          input_data?: Json | null
          results?: Json | null
          simulation_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      partner_connections: {
        Row: {
          connected_at: string | null
          created_at: string | null
          disconnected_at: string | null
          id: string
          invite_code: string | null
          partner_id: string
          share_live_feed: boolean | null
          share_photos: boolean | null
          share_progress: boolean | null
          share_recordings: boolean | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          connected_at?: string | null
          created_at?: string | null
          disconnected_at?: string | null
          id?: string
          invite_code?: string | null
          partner_id: string
          share_live_feed?: boolean | null
          share_photos?: boolean | null
          share_progress?: boolean | null
          share_recordings?: boolean | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          connected_at?: string | null
          created_at?: string | null
          disconnected_at?: string | null
          id?: string
          invite_code?: string | null
          partner_id?: string
          share_live_feed?: boolean | null
          share_photos?: boolean | null
          share_progress?: boolean | null
          share_recordings?: boolean | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      partner_data_permissions: {
        Row: {
          created_at: string | null
          id: string
          is_granted: boolean | null
          partner_id: string | null
          permission_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_granted?: boolean | null
          partner_id?: string | null
          permission_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_granted?: boolean | null
          partner_id?: string | null
          permission_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      partner_date_nights: {
        Row: {
          ambiance_notes: string | null
          created_at: string | null
          creator_id: string
          distractions_plan: string | null
          evening_description: string | null
          id: string
          itinerary: Json | null
          location_address: string | null
          location_name: string | null
          location_type: string | null
          mood_setting: string | null
          music_playlist: string | null
          night_description: string | null
          partner_accepted_at: string | null
          partner_id: string
          partner_response: string | null
          planned_date: string
          planned_time: string
          special_requests: string | null
          status: string | null
          supplies_needed: string[] | null
          theme_category: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ambiance_notes?: string | null
          created_at?: string | null
          creator_id: string
          distractions_plan?: string | null
          evening_description?: string | null
          id?: string
          itinerary?: Json | null
          location_address?: string | null
          location_name?: string | null
          location_type?: string | null
          mood_setting?: string | null
          music_playlist?: string | null
          night_description?: string | null
          partner_accepted_at?: string | null
          partner_id: string
          partner_response?: string | null
          planned_date: string
          planned_time: string
          special_requests?: string | null
          status?: string | null
          supplies_needed?: string[] | null
          theme_category?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ambiance_notes?: string | null
          created_at?: string | null
          creator_id?: string
          distractions_plan?: string | null
          evening_description?: string | null
          id?: string
          itinerary?: Json | null
          location_address?: string | null
          location_name?: string | null
          location_type?: string | null
          mood_setting?: string | null
          music_playlist?: string | null
          night_description?: string | null
          partner_accepted_at?: string | null
          partner_id?: string
          partner_response?: string | null
          planned_date?: string
          planned_time?: string
          special_requests?: string | null
          status?: string | null
          supplies_needed?: string[] | null
          theme_category?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      partner_invites: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          invite_code: string
          is_used: boolean | null
          used_at: string | null
          used_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          id?: string
          invite_code: string
          is_used?: boolean | null
          used_at?: string | null
          used_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          invite_code?: string
          is_used?: boolean | null
          used_at?: string | null
          used_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      partner_position_activity_log: {
        Row: {
          activity_type: string | null
          created_at: string | null
          id: string
          notes: string | null
          position_id: string | null
          user_id: string
        }
        Insert: {
          activity_type?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          position_id?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          position_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      partner_position_selections: {
        Row: {
          completed_at: string | null
          created_at: string | null
          date_night_id: string | null
          feedback: string | null
          id: string
          order_in_sequence: number | null
          partner_counter_position_id: string | null
          partner_counter_position_name: string | null
          partner_id: string
          partner_notes: string | null
          position_id: string
          position_name: string
          rating: number | null
          status: string | null
          suggested_by: string
          suggester_notes: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          date_night_id?: string | null
          feedback?: string | null
          id?: string
          order_in_sequence?: number | null
          partner_counter_position_id?: string | null
          partner_counter_position_name?: string | null
          partner_id: string
          partner_notes?: string | null
          position_id: string
          position_name: string
          rating?: number | null
          status?: string | null
          suggested_by: string
          suggester_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          date_night_id?: string | null
          feedback?: string | null
          id?: string
          order_in_sequence?: number | null
          partner_counter_position_id?: string | null
          partner_counter_position_name?: string | null
          partner_id?: string
          partner_notes?: string | null
          position_id?: string
          position_name?: string
          rating?: number | null
          status?: string | null
          suggested_by?: string
          suggester_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_position_selections_date_night_id_fkey"
            columns: ["date_night_id"]
            isOneToOne: false
            referencedRelation: "partner_date_nights"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_quick_reply_templates: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          order_index: number | null
          reply_text: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          reply_text: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          reply_text?: string
        }
        Relationships: []
      }
      partner_sync_abuse_signals: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          reported_user_id: string | null
          reporter_id: string
          signal_type: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          reported_user_id?: string | null
          reporter_id: string
          signal_type: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          reported_user_id?: string | null
          reporter_id?: string
          signal_type?: string
          status?: string | null
        }
        Relationships: []
      }
      partner_sync_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_sync_consent: {
        Row: {
          consent_type: string
          created_at: string | null
          granted_at: string | null
          id: string
          is_granted: boolean | null
          partner_id: string | null
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          consent_type: string
          created_at?: string | null
          granted_at?: string | null
          id?: string
          is_granted?: boolean | null
          partner_id?: string | null
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          consent_type?: string
          created_at?: string | null
          granted_at?: string | null
          id?: string
          is_granted?: boolean | null
          partner_id?: string | null
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      partner_sync_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          partner_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          partner_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          partner_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      partner_sync_preferences: {
        Row: {
          auto_share_enabled: boolean | null
          created_at: string | null
          id: string
          notification_enabled: boolean | null
          preferences: Json | null
          sync_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_share_enabled?: boolean | null
          created_at?: string | null
          id?: string
          notification_enabled?: boolean | null
          preferences?: Json | null
          sync_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_share_enabled?: boolean | null
          created_at?: string | null
          id?: string
          notification_enabled?: boolean | null
          preferences?: Json | null
          sync_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      partner_sync_retention_policies: {
        Row: {
          created_at: string | null
          data_type: string | null
          id: string
          is_active: boolean | null
          policy_name: string
          retention_days: number | null
        }
        Insert: {
          created_at?: string | null
          data_type?: string | null
          id?: string
          is_active?: boolean | null
          policy_name: string
          retention_days?: number | null
        }
        Update: {
          created_at?: string | null
          data_type?: string | null
          id?: string
          is_active?: boolean | null
          policy_name?: string
          retention_days?: number | null
        }
        Relationships: []
      }
      partner_thought_ping_reactions: {
        Row: {
          created_at: string | null
          id: string
          ping_id: string | null
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ping_id?: string | null
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ping_id?: string | null
          reaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_thought_ping_templates: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          order_index: number | null
          template_text: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          order_index?: number | null
          template_text: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          order_index?: number | null
          template_text?: string
        }
        Relationships: []
      }
      partner_thought_pings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          intensity_level: number | null
          is_read: boolean | null
          reaction: string | null
          reaction_at: string | null
          read_at: string | null
          receiver_id: string
          sender_id: string
          thought_category: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          intensity_level?: number | null
          is_read?: boolean | null
          reaction?: string | null
          reaction_at?: string | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
          thought_category: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          intensity_level?: number | null
          is_read?: boolean | null
          reaction?: string | null
          reaction_at?: string | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
          thought_category?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      patient_provider_relationships: {
        Row: {
          access_level: string | null
          can_view_analytics: boolean | null
          can_view_diary: boolean | null
          can_view_reports: boolean | null
          can_view_scans: boolean | null
          consent_date: string | null
          consent_expires_date: string | null
          consent_granted: boolean | null
          consent_scope: string[] | null
          created_at: string
          id: string
          patient_id: string
          provider_id: string
          provider_notes: string | null
          relationship_type: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          access_level?: string | null
          can_view_analytics?: boolean | null
          can_view_diary?: boolean | null
          can_view_reports?: boolean | null
          can_view_scans?: boolean | null
          consent_date?: string | null
          consent_expires_date?: string | null
          consent_granted?: boolean | null
          consent_scope?: string[] | null
          created_at?: string
          id?: string
          patient_id: string
          provider_id: string
          provider_notes?: string | null
          relationship_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          access_level?: string | null
          can_view_analytics?: boolean | null
          can_view_diary?: boolean | null
          can_view_reports?: boolean | null
          can_view_scans?: boolean | null
          consent_date?: string | null
          consent_expires_date?: string | null
          consent_granted?: boolean | null
          consent_scope?: string[] | null
          created_at?: string
          id?: string
          patient_id?: string
          provider_id?: string
          provider_notes?: string | null
          relationship_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_provider_relationships_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "healthcare_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_videos: {
        Row: {
          added_at: string | null
          id: string
          order_index: number | null
          playlist_id: string | null
          video_id: string | null
        }
        Insert: {
          added_at?: string | null
          id?: string
          order_index?: number | null
          playlist_id?: string | null
          video_id?: string | null
        }
        Update: {
          added_at?: string | null
          id?: string
          order_index?: number | null
          playlist_id?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playlist_videos_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "video_playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      pornmd_integration: {
        Row: {
          api_key_encrypted: string | null
          api_secret_encrypted: string | null
          content_preferences: Json | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          is_partner: boolean | null
          last_sync_at: string | null
          partner_tier: string | null
          sync_count: number | null
          sync_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          content_preferences?: Json | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          is_partner?: boolean | null
          last_sync_at?: string | null
          partner_tier?: string | null
          sync_count?: number | null
          sync_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          content_preferences?: Json | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          is_partner?: boolean | null
          last_sync_at?: string | null
          partner_tier?: string | null
          sync_count?: number | null
          sync_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      predictive_models: {
        Row: {
          accuracy: number | null
          created_at: string | null
          id: string
          last_trained_at: string | null
          model_data: Json | null
          model_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          created_at?: string | null
          id?: string
          last_trained_at?: string | null
          model_data?: Json | null
          model_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          created_at?: string | null
          id?: string
          last_trained_at?: string | null
          model_data?: Json | null
          model_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      premium_add_ons: {
        Row: {
          addon_description: string
          addon_id: string
          addon_name: string
          annual_discount_percentage: number | null
          annual_price: number | null
          category: string | null
          created_at: string | null
          features: Json
          icon_url: string | null
          id: string
          incompatible_addons: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          is_popular: boolean | null
          lifetime_price: number | null
          limitations: Json | null
          monthly_price: number
          requires_tier: string[] | null
          sort_order: number | null
          stripe_annual_price_id: string | null
          stripe_lifetime_price_id: string | null
          stripe_monthly_price_id: string | null
          updated_at: string | null
        }
        Insert: {
          addon_description: string
          addon_id: string
          addon_name: string
          annual_discount_percentage?: number | null
          annual_price?: number | null
          category?: string | null
          created_at?: string | null
          features?: Json
          icon_url?: string | null
          id?: string
          incompatible_addons?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_popular?: boolean | null
          lifetime_price?: number | null
          limitations?: Json | null
          monthly_price: number
          requires_tier?: string[] | null
          sort_order?: number | null
          stripe_annual_price_id?: string | null
          stripe_lifetime_price_id?: string | null
          stripe_monthly_price_id?: string | null
          updated_at?: string | null
        }
        Update: {
          addon_description?: string
          addon_id?: string
          addon_name?: string
          annual_discount_percentage?: number | null
          annual_price?: number | null
          category?: string | null
          created_at?: string | null
          features?: Json
          icon_url?: string | null
          id?: string
          incompatible_addons?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_popular?: boolean | null
          lifetime_price?: number | null
          limitations?: Json | null
          monthly_price?: number
          requires_tier?: string[] | null
          sort_order?: number | null
          stripe_annual_price_id?: string | null
          stripe_lifetime_price_id?: string | null
          stripe_monthly_price_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      premium_content_items: {
        Row: {
          category: string | null
          content_type: string | null
          content_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          preview_url: string | null
          price: number | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          category?: string | null
          content_type?: string | null
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          preview_url?: string | null
          price?: number | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string | null
          content_type?: string | null
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          preview_url?: string | null
          price?: number | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      premium_content_purchases: {
        Row: {
          content_id: string | null
          id: string
          payment_status: string | null
          price_paid: number | null
          purchased_at: string | null
          user_id: string
        }
        Insert: {
          content_id?: string | null
          id?: string
          payment_status?: string | null
          price_paid?: number | null
          purchased_at?: string | null
          user_id: string
        }
        Update: {
          content_id?: string | null
          id?: string
          payment_status?: string | null
          price_paid?: number | null
          purchased_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      premium_content_reviews: {
        Row: {
          content_id: string | null
          created_at: string | null
          id: string
          rating: number
          review_text: string | null
          user_id: string
        }
        Insert: {
          content_id?: string | null
          created_at?: string | null
          id?: string
          rating: number
          review_text?: string | null
          user_id: string
        }
        Update: {
          content_id?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          review_text?: string | null
          user_id?: string
        }
        Relationships: []
      }
      premium_content_wishlist: {
        Row: {
          added_at: string | null
          content_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          content_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          content_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      privacy_controls: {
        Row: {
          control_type: string
          created_at: string | null
          id: string
          is_enabled: boolean | null
          settings: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          control_type: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          settings?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          control_type?: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          settings?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progress_share_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string
          share_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type: string
          share_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string
          share_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      progress_shares: {
        Row: {
          content: Json | null
          created_at: string | null
          id: string
          is_public: boolean | null
          share_type: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          share_type?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          share_type?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      prostate_health: {
        Row: {
          assessment_date: string | null
          created_at: string | null
          id: string
          notes: string | null
          psa_level: number | null
          symptoms: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assessment_date?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          psa_level?: number | null
          symptoms?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assessment_date?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          psa_level?: number | null
          symptoms?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      provider_professional_reports: {
        Row: {
          created_at: string
          file_format: string | null
          file_url: string | null
          findings: string[] | null
          id: string
          is_shared_with_patient: boolean | null
          patient_id: string
          provider_id: string
          recommendations: string[] | null
          report_content: Json | null
          report_status: string | null
          report_title: string
          report_type: string
          shared_at: string | null
          treatment_plan: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_format?: string | null
          file_url?: string | null
          findings?: string[] | null
          id?: string
          is_shared_with_patient?: boolean | null
          patient_id: string
          provider_id: string
          recommendations?: string[] | null
          report_content?: Json | null
          report_status?: string | null
          report_title: string
          report_type?: string
          shared_at?: string | null
          treatment_plan?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_format?: string | null
          file_url?: string | null
          findings?: string[] | null
          id?: string
          is_shared_with_patient?: boolean | null
          patient_id?: string
          provider_id?: string
          recommendations?: string[] | null
          report_content?: Json | null
          report_status?: string | null
          report_title?: string
          report_type?: string
          shared_at?: string | null
          treatment_plan?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_professional_reports_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "healthcare_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_reports: {
        Row: {
          created_at: string | null
          file_format: string | null
          file_url: string | null
          findings: string[] | null
          id: string
          is_shared_with_patient: boolean | null
          patient_id: string
          provider_id: string
          recommendations: string[] | null
          report_content: Json | null
          report_title: string
          report_type: string
          shared_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_format?: string | null
          file_url?: string | null
          findings?: string[] | null
          id?: string
          is_shared_with_patient?: boolean | null
          patient_id: string
          provider_id: string
          recommendations?: string[] | null
          report_content?: Json | null
          report_title: string
          report_type: string
          shared_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_format?: string | null
          file_url?: string | null
          findings?: string[] | null
          id?: string
          is_shared_with_patient?: boolean | null
          patient_id?: string
          provider_id?: string
          recommendations?: string[] | null
          report_content?: Json | null
          report_title?: string
          report_type?: string
          shared_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quality_assessment_history: {
        Row: {
          angle_score: number | null
          assessed_at: string | null
          average_score: number | null
          compared_to_average: boolean | null
          contrast_score: number | null
          created_at: string | null
          critical_issues: string[] | null
          distance_score: number | null
          focus_score: number | null
          id: string
          lighting_score: number | null
          overall_score: number
          percentile_rank: number | null
          recommendations: string[] | null
          scan_id: string | null
          stability_score: number | null
          user_id: string
        }
        Insert: {
          angle_score?: number | null
          assessed_at?: string | null
          average_score?: number | null
          compared_to_average?: boolean | null
          contrast_score?: number | null
          created_at?: string | null
          critical_issues?: string[] | null
          distance_score?: number | null
          focus_score?: number | null
          id?: string
          lighting_score?: number | null
          overall_score: number
          percentile_rank?: number | null
          recommendations?: string[] | null
          scan_id?: string | null
          stability_score?: number | null
          user_id: string
        }
        Update: {
          angle_score?: number | null
          assessed_at?: string | null
          average_score?: number | null
          compared_to_average?: boolean | null
          contrast_score?: number | null
          created_at?: string | null
          critical_issues?: string[] | null
          distance_score?: number | null
          focus_score?: number | null
          id?: string
          lighting_score?: number | null
          overall_score?: number
          percentile_rank?: number | null
          recommendations?: string[] | null
          scan_id?: string | null
          stability_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_assessment_history_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      real_time_scan_feedback: {
        Row: {
          created_at: string | null
          feedback_type: string
          id: string
          message: string
          session_id: string
          severity: string | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback_type: string
          id?: string
          message: string
          session_id: string
          severity?: string | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback_type?: string
          id?: string
          message?: string
          session_id?: string
          severity?: string | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          applied_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          referral_tracking_id: string
          reward_status: string
          reward_type: string
          reward_value: number
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          referral_tracking_id: string
          reward_status?: string
          reward_type: string
          reward_value: number
          user_id: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          referral_tracking_id?: string
          reward_status?: string
          reward_type?: string
          reward_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referral_tracking_id_fkey"
            columns: ["referral_tracking_id"]
            isOneToOne: false
            referencedRelation: "referral_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_tracking: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          referral_code_id: string
          referred_id: string
          referred_subscribed: boolean
          referred_subscription_tier: string | null
          referrer_id: string
          reward_applied: boolean
          reward_type: string | null
          reward_value: number | null
          rewarded_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code_id: string
          referred_id: string
          referred_subscribed?: boolean
          referred_subscription_tier?: string | null
          referrer_id: string
          reward_applied?: boolean
          reward_type?: string | null
          reward_value?: number | null
          rewarded_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code_id?: string
          referred_id?: string
          referred_subscribed?: boolean
          referred_subscription_tier?: string | null
          referrer_id?: string
          reward_applied?: boolean
          reward_type?: string | null
          reward_value?: number | null
          rewarded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_tracking_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      rest_day_recommendations: {
        Row: {
          created_at: string | null
          id: string
          is_accepted: boolean | null
          recommendation_data: Json | null
          recommended_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_accepted?: boolean | null
          recommendation_data?: Json | null
          recommended_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_accepted?: boolean | null
          recommendation_data?: Json | null
          recommended_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      routine_analytics: {
        Row: {
          analytics_data: Json | null
          created_at: string | null
          id: string
          period_end: string | null
          period_start: string | null
          routine_id: string | null
          user_id: string
        }
        Insert: {
          analytics_data?: Json | null
          created_at?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          routine_id?: string | null
          user_id: string
        }
        Update: {
          analytics_data?: Json | null
          created_at?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          routine_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      routine_marketplace: {
        Row: {
          category: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          download_count: number | null
          id: string
          is_active: boolean | null
          price: number | null
          rating_average: number | null
          routine_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          download_count?: number | null
          id?: string
          is_active?: boolean | null
          price?: number | null
          rating_average?: number | null
          routine_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          download_count?: number | null
          id?: string
          is_active?: boolean | null
          price?: number | null
          rating_average?: number | null
          routine_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      routine_templates: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          id: string
          is_public: boolean | null
          routine_data: Json | null
          template_name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          id?: string
          is_public?: boolean | null
          routine_data?: Json | null
          template_name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          id?: string
          is_public?: boolean | null
          routine_data?: Json | null
          template_name?: string
        }
        Relationships: []
      }
      routine_timing_predictions: {
        Row: {
          created_at: string | null
          id: string
          optimal_times: Json | null
          prediction_data: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          optimal_times?: Json | null
          prediction_data?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          optimal_times?: Json | null
          prediction_data?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      scan_history: {
        Row: {
          circumference: number | null
          created_at: string
          curvature_angle: number | null
          curvature_direction: string | null
          id: string
          image_path: string | null
          length: number | null
          notes: string | null
          scan_type: string
          user_id: string
        }
        Insert: {
          circumference?: number | null
          created_at?: string
          curvature_angle?: number | null
          curvature_direction?: string | null
          id?: string
          image_path?: string | null
          length?: number | null
          notes?: string | null
          scan_type?: string
          user_id: string
        }
        Update: {
          circumference?: number | null
          created_at?: string
          curvature_angle?: number | null
          curvature_direction?: string | null
          id?: string
          image_path?: string | null
          length?: number | null
          notes?: string | null
          scan_type?: string
          user_id?: string
        }
        Relationships: []
      }
      scans: {
        Row: {
          analysis_result: Json | null
          confidence_level: number | null
          created_at: string | null
          girth: number | null
          id: string
          length: number | null
          overall_health: string | null
          scanned_at: string | null
          urgency: string | null
          user_id: string
        }
        Insert: {
          analysis_result?: Json | null
          confidence_level?: number | null
          created_at?: string | null
          girth?: number | null
          id?: string
          length?: number | null
          overall_health?: string | null
          scanned_at?: string | null
          urgency?: string | null
          user_id: string
        }
        Update: {
          analysis_result?: Json | null
          confidence_level?: number | null
          created_at?: string | null
          girth?: number | null
          id?: string
          length?: number | null
          overall_health?: string | null
          scanned_at?: string | null
          urgency?: string | null
          user_id?: string
        }
        Relationships: []
      }
      screening_reminders: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          notes: string | null
          reminder_date: string | null
          screening_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          reminder_date?: string | null
          screening_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          reminder_date?: string | null
          screening_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          is_resolved: boolean | null
          message: string
          resolved_at: string | null
          severity: string | null
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          message: string
          resolved_at?: string | null
          severity?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          message?: string
          resolved_at?: string | null
          severity?: string | null
          user_id?: string
        }
        Relationships: []
      }
      seductive_ai_messages: {
        Row: {
          adult_emojis: string[] | null
          ai_confidence: number | null
          ai_sentiment: string | null
          ai_suggestions: string[] | null
          context_data: Json | null
          created_at: string | null
          gifs_urls: string[] | null
          id: string
          images_urls: string[] | null
          message_content: string
          message_type: string
          session_id: string
          user_id: string
          videos_urls: string[] | null
          voice_message_url: string | null
        }
        Insert: {
          adult_emojis?: string[] | null
          ai_confidence?: number | null
          ai_sentiment?: string | null
          ai_suggestions?: string[] | null
          context_data?: Json | null
          created_at?: string | null
          gifs_urls?: string[] | null
          id?: string
          images_urls?: string[] | null
          message_content: string
          message_type: string
          session_id: string
          user_id: string
          videos_urls?: string[] | null
          voice_message_url?: string | null
        }
        Update: {
          adult_emojis?: string[] | null
          ai_confidence?: number | null
          ai_sentiment?: string | null
          ai_suggestions?: string[] | null
          context_data?: Json | null
          created_at?: string | null
          gifs_urls?: string[] | null
          id?: string
          images_urls?: string[] | null
          message_content?: string
          message_type?: string
          session_id?: string
          user_id?: string
          videos_urls?: string[] | null
          voice_message_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seductive_ai_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "seductive_ai_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      seductive_ai_sessions: {
        Row: {
          ai_intensity: string | null
          ai_personality: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          partner_id: string | null
          session_name: string | null
          session_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_intensity?: string | null
          ai_personality?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          partner_id?: string | null
          session_name?: string | null
          session_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_intensity?: string | null
          ai_personality?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          partner_id?: string | null
          session_name?: string | null
          session_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      self_examination_guides: {
        Row: {
          body_area: string | null
          created_at: string | null
          frequency: string | null
          id: string
          importance_level: string | null
          steps: Json | null
          title: string
        }
        Insert: {
          body_area?: string | null
          created_at?: string | null
          frequency?: string | null
          id?: string
          importance_level?: string | null
          steps?: Json | null
          title: string
        }
        Update: {
          body_area?: string | null
          created_at?: string | null
          frequency?: string | null
          id?: string
          importance_level?: string | null
          steps?: Json | null
          title?: string
        }
        Relationships: []
      }
      sex_positions_library: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          gif_url: string | null
          id: string
          image_url: string | null
          instructions: string[] | null
          is_featured: boolean | null
          popularity_score: number | null
          position_category: string | null
          position_name: string
          tips: string[] | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          gif_url?: string | null
          id?: string
          image_url?: string | null
          instructions?: string[] | null
          is_featured?: boolean | null
          popularity_score?: number | null
          position_category?: string | null
          position_name: string
          tips?: string[] | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          gif_url?: string | null
          id?: string
          image_url?: string | null
          instructions?: string[] | null
          is_featured?: boolean | null
          popularity_score?: number | null
          position_category?: string | null
          position_name?: string
          tips?: string[] | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      sexual_health_education_modules: {
        Row: {
          category: string | null
          content: Json | null
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          id: string
          is_published: boolean | null
          order_index: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: Json | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: Json | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sexual_health_metrics: {
        Row: {
          created_at: string | null
          id: string
          metric_date: string | null
          metric_type: string | null
          metric_value: number | null
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metric_date?: string | null
          metric_type?: string | null
          metric_value?: number | null
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metric_date?: string | null
          metric_type?: string | null
          metric_value?: number | null
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sexual_wellness_entries: {
        Row: {
          created_at: string | null
          data: Json | null
          entry_date: string | null
          id: string
          notes: string | null
          score: number | null
          updated_at: string | null
          user_id: string
          wellness_type: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          entry_date?: string | null
          id?: string
          notes?: string | null
          score?: number | null
          updated_at?: string | null
          user_id: string
          wellness_type?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          entry_date?: string | null
          id?: string
          notes?: string | null
          score?: number | null
          updated_at?: string | null
          user_id?: string
          wellness_type?: string | null
        }
        Relationships: []
      }
      sexual_wellness_goals: {
        Row: {
          created_at: string | null
          current_value: number | null
          goal_name: string
          id: string
          status: string | null
          target_value: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          goal_name: string
          id?: string
          status?: string | null
          target_value?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          goal_name?: string
          id?: string
          status?: string | null
          target_value?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sexual_wellness_patterns: {
        Row: {
          created_at: string | null
          detected_at: string | null
          id: string
          pattern_data: Json | null
          pattern_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          detected_at?: string | null
          id?: string
          pattern_data?: Json | null
          pattern_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          detected_at?: string | null
          id?: string
          pattern_data?: Json | null
          pattern_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sexual_wellness_scores: {
        Row: {
          created_at: string | null
          dimensions: Json | null
          id: string
          overall_score: number | null
          score_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dimensions?: Json | null
          id?: string
          overall_score?: number | null
          score_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dimensions?: Json | null
          id?: string
          overall_score?: number | null
          score_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shared_routines: {
        Row: {
          created_at: string | null
          download_count: number | null
          id: string
          is_public: boolean | null
          routine_id: string | null
          share_code: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          download_count?: number | null
          id?: string
          is_public?: boolean | null
          routine_id?: string | null
          share_code?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          download_count?: number | null
          id?: string
          is_public?: boolean | null
          routine_id?: string | null
          share_code?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json
          processed: boolean | null
          processed_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_id: string
          event_type: string
          id?: string
          payload: Json
          processed?: boolean | null
          processed_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
        }
        Relationships: []
      }
      subscription_tiers: {
        Row: {
          annual_discount_percentage: number | null
          annual_price: number | null
          color_scheme: string | null
          created_at: string
          features: Json
          icon_url: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_popular: boolean | null
          lifetime_discount_percentage: number | null
          lifetime_price: number | null
          limitations: Json | null
          monthly_price: number
          sort_order: number | null
          stripe_annual_price_id: string | null
          stripe_lifetime_price_id: string | null
          stripe_monthly_price_id: string | null
          tier_description: string | null
          tier_id: string
          tier_name: string
          updated_at: string
        }
        Insert: {
          annual_discount_percentage?: number | null
          annual_price?: number | null
          color_scheme?: string | null
          created_at?: string
          features?: Json
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_popular?: boolean | null
          lifetime_discount_percentage?: number | null
          lifetime_price?: number | null
          limitations?: Json | null
          monthly_price?: number
          sort_order?: number | null
          stripe_annual_price_id?: string | null
          stripe_lifetime_price_id?: string | null
          stripe_monthly_price_id?: string | null
          tier_description?: string | null
          tier_id: string
          tier_name: string
          updated_at?: string
        }
        Update: {
          annual_discount_percentage?: number | null
          annual_price?: number | null
          color_scheme?: string | null
          created_at?: string
          features?: Json
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_popular?: boolean | null
          lifetime_discount_percentage?: number | null
          lifetime_price?: number | null
          limitations?: Json | null
          monthly_price?: number
          sort_order?: number | null
          stripe_annual_price_id?: string | null
          stripe_lifetime_price_id?: string | null
          stripe_monthly_price_id?: string | null
          tier_description?: string | null
          tier_id?: string
          tier_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      success_stories: {
        Row: {
          after_stats: Json | null
          before_stats: Json | null
          created_at: string | null
          display_name: string | null
          duration_weeks: number | null
          featured: boolean | null
          id: string
          is_anonymous: boolean | null
          story: string
          title: string
          updated_at: string | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          after_stats?: Json | null
          before_stats?: Json | null
          created_at?: string | null
          display_name?: string | null
          duration_weeks?: number | null
          featured?: boolean | null
          id?: string
          is_anonymous?: boolean | null
          story: string
          title: string
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          after_stats?: Json | null
          before_stats?: Json | null
          created_at?: string | null
          display_name?: string | null
          duration_weeks?: number | null
          featured?: boolean | null
          id?: string
          is_anonymous?: boolean | null
          story?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      support_chat_messages: {
        Row: {
          created_at: string | null
          id: string
          is_from_agent: boolean | null
          message: string
          sender_id: string
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_from_agent?: boolean | null
          message: string
          sender_id: string
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_from_agent?: boolean | null
          message?: string
          sender_id?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "support_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      support_chat_quick_responses: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          response_text: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          response_text: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          response_text?: string
        }
        Relationships: []
      }
      support_chat_sessions: {
        Row: {
          assigned_agent_id: string | null
          created_at: string | null
          id: string
          status: string | null
          subject: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_agent_id?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_agent_id?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_ticket_messages: {
        Row: {
          created_at: string | null
          id: string
          is_staff_reply: boolean | null
          message: string
          sender_id: string
          ticket_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_staff_reply?: boolean | null
          message: string
          sender_id: string
          ticket_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_staff_reply?: boolean | null
          message?: string
          sender_id?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          priority: string | null
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      testicular_health: {
        Row: {
          created_at: string | null
          exam_date: string | null
          findings: Json | null
          id: string
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          exam_date?: string | null
          findings?: Json | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          exam_date?: string | null
          findings?: Json | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      testimonial_votes: {
        Row: {
          created_at: string | null
          id: string
          testimonial_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          testimonial_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          testimonial_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonial_votes_testimonial_id_fkey"
            columns: ["testimonial_id"]
            isOneToOne: false
            referencedRelation: "testimonials"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          display_name: string | null
          featured: boolean | null
          helpful_count: number | null
          id: string
          is_anonymous: boolean | null
          rating: number
          title: string
          updated_at: string | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          display_name?: string | null
          featured?: boolean | null
          helpful_count?: number | null
          id?: string
          is_anonymous?: boolean | null
          rating: number
          title: string
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          display_name?: string | null
          featured?: boolean | null
          helpful_count?: number | null
          id?: string
          is_anonymous?: boolean | null
          rating?: number
          title?: string
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      tier_comparison_features: {
        Row: {
          available_tiers: string[]
          created_at: string
          feature_category: string | null
          feature_description: string | null
          feature_name: string
          id: string
          is_core: boolean | null
          is_premium: boolean | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          available_tiers?: string[]
          created_at?: string
          feature_category?: string | null
          feature_description?: string | null
          feature_name: string
          id?: string
          is_core?: boolean | null
          is_premium?: boolean | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          available_tiers?: string[]
          created_at?: string
          feature_category?: string | null
          feature_description?: string | null
          feature_name?: string
          id?: string
          is_core?: boolean | null
          is_premium?: boolean | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      time_lapse_comparisons: {
        Row: {
          comparison_data: Json | null
          comparison_name: string | null
          created_at: string | null
          id: string
          scan_ids: string[] | null
          user_id: string
        }
        Insert: {
          comparison_data?: Json | null
          comparison_name?: string | null
          created_at?: string | null
          id?: string
          scan_ids?: string[] | null
          user_id: string
        }
        Update: {
          comparison_data?: Json | null
          comparison_name?: string | null
          created_at?: string | null
          id?: string
          scan_ids?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      treatment_plans: {
        Row: {
          completed_at: string | null
          created_at: string
          end_date: string | null
          goals: string[] | null
          id: string
          milestones: string[] | null
          milestones_completed: number | null
          patient_id: string
          plan_data: Json | null
          plan_description: string | null
          plan_name: string
          plan_status: string | null
          progress_percentage: number | null
          provider_id: string
          start_date: string | null
          timeline_days: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          end_date?: string | null
          goals?: string[] | null
          id?: string
          milestones?: string[] | null
          milestones_completed?: number | null
          patient_id: string
          plan_data?: Json | null
          plan_description?: string | null
          plan_name: string
          plan_status?: string | null
          progress_percentage?: number | null
          provider_id: string
          start_date?: string | null
          timeline_days?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          end_date?: string | null
          goals?: string[] | null
          id?: string
          milestones?: string[] | null
          milestones_completed?: number | null
          patient_id?: string
          plan_data?: Json | null
          plan_description?: string | null
          plan_name?: string
          plan_status?: string | null
          progress_percentage?: number | null
          provider_id?: string
          start_date?: string | null
          timeline_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plans_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "healthcare_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_badges: {
        Row: {
          badge_name: string
          badge_type: string
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          link_url: string | null
          sort_order: number | null
        }
        Insert: {
          badge_name: string
          badge_type: string
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          link_url?: string | null
          sort_order?: number | null
        }
        Update: {
          badge_name?: string
          badge_type?: string
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          link_url?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      two_factor_authentication: {
        Row: {
          backup_codes: string[] | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          secret_key: string | null
          updated_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          secret_key?: string | null
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          secret_key?: string | null
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      urinary_health: {
        Row: {
          assessment_date: string | null
          created_at: string | null
          id: string
          ipss_score: number | null
          notes: string | null
          symptoms: Json | null
          user_id: string
        }
        Insert: {
          assessment_date?: string | null
          created_at?: string | null
          id?: string
          ipss_score?: number | null
          notes?: string | null
          symptoms?: Json | null
          user_id: string
        }
        Update: {
          assessment_date?: string | null
          created_at?: string | null
          id?: string
          ipss_score?: number | null
          notes?: string | null
          symptoms?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string | null
          id: string
          is_unlocked: boolean | null
          progress: number
          progress_data: Json | null
          unlocked_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string | null
          id?: string
          is_unlocked?: boolean | null
          progress?: number
          progress_data?: Json | null
          unlocked_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string | null
          id?: string
          is_unlocked?: boolean | null
          progress?: number
          progress_data?: Json | null
          unlocked_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievement_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_add_ons: {
        Row: {
          addon_id: string
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string
          price_paid: number
          status: string
          stripe_payment_intent_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          addon_id: string
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type: string
          price_paid: number
          status: string
          stripe_payment_intent_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          addon_id?: string
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          price_paid?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_assessment_results: {
        Row: {
          answers: Json | null
          assessment_id: string | null
          created_at: string | null
          id: string
          risk_level: string | null
          score: number | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          assessment_id?: string | null
          created_at?: string | null
          id?: string
          risk_level?: string | null
          score?: number | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          assessment_id?: string | null
          created_at?: string | null
          id?: string
          risk_level?: string | null
          score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          actual: string | null
          admin_response: string | null
          allow_contact: boolean | null
          attachments: string[] | null
          contact_email: string | null
          created_at: string
          description: string
          environment: Json | null
          expected: string | null
          frequency: string | null
          id: string
          kind: string
          rating: number | null
          sentiment: string | null
          severity: string | null
          status: string | null
          steps_to_reproduce: string | null
          tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual?: string | null
          admin_response?: string | null
          allow_contact?: boolean | null
          attachments?: string[] | null
          contact_email?: string | null
          created_at?: string
          description: string
          environment?: Json | null
          expected?: string | null
          frequency?: string | null
          id?: string
          kind?: string
          rating?: number | null
          sentiment?: string | null
          severity?: string | null
          status?: string | null
          steps_to_reproduce?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual?: string | null
          admin_response?: string | null
          allow_contact?: boolean | null
          attachments?: string[] | null
          contact_email?: string | null
          created_at?: string
          description?: string
          environment?: Json | null
          expected?: string | null
          frequency?: string | null
          id?: string
          kind?: string
          rating?: number | null
          sentiment?: string | null
          severity?: string | null
          status?: string | null
          steps_to_reproduce?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_habits: {
        Row: {
          archived_at: string | null
          completion_rate: number | null
          created_at: string
          current_streak: number | null
          custom_name: string | null
          custom_target_value: number | null
          habit_definition_id: string
          id: string
          is_active: boolean | null
          longest_streak: number | null
          paused_at: string | null
          started_at: string | null
          total_completions: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          completion_rate?: number | null
          created_at?: string
          current_streak?: number | null
          custom_name?: string | null
          custom_target_value?: number | null
          habit_definition_id: string
          id?: string
          is_active?: boolean | null
          longest_streak?: number | null
          paused_at?: string | null
          started_at?: string | null
          total_completions?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          completion_rate?: number | null
          created_at?: string
          current_streak?: number | null
          custom_name?: string | null
          custom_target_value?: number | null
          habit_definition_id?: string
          id?: string
          is_active?: boolean | null
          longest_streak?: number | null
          paused_at?: string | null
          started_at?: string | null
          total_completions?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_habits_habit_definition_id_fkey"
            columns: ["habit_definition_id"]
            isOneToOne: false
            referencedRelation: "habit_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_milestones: {
        Row: {
          achieved_at: string | null
          created_at: string | null
          id: string
          milestone_data: Json | null
          milestone_type: string
          milestone_value: number
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          created_at?: string | null
          id?: string
          milestone_data?: Json | null
          milestone_type: string
          milestone_value: number
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          created_at?: string | null
          id?: string
          milestone_data?: Json | null
          milestone_type?: string
          milestone_value?: number
          user_id?: string
        }
        Relationships: []
      }
      user_position_media_overrides: {
        Row: {
          created_at: string | null
          custom_image_url: string | null
          custom_video_url: string | null
          id: string
          notes: string | null
          position_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_image_url?: string | null
          custom_video_url?: string | null
          id?: string
          notes?: string | null
          position_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_image_url?: string | null
          custom_video_url?: string | null
          id?: string
          notes?: string | null
          position_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          color_blind_mode: string | null
          created_at: string
          font_size: string | null
          haptic_enabled: boolean | null
          id: string
          notifications_enabled: boolean | null
          reminder_days: number[] | null
          reminder_time: string | null
          theme: string | null
          theme_preset: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color_blind_mode?: string | null
          created_at?: string
          font_size?: string | null
          haptic_enabled?: boolean | null
          id?: string
          notifications_enabled?: boolean | null
          reminder_days?: number[] | null
          reminder_time?: string | null
          theme?: string | null
          theme_preset?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color_blind_mode?: string | null
          created_at?: string
          font_size?: string | null
          haptic_enabled?: boolean | null
          id?: string
          notifications_enabled?: boolean | null
          reminder_days?: number[] | null
          reminder_time?: string | null
          theme?: string | null
          theme_preset?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_privacy_settings: {
        Row: {
          analytics_opt_in: boolean | null
          created_at: string | null
          data_sharing_consent: boolean | null
          id: string
          marketing_opt_in: boolean | null
          profile_visibility: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analytics_opt_in?: boolean | null
          created_at?: string | null
          data_sharing_consent?: boolean | null
          id?: string
          marketing_opt_in?: boolean | null
          profile_visibility?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analytics_opt_in?: boolean | null
          created_at?: string | null
          data_sharing_consent?: boolean | null
          id?: string
          marketing_opt_in?: boolean | null
          profile_visibility?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_saved_positions: {
        Row: {
          created_at: string | null
          favorite: boolean | null
          id: string
          personal_notes: string | null
          position_id: string
          rating: number | null
          tried: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          favorite?: boolean | null
          id?: string
          personal_notes?: string | null
          position_id: string
          rating?: number | null
          tried?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          favorite?: boolean | null
          id?: string
          personal_notes?: string | null
          position_id?: string
          rating?: number | null
          tried?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_saved_positions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "sex_positions_library"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          created_at: string | null
          current_streak: number
          id: string
          is_active: boolean | null
          last_activity_date: string | null
          longest_streak: number
          streak_start_date: string | null
          streak_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number
          id?: string
          is_active?: boolean | null
          last_activity_date?: string | null
          longest_streak?: number
          streak_start_date?: string | null
          streak_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number
          id?: string
          is_active?: boolean | null
          last_activity_date?: string | null
          longest_streak?: number
          streak_start_date?: string | null
          streak_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_tier: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      video_bookmarks: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      video_downloads: {
        Row: {
          created_at: string | null
          download_progress: number | null
          download_status: string | null
          downloaded_at: string | null
          expires_at: string | null
          file_size_bytes: number | null
          id: string
          local_file_path: string | null
          updated_at: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string | null
          download_progress?: number | null
          download_status?: string | null
          downloaded_at?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          id?: string
          local_file_path?: string | null
          updated_at?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string | null
          download_progress?: number | null
          download_status?: string | null
          downloaded_at?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          id?: string
          local_file_path?: string | null
          updated_at?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      video_edit_sessions: {
        Row: {
          active_camera_index: number | null
          created_at: string | null
          edit_config: Json | null
          edit_name: string | null
          focus_mode: string | null
          focus_point: Json | null
          id: string
          keyframes: Json | null
          masks: Json | null
          pan_x: number | null
          pan_y: number | null
          recording_id: string
          stabilization_enabled: boolean | null
          timeline_position: number | null
          tracking_enabled: boolean | null
          tracking_target: Json | null
          updated_at: string | null
          user_id: string
          zoom_level: number | null
        }
        Insert: {
          active_camera_index?: number | null
          created_at?: string | null
          edit_config?: Json | null
          edit_name?: string | null
          focus_mode?: string | null
          focus_point?: Json | null
          id?: string
          keyframes?: Json | null
          masks?: Json | null
          pan_x?: number | null
          pan_y?: number | null
          recording_id: string
          stabilization_enabled?: boolean | null
          timeline_position?: number | null
          tracking_enabled?: boolean | null
          tracking_target?: Json | null
          updated_at?: string | null
          user_id: string
          zoom_level?: number | null
        }
        Update: {
          active_camera_index?: number | null
          created_at?: string | null
          edit_config?: Json | null
          edit_name?: string | null
          focus_mode?: string | null
          focus_point?: Json | null
          id?: string
          keyframes?: Json | null
          masks?: Json | null
          pan_x?: number | null
          pan_y?: number | null
          recording_id?: string
          stabilization_enabled?: boolean | null
          timeline_position?: number | null
          tracking_enabled?: boolean | null
          tracking_target?: Json | null
          updated_at?: string | null
          user_id?: string
          zoom_level?: number | null
        }
        Relationships: []
      }
      video_edits: {
        Row: {
          camera_switches: Json | null
          created_at: string | null
          edit_config: Json
          edit_name: string | null
          edit_status: string | null
          edit_type: string
          edited_video_storage_path: string | null
          edited_video_url: string | null
          id: string
          masking_data: Json | null
          preview_url: string | null
          recording_id: string
          transitions: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          camera_switches?: Json | null
          created_at?: string | null
          edit_config: Json
          edit_name?: string | null
          edit_status?: string | null
          edit_type: string
          edited_video_storage_path?: string | null
          edited_video_url?: string | null
          id?: string
          masking_data?: Json | null
          preview_url?: string | null
          recording_id: string
          transitions?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          camera_switches?: Json | null
          created_at?: string | null
          edit_config?: Json
          edit_name?: string | null
          edit_status?: string | null
          edit_type?: string
          edited_video_storage_path?: string | null
          edited_video_url?: string | null
          id?: string
          masking_data?: Json | null
          preview_url?: string | null
          recording_id?: string
          transitions?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_edits_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "video_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      video_library: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          duration_seconds: number | null
          file_size_bytes: number | null
          id: string
          instructor_credentials: string | null
          instructor_name: string | null
          is_featured: boolean | null
          is_nsfw: boolean | null
          is_premium: boolean | null
          like_count: number | null
          order_index: number | null
          rating_average: number | null
          rating_count: number | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_url: string
          view_count: number | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          instructor_credentials?: string | null
          instructor_name?: string | null
          is_featured?: boolean | null
          is_nsfw?: boolean | null
          is_premium?: boolean | null
          like_count?: number | null
          order_index?: number | null
          rating_average?: number | null
          rating_count?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_url: string
          view_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          instructor_credentials?: string | null
          instructor_name?: string | null
          is_featured?: boolean | null
          is_nsfw?: boolean | null
          is_premium?: boolean | null
          like_count?: number | null
          order_index?: number | null
          rating_average?: number | null
          rating_count?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string
          view_count?: number | null
        }
        Relationships: []
      }
      video_playlists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          playlist_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          playlist_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          playlist_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      video_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          last_watched_at: string | null
          progress_percentage: number | null
          progress_seconds: number | null
          updated_at: string | null
          user_id: string
          video_id: string
          watch_count: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          last_watched_at?: string | null
          progress_percentage?: number | null
          progress_seconds?: number | null
          updated_at?: string | null
          user_id: string
          video_id: string
          watch_count?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          last_watched_at?: string | null
          progress_percentage?: number | null
          progress_seconds?: number | null
          updated_at?: string | null
          user_id?: string
          video_id?: string
          watch_count?: number | null
        }
        Relationships: []
      }
      video_ratings: {
        Row: {
          created_at: string | null
          id: string
          rating: number
          review_text: string | null
          updated_at: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating: number
          review_text?: string | null
          updated_at?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      video_recordings: {
        Row: {
          codec: string | null
          created_at: string | null
          duration_seconds: number | null
          edit_version: number | null
          file_size_bytes: number | null
          fps: number | null
          id: string
          is_edited: boolean | null
          is_private: boolean | null
          original_recording_id: string | null
          recording_name: string
          recording_type: string | null
          resolution_height: number | null
          resolution_width: number | null
          session_id: string
          share_with_partner: boolean | null
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
          video_storage_path: string | null
          video_url: string | null
        }
        Insert: {
          codec?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          edit_version?: number | null
          file_size_bytes?: number | null
          fps?: number | null
          id?: string
          is_edited?: boolean | null
          is_private?: boolean | null
          original_recording_id?: string | null
          recording_name: string
          recording_type?: string | null
          resolution_height?: number | null
          resolution_width?: number | null
          session_id: string
          share_with_partner?: boolean | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
          video_storage_path?: string | null
          video_url?: string | null
        }
        Update: {
          codec?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          edit_version?: number | null
          file_size_bytes?: number | null
          fps?: number | null
          id?: string
          is_edited?: boolean | null
          is_private?: boolean | null
          original_recording_id?: string | null
          recording_name?: string
          recording_type?: string | null
          resolution_height?: number | null
          resolution_width?: number | null
          session_id?: string
          share_with_partner?: boolean | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
          video_storage_path?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_recordings_original_recording_id_fkey"
            columns: ["original_recording_id"]
            isOneToOne: false
            referencedRelation: "video_recordings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_recordings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "multi_camera_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      video_screenshots: {
        Row: {
          created_at: string | null
          edit_data: Json | null
          id: string
          image_storage_path: string | null
          image_url: string | null
          is_edited: boolean | null
          recording_id: string
          screenshot_name: string | null
          thumbnail_url: string | null
          timestamp_seconds: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          edit_data?: Json | null
          id?: string
          image_storage_path?: string | null
          image_url?: string | null
          is_edited?: boolean | null
          recording_id: string
          screenshot_name?: string | null
          thumbnail_url?: string | null
          timestamp_seconds: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          edit_data?: Json | null
          id?: string
          image_storage_path?: string | null
          image_url?: string | null
          is_edited?: boolean | null
          recording_id?: string
          screenshot_name?: string | null
          thumbnail_url?: string | null
          timestamp_seconds?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_screenshots_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "video_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          failed_deliveries: number
          id: string
          is_active: boolean
          is_verified: boolean
          last_delivery_at: string | null
          max_retries: number
          retry_delay_seconds: number
          subscribed_events: string[]
          successful_deliveries: number
          total_deliveries: number
          updated_at: string
          user_id: string
          verification_token: string | null
          webhook_name: string
          webhook_secret: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          failed_deliveries?: number
          id?: string
          is_active?: boolean
          is_verified?: boolean
          last_delivery_at?: string | null
          max_retries?: number
          retry_delay_seconds?: number
          subscribed_events?: string[]
          successful_deliveries?: number
          total_deliveries?: number
          updated_at?: string
          user_id: string
          verification_token?: string | null
          webhook_name: string
          webhook_secret: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          failed_deliveries?: number
          id?: string
          is_active?: boolean
          is_verified?: boolean
          last_delivery_at?: string | null
          max_retries?: number
          retry_delay_seconds?: number
          subscribed_events?: string[]
          successful_deliveries?: number
          total_deliveries?: number
          updated_at?: string
          user_id?: string
          verification_token?: string | null
          webhook_name?: string
          webhook_secret?: string
          webhook_url?: string
        }
        Relationships: []
      }
      workshop_bookings: {
        Row: {
          created_at: string | null
          id: string
          payment_status: string | null
          status: string | null
          user_id: string
          workshop_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_status?: string | null
          status?: string | null
          user_id: string
          workshop_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_status?: string | null
          status?: string | null
          user_id?: string
          workshop_id?: string | null
        }
        Relationships: []
      }
      workshop_participants: {
        Row: {
          created_at: string | null
          id: string
          joined_at: string | null
          payment_status: string | null
          user_id: string
          workshop_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          joined_at?: string | null
          payment_status?: string | null
          user_id: string
          workshop_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          joined_at?: string | null
          payment_status?: string | null
          user_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_participants_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "expert_group_workshops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_achievement_progress: {
        Args: {
          p_achievement_code: string
          p_progress_increment?: number
          p_user_id: string
        }
        Returns: boolean
      }
      get_public_leaderboards: {
        Args: {
          p_leaderboard_type?: string
          p_limit?: number
          p_period?: string
        }
        Returns: {
          created_at: string
          display_name: string
          id: string
          is_anonymous: boolean
          leaderboard_type: string
          period: string
          rank: number
          score: number
          updated_at: string
        }[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_patient_count: {
        Args: { p_provider_id: string }
        Returns: undefined
      }
      update_streak: {
        Args: { p_streak_type: string; p_user_id: string }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "pro" | "user" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "pro", "user", "super_admin"],
    },
  },
} as const
