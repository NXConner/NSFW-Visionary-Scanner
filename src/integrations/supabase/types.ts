export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      achievement_definitions: {
        Row: {
          badge_color: string | null;
          category: string;
          code: string;
          created_at: string | null;
          description: string;
          icon_name: string | null;
          id: string;
          is_active: boolean | null;
          is_premium: boolean | null;
          name: string;
          points: number | null;
          requirement_data: Json | null;
          requirement_type: string;
          requirement_value: number | null;
          updated_at: string | null;
        };
        Insert: {
          badge_color?: string | null;
          category: string;
          code: string;
          created_at?: string | null;
          description: string;
          icon_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_premium?: boolean | null;
          name: string;
          points?: number | null;
          requirement_data?: Json | null;
          requirement_type: string;
          requirement_value?: number | null;
          updated_at?: string | null;
        };
        Update: {
          badge_color?: string | null;
          category?: string;
          code?: string;
          created_at?: string | null;
          description?: string;
          icon_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_premium?: boolean | null;
          name?: string;
          points?: number | null;
          requirement_data?: Json | null;
          requirement_type?: string;
          requirement_value?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      active_sessions: {
        Row: {
          browser: string | null;
          created_at: string | null;
          device_name: string | null;
          device_type: string | null;
          expires_at: string | null;
          id: string;
          ip_address: unknown;
          is_active: boolean | null;
          is_current_session: boolean | null;
          last_activity_at: string | null;
          location_city: string | null;
          location_country: string | null;
          platform: string | null;
          revoked_at: string | null;
          session_token_hash: string;
          user_id: string;
        };
        Insert: {
          browser?: string | null;
          created_at?: string | null;
          device_name?: string | null;
          device_type?: string | null;
          expires_at?: string | null;
          id?: string;
          ip_address?: unknown;
          is_active?: boolean | null;
          is_current_session?: boolean | null;
          last_activity_at?: string | null;
          location_city?: string | null;
          location_country?: string | null;
          platform?: string | null;
          revoked_at?: string | null;
          session_token_hash: string;
          user_id: string;
        };
        Update: {
          browser?: string | null;
          created_at?: string | null;
          device_name?: string | null;
          device_type?: string | null;
          expires_at?: string | null;
          id?: string;
          ip_address?: unknown;
          is_active?: boolean | null;
          is_current_session?: boolean | null;
          last_activity_at?: string | null;
          location_city?: string | null;
          location_country?: string | null;
          platform?: string | null;
          revoked_at?: string | null;
          session_token_hash?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      adaptive_routines: {
        Row: {
          adaptation_confidence: number | null;
          adaptation_count: number | null;
          adaptation_history: Json | null;
          adaptation_reason: string | null;
          ai_model_version: string | null;
          base_template_id: string | null;
          created_at: string | null;
          current_exercises: Json;
          current_schedule: Json;
          difficulty_adjustment: number | null;
          id: string;
          last_adapted_at: string | null;
          routine_name: string;
          start_date: string | null;
          status: string | null;
          target_end_date: string | null;
          updated_at: string | null;
          user_id: string;
          user_profile: Json;
        };
        Insert: {
          adaptation_confidence?: number | null;
          adaptation_count?: number | null;
          adaptation_history?: Json | null;
          adaptation_reason?: string | null;
          ai_model_version?: string | null;
          base_template_id?: string | null;
          created_at?: string | null;
          current_exercises: Json;
          current_schedule: Json;
          difficulty_adjustment?: number | null;
          id?: string;
          last_adapted_at?: string | null;
          routine_name: string;
          start_date?: string | null;
          status?: string | null;
          target_end_date?: string | null;
          updated_at?: string | null;
          user_id: string;
          user_profile: Json;
        };
        Update: {
          adaptation_confidence?: number | null;
          adaptation_count?: number | null;
          adaptation_history?: Json | null;
          adaptation_reason?: string | null;
          ai_model_version?: string | null;
          base_template_id?: string | null;
          created_at?: string | null;
          current_exercises?: Json;
          current_schedule?: Json;
          difficulty_adjustment?: number | null;
          id?: string;
          last_adapted_at?: string | null;
          routine_name?: string;
          start_date?: string | null;
          status?: string | null;
          target_end_date?: string | null;
          updated_at?: string | null;
          user_id?: string;
          user_profile?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "adaptive_routines_base_template_id_fkey";
            columns: ["base_template_id"];
            isOneToOne: false;
            referencedRelation: "routine_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      addon_usage_tracking: {
        Row: {
          addon_id: string;
          created_at: string | null;
          id: string;
          period_end: string;
          period_start: string;
          tracked_at: string | null;
          usage_limit: number | null;
          usage_type: string;
          usage_value: number;
          user_id: string;
        };
        Insert: {
          addon_id: string;
          created_at?: string | null;
          id?: string;
          period_end: string;
          period_start: string;
          tracked_at?: string | null;
          usage_limit?: number | null;
          usage_type: string;
          usage_value: number;
          user_id: string;
        };
        Update: {
          addon_id?: string;
          created_at?: string | null;
          id?: string;
          period_end?: string;
          period_start?: string;
          tracked_at?: string | null;
          usage_limit?: number | null;
          usage_type?: string;
          usage_value?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "addon_usage_tracking_addon_id_fkey";
            columns: ["addon_id"];
            isOneToOne: false;
            referencedRelation: "premium_add_ons";
            referencedColumns: ["addon_id"];
          },
        ];
      };
      admin_dlc_package_toggles: {
        Row: {
          created_at: string;
          id: string;
          is_enabled: boolean;
          package_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_enabled?: boolean;
          package_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_enabled?: boolean;
          package_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      affiliate_commissions: {
        Row: {
          affiliate_link_clicked_at: string | null;
          approved_at: string | null;
          commission_amount: number;
          commission_rate: number;
          commission_status: string | null;
          created_at: string | null;
          id: string;
          paid_at: string | null;
          purchase_amount: number;
          purchase_completed_at: string | null;
          source_id: string;
          source_type: string;
          user_id: string | null;
        };
        Insert: {
          affiliate_link_clicked_at?: string | null;
          approved_at?: string | null;
          commission_amount: number;
          commission_rate: number;
          commission_status?: string | null;
          created_at?: string | null;
          id?: string;
          paid_at?: string | null;
          purchase_amount: number;
          purchase_completed_at?: string | null;
          source_id: string;
          source_type: string;
          user_id?: string | null;
        };
        Update: {
          affiliate_link_clicked_at?: string | null;
          approved_at?: string | null;
          commission_amount?: number;
          commission_rate?: number;
          commission_status?: string | null;
          created_at?: string | null;
          id?: string;
          paid_at?: string | null;
          purchase_amount?: number;
          purchase_completed_at?: string | null;
          source_id?: string;
          source_type?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      ai_contextual_memory: {
        Row: {
          access_count: number | null;
          created_at: string | null;
          expires_at: string | null;
          id: string;
          importance_score: number | null;
          last_accessed_at: string | null;
          memory_key: string;
          memory_type: string;
          memory_value: Json;
          source_message_id: string | null;
          source_session_id: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          access_count?: number | null;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          importance_score?: number | null;
          last_accessed_at?: string | null;
          memory_key: string;
          memory_type: string;
          memory_value: Json;
          source_message_id?: string | null;
          source_session_id?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          access_count?: number | null;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          importance_score?: number | null;
          last_accessed_at?: string | null;
          memory_key?: string;
          memory_type?: string;
          memory_value?: Json;
          source_message_id?: string | null;
          source_session_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_contextual_memory_source_message_id_fkey";
            columns: ["source_message_id"];
            isOneToOne: false;
            referencedRelation: "ai_conversation_messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_contextual_memory_source_session_id_fkey";
            columns: ["source_session_id"];
            isOneToOne: false;
            referencedRelation: "ai_conversation_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_conversation_messages: {
        Row: {
          ai_confidence: number | null;
          ai_model_version: string | null;
          ai_reasoning: string | null;
          content_audio_url: string | null;
          content_image_url: string | null;
          content_text: string | null;
          context_references: string[] | null;
          created_at: string | null;
          emotional_tone: string | null;
          id: string;
          message_type: string;
          proactive_suggestions: Json | null;
          referenced_data: Json | null;
          sender_type: string;
          sentiment_score: number | null;
          session_id: string;
          transcription: string | null;
          user_id: string;
        };
        Insert: {
          ai_confidence?: number | null;
          ai_model_version?: string | null;
          ai_reasoning?: string | null;
          content_audio_url?: string | null;
          content_image_url?: string | null;
          content_text?: string | null;
          context_references?: string[] | null;
          created_at?: string | null;
          emotional_tone?: string | null;
          id?: string;
          message_type: string;
          proactive_suggestions?: Json | null;
          referenced_data?: Json | null;
          sender_type: string;
          sentiment_score?: number | null;
          session_id: string;
          transcription?: string | null;
          user_id: string;
        };
        Update: {
          ai_confidence?: number | null;
          ai_model_version?: string | null;
          ai_reasoning?: string | null;
          content_audio_url?: string | null;
          content_image_url?: string | null;
          content_text?: string | null;
          context_references?: string[] | null;
          created_at?: string | null;
          emotional_tone?: string | null;
          id?: string;
          message_type?: string;
          proactive_suggestions?: Json | null;
          referenced_data?: Json | null;
          sender_type?: string;
          sentiment_score?: number | null;
          session_id?: string;
          transcription?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_conversation_messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "ai_conversation_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_conversation_sessions: {
        Row: {
          context_summary: string | null;
          conversation_mode: string | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          language: string | null;
          last_activity_at: string | null;
          session_name: string | null;
          updated_at: string | null;
          user_id: string;
          user_preferences: Json | null;
        };
        Insert: {
          context_summary?: string | null;
          conversation_mode?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          language?: string | null;
          last_activity_at?: string | null;
          session_name?: string | null;
          updated_at?: string | null;
          user_id: string;
          user_preferences?: Json | null;
        };
        Update: {
          context_summary?: string | null;
          conversation_mode?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          language?: string | null;
          last_activity_at?: string | null;
          session_name?: string | null;
          updated_at?: string | null;
          user_id?: string;
          user_preferences?: Json | null;
        };
        Relationships: [];
      };
      ai_model_performance: {
        Row: {
          accuracy: number | null;
          average_processing_time_ms: number | null;
          created_at: string | null;
          f1_score: number | null;
          failed_predictions: number | null;
          id: string;
          model_name: string;
          model_version: string;
          precision: number | null;
          recall: number | null;
          recorded_at: string | null;
          successful_predictions: number | null;
          task_type: string;
          total_predictions: number | null;
          user_feedback_negative: number | null;
          user_feedback_positive: number | null;
        };
        Insert: {
          accuracy?: number | null;
          average_processing_time_ms?: number | null;
          created_at?: string | null;
          f1_score?: number | null;
          failed_predictions?: number | null;
          id?: string;
          model_name: string;
          model_version: string;
          precision?: number | null;
          recall?: number | null;
          recorded_at?: string | null;
          successful_predictions?: number | null;
          task_type: string;
          total_predictions?: number | null;
          user_feedback_negative?: number | null;
          user_feedback_positive?: number | null;
        };
        Update: {
          accuracy?: number | null;
          average_processing_time_ms?: number | null;
          created_at?: string | null;
          f1_score?: number | null;
          failed_predictions?: number | null;
          id?: string;
          model_name?: string;
          model_version?: string;
          precision?: number | null;
          recall?: number | null;
          recorded_at?: string | null;
          successful_predictions?: number | null;
          task_type?: string;
          total_predictions?: number | null;
          user_feedback_negative?: number | null;
          user_feedback_positive?: number | null;
        };
        Relationships: [];
      };
      ai_multimodal_interactions: {
        Row: {
          ai_analysis: Json | null;
          ai_response: string | null;
          ai_response_audio_url: string | null;
          created_at: string | null;
          has_image: boolean | null;
          has_text: boolean | null;
          has_voice: boolean | null;
          id: string;
          image_url: string | null;
          session_id: string | null;
          text_content: string | null;
          user_id: string;
          voice_url: string | null;
        };
        Insert: {
          ai_analysis?: Json | null;
          ai_response?: string | null;
          ai_response_audio_url?: string | null;
          created_at?: string | null;
          has_image?: boolean | null;
          has_text?: boolean | null;
          has_voice?: boolean | null;
          id?: string;
          image_url?: string | null;
          session_id?: string | null;
          text_content?: string | null;
          user_id: string;
          voice_url?: string | null;
        };
        Update: {
          ai_analysis?: Json | null;
          ai_response?: string | null;
          ai_response_audio_url?: string | null;
          created_at?: string | null;
          has_image?: boolean | null;
          has_text?: boolean | null;
          has_voice?: boolean | null;
          id?: string;
          image_url?: string | null;
          session_id?: string | null;
          text_content?: string | null;
          user_id?: string;
          voice_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_multimodal_interactions_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "ai_conversation_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_proactive_suggestions: {
        Row: {
          accepted_at: string | null;
          ai_confidence: number | null;
          ai_reasoning: string | null;
          created_at: string | null;
          dismissed_at: string | null;
          expires_at: string | null;
          id: string;
          shown_at: string | null;
          suggestion_action: Json | null;
          suggestion_content: string;
          suggestion_status: string | null;
          suggestion_title: string;
          suggestion_type: string;
          trigger_condition: Json | null;
          user_id: string;
        };
        Insert: {
          accepted_at?: string | null;
          ai_confidence?: number | null;
          ai_reasoning?: string | null;
          created_at?: string | null;
          dismissed_at?: string | null;
          expires_at?: string | null;
          id?: string;
          shown_at?: string | null;
          suggestion_action?: Json | null;
          suggestion_content: string;
          suggestion_status?: string | null;
          suggestion_title: string;
          suggestion_type: string;
          trigger_condition?: Json | null;
          user_id: string;
        };
        Update: {
          accepted_at?: string | null;
          ai_confidence?: number | null;
          ai_reasoning?: string | null;
          created_at?: string | null;
          dismissed_at?: string | null;
          expires_at?: string | null;
          id?: string;
          shown_at?: string | null;
          suggestion_action?: Json | null;
          suggestion_content?: string;
          suggestion_status?: string | null;
          suggestion_title?: string;
          suggestion_type?: string;
          trigger_condition?: Json | null;
          user_id?: string;
        };
        Relationships: [];
      };
      ai_scan_analysis: {
        Row: {
          ai_model_confidence: number | null;
          ai_model_version: string | null;
          analysis_type: string;
          analyzed_at: string | null;
          anomalies_detected: Json | null;
          anomaly_confidence: number | null;
          comparison_results: Json | null;
          created_at: string | null;
          detected_conditions: Json | null;
          health_alerts: Json | null;
          id: string;
          measurement_confidence: number | null;
          measurement_reasoning: string | null;
          overall_quality_score: number | null;
          previous_scan_id: string | null;
          processing_time_ms: number | null;
          quality_breakdown: Json | null;
          quality_recommendations: string[] | null;
          risk_factors: Json | null;
          scan_id: string | null;
          suggested_measurements: Json | null;
          trend_data: Json | null;
          trend_direction: string | null;
          user_id: string;
          visualization_url: string | null;
        };
        Insert: {
          ai_model_confidence?: number | null;
          ai_model_version?: string | null;
          analysis_type: string;
          analyzed_at?: string | null;
          anomalies_detected?: Json | null;
          anomaly_confidence?: number | null;
          comparison_results?: Json | null;
          created_at?: string | null;
          detected_conditions?: Json | null;
          health_alerts?: Json | null;
          id?: string;
          measurement_confidence?: number | null;
          measurement_reasoning?: string | null;
          overall_quality_score?: number | null;
          previous_scan_id?: string | null;
          processing_time_ms?: number | null;
          quality_breakdown?: Json | null;
          quality_recommendations?: string[] | null;
          risk_factors?: Json | null;
          scan_id?: string | null;
          suggested_measurements?: Json | null;
          trend_data?: Json | null;
          trend_direction?: string | null;
          user_id: string;
          visualization_url?: string | null;
        };
        Update: {
          ai_model_confidence?: number | null;
          ai_model_version?: string | null;
          analysis_type?: string;
          analyzed_at?: string | null;
          anomalies_detected?: Json | null;
          anomaly_confidence?: number | null;
          comparison_results?: Json | null;
          created_at?: string | null;
          detected_conditions?: Json | null;
          health_alerts?: Json | null;
          id?: string;
          measurement_confidence?: number | null;
          measurement_reasoning?: string | null;
          overall_quality_score?: number | null;
          previous_scan_id?: string | null;
          processing_time_ms?: number | null;
          quality_breakdown?: Json | null;
          quality_recommendations?: string[] | null;
          risk_factors?: Json | null;
          scan_id?: string | null;
          suggested_measurements?: Json | null;
          trend_data?: Json | null;
          trend_direction?: string | null;
          user_id?: string;
          visualization_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_scan_analysis_previous_scan_id_fkey";
            columns: ["previous_scan_id"];
            isOneToOne: false;
            referencedRelation: "scans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_scan_analysis_scan_id_fkey";
            columns: ["scan_id"];
            isOneToOne: false;
            referencedRelation: "scans";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_user_preferences: {
        Row: {
          ai_personality: string | null;
          ai_response_length: string | null;
          created_at: string | null;
          data_sharing_level: string | null;
          id: string;
          image_analysis_enabled: boolean | null;
          preferred_language: string | null;
          preferred_mode: string | null;
          proactive_suggestions_enabled: boolean | null;
          updated_at: string | null;
          user_id: string;
          voice_enabled: boolean | null;
        };
        Insert: {
          ai_personality?: string | null;
          ai_response_length?: string | null;
          created_at?: string | null;
          data_sharing_level?: string | null;
          id?: string;
          image_analysis_enabled?: boolean | null;
          preferred_language?: string | null;
          preferred_mode?: string | null;
          proactive_suggestions_enabled?: boolean | null;
          updated_at?: string | null;
          user_id: string;
          voice_enabled?: boolean | null;
        };
        Update: {
          ai_personality?: string | null;
          ai_response_length?: string | null;
          created_at?: string | null;
          data_sharing_level?: string | null;
          id?: string;
          image_analysis_enabled?: boolean | null;
          preferred_language?: string | null;
          preferred_mode?: string | null;
          proactive_suggestions_enabled?: boolean | null;
          updated_at?: string | null;
          user_id?: string;
          voice_enabled?: boolean | null;
        };
        Relationships: [];
      };
      ai_voice_interactions: {
        Row: {
          audio_url: string;
          created_at: string | null;
          emotional_tone: string | null;
          id: string;
          keywords_extracted: string[] | null;
          language_detected: string | null;
          processed_at: string | null;
          processing_status: string | null;
          sentiment_score: number | null;
          session_id: string | null;
          transcription: string | null;
          user_id: string;
        };
        Insert: {
          audio_url: string;
          created_at?: string | null;
          emotional_tone?: string | null;
          id?: string;
          keywords_extracted?: string[] | null;
          language_detected?: string | null;
          processed_at?: string | null;
          processing_status?: string | null;
          sentiment_score?: number | null;
          session_id?: string | null;
          transcription?: string | null;
          user_id: string;
        };
        Update: {
          audio_url?: string;
          created_at?: string | null;
          emotional_tone?: string | null;
          id?: string;
          keywords_extracted?: string[] | null;
          language_detected?: string | null;
          processed_at?: string | null;
          processing_status?: string | null;
          sentiment_score?: number | null;
          session_id?: string | null;
          transcription?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_voice_interactions_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "ai_conversation_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      anomaly_detection_log: {
        Row: {
          affected_measurements: string[] | null;
          anomaly_type: string;
          compared_to_previous: boolean | null;
          confidence: number;
          created_at: string | null;
          description: string;
          detected_at: string | null;
          deviation_amount: number | null;
          id: string;
          is_reviewed: boolean | null;
          location: Json | null;
          previous_scan_id: string | null;
          recommendation: string | null;
          requires_attention: boolean | null;
          review_notes: string | null;
          reviewed_at: string | null;
          scan_id: string | null;
          severity: string | null;
          user_id: string;
        };
        Insert: {
          affected_measurements?: string[] | null;
          anomaly_type: string;
          compared_to_previous?: boolean | null;
          confidence: number;
          created_at?: string | null;
          description: string;
          detected_at?: string | null;
          deviation_amount?: number | null;
          id?: string;
          is_reviewed?: boolean | null;
          location?: Json | null;
          previous_scan_id?: string | null;
          recommendation?: string | null;
          requires_attention?: boolean | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          scan_id?: string | null;
          severity?: string | null;
          user_id: string;
        };
        Update: {
          affected_measurements?: string[] | null;
          anomaly_type?: string;
          compared_to_previous?: boolean | null;
          confidence?: number;
          created_at?: string | null;
          description?: string;
          detected_at?: string | null;
          deviation_amount?: number | null;
          id?: string;
          is_reviewed?: boolean | null;
          location?: Json | null;
          previous_scan_id?: string | null;
          recommendation?: string | null;
          requires_attention?: boolean | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          scan_id?: string | null;
          severity?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "anomaly_detection_log_previous_scan_id_fkey";
            columns: ["previous_scan_id"];
            isOneToOne: false;
            referencedRelation: "scans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "anomaly_detection_log_scan_id_fkey";
            columns: ["scan_id"];
            isOneToOne: false;
            referencedRelation: "scans";
            referencedColumns: ["id"];
          },
        ];
      };
      anonymization_rules: {
        Row: {
          anonymization_method: string;
          applies_to: string[];
          created_at: string | null;
          field_name: string;
          id: string;
          is_active: boolean | null;
        };
        Insert: {
          anonymization_method: string;
          applies_to: string[];
          created_at?: string | null;
          field_name: string;
          id?: string;
          is_active?: boolean | null;
        };
        Update: {
          anonymization_method?: string;
          applies_to?: string[];
          created_at?: string | null;
          field_name?: string;
          id?: string;
          is_active?: boolean | null;
        };
        Relationships: [];
      };
      anonymized_contributions: {
        Row: {
          anonymous_user_id: string;
          contributed_at: string | null;
          contribution_type: string;
          data: Json;
          data_hash: string;
          id: string;
          participation_id: string;
          program_id: string;
        };
        Insert: {
          anonymous_user_id?: string;
          contributed_at?: string | null;
          contribution_type: string;
          data: Json;
          data_hash: string;
          id?: string;
          participation_id: string;
          program_id: string;
        };
        Update: {
          anonymous_user_id?: string;
          contributed_at?: string | null;
          contribution_type?: string;
          data?: Json;
          data_hash?: string;
          id?: string;
          participation_id?: string;
          program_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "anonymized_contributions_participation_id_fkey";
            columns: ["participation_id"];
            isOneToOne: false;
            referencedRelation: "research_participation";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "anonymized_contributions_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "research_programs";
            referencedColumns: ["id"];
          },
        ];
      };
      api_keys: {
        Row: {
          access_tier: string | null;
          allowed_endpoints: string[] | null;
          allowed_methods: string[] | null;
          api_key_hash: string;
          api_key_prefix: string;
          created_at: string | null;
          expires_at: string | null;
          id: string;
          is_active: boolean | null;
          key_name: string;
          last_request_at: string | null;
          last_used_at: string | null;
          rate_limit_per_day: number | null;
          rate_limit_per_hour: number | null;
          rate_limit_per_minute: number | null;
          total_requests: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          access_tier?: string | null;
          allowed_endpoints?: string[] | null;
          allowed_methods?: string[] | null;
          api_key_hash: string;
          api_key_prefix: string;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          key_name: string;
          last_request_at?: string | null;
          last_used_at?: string | null;
          rate_limit_per_day?: number | null;
          rate_limit_per_hour?: number | null;
          rate_limit_per_minute?: number | null;
          total_requests?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          access_tier?: string | null;
          allowed_endpoints?: string[] | null;
          allowed_methods?: string[] | null;
          api_key_hash?: string;
          api_key_prefix?: string;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          key_name?: string;
          last_request_at?: string | null;
          last_used_at?: string | null;
          rate_limit_per_day?: number | null;
          rate_limit_per_hour?: number | null;
          rate_limit_per_minute?: number | null;
          total_requests?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      api_rate_limits: {
        Row: {
          api_key_id: string;
          created_at: string | null;
          id: string;
          is_limit_exceeded: boolean | null;
          request_count: number | null;
          updated_at: string | null;
          window_end: string;
          window_start: string;
          window_type: string;
        };
        Insert: {
          api_key_id: string;
          created_at?: string | null;
          id?: string;
          is_limit_exceeded?: boolean | null;
          request_count?: number | null;
          updated_at?: string | null;
          window_end: string;
          window_start: string;
          window_type: string;
        };
        Update: {
          api_key_id?: string;
          created_at?: string | null;
          id?: string;
          is_limit_exceeded?: boolean | null;
          request_count?: number | null;
          updated_at?: string | null;
          window_end?: string;
          window_start?: string;
          window_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "api_rate_limits_api_key_id_fkey";
            columns: ["api_key_id"];
            isOneToOne: false;
            referencedRelation: "api_keys";
            referencedColumns: ["id"];
          },
        ];
      };
      api_usage_analytics: {
        Row: {
          api_key_id: string | null;
          endpoint: string;
          error_message: string | null;
          error_type: string | null;
          id: string;
          ip_address: unknown;
          method: string;
          request_size_bytes: number | null;
          requested_at: string | null;
          response_size_bytes: number | null;
          response_time_ms: number | null;
          status_code: number;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          api_key_id?: string | null;
          endpoint: string;
          error_message?: string | null;
          error_type?: string | null;
          id?: string;
          ip_address?: unknown;
          method: string;
          request_size_bytes?: number | null;
          requested_at?: string | null;
          response_size_bytes?: number | null;
          response_time_ms?: number | null;
          status_code: number;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          api_key_id?: string | null;
          endpoint?: string;
          error_message?: string | null;
          error_type?: string | null;
          id?: string;
          ip_address?: unknown;
          method?: string;
          request_size_bytes?: number | null;
          requested_at?: string | null;
          response_size_bytes?: number | null;
          response_time_ms?: number | null;
          status_code?: number;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "api_usage_analytics_api_key_id_fkey";
            columns: ["api_key_id"];
            isOneToOne: false;
            referencedRelation: "api_keys";
            referencedColumns: ["id"];
          },
        ];
      };
      app_analytics_events: {
        Row: {
          app_build: string | null;
          app_version: string | null;
          created_at: string;
          device_platform: string | null;
          distribution_channel: string | null;
          event_action: string | null;
          event_category: string | null;
          event_label: string | null;
          event_name: string;
          event_value: number | null;
          id: string;
          page_path: string | null;
          properties: Json;
          referrer: string | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          app_build?: string | null;
          app_version?: string | null;
          created_at?: string;
          device_platform?: string | null;
          distribution_channel?: string | null;
          event_action?: string | null;
          event_category?: string | null;
          event_label?: string | null;
          event_name: string;
          event_value?: number | null;
          id?: string;
          page_path?: string | null;
          properties?: Json;
          referrer?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          app_build?: string | null;
          app_version?: string | null;
          created_at?: string;
          device_platform?: string | null;
          distribution_channel?: string | null;
          event_action?: string | null;
          event_category?: string | null;
          event_label?: string | null;
          event_name?: string;
          event_value?: number | null;
          id?: string;
          page_path?: string | null;
          properties?: Json;
          referrer?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      app_shortcuts: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          last_used_at: string | null;
          platform: string;
          shortcut_action: Json;
          shortcut_icon: string | null;
          shortcut_name: string;
          shortcut_type: string;
          sort_order: number | null;
          updated_at: string | null;
          usage_count: number | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_used_at?: string | null;
          platform: string;
          shortcut_action: Json;
          shortcut_icon?: string | null;
          shortcut_name: string;
          shortcut_type: string;
          sort_order?: number | null;
          updated_at?: string | null;
          usage_count?: number | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_used_at?: string | null;
          platform?: string;
          shortcut_action?: Json;
          shortcut_icon?: string | null;
          shortcut_name?: string;
          shortcut_type?: string;
          sort_order?: number | null;
          updated_at?: string | null;
          usage_count?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      background_processing_jobs: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          error_message: string | null;
          failed_at: string | null;
          id: string;
          job_name: string;
          job_status: string | null;
          job_type: string;
          progress_percentage: number | null;
          recurrence_pattern: string | null;
          requires_charging: boolean | null;
          requires_wifi: boolean | null;
          schedule_type: string;
          scheduled_at: string | null;
          started_at: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          failed_at?: string | null;
          id?: string;
          job_name: string;
          job_status?: string | null;
          job_type: string;
          progress_percentage?: number | null;
          recurrence_pattern?: string | null;
          requires_charging?: boolean | null;
          requires_wifi?: boolean | null;
          schedule_type: string;
          scheduled_at?: string | null;
          started_at?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          failed_at?: string | null;
          id?: string;
          job_name?: string;
          job_status?: string | null;
          job_type?: string;
          progress_percentage?: number | null;
          recurrence_pattern?: string | null;
          requires_charging?: boolean | null;
          requires_wifi?: boolean | null;
          schedule_type?: string;
          scheduled_at?: string | null;
          started_at?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      batch_scan_entries: {
        Row: {
          batch_session_id: string;
          captured_at: string;
          created_at: string | null;
          entry_index: number;
          id: string;
          notes: string | null;
          quick_circumference: number | null;
          quick_length: number | null;
          scan_id: string | null;
        };
        Insert: {
          batch_session_id: string;
          captured_at: string;
          created_at?: string | null;
          entry_index: number;
          id?: string;
          notes?: string | null;
          quick_circumference?: number | null;
          quick_length?: number | null;
          scan_id?: string | null;
        };
        Update: {
          batch_session_id?: string;
          captured_at?: string;
          created_at?: string | null;
          entry_index?: number;
          id?: string;
          notes?: string | null;
          quick_circumference?: number | null;
          quick_length?: number | null;
          scan_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "batch_scan_entries_batch_session_id_fkey";
            columns: ["batch_session_id"];
            isOneToOne: false;
            referencedRelation: "batch_scan_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "batch_scan_entries_scan_id_fkey";
            columns: ["scan_id"];
            isOneToOne: false;
            referencedRelation: "scans";
            referencedColumns: ["id"];
          },
        ];
      };
      batch_scan_sessions: {
        Row: {
          average_measurements: Json | null;
          batch_type: string | null;
          created_at: string | null;
          id: string;
          interval_minutes: number | null;
          is_complete: boolean | null;
          measurement_variance: Json | null;
          scans_captured: number | null;
          scheduled_end_time: string | null;
          scheduled_start_time: string | null;
          session_name: string | null;
          target_count: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          average_measurements?: Json | null;
          batch_type?: string | null;
          created_at?: string | null;
          id?: string;
          interval_minutes?: number | null;
          is_complete?: boolean | null;
          measurement_variance?: Json | null;
          scans_captured?: number | null;
          scheduled_end_time?: string | null;
          scheduled_start_time?: string | null;
          session_name?: string | null;
          target_count?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          average_measurements?: Json | null;
          batch_type?: string | null;
          created_at?: string | null;
          id?: string;
          interval_minutes?: number | null;
          is_complete?: boolean | null;
          measurement_variance?: Json | null;
          scans_captured?: number | null;
          scheduled_end_time?: string | null;
          scheduled_start_time?: string | null;
          session_name?: string | null;
          target_count?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      beta_testers: {
        Row: {
          created_at: string;
          email: string;
          enabled: boolean;
          expires_at: string | null;
          granted_by: string | null;
          id: string;
          notes: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          enabled?: boolean;
          expires_at?: string | null;
          granted_by?: string | null;
          id?: string;
          notes?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          enabled?: boolean;
          expires_at?: string | null;
          granted_by?: string | null;
          id?: string;
          notes?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      biometric_authentication: {
        Row: {
          biometric_type: string;
          created_at: string | null;
          device_id: string;
          device_name: string | null;
          id: string;
          is_enabled: boolean | null;
          is_registered: boolean | null;
          last_used_at: string | null;
          registered_at: string | null;
          updated_at: string | null;
          usage_count: number | null;
          user_id: string;
        };
        Insert: {
          biometric_type: string;
          created_at?: string | null;
          device_id: string;
          device_name?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          is_registered?: boolean | null;
          last_used_at?: string | null;
          registered_at?: string | null;
          updated_at?: string | null;
          usage_count?: number | null;
          user_id: string;
        };
        Update: {
          biometric_type?: string;
          created_at?: string | null;
          device_id?: string;
          device_name?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          is_registered?: boolean | null;
          last_used_at?: string | null;
          registered_at?: string | null;
          updated_at?: string | null;
          usage_count?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      camera_streams: {
        Row: {
          camera_index: number;
          camera_name: string | null;
          codec: string | null;
          created_at: string | null;
          device_id: string | null;
          device_type: string | null;
          fps: number | null;
          id: string;
          is_active: boolean | null;
          is_recording: boolean | null;
          resolution_height: number | null;
          resolution_width: number | null;
          session_id: string;
          started_at: string | null;
          stopped_at: string | null;
          updated_at: string | null;
          user_id: string;
          video_duration_seconds: number | null;
          video_size_bytes: number | null;
          video_storage_path: string | null;
          video_url: string | null;
        };
        Insert: {
          camera_index: number;
          camera_name?: string | null;
          codec?: string | null;
          created_at?: string | null;
          device_id?: string | null;
          device_type?: string | null;
          fps?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_recording?: boolean | null;
          resolution_height?: number | null;
          resolution_width?: number | null;
          session_id: string;
          started_at?: string | null;
          stopped_at?: string | null;
          updated_at?: string | null;
          user_id: string;
          video_duration_seconds?: number | null;
          video_size_bytes?: number | null;
          video_storage_path?: string | null;
          video_url?: string | null;
        };
        Update: {
          camera_index?: number;
          camera_name?: string | null;
          codec?: string | null;
          created_at?: string | null;
          device_id?: string | null;
          device_type?: string | null;
          fps?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_recording?: boolean | null;
          resolution_height?: number | null;
          resolution_width?: number | null;
          session_id?: string;
          started_at?: string | null;
          stopped_at?: string | null;
          updated_at?: string | null;
          user_id?: string;
          video_duration_seconds?: number | null;
          video_size_bytes?: number | null;
          video_storage_path?: string | null;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "camera_streams_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "multi_camera_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      challenge_checkins: {
        Row: {
          checkin_date: string;
          created_at: string | null;
          id: string;
          metrics: Json | null;
          notes: string | null;
          participant_id: string;
          photo_url: string | null;
        };
        Insert: {
          checkin_date: string;
          created_at?: string | null;
          id?: string;
          metrics?: Json | null;
          notes?: string | null;
          participant_id: string;
          photo_url?: string | null;
        };
        Update: {
          checkin_date?: string;
          created_at?: string | null;
          id?: string;
          metrics?: Json | null;
          notes?: string | null;
          participant_id?: string;
          photo_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "challenge_checkins_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "challenge_participants";
            referencedColumns: ["id"];
          },
        ];
      };
      challenge_participants: {
        Row: {
          challenge_id: string;
          completed: boolean | null;
          completed_at: string | null;
          current_metrics: Json | null;
          id: string;
          joined_at: string | null;
          last_activity_at: string | null;
          progress_data: Json | null;
          progress_percentage: number | null;
          started_at: string | null;
          status: string | null;
          user_id: string;
        };
        Insert: {
          challenge_id: string;
          completed?: boolean | null;
          completed_at?: string | null;
          current_metrics?: Json | null;
          id?: string;
          joined_at?: string | null;
          last_activity_at?: string | null;
          progress_data?: Json | null;
          progress_percentage?: number | null;
          started_at?: string | null;
          status?: string | null;
          user_id: string;
        };
        Update: {
          challenge_id?: string;
          completed?: boolean | null;
          completed_at?: string | null;
          current_metrics?: Json | null;
          id?: string;
          joined_at?: string | null;
          last_activity_at?: string | null;
          progress_data?: Json | null;
          progress_percentage?: number | null;
          started_at?: string | null;
          status?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey";
            columns: ["challenge_id"];
            isOneToOne: false;
            referencedRelation: "community_challenges";
            referencedColumns: ["id"];
          },
        ];
      };
      challenges: {
        Row: {
          badge_id: string | null;
          challenge_type: string;
          completion_count: number | null;
          created_at: string | null;
          description: string;
          duration_days: number;
          end_date: string | null;
          goal_description: string | null;
          id: string;
          is_active: boolean | null;
          is_featured: boolean | null;
          is_premium: boolean | null;
          is_recurring: boolean | null;
          name: string;
          participant_count: number | null;
          reward_description: string | null;
          start_date: string | null;
          success_criteria: Json | null;
          target_metrics: Json | null;
          updated_at: string | null;
        };
        Insert: {
          badge_id?: string | null;
          challenge_type: string;
          completion_count?: number | null;
          created_at?: string | null;
          description: string;
          duration_days: number;
          end_date?: string | null;
          goal_description?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          is_recurring?: boolean | null;
          name: string;
          participant_count?: number | null;
          reward_description?: string | null;
          start_date?: string | null;
          success_criteria?: Json | null;
          target_metrics?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          badge_id?: string | null;
          challenge_type?: string;
          completion_count?: number | null;
          created_at?: string | null;
          description?: string;
          duration_days?: number;
          end_date?: string | null;
          goal_description?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          is_recurring?: boolean | null;
          name?: string;
          participant_count?: number | null;
          reward_description?: string | null;
          start_date?: string | null;
          success_criteria?: Json | null;
          target_metrics?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      cloud_processing_jobs: {
        Row: {
          created_at: string | null;
          error_message: string | null;
          id: string;
          input_data: Json;
          job_type: string;
          priority: number | null;
          processing_completed_at: string | null;
          processing_cost: number | null;
          processing_duration_seconds: number | null;
          processing_started_at: string | null;
          related_session_id: string | null;
          result_data: Json | null;
          result_urls: Json | null;
          status: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          input_data: Json;
          job_type: string;
          priority?: number | null;
          processing_completed_at?: string | null;
          processing_cost?: number | null;
          processing_duration_seconds?: number | null;
          processing_started_at?: string | null;
          related_session_id?: string | null;
          result_data?: Json | null;
          result_urls?: Json | null;
          status?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          input_data?: Json;
          job_type?: string;
          priority?: number | null;
          processing_completed_at?: string | null;
          processing_cost?: number | null;
          processing_duration_seconds?: number | null;
          processing_started_at?: string | null;
          related_session_id?: string | null;
          result_data?: Json | null;
          result_urls?: Json | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      cloud_service_connections: {
        Row: {
          access_token_encrypted: string | null;
          connection_status: string | null;
          created_at: string | null;
          id: string;
          is_connected: boolean | null;
          last_sync_at: string | null;
          permissions_granted: string[] | null;
          refresh_token_encrypted: string | null;
          service_name: string;
          service_type: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          access_token_encrypted?: string | null;
          connection_status?: string | null;
          created_at?: string | null;
          id?: string;
          is_connected?: boolean | null;
          last_sync_at?: string | null;
          permissions_granted?: string[] | null;
          refresh_token_encrypted?: string | null;
          service_name: string;
          service_type: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          access_token_encrypted?: string | null;
          connection_status?: string | null;
          created_at?: string | null;
          id?: string;
          is_connected?: boolean | null;
          last_sync_at?: string | null;
          permissions_granted?: string[] | null;
          refresh_token_encrypted?: string | null;
          service_name?: string;
          service_type?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      coaching_reports: {
        Row: {
          created_at: string | null;
          id: string;
          key_insights: Json;
          metrics: Json;
          period_end: string;
          period_start: string;
          recommendations: string[] | null;
          report_type: string;
          summary: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          key_insights: Json;
          metrics: Json;
          period_end: string;
          period_start: string;
          recommendations?: string[] | null;
          report_type: string;
          summary: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          key_insights?: Json;
          metrics?: Json;
          period_end?: string;
          period_start?: string;
          recommendations?: string[] | null;
          report_type?: string;
          summary?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      coaching_sessions: {
        Row: {
          action_items: string[] | null;
          ai_insights: Json;
          completed: boolean | null;
          created_at: string | null;
          goals_set: Json | null;
          id: string;
          session_type: string;
          updated_at: string | null;
          user_feedback: string | null;
          user_id: string;
        };
        Insert: {
          action_items?: string[] | null;
          ai_insights: Json;
          completed?: boolean | null;
          created_at?: string | null;
          goals_set?: Json | null;
          id?: string;
          session_type: string;
          updated_at?: string | null;
          user_feedback?: string | null;
          user_id: string;
        };
        Update: {
          action_items?: string[] | null;
          ai_insights?: Json;
          completed?: boolean | null;
          created_at?: string | null;
          goals_set?: Json | null;
          id?: string;
          session_type?: string;
          updated_at?: string | null;
          user_feedback?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      community_challenges: {
        Row: {
          challenge_type: string;
          created_at: string | null;
          description: string;
          end_date: string;
          id: string;
          is_active: boolean | null;
          participant_count: number | null;
          rewards: Json | null;
          rules: Json | null;
          start_date: string;
          title: string;
        };
        Insert: {
          challenge_type: string;
          created_at?: string | null;
          description: string;
          end_date: string;
          id?: string;
          is_active?: boolean | null;
          participant_count?: number | null;
          rewards?: Json | null;
          rules?: Json | null;
          start_date: string;
          title: string;
        };
        Update: {
          challenge_type?: string;
          created_at?: string | null;
          description?: string;
          end_date?: string;
          id?: string;
          is_active?: boolean | null;
          participant_count?: number | null;
          rewards?: Json | null;
          rules?: Json | null;
          start_date?: string;
          title?: string;
        };
        Relationships: [];
      };
      community_forums: {
        Row: {
          category: string;
          created_at: string | null;
          description: string | null;
          icon_url: string | null;
          id: string;
          is_active: boolean | null;
          is_nsfw: boolean | null;
          member_count: number | null;
          name: string;
          post_count: number | null;
          updated_at: string | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          description?: string | null;
          icon_url?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_nsfw?: boolean | null;
          member_count?: number | null;
          name: string;
          post_count?: number | null;
          updated_at?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          description?: string | null;
          icon_url?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_nsfw?: boolean | null;
          member_count?: number | null;
          name?: string;
          post_count?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      comparative_analytics: {
        Row: {
          baseline_data: Json;
          comparison_data: Json;
          comparison_group: string | null;
          comparison_period: Json | null;
          comparison_type: string;
          created_at: string | null;
          differences: Json | null;
          id: string;
          insights: string[] | null;
          percentage_changes: Json | null;
          significant_changes: Json | null;
          user_id: string;
        };
        Insert: {
          baseline_data: Json;
          comparison_data: Json;
          comparison_group?: string | null;
          comparison_period?: Json | null;
          comparison_type: string;
          created_at?: string | null;
          differences?: Json | null;
          id?: string;
          insights?: string[] | null;
          percentage_changes?: Json | null;
          significant_changes?: Json | null;
          user_id: string;
        };
        Update: {
          baseline_data?: Json;
          comparison_data?: Json;
          comparison_group?: string | null;
          comparison_period?: Json | null;
          comparison_type?: string;
          created_at?: string | null;
          differences?: Json | null;
          id?: string;
          insights?: string[] | null;
          percentage_changes?: Json | null;
          significant_changes?: Json | null;
          user_id?: string;
        };
        Relationships: [];
      };
      consultation_bookings: {
        Row: {
          amount: number;
          booking_status: string | null;
          booking_type: string;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          completed_at: string | null;
          concerns: string | null;
          confirmed_at: string | null;
          consultation_type: string;
          created_at: string | null;
          currency: string | null;
          duration_minutes: number | null;
          expert_id: string;
          follow_up_required: boolean | null;
          follow_up_scheduled_at: string | null;
          goals: string | null;
          id: string;
          payment_intent_id: string | null;
          payment_status: string | null;
          preferred_approach: string | null;
          scheduled_at: string;
          session_notes: string | null;
          session_recording_url: string | null;
          session_url: string | null;
          started_at: string | null;
          timezone: string | null;
          topic: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          booking_status?: string | null;
          booking_type: string;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          completed_at?: string | null;
          concerns?: string | null;
          confirmed_at?: string | null;
          consultation_type: string;
          created_at?: string | null;
          currency?: string | null;
          duration_minutes?: number | null;
          expert_id: string;
          follow_up_required?: boolean | null;
          follow_up_scheduled_at?: string | null;
          goals?: string | null;
          id?: string;
          payment_intent_id?: string | null;
          payment_status?: string | null;
          preferred_approach?: string | null;
          scheduled_at: string;
          session_notes?: string | null;
          session_recording_url?: string | null;
          session_url?: string | null;
          started_at?: string | null;
          timezone?: string | null;
          topic?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          booking_status?: string | null;
          booking_type?: string;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          completed_at?: string | null;
          concerns?: string | null;
          confirmed_at?: string | null;
          consultation_type?: string;
          created_at?: string | null;
          currency?: string | null;
          duration_minutes?: number | null;
          expert_id?: string;
          follow_up_required?: boolean | null;
          follow_up_scheduled_at?: string | null;
          goals?: string | null;
          id?: string;
          payment_intent_id?: string | null;
          payment_status?: string | null;
          preferred_approach?: string | null;
          scheduled_at?: string;
          session_notes?: string | null;
          session_recording_url?: string | null;
          session_url?: string | null;
          started_at?: string | null;
          timezone?: string | null;
          topic?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "consultation_bookings_expert_id_fkey";
            columns: ["expert_id"];
            isOneToOne: false;
            referencedRelation: "expert_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      custom_reports: {
        Row: {
          chart_types: Json | null;
          color_scheme: Json | null;
          created_at: string | null;
          date_range: Json | null;
          description: string | null;
          generation_count: number | null;
          generation_status: string | null;
          id: string;
          is_favorite: boolean | null;
          is_scheduled: boolean | null;
          is_shared: boolean | null;
          is_template: boolean | null;
          last_generated_at: string | null;
          next_scheduled_at: string | null;
          report_config: Json;
          report_name: string;
          report_type: string;
          schedule_day: number | null;
          schedule_frequency: string | null;
          schedule_time: string | null;
          selected_metrics: string[];
          share_count: number | null;
          share_token: string | null;
          shared_with_doctors: string[] | null;
          shared_with_users: string[] | null;
          theme: string | null;
          updated_at: string | null;
          user_id: string;
          view_count: number | null;
        };
        Insert: {
          chart_types?: Json | null;
          color_scheme?: Json | null;
          created_at?: string | null;
          date_range?: Json | null;
          description?: string | null;
          generation_count?: number | null;
          generation_status?: string | null;
          id?: string;
          is_favorite?: boolean | null;
          is_scheduled?: boolean | null;
          is_shared?: boolean | null;
          is_template?: boolean | null;
          last_generated_at?: string | null;
          next_scheduled_at?: string | null;
          report_config: Json;
          report_name: string;
          report_type: string;
          schedule_day?: number | null;
          schedule_frequency?: string | null;
          schedule_time?: string | null;
          selected_metrics: string[];
          share_count?: number | null;
          share_token?: string | null;
          shared_with_doctors?: string[] | null;
          shared_with_users?: string[] | null;
          theme?: string | null;
          updated_at?: string | null;
          user_id: string;
          view_count?: number | null;
        };
        Update: {
          chart_types?: Json | null;
          color_scheme?: Json | null;
          created_at?: string | null;
          date_range?: Json | null;
          description?: string | null;
          generation_count?: number | null;
          generation_status?: string | null;
          id?: string;
          is_favorite?: boolean | null;
          is_scheduled?: boolean | null;
          is_shared?: boolean | null;
          is_template?: boolean | null;
          last_generated_at?: string | null;
          next_scheduled_at?: string | null;
          report_config?: Json;
          report_name?: string;
          report_type?: string;
          schedule_day?: number | null;
          schedule_frequency?: string | null;
          schedule_time?: string | null;
          selected_metrics?: string[];
          share_count?: number | null;
          share_token?: string | null;
          shared_with_doctors?: string[] | null;
          shared_with_users?: string[] | null;
          theme?: string | null;
          updated_at?: string | null;
          user_id?: string;
          view_count?: number | null;
        };
        Relationships: [];
      };
      daily_health_insights: {
        Row: {
          action_items: string[] | null;
          actionable: boolean | null;
          category: string;
          confidence: number | null;
          content: string;
          created_at: string | null;
          id: string;
          insight_date: string;
          insight_type: string;
          is_read: boolean | null;
          title: string;
          user_id: string;
        };
        Insert: {
          action_items?: string[] | null;
          actionable?: boolean | null;
          category: string;
          confidence?: number | null;
          content: string;
          created_at?: string | null;
          id?: string;
          insight_date?: string;
          insight_type: string;
          is_read?: boolean | null;
          title: string;
          user_id: string;
        };
        Update: {
          action_items?: string[] | null;
          actionable?: boolean | null;
          category?: string;
          confidence?: number | null;
          content?: string;
          created_at?: string | null;
          id?: string;
          insight_date?: string;
          insight_type?: string;
          is_read?: boolean | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      data_usage_transparency: {
        Row: {
          created_at: string | null;
          data_points_used: number | null;
          findings_summary: string | null;
          id: string;
          program_id: string;
          publication_date: string | null;
          publication_title: string | null;
          publication_url: string | null;
        };
        Insert: {
          created_at?: string | null;
          data_points_used?: number | null;
          findings_summary?: string | null;
          id?: string;
          program_id: string;
          publication_date?: string | null;
          publication_title?: string | null;
          publication_url?: string | null;
        };
        Update: {
          created_at?: string | null;
          data_points_used?: number | null;
          findings_summary?: string | null;
          id?: string;
          program_id?: string;
          publication_date?: string | null;
          publication_title?: string | null;
          publication_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "data_usage_transparency_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "research_programs";
            referencedColumns: ["id"];
          },
        ];
      };
      device_tokens: {
        Row: {
          app_version: string | null;
          created_at: string | null;
          device_id: string | null;
          device_name: string | null;
          id: string;
          is_active: boolean | null;
          last_used_at: string | null;
          platform: string;
          token: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          app_version?: string | null;
          created_at?: string | null;
          device_id?: string | null;
          device_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_used_at?: string | null;
          platform: string;
          token: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          app_version?: string | null;
          created_at?: string | null;
          device_id?: string | null;
          device_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_used_at?: string | null;
          platform?: string;
          token?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      diary_analytics: {
        Row: {
          activity_patterns: Json | null;
          analysis_period_end: string;
          analysis_period_start: string;
          average_energy_level: number | null;
          average_mood_score: number | null;
          average_sleep_hours: number | null;
          average_sleep_quality: number | null;
          calculated_at: string | null;
          created_at: string | null;
          energy_trend: string | null;
          entries_with_medications: number | null;
          entries_with_photos: number | null;
          entries_with_symptoms: number | null;
          entries_with_voice_notes: number | null;
          id: string;
          insights: string[] | null;
          mood_trend: string | null;
          most_common_moods: string[] | null;
          most_common_symptoms: Json | null;
          recommendations: string[] | null;
          sleep_trend: string | null;
          total_calories: number | null;
          total_entries: number | null;
          total_exercise_minutes: number | null;
          total_water_intake_ml: number | null;
          user_id: string;
        };
        Insert: {
          activity_patterns?: Json | null;
          analysis_period_end: string;
          analysis_period_start: string;
          average_energy_level?: number | null;
          average_mood_score?: number | null;
          average_sleep_hours?: number | null;
          average_sleep_quality?: number | null;
          calculated_at?: string | null;
          created_at?: string | null;
          energy_trend?: string | null;
          entries_with_medications?: number | null;
          entries_with_photos?: number | null;
          entries_with_symptoms?: number | null;
          entries_with_voice_notes?: number | null;
          id?: string;
          insights?: string[] | null;
          mood_trend?: string | null;
          most_common_moods?: string[] | null;
          most_common_symptoms?: Json | null;
          recommendations?: string[] | null;
          sleep_trend?: string | null;
          total_calories?: number | null;
          total_entries?: number | null;
          total_exercise_minutes?: number | null;
          total_water_intake_ml?: number | null;
          user_id: string;
        };
        Update: {
          activity_patterns?: Json | null;
          analysis_period_end?: string;
          analysis_period_start?: string;
          average_energy_level?: number | null;
          average_mood_score?: number | null;
          average_sleep_hours?: number | null;
          average_sleep_quality?: number | null;
          calculated_at?: string | null;
          created_at?: string | null;
          energy_trend?: string | null;
          entries_with_medications?: number | null;
          entries_with_photos?: number | null;
          entries_with_symptoms?: number | null;
          entries_with_voice_notes?: number | null;
          id?: string;
          insights?: string[] | null;
          mood_trend?: string | null;
          most_common_moods?: string[] | null;
          most_common_symptoms?: Json | null;
          recommendations?: string[] | null;
          sleep_trend?: string | null;
          total_calories?: number | null;
          total_entries?: number | null;
          total_exercise_minutes?: number | null;
          total_water_intake_ml?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      diary_search_index: {
        Row: {
          categories: string[] | null;
          entry_date: string;
          entry_id: string;
          id: string;
          indexed_at: string | null;
          keywords: string[] | null;
          search_vector: unknown;
          searchable_text: string;
          tags: string[] | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          categories?: string[] | null;
          entry_date: string;
          entry_id: string;
          id?: string;
          indexed_at?: string | null;
          keywords?: string[] | null;
          search_vector?: unknown;
          searchable_text: string;
          tags?: string[] | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          categories?: string[] | null;
          entry_date?: string;
          entry_id?: string;
          id?: string;
          indexed_at?: string | null;
          keywords?: string[] | null;
          search_vector?: unknown;
          searchable_text?: string;
          tags?: string[] | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "diary_search_index_entry_id_fkey";
            columns: ["entry_id"];
            isOneToOne: false;
            referencedRelation: "enhanced_diary_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      diary_templates: {
        Row: {
          category: string | null;
          created_at: string | null;
          default_values: Json | null;
          description: string | null;
          id: string;
          is_default: boolean | null;
          is_shared: boolean | null;
          optional_fields: string[] | null;
          required_fields: string[] | null;
          template_config: Json;
          template_name: string;
          updated_at: string | null;
          usage_count: number | null;
          user_id: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          default_values?: Json | null;
          description?: string | null;
          id?: string;
          is_default?: boolean | null;
          is_shared?: boolean | null;
          optional_fields?: string[] | null;
          required_fields?: string[] | null;
          template_config: Json;
          template_name: string;
          updated_at?: string | null;
          usage_count?: number | null;
          user_id?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          default_values?: Json | null;
          description?: string | null;
          id?: string;
          is_default?: boolean | null;
          is_shared?: boolean | null;
          optional_fields?: string[] | null;
          required_fields?: string[] | null;
          template_config?: Json;
          template_name?: string;
          updated_at?: string | null;
          usage_count?: number | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      direct_messages: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          is_read: boolean | null;
          read_at: string | null;
          recipient_id: string;
          sender_id: string;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          read_at?: string | null;
          recipient_id: string;
          sender_id: string;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          read_at?: string | null;
          recipient_id?: string;
          sender_id?: string;
        };
        Relationships: [];
      };
      dlc_age_verifications: {
        Row: {
          adult_content_consent: boolean | null;
          country_code: string | null;
          created_at: string | null;
          date_of_birth: string | null;
          declared_age: number | null;
          id: string;
          ip_address: unknown;
          is_verified: boolean | null;
          terms_accepted: boolean | null;
          terms_accepted_at: string | null;
          terms_version: string | null;
          updated_at: string | null;
          user_agent: string | null;
          user_id: string;
          verification_method: string | null;
          verified_at: string;
        };
        Insert: {
          adult_content_consent?: boolean | null;
          country_code?: string | null;
          created_at?: string | null;
          date_of_birth?: string | null;
          declared_age?: number | null;
          id?: string;
          ip_address?: unknown;
          is_verified?: boolean | null;
          terms_accepted?: boolean | null;
          terms_accepted_at?: string | null;
          terms_version?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id: string;
          verification_method?: string | null;
          verified_at?: string;
        };
        Update: {
          adult_content_consent?: boolean | null;
          country_code?: string | null;
          created_at?: string | null;
          date_of_birth?: string | null;
          declared_age?: number | null;
          id?: string;
          ip_address?: unknown;
          is_verified?: boolean | null;
          terms_accepted?: boolean | null;
          terms_accepted_at?: string | null;
          terms_version?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id?: string;
          verification_method?: string | null;
          verified_at?: string;
        };
        Relationships: [];
      };
      dlc_analytics_events: {
        Row: {
          app_version: string | null;
          created_at: string | null;
          device_id: string | null;
          device_platform: string | null;
          event_data: Json | null;
          event_type: string;
          id: string;
          package_id: string | null;
          session_id: string | null;
          user_id: string | null;
        };
        Insert: {
          app_version?: string | null;
          created_at?: string | null;
          device_id?: string | null;
          device_platform?: string | null;
          event_data?: Json | null;
          event_type: string;
          id?: string;
          package_id?: string | null;
          session_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          app_version?: string | null;
          created_at?: string | null;
          device_id?: string | null;
          device_platform?: string | null;
          event_data?: Json | null;
          event_type?: string;
          id?: string;
          package_id?: string | null;
          session_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      dlc_asset_access_logs: {
        Row: {
          access_type: string;
          asset_path: string;
          created_at: string;
          device_id: string | null;
          device_platform: string | null;
          expires_at: string | null;
          id: string;
          package_id: string;
          user_id: string;
        };
        Insert: {
          access_type?: string;
          asset_path: string;
          created_at?: string;
          device_id?: string | null;
          device_platform?: string | null;
          expires_at?: string | null;
          id?: string;
          package_id: string;
          user_id: string;
        };
        Update: {
          access_type?: string;
          asset_path?: string;
          created_at?: string;
          device_id?: string | null;
          device_platform?: string | null;
          expires_at?: string | null;
          id?: string;
          package_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      dlc_backup_status: {
        Row: {
          backup_location: string | null;
          backup_size_bytes: number | null;
          backup_status: string | null;
          cloud_backup_url: string | null;
          created_at: string | null;
          id: string;
          last_backed_up_at: string | null;
          last_restored_at: string | null;
          local_backup_path: string | null;
          purchase_id: string;
          restore_status: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          backup_location?: string | null;
          backup_size_bytes?: number | null;
          backup_status?: string | null;
          cloud_backup_url?: string | null;
          created_at?: string | null;
          id?: string;
          last_backed_up_at?: string | null;
          last_restored_at?: string | null;
          local_backup_path?: string | null;
          purchase_id: string;
          restore_status?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          backup_location?: string | null;
          backup_size_bytes?: number | null;
          backup_status?: string | null;
          cloud_backup_url?: string | null;
          created_at?: string | null;
          id?: string;
          last_backed_up_at?: string | null;
          last_restored_at?: string | null;
          local_backup_path?: string | null;
          purchase_id?: string;
          restore_status?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dlc_backup_status_purchase_id_fkey";
            columns: ["purchase_id"];
            isOneToOne: false;
            referencedRelation: "dlc_purchases";
            referencedColumns: ["id"];
          },
        ];
      };
      dlc_bundles: {
        Row: {
          bundle_name: string;
          bundle_price: number;
          created_at: string | null;
          description: string;
          discount_percentage: number | null;
          expires_at: string | null;
          id: string;
          is_active: boolean | null;
          is_featured: boolean | null;
          is_limited_time: boolean | null;
          original_price: number | null;
          pack_count: number | null;
          pack_ids: string[];
          preview_description: string | null;
          preview_image_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          bundle_name: string;
          bundle_price: number;
          created_at?: string | null;
          description: string;
          discount_percentage?: number | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_limited_time?: boolean | null;
          original_price?: number | null;
          pack_count?: number | null;
          pack_ids: string[];
          preview_description?: string | null;
          preview_image_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          bundle_name?: string;
          bundle_price?: number;
          created_at?: string | null;
          description?: string;
          discount_percentage?: number | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_limited_time?: boolean | null;
          original_price?: number | null;
          pack_count?: number | null;
          pack_ids?: string[];
          preview_description?: string | null;
          preview_image_url?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      dlc_content_import_job_items: {
        Row: {
          action: string | null;
          created_at: string;
          error_message: string | null;
          id: string;
          item_key: string;
          job_id: string;
          status: string;
        };
        Insert: {
          action?: string | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          item_key: string;
          job_id: string;
          status?: string;
        };
        Update: {
          action?: string | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          item_key?: string;
          job_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dlc_content_import_job_items_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "dlc_content_import_jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      dlc_content_import_jobs: {
        Row: {
          created_at: string;
          created_by: string | null;
          error_message: string | null;
          id: string;
          import_type: string;
          source_file_name: string | null;
          source_sha256: string | null;
          status: string;
          summary: Json;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          error_message?: string | null;
          id?: string;
          import_type: string;
          source_file_name?: string | null;
          source_sha256?: string | null;
          status?: string;
          summary?: Json;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          error_message?: string | null;
          id?: string;
          import_type?: string;
          source_file_name?: string | null;
          source_sha256?: string | null;
          status?: string;
          summary?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      dlc_content_items: {
        Row: {
          content_description: string | null;
          content_name: string;
          content_type: string;
          created_at: string | null;
          download_count: number | null;
          file_size_bytes: number | null;
          file_url: string | null;
          id: string;
          is_active: boolean | null;
          is_downloadable: boolean | null;
          is_preview_available: boolean | null;
          is_streamable: boolean | null;
          metadata: Json | null;
          pack_id: string;
          preview_url: string | null;
          sort_order: number | null;
          thumbnail_url: string | null;
          updated_at: string | null;
          view_count: number | null;
        };
        Insert: {
          content_description?: string | null;
          content_name: string;
          content_type: string;
          created_at?: string | null;
          download_count?: number | null;
          file_size_bytes?: number | null;
          file_url?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_downloadable?: boolean | null;
          is_preview_available?: boolean | null;
          is_streamable?: boolean | null;
          metadata?: Json | null;
          pack_id: string;
          preview_url?: string | null;
          sort_order?: number | null;
          thumbnail_url?: string | null;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Update: {
          content_description?: string | null;
          content_name?: string;
          content_type?: string;
          created_at?: string | null;
          download_count?: number | null;
          file_size_bytes?: number | null;
          file_url?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_downloadable?: boolean | null;
          is_preview_available?: boolean | null;
          is_streamable?: boolean | null;
          metadata?: Json | null;
          pack_id?: string;
          preview_url?: string | null;
          sort_order?: number | null;
          thumbnail_url?: string | null;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "dlc_content_items_pack_id_fkey";
            columns: ["pack_id"];
            isOneToOne: false;
            referencedRelation: "dlc_packs";
            referencedColumns: ["id"];
          },
        ];
      };
      dlc_content_library: {
        Row: {
          access_count: number | null;
          created_at: string | null;
          custom_notes: string | null;
          download_location: string | null;
          folder_name: string | null;
          id: string;
          is_downloaded: boolean | null;
          is_favorite: boolean | null;
          last_accessed_at: string | null;
          purchase_id: string;
          tags: string[] | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          access_count?: number | null;
          created_at?: string | null;
          custom_notes?: string | null;
          download_location?: string | null;
          folder_name?: string | null;
          id?: string;
          is_downloaded?: boolean | null;
          is_favorite?: boolean | null;
          last_accessed_at?: string | null;
          purchase_id: string;
          tags?: string[] | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          access_count?: number | null;
          created_at?: string | null;
          custom_notes?: string | null;
          download_location?: string | null;
          folder_name?: string | null;
          id?: string;
          is_downloaded?: boolean | null;
          is_favorite?: boolean | null;
          last_accessed_at?: string | null;
          purchase_id?: string;
          tags?: string[] | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dlc_content_library_purchase_id_fkey";
            columns: ["purchase_id"];
            isOneToOne: false;
            referencedRelation: "dlc_purchases";
            referencedColumns: ["id"];
          },
        ];
      };
      dlc_content_packages: {
        Row: {
          changelog: Json | null;
          checksum: string;
          created_at: string | null;
          download_url: string;
          id: string;
          is_active: boolean | null;
          release_date: string | null;
          size_bytes: number;
          updated_at: string | null;
          version: string;
        };
        Insert: {
          changelog?: Json | null;
          checksum: string;
          created_at?: string | null;
          download_url: string;
          id?: string;
          is_active?: boolean | null;
          release_date?: string | null;
          size_bytes: number;
          updated_at?: string | null;
          version: string;
        };
        Update: {
          changelog?: Json | null;
          checksum?: string;
          created_at?: string | null;
          download_url?: string;
          id?: string;
          is_active?: boolean | null;
          release_date?: string | null;
          size_bytes?: number;
          updated_at?: string | null;
          version?: string;
        };
        Relationships: [];
      };
      dlc_download_queue: {
        Row: {
          completed_at: string | null;
          content_item_id: string;
          content_type: string;
          download_priority: number | null;
          download_progress: number | null;
          download_speed_bytes_per_sec: number | null;
          download_status: string | null;
          downloaded_bytes: number | null;
          error_message: string | null;
          estimated_time_remaining_seconds: number | null;
          failed_at: string | null;
          file_size_bytes: number | null;
          file_url: string;
          id: string;
          max_retries: number | null;
          purchase_id: string;
          queued_at: string | null;
          retry_count: number | null;
          started_at: string | null;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          content_item_id: string;
          content_type: string;
          download_priority?: number | null;
          download_progress?: number | null;
          download_speed_bytes_per_sec?: number | null;
          download_status?: string | null;
          downloaded_bytes?: number | null;
          error_message?: string | null;
          estimated_time_remaining_seconds?: number | null;
          failed_at?: string | null;
          file_size_bytes?: number | null;
          file_url: string;
          id?: string;
          max_retries?: number | null;
          purchase_id: string;
          queued_at?: string | null;
          retry_count?: number | null;
          started_at?: string | null;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          content_item_id?: string;
          content_type?: string;
          download_priority?: number | null;
          download_progress?: number | null;
          download_speed_bytes_per_sec?: number | null;
          download_status?: string | null;
          downloaded_bytes?: number | null;
          error_message?: string | null;
          estimated_time_remaining_seconds?: number | null;
          failed_at?: string | null;
          file_size_bytes?: number | null;
          file_url?: string;
          id?: string;
          max_retries?: number | null;
          purchase_id?: string;
          queued_at?: string | null;
          retry_count?: number | null;
          started_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dlc_download_queue_purchase_id_fkey";
            columns: ["purchase_id"];
            isOneToOne: false;
            referencedRelation: "dlc_purchases";
            referencedColumns: ["id"];
          },
        ];
      };
      dlc_downloads: {
        Row: {
          checksum_expected: string | null;
          checksum_verified: boolean | null;
          created_at: string | null;
          device_id: string;
          download_completed_at: string | null;
          download_progress: number | null;
          download_speed_bps: number | null;
          download_started_at: string | null;
          download_status: string;
          download_type: string | null;
          download_url: string;
          downloaded_bytes: number | null;
          error_code: string | null;
          error_message: string | null;
          estimated_time_remaining: number | null;
          file_size_bytes: number | null;
          id: string;
          license_id: string | null;
          max_retries: number | null;
          package_id: string;
          retry_count: number | null;
          user_id: string;
        };
        Insert: {
          checksum_expected?: string | null;
          checksum_verified?: boolean | null;
          created_at?: string | null;
          device_id: string;
          download_completed_at?: string | null;
          download_progress?: number | null;
          download_speed_bps?: number | null;
          download_started_at?: string | null;
          download_status: string;
          download_type?: string | null;
          download_url: string;
          downloaded_bytes?: number | null;
          error_code?: string | null;
          error_message?: string | null;
          estimated_time_remaining?: number | null;
          file_size_bytes?: number | null;
          id?: string;
          license_id?: string | null;
          max_retries?: number | null;
          package_id: string;
          retry_count?: number | null;
          user_id: string;
        };
        Update: {
          checksum_expected?: string | null;
          checksum_verified?: boolean | null;
          created_at?: string | null;
          device_id?: string;
          download_completed_at?: string | null;
          download_progress?: number | null;
          download_speed_bps?: number | null;
          download_started_at?: string | null;
          download_status?: string;
          download_type?: string | null;
          download_url?: string;
          downloaded_bytes?: number | null;
          error_code?: string | null;
          error_message?: string | null;
          estimated_time_remaining?: number | null;
          file_size_bytes?: number | null;
          id?: string;
          license_id?: string | null;
          max_retries?: number | null;
          package_id?: string;
          retry_count?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dlc_downloads_license_id_fkey";
            columns: ["license_id"];
            isOneToOne: false;
            referencedRelation: "dlc_licenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dlc_downloads_package_id_fkey";
            columns: ["package_id"];
            isOneToOne: false;
            referencedRelation: "dlc_packages";
            referencedColumns: ["package_id"];
          },
        ];
      };
      dlc_gift_codes: {
        Row: {
          code: string;
          expires_at: string | null;
          gift_message: string | null;
          id: string;
          is_active: boolean | null;
          is_redeemed: boolean | null;
          package_id: string;
          purchase_price: number | null;
          purchased_at: string;
          purchased_by: string | null;
          recipient_email: string | null;
          redeemed_at: string | null;
          redeemed_by: string | null;
          sender_id: string | null;
        };
        Insert: {
          code: string;
          expires_at?: string | null;
          gift_message?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_redeemed?: boolean | null;
          package_id: string;
          purchase_price?: number | null;
          purchased_at?: string;
          purchased_by?: string | null;
          recipient_email?: string | null;
          redeemed_at?: string | null;
          redeemed_by?: string | null;
          sender_id?: string | null;
        };
        Update: {
          code?: string;
          expires_at?: string | null;
          gift_message?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_redeemed?: boolean | null;
          package_id?: string;
          purchase_price?: number | null;
          purchased_at?: string;
          purchased_by?: string | null;
          recipient_email?: string | null;
          redeemed_at?: string | null;
          redeemed_by?: string | null;
          sender_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "dlc_gift_codes_package_id_fkey";
            columns: ["package_id"];
            isOneToOne: false;
            referencedRelation: "dlc_packages";
            referencedColumns: ["package_id"];
          },
        ];
      };
      dlc_installations: {
        Row: {
          app_version: string | null;
          cached_content_bytes: number | null;
          content_version: string | null;
          created_at: string | null;
          device_id: string;
          device_model: string | null;
          device_platform: string | null;
          id: string;
          install_date: string;
          install_source: string | null;
          installed_version: string;
          is_corrupted: boolean | null;
          is_installed: boolean | null;
          last_integrity_check: string | null;
          last_used_at: string | null;
          license_id: string;
          package_id: string;
          storage_used_bytes: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          app_version?: string | null;
          cached_content_bytes?: number | null;
          content_version?: string | null;
          created_at?: string | null;
          device_id: string;
          device_model?: string | null;
          device_platform?: string | null;
          id?: string;
          install_date?: string;
          install_source?: string | null;
          installed_version: string;
          is_corrupted?: boolean | null;
          is_installed?: boolean | null;
          last_integrity_check?: string | null;
          last_used_at?: string | null;
          license_id: string;
          package_id: string;
          storage_used_bytes?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          app_version?: string | null;
          cached_content_bytes?: number | null;
          content_version?: string | null;
          created_at?: string | null;
          device_id?: string;
          device_model?: string | null;
          device_platform?: string | null;
          id?: string;
          install_date?: string;
          install_source?: string | null;
          installed_version?: string;
          is_corrupted?: boolean | null;
          is_installed?: boolean | null;
          last_integrity_check?: string | null;
          last_used_at?: string | null;
          license_id?: string;
          package_id?: string;
          storage_used_bytes?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dlc_installations_license_id_fkey";
            columns: ["license_id"];
            isOneToOne: false;
            referencedRelation: "dlc_licenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dlc_installations_package_id_fkey";
            columns: ["package_id"];
            isOneToOne: false;
            referencedRelation: "dlc_packages";
            referencedColumns: ["package_id"];
          },
        ];
      };
      dlc_installed_content: {
        Row: {
          checksum: string | null;
          content_item_id: string | null;
          file_path: string | null;
          file_size_bytes: number | null;
          id: string;
          installed_at: string | null;
          installed_version: string;
          is_valid: boolean | null;
          last_verified_at: string | null;
          pack_id: string;
          purchase_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          checksum?: string | null;
          content_item_id?: string | null;
          file_path?: string | null;
          file_size_bytes?: number | null;
          id?: string;
          installed_at?: string | null;
          installed_version: string;
          is_valid?: boolean | null;
          last_verified_at?: string | null;
          pack_id: string;
          purchase_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          checksum?: string | null;
          content_item_id?: string | null;
          file_path?: string | null;
          file_size_bytes?: number | null;
          id?: string;
          installed_at?: string | null;
          installed_version?: string;
          is_valid?: boolean | null;
          last_verified_at?: string | null;
          pack_id?: string;
          purchase_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dlc_installed_content_content_item_id_fkey";
            columns: ["content_item_id"];
            isOneToOne: false;
            referencedRelation: "dlc_content_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dlc_installed_content_pack_id_fkey";
            columns: ["pack_id"];
            isOneToOne: false;
            referencedRelation: "dlc_packs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dlc_installed_content_purchase_id_fkey";
            columns: ["purchase_id"];
            isOneToOne: false;
            referencedRelation: "dlc_purchases";
            referencedColumns: ["id"];
          },
        ];
      };
      dlc_license_devices: {
        Row: {
          device_fingerprint: string | null;
          device_id: string;
          device_model: string | null;
          device_name: string | null;
          device_platform: string | null;
          id: string;
          is_active: boolean | null;
          is_primary: boolean | null;
          last_used_at: string | null;
          last_validation_at: string | null;
          license_id: string;
          registered_at: string | null;
          user_id: string | null;
        };
        Insert: {
          device_fingerprint?: string | null;
          device_id: string;
          device_model?: string | null;
          device_name?: string | null;
          device_platform?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_primary?: boolean | null;
          last_used_at?: string | null;
          last_validation_at?: string | null;
          license_id: string;
          registered_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          device_fingerprint?: string | null;
          device_id?: string;
          device_model?: string | null;
          device_name?: string | null;
          device_platform?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_primary?: boolean | null;
          last_used_at?: string | null;
          last_validation_at?: string | null;
          license_id?: string;
          registered_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "dlc_license_devices_license_id_fkey";
            columns: ["license_id"];
            isOneToOne: false;
            referencedRelation: "dlc_licenses";
            referencedColumns: ["id"];
          },
        ];
      };
      dlc_licenses: {
        Row: {
          activated_at: string | null;
          auto_renew: boolean | null;
          content_version: string | null;
          created_at: string | null;
          deactivated_at: string | null;
          device_id: string | null;
          expiration_date: string | null;
          grace_period_until: string | null;
          id: string;
          is_active: boolean | null;
          last_online_validation: string | null;
          license_key: string;
          license_type: string;
          max_devices: number | null;
          offline_cache_expires_at: string | null;
          package_id: string;
          payment_id: string | null;
          payment_provider: string | null;
          purchase_currency: string | null;
          purchase_date: string;
          purchase_price: number | null;
          refund_reason: string | null;
          refunded_at: string | null;
          signature: string | null;
          subscription_end: string | null;
          subscription_pause_until: string | null;
          subscription_start: string | null;
          subscription_status: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          activated_at?: string | null;
          auto_renew?: boolean | null;
          content_version?: string | null;
          created_at?: string | null;
          deactivated_at?: string | null;
          device_id?: string | null;
          expiration_date?: string | null;
          grace_period_until?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_online_validation?: string | null;
          license_key: string;
          license_type: string;
          max_devices?: number | null;
          offline_cache_expires_at?: string | null;
          package_id: string;
          payment_id?: string | null;
          payment_provider?: string | null;
          purchase_currency?: string | null;
          purchase_date?: string;
          purchase_price?: number | null;
          refund_reason?: string | null;
          refunded_at?: string | null;
          signature?: string | null;
          subscription_end?: string | null;
          subscription_pause_until?: string | null;
          subscription_start?: string | null;
          subscription_status?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          activated_at?: string | null;
          auto_renew?: boolean | null;
          content_version?: string | null;
          created_at?: string | null;
          deactivated_at?: string | null;
          device_id?: string | null;
          expiration_date?: string | null;
          grace_period_until?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_online_validation?: string | null;
          license_key?: string;
          license_type?: string;
          max_devices?: number | null;
          offline_cache_expires_at?: string | null;
          package_id?: string;
          payment_id?: string | null;
          payment_provider?: string | null;
          purchase_currency?: string | null;
          purchase_date?: string;
          purchase_price?: number | null;
          refund_reason?: string | null;
          refunded_at?: string | null;
          signature?: string | null;
          subscription_end?: string | null;
          subscription_pause_until?: string | null;
          subscription_start?: string | null;
          subscription_status?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dlc_licenses_package_id_fkey";
            columns: ["package_id"];
            isOneToOne: false;
            referencedRelation: "dlc_packages";
            referencedColumns: ["package_id"];
          },
        ];
      };
      dlc_package_keyring: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          key_ciphertext: string;
          key_iv: string;
          key_version: number;
          package_id: string;
          rotated_at: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          key_ciphertext: string;
          key_iv: string;
          key_version?: number;
          package_id: string;
          rotated_at?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          key_ciphertext?: string;
          key_iv?: string;
          key_version?: number;
          package_id?: string;
          rotated_at?: string | null;
        };
        Relationships: [];
      };
      dlc_packages: {
        Row: {
          checksum_sha256: string | null;
          content_changelog: Json | null;
          content_rating: string | null;
          content_version: string | null;
          created_at: string | null;
          display_order: number | null;
          download_size_bytes: number | null;
          download_url: string | null;
          encryption_key_id: string | null;
          features: Json;
          full_description: string | null;
          id: string;
          included_packages: string[] | null;
          is_active: boolean | null;
          is_featured: boolean | null;
          localized_descriptions: Json | null;
          localized_names: Json | null;
          marketing_tagline: string | null;
          max_app_version: string | null;
          min_app_version: string | null;
          package_id: string;
          package_name: string;
          package_type: string;
          preview_images: string[] | null;
          preview_video_url: string | null;
          price_type: string;
          price_usd: number;
          regional_pricing: Json | null;
          safe_description: string;
          stripe_price_id: string | null;
          stripe_product_id: string | null;
          subscription_interval: string | null;
          updated_at: string | null;
          version: string;
        };
        Insert: {
          checksum_sha256?: string | null;
          content_changelog?: Json | null;
          content_rating?: string | null;
          content_version?: string | null;
          created_at?: string | null;
          display_order?: number | null;
          download_size_bytes?: number | null;
          download_url?: string | null;
          encryption_key_id?: string | null;
          features?: Json;
          full_description?: string | null;
          id?: string;
          included_packages?: string[] | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          localized_descriptions?: Json | null;
          localized_names?: Json | null;
          marketing_tagline?: string | null;
          max_app_version?: string | null;
          min_app_version?: string | null;
          package_id: string;
          package_name: string;
          package_type: string;
          preview_images?: string[] | null;
          preview_video_url?: string | null;
          price_type: string;
          price_usd: number;
          regional_pricing?: Json | null;
          safe_description: string;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          subscription_interval?: string | null;
          updated_at?: string | null;
          version?: string;
        };
        Update: {
          checksum_sha256?: string | null;
          content_changelog?: Json | null;
          content_rating?: string | null;
          content_version?: string | null;
          created_at?: string | null;
          display_order?: number | null;
          download_size_bytes?: number | null;
          download_url?: string | null;
          encryption_key_id?: string | null;
          features?: Json;
          full_description?: string | null;
          id?: string;
          included_packages?: string[] | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          localized_descriptions?: Json | null;
          localized_names?: Json | null;
          marketing_tagline?: string | null;
          max_app_version?: string | null;
          min_app_version?: string | null;
          package_id?: string;
          package_name?: string;
          package_type?: string;
          preview_images?: string[] | null;
          preview_video_url?: string | null;
          price_type?: string;
          price_usd?: number;
          regional_pricing?: Json | null;
          safe_description?: string;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          subscription_interval?: string | null;
          updated_at?: string | null;
          version?: string;
        };
        Relationships: [];
      };
      dlc_packs: {
        Row: {
          average_rating: number | null;
          base_pack_id: string | null;
          category: string | null;
          content_items: Json;
          content_rating: string | null;
          created_at: string | null;
          currency: string | null;
          description: string;
          difficulty_level: string | null;
          id: string;
          is_active: boolean | null;
          is_featured: boolean | null;
          is_standalone: boolean | null;
          is_subscription: boolean | null;
          item_count: number | null;
          pack_name: string;
          pack_type: string;
          preview_description: string | null;
          preview_images: string[] | null;
          preview_video_url: string | null;
          price: number;
          rating_count: number | null;
          release_date: string | null;
          requires_base_pack: boolean | null;
          revenue_total: number | null;
          sales_count: number | null;
          subscription_duration_days: number | null;
          tags: string[] | null;
          updated_at: string | null;
        };
        Insert: {
          average_rating?: number | null;
          base_pack_id?: string | null;
          category?: string | null;
          content_items: Json;
          content_rating?: string | null;
          created_at?: string | null;
          currency?: string | null;
          description: string;
          difficulty_level?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_standalone?: boolean | null;
          is_subscription?: boolean | null;
          item_count?: number | null;
          pack_name: string;
          pack_type: string;
          preview_description?: string | null;
          preview_images?: string[] | null;
          preview_video_url?: string | null;
          price: number;
          rating_count?: number | null;
          release_date?: string | null;
          requires_base_pack?: boolean | null;
          revenue_total?: number | null;
          sales_count?: number | null;
          subscription_duration_days?: number | null;
          tags?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          average_rating?: number | null;
          base_pack_id?: string | null;
          category?: string | null;
          content_items?: Json;
          content_rating?: string | null;
          created_at?: string | null;
          currency?: string | null;
          description?: string;
          difficulty_level?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_standalone?: boolean | null;
          is_subscription?: boolean | null;
          item_count?: number | null;
          pack_name?: string;
          pack_type?: string;
          preview_description?: string | null;
          preview_images?: string[] | null;
          preview_video_url?: string | null;
          price?: number;
          rating_count?: number | null;
          release_date?: string | null;
          requires_base_pack?: boolean | null;
          revenue_total?: number | null;
          sales_count?: number | null;
          subscription_duration_days?: number | null;
          tags?: string[] | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "dlc_packs_base_pack_id_fkey";
            columns: ["base_pack_id"];
            isOneToOne: false;
            referencedRelation: "dlc_packs";
            referencedColumns: ["id"];
          },
        ];
      };
      dlc_promo_code_usage: {
        Row: {
          discount_applied: number;
          id: string;
          promo_code_id: string;
          purchase_id: string | null;
          used_at: string | null;
          user_id: string;
        };
        Insert: {
          discount_applied: number;
          id?: string;
          promo_code_id: string;
          purchase_id?: string | null;
          used_at?: string | null;
          user_id: string;
        };
        Update: {
          discount_applied?: number;
          id?: string;
          promo_code_id?: string;
          purchase_id?: string | null;
          used_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dlc_promo_code_usage_promo_code_id_fkey";
            columns: ["promo_code_id"];
            isOneToOne: false;
            referencedRelation: "dlc_promo_codes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dlc_promo_code_usage_purchase_id_fkey";
            columns: ["purchase_id"];
            isOneToOne: false;
            referencedRelation: "dlc_purchases";
            referencedColumns: ["id"];
          },
        ];
      };
      dlc_promo_codes: {
        Row: {
          affiliate_commission: number | null;
          affiliate_id: string | null;
          applies_to: string[];
          campaign_name: string | null;
          code: string;
          created_at: string | null;
          current_redemptions: number | null;
          discount_type: string;
          discount_value: number;
          expires_at: string | null;
          id: string;
          is_active: boolean | null;
          max_per_user: number | null;
          max_redemptions: number | null;
          valid_from: string;
          valid_until: string | null;
        };
        Insert: {
          affiliate_commission?: number | null;
          affiliate_id?: string | null;
          applies_to: string[];
          campaign_name?: string | null;
          code: string;
          created_at?: string | null;
          current_redemptions?: number | null;
          discount_type: string;
          discount_value: number;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_per_user?: number | null;
          max_redemptions?: number | null;
          valid_from?: string;
          valid_until?: string | null;
        };
        Update: {
          affiliate_commission?: number | null;
          affiliate_id?: string | null;
          applies_to?: string[];
          campaign_name?: string | null;
          code?: string;
          created_at?: string | null;
          current_redemptions?: number | null;
          discount_type?: string;
          discount_value?: number;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_per_user?: number | null;
          max_redemptions?: number | null;
          valid_from?: string;
          valid_until?: string | null;
        };
        Relationships: [];
      };
      dlc_promo_redemptions: {
        Row: {
          discount_applied: number;
          final_price: number;
          id: string;
          original_price: number;
          package_id: string;
          promo_code_id: string;
          redeemed_at: string;
          user_id: string;
        };
        Insert: {
          discount_applied: number;
          final_price: number;
          id?: string;
          original_price: number;
          package_id: string;
          promo_code_id: string;
          redeemed_at?: string;
          user_id: string;
        };
        Update: {
          discount_applied?: number;
          final_price?: number;
          id?: string;
          original_price?: number;
          package_id?: string;
          promo_code_id?: string;
          redeemed_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dlc_promo_redemptions_package_id_fkey";
            columns: ["package_id"];
            isOneToOne: false;
            referencedRelation: "dlc_packages";
            referencedColumns: ["package_id"];
          },
          {
            foreignKeyName: "dlc_promo_redemptions_promo_code_id_fkey";
            columns: ["promo_code_id"];
            isOneToOne: false;
            referencedRelation: "dlc_promo_codes";
            referencedColumns: ["id"];
          },
        ];
      };
      dlc_purchases: {
        Row: {
          access_expires_at: string | null;
          access_granted_at: string | null;
          download_enabled: boolean | null;
          id: string;
          is_active: boolean | null;
          pack_id: string;
          payment_intent_id: string | null;
          price_paid: number;
          purchase_type: string | null;
          purchased_at: string | null;
          stream_enabled: boolean | null;
          user_id: string;
        };
        Insert: {
          access_expires_at?: string | null;
          access_granted_at?: string | null;
          download_enabled?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          pack_id: string;
          payment_intent_id?: string | null;
          price_paid: number;
          purchase_type?: string | null;
          purchased_at?: string | null;
          stream_enabled?: boolean | null;
          user_id: string;
        };
        Update: {
          access_expires_at?: string | null;
          access_granted_at?: string | null;
          download_enabled?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          pack_id?: string;
          payment_intent_id?: string | null;
          price_paid?: number;
          purchase_type?: string | null;
          purchased_at?: string | null;
          stream_enabled?: boolean | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dlc_purchases_pack_id_fkey";
            columns: ["pack_id"];
            isOneToOne: false;
            referencedRelation: "dlc_packs";
            referencedColumns: ["id"];
          },
        ];
      };
      dlc_ratings: {
        Row: {
          bundle_id: string | null;
          created_at: string | null;
          helpful_count: number | null;
          id: string;
          is_approved: boolean | null;
          is_featured: boolean | null;
          is_verified_purchase: boolean | null;
          pack_id: string | null;
          rating: number;
          review_text: string | null;
          review_title: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          bundle_id?: string | null;
          created_at?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          is_verified_purchase?: boolean | null;
          pack_id?: string | null;
          rating: number;
          review_text?: string | null;
          review_title?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          bundle_id?: string | null;
          created_at?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          is_verified_purchase?: boolean | null;
          pack_id?: string | null;
          rating?: number;
          review_text?: string | null;
          review_title?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dlc_ratings_bundle_id_fkey";
            columns: ["bundle_id"];
            isOneToOne: false;
            referencedRelation: "dlc_bundles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dlc_ratings_pack_id_fkey";
            columns: ["pack_id"];
            isOneToOne: false;
            referencedRelation: "dlc_packs";
            referencedColumns: ["id"];
          },
        ];
      };
      dlc_streaming_sessions: {
        Row: {
          average_bitrate: number | null;
          buffering_count: number | null;
          content_item_id: string;
          content_type: string;
          created_at: string | null;
          id: string;
          purchase_id: string;
          quality: string | null;
          quality_changes: number | null;
          session_ended_at: string | null;
          session_started_at: string | null;
          total_watch_time_seconds: number | null;
          user_id: string;
        };
        Insert: {
          average_bitrate?: number | null;
          buffering_count?: number | null;
          content_item_id: string;
          content_type: string;
          created_at?: string | null;
          id?: string;
          purchase_id: string;
          quality?: string | null;
          quality_changes?: number | null;
          session_ended_at?: string | null;
          session_started_at?: string | null;
          total_watch_time_seconds?: number | null;
          user_id: string;
        };
        Update: {
          average_bitrate?: number | null;
          buffering_count?: number | null;
          content_item_id?: string;
          content_type?: string;
          created_at?: string | null;
          id?: string;
          purchase_id?: string;
          quality?: string | null;
          quality_changes?: number | null;
          session_ended_at?: string | null;
          session_started_at?: string | null;
          total_watch_time_seconds?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dlc_streaming_sessions_purchase_id_fkey";
            columns: ["purchase_id"];
            isOneToOne: false;
            referencedRelation: "dlc_purchases";
            referencedColumns: ["id"];
          },
        ];
      };
      dlc_update_sources: {
        Row: {
          acknowledged_at: string | null;
          available_update_version: string | null;
          created_at: string | null;
          current_app_version: string | null;
          current_update_source: string;
          device_id: string;
          id: string;
          last_update_check: string | null;
          last_update_installed: string | null;
          original_install_source: string | null;
          source_change_reason: string | null;
          source_changed_at: string | null;
          update_source_acknowledged: boolean | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          available_update_version?: string | null;
          created_at?: string | null;
          current_app_version?: string | null;
          current_update_source: string;
          device_id: string;
          id?: string;
          last_update_check?: string | null;
          last_update_installed?: string | null;
          original_install_source?: string | null;
          source_change_reason?: string | null;
          source_changed_at?: string | null;
          update_source_acknowledged?: boolean | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          acknowledged_at?: string | null;
          available_update_version?: string | null;
          created_at?: string | null;
          current_app_version?: string | null;
          current_update_source?: string;
          device_id?: string;
          id?: string;
          last_update_check?: string | null;
          last_update_installed?: string | null;
          original_install_source?: string | null;
          source_change_reason?: string | null;
          source_changed_at?: string | null;
          update_source_acknowledged?: boolean | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      dlc_updates: {
        Row: {
          changelog: string[] | null;
          created_at: string | null;
          id: string;
          is_available: boolean | null;
          is_required: boolean | null;
          modified_content_items: Json | null;
          new_content_items: Json | null;
          pack_id: string;
          release_date: string | null;
          removed_content_items: string[] | null;
          update_file_size_bytes: number | null;
          update_file_url: string | null;
          update_type: string | null;
          version_number: string;
        };
        Insert: {
          changelog?: string[] | null;
          created_at?: string | null;
          id?: string;
          is_available?: boolean | null;
          is_required?: boolean | null;
          modified_content_items?: Json | null;
          new_content_items?: Json | null;
          pack_id: string;
          release_date?: string | null;
          removed_content_items?: string[] | null;
          update_file_size_bytes?: number | null;
          update_file_url?: string | null;
          update_type?: string | null;
          version_number: string;
        };
        Update: {
          changelog?: string[] | null;
          created_at?: string | null;
          id?: string;
          is_available?: boolean | null;
          is_required?: boolean | null;
          modified_content_items?: Json | null;
          new_content_items?: Json | null;
          pack_id?: string;
          release_date?: string | null;
          removed_content_items?: string[] | null;
          update_file_size_bytes?: number | null;
          update_file_url?: string | null;
          update_type?: string | null;
          version_number?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dlc_updates_pack_id_fkey";
            columns: ["pack_id"];
            isOneToOne: false;
            referencedRelation: "dlc_packs";
            referencedColumns: ["id"];
          },
        ];
      };
      dlc_wishlist: {
        Row: {
          added_at: string | null;
          bundle_id: string | null;
          id: string;
          notes: string | null;
          notify_on_release: boolean | null;
          notify_on_sale: boolean | null;
          pack_id: string | null;
          priority: number | null;
          user_id: string;
        };
        Insert: {
          added_at?: string | null;
          bundle_id?: string | null;
          id?: string;
          notes?: string | null;
          notify_on_release?: boolean | null;
          notify_on_sale?: boolean | null;
          pack_id?: string | null;
          priority?: number | null;
          user_id: string;
        };
        Update: {
          added_at?: string | null;
          bundle_id?: string | null;
          id?: string;
          notes?: string | null;
          notify_on_release?: boolean | null;
          notify_on_sale?: boolean | null;
          pack_id?: string | null;
          priority?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dlc_wishlist_bundle_id_fkey";
            columns: ["bundle_id"];
            isOneToOne: false;
            referencedRelation: "dlc_bundles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dlc_wishlist_pack_id_fkey";
            columns: ["pack_id"];
            isOneToOne: false;
            referencedRelation: "dlc_packs";
            referencedColumns: ["id"];
          },
        ];
      };
      dlc_wishlist_packages: {
        Row: {
          added_at: string | null;
          id: string;
          notes: string | null;
          notify_on_release: boolean | null;
          notify_on_sale: boolean | null;
          package_id: string;
          priority: number | null;
          user_id: string;
        };
        Insert: {
          added_at?: string | null;
          id?: string;
          notes?: string | null;
          notify_on_release?: boolean | null;
          notify_on_sale?: boolean | null;
          package_id: string;
          priority?: number | null;
          user_id: string;
        };
        Update: {
          added_at?: string | null;
          id?: string;
          notes?: string | null;
          notify_on_release?: boolean | null;
          notify_on_sale?: boolean | null;
          package_id?: string;
          priority?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dlc_wishlist_packages_package_id_fkey";
            columns: ["package_id"];
            isOneToOne: false;
            referencedRelation: "dlc_packages";
            referencedColumns: ["package_id"];
          },
        ];
      };
      e2e_encryption_keys: {
        Row: {
          algorithm: string | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          is_recovery: boolean | null;
          key_encrypted: string;
          key_hash: string;
          key_type: string;
          key_version: number | null;
          last_used_at: string | null;
          rotated_at: string | null;
          user_id: string;
        };
        Insert: {
          algorithm?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_recovery?: boolean | null;
          key_encrypted: string;
          key_hash: string;
          key_type: string;
          key_version?: number | null;
          last_used_at?: string | null;
          rotated_at?: string | null;
          user_id: string;
        };
        Update: {
          algorithm?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_recovery?: boolean | null;
          key_encrypted?: string;
          key_hash?: string;
          key_type?: string;
          key_version?: number | null;
          last_used_at?: string | null;
          rotated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      edge_rate_limits: {
        Row: {
          created_at: string | null;
          endpoint: string;
          id: string;
          identifier: string;
          max_requests: number;
          request_count: number;
          updated_at: string | null;
          window_end: string;
          window_start: string;
        };
        Insert: {
          created_at?: string | null;
          endpoint: string;
          id?: string;
          identifier: string;
          max_requests?: number;
          request_count?: number;
          updated_at?: string | null;
          window_end: string;
          window_start: string;
        };
        Update: {
          created_at?: string | null;
          endpoint?: string;
          id?: string;
          identifier?: string;
          max_requests?: number;
          request_count?: number;
          updated_at?: string | null;
          window_end?: string;
          window_start?: string;
        };
        Relationships: [];
      };
      education_bookmarks: {
        Row: {
          content_id: string;
          content_type: string;
          created_at: string | null;
          id: string;
          notes: string | null;
          user_id: string;
        };
        Insert: {
          content_id: string;
          content_type: string;
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          user_id: string;
        };
        Update: {
          content_id?: string;
          content_type?: string;
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      education_expert_content: {
        Row: {
          content_text: string | null;
          content_type: string | null;
          created_at: string | null;
          description: string | null;
          duration_minutes: number | null;
          expert_bio: string | null;
          expert_credentials: string | null;
          expert_image_url: string | null;
          expert_name: string;
          expert_title: string | null;
          id: string;
          is_premium: boolean | null;
          published_at: string | null;
          tags: string[] | null;
          thumbnail_url: string | null;
          title: string;
          topics: string[] | null;
          transcript: string | null;
          updated_at: string | null;
          video_url: string | null;
          view_count: number | null;
        };
        Insert: {
          content_text?: string | null;
          content_type?: string | null;
          created_at?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          expert_bio?: string | null;
          expert_credentials?: string | null;
          expert_image_url?: string | null;
          expert_name: string;
          expert_title?: string | null;
          id?: string;
          is_premium?: boolean | null;
          published_at?: string | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title: string;
          topics?: string[] | null;
          transcript?: string | null;
          updated_at?: string | null;
          video_url?: string | null;
          view_count?: number | null;
        };
        Update: {
          content_text?: string | null;
          content_type?: string | null;
          created_at?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          expert_bio?: string | null;
          expert_credentials?: string | null;
          expert_image_url?: string | null;
          expert_name?: string;
          expert_title?: string | null;
          id?: string;
          is_premium?: boolean | null;
          published_at?: string | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title?: string;
          topics?: string[] | null;
          transcript?: string | null;
          updated_at?: string | null;
          video_url?: string | null;
          view_count?: number | null;
        };
        Relationships: [];
      };
      education_interactive_content: {
        Row: {
          answers: Json | null;
          average_score: number | null;
          completion_count: number | null;
          content_type: string;
          created_at: string | null;
          description: string | null;
          id: string;
          module_id: string | null;
          passing_score: number | null;
          questions: Json;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          answers?: Json | null;
          average_score?: number | null;
          completion_count?: number | null;
          content_type: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          module_id?: string | null;
          passing_score?: number | null;
          questions: Json;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          answers?: Json | null;
          average_score?: number | null;
          completion_count?: number | null;
          content_type?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          module_id?: string | null;
          passing_score?: number | null;
          questions?: Json;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "education_interactive_content_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "sexual_health_education_modules";
            referencedColumns: ["id"];
          },
        ];
      };
      education_qa: {
        Row: {
          answer: string;
          answered_by: string | null;
          category: string | null;
          created_at: string | null;
          expert_verified: boolean | null;
          helpful_count: number | null;
          id: string;
          not_helpful_count: number | null;
          question: string;
          related_module_ids: string[] | null;
          source_url: string | null;
          tags: string[] | null;
          updated_at: string | null;
          view_count: number | null;
        };
        Insert: {
          answer: string;
          answered_by?: string | null;
          category?: string | null;
          created_at?: string | null;
          expert_verified?: boolean | null;
          helpful_count?: number | null;
          id?: string;
          not_helpful_count?: number | null;
          question: string;
          related_module_ids?: string[] | null;
          source_url?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Update: {
          answer?: string;
          answered_by?: string | null;
          category?: string | null;
          created_at?: string | null;
          expert_verified?: boolean | null;
          helpful_count?: number | null;
          id?: string;
          not_helpful_count?: number | null;
          question?: string;
          related_module_ids?: string[] | null;
          source_url?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Relationships: [];
      };
      education_qa_interactions: {
        Row: {
          created_at: string | null;
          id: string;
          qa_id: string;
          user_id: string;
          user_question: string | null;
          was_helpful: boolean | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          qa_id: string;
          user_id: string;
          user_question?: string | null;
          was_helpful?: boolean | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          qa_id?: string;
          user_id?: string;
          user_question?: string | null;
          was_helpful?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "education_qa_interactions_qa_id_fkey";
            columns: ["qa_id"];
            isOneToOne: false;
            referencedRelation: "education_qa";
            referencedColumns: ["id"];
          },
        ];
      };
      education_research_updates: {
        Row: {
          category: string | null;
          created_at: string | null;
          full_article: string | null;
          id: string;
          published_date: string | null;
          relevance_score: number | null;
          source_name: string | null;
          source_url: string | null;
          summary: string;
          tags: string[] | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          full_article?: string | null;
          id?: string;
          published_date?: string | null;
          relevance_score?: number | null;
          source_name?: string | null;
          source_url?: string | null;
          summary: string;
          tags?: string[] | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          full_article?: string | null;
          id?: string;
          published_date?: string | null;
          relevance_score?: number | null;
          source_name?: string | null;
          source_url?: string | null;
          summary?: string;
          tags?: string[] | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      education_user_progress: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          id: string;
          is_completed: boolean | null;
          last_accessed_at: string | null;
          module_id: string;
          progress_percentage: number | null;
          quiz_attempts: number | null;
          quiz_completed_at: string | null;
          quiz_score: number | null;
          time_spent_minutes: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          is_completed?: boolean | null;
          last_accessed_at?: string | null;
          module_id: string;
          progress_percentage?: number | null;
          quiz_attempts?: number | null;
          quiz_completed_at?: string | null;
          quiz_score?: number | null;
          time_spent_minutes?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          is_completed?: boolean | null;
          last_accessed_at?: string | null;
          module_id?: string;
          progress_percentage?: number | null;
          quiz_attempts?: number | null;
          quiz_completed_at?: string | null;
          quiz_score?: number | null;
          time_spent_minutes?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "education_user_progress_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "sexual_health_education_modules";
            referencedColumns: ["id"];
          },
        ];
      };
      email_analytics: {
        Row: {
          campaign_id: string | null;
          created_at: string | null;
          email_address: string;
          event_data: Json | null;
          event_type: string;
          id: string;
          user_id: string | null;
        };
        Insert: {
          campaign_id?: string | null;
          created_at?: string | null;
          email_address: string;
          event_data?: Json | null;
          event_type: string;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          campaign_id?: string | null;
          created_at?: string | null;
          email_address?: string;
          event_data?: Json | null;
          event_type?: string;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      email_campaigns: {
        Row: {
          content: string;
          created_at: string | null;
          created_by: string | null;
          id: string;
          name: string;
          scheduled_at: string | null;
          segment_id: string | null;
          sent_at: string | null;
          status: string;
          subject: string;
          template_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          name: string;
          scheduled_at?: string | null;
          segment_id?: string | null;
          sent_at?: string | null;
          status: string;
          subject: string;
          template_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          name?: string;
          scheduled_at?: string | null;
          segment_id?: string | null;
          sent_at?: string | null;
          status?: string;
          subject?: string;
          template_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "email_campaigns_segment_id_fkey";
            columns: ["segment_id"];
            isOneToOne: false;
            referencedRelation: "email_segments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "email_campaigns_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "email_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      email_segments: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          criteria: Json;
          id: string;
          name: string;
          updated_at: string | null;
          user_count: number | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          criteria?: Json;
          id?: string;
          name: string;
          updated_at?: string | null;
          user_count?: number | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          criteria?: Json;
          id?: string;
          name?: string;
          updated_at?: string | null;
          user_count?: number | null;
        };
        Relationships: [];
      };
      email_send_events: {
        Row: {
          campaign_id: string | null;
          created_at: string | null;
          error_message: string | null;
          id: string;
          provider: string | null;
          provider_message_id: string | null;
          sent_at: string | null;
          status: string;
          to_email: string;
          user_id: string | null;
        };
        Insert: {
          campaign_id?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          provider?: string | null;
          provider_message_id?: string | null;
          sent_at?: string | null;
          status: string;
          to_email: string;
          user_id?: string | null;
        };
        Update: {
          campaign_id?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          provider?: string | null;
          provider_message_id?: string | null;
          sent_at?: string | null;
          status?: string;
          to_email?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "email_send_events_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "email_campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      email_templates: {
        Row: {
          category: string;
          content: string;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          subject: string;
          updated_at: string | null;
          variables: string[] | null;
        };
        Insert: {
          category: string;
          content: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          subject: string;
          updated_at?: string | null;
          variables?: string[] | null;
        };
        Update: {
          category?: string;
          content?: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          subject?: string;
          updated_at?: string | null;
          variables?: string[] | null;
        };
        Relationships: [];
      };
      enhanced_diary_entries: {
        Row: {
          base_entry_id: string | null;
          created_at: string | null;
          diet_notes: string | null;
          energy_level: number | null;
          energy_notes: string | null;
          entry_date: string;
          entry_time: string | null;
          exercise_notes: string | null;
          exercises: Json | null;
          id: string;
          is_private: boolean | null;
          location: string | null;
          meals: Json | null;
          medication_count: number | null;
          medications: Json | null;
          mood_label: string | null;
          mood_notes: string | null;
          mood_score: number | null;
          mood_tags: string[] | null;
          notes: string | null;
          photo_count: number | null;
          photos: Json | null;
          sleep_end_time: string | null;
          sleep_hours: number | null;
          sleep_interruptions: number | null;
          sleep_notes: string | null;
          sleep_quality: number | null;
          sleep_start_time: string | null;
          symptom_count: number | null;
          symptoms: Json | null;
          tags: string[] | null;
          temperature_celsius: number | null;
          total_calories: number | null;
          total_exercise_minutes: number | null;
          updated_at: string | null;
          user_id: string;
          voice_note_count: number | null;
          voice_notes: Json | null;
          water_intake_ml: number | null;
          weather: string | null;
        };
        Insert: {
          base_entry_id?: string | null;
          created_at?: string | null;
          diet_notes?: string | null;
          energy_level?: number | null;
          energy_notes?: string | null;
          entry_date: string;
          entry_time?: string | null;
          exercise_notes?: string | null;
          exercises?: Json | null;
          id?: string;
          is_private?: boolean | null;
          location?: string | null;
          meals?: Json | null;
          medication_count?: number | null;
          medications?: Json | null;
          mood_label?: string | null;
          mood_notes?: string | null;
          mood_score?: number | null;
          mood_tags?: string[] | null;
          notes?: string | null;
          photo_count?: number | null;
          photos?: Json | null;
          sleep_end_time?: string | null;
          sleep_hours?: number | null;
          sleep_interruptions?: number | null;
          sleep_notes?: string | null;
          sleep_quality?: number | null;
          sleep_start_time?: string | null;
          symptom_count?: number | null;
          symptoms?: Json | null;
          tags?: string[] | null;
          temperature_celsius?: number | null;
          total_calories?: number | null;
          total_exercise_minutes?: number | null;
          updated_at?: string | null;
          user_id: string;
          voice_note_count?: number | null;
          voice_notes?: Json | null;
          water_intake_ml?: number | null;
          weather?: string | null;
        };
        Update: {
          base_entry_id?: string | null;
          created_at?: string | null;
          diet_notes?: string | null;
          energy_level?: number | null;
          energy_notes?: string | null;
          entry_date?: string;
          entry_time?: string | null;
          exercise_notes?: string | null;
          exercises?: Json | null;
          id?: string;
          is_private?: boolean | null;
          location?: string | null;
          meals?: Json | null;
          medication_count?: number | null;
          medications?: Json | null;
          mood_label?: string | null;
          mood_notes?: string | null;
          mood_score?: number | null;
          mood_tags?: string[] | null;
          notes?: string | null;
          photo_count?: number | null;
          photos?: Json | null;
          sleep_end_time?: string | null;
          sleep_hours?: number | null;
          sleep_interruptions?: number | null;
          sleep_notes?: string | null;
          sleep_quality?: number | null;
          sleep_start_time?: string | null;
          symptom_count?: number | null;
          symptoms?: Json | null;
          tags?: string[] | null;
          temperature_celsius?: number | null;
          total_calories?: number | null;
          total_exercise_minutes?: number | null;
          updated_at?: string | null;
          user_id?: string;
          voice_note_count?: number | null;
          voice_notes?: Json | null;
          water_intake_ml?: number | null;
          weather?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "enhanced_diary_entries_base_entry_id_fkey";
            columns: ["base_entry_id"];
            isOneToOne: false;
            referencedRelation: "health_diary";
            referencedColumns: ["id"];
          },
        ];
      };
      equipment_recommendations: {
        Row: {
          affiliate_provider: string | null;
          affiliate_url: string;
          commission_rate: number | null;
          created_at: string | null;
          effectiveness_rating: number | null;
          equipment_category: string | null;
          equipment_description: string;
          equipment_name: string;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          is_featured: boolean | null;
          price_range: string | null;
          rating: number | null;
          recommended_for: string[] | null;
          review_count: number | null;
          updated_at: string | null;
        };
        Insert: {
          affiliate_provider?: string | null;
          affiliate_url: string;
          commission_rate?: number | null;
          created_at?: string | null;
          effectiveness_rating?: number | null;
          equipment_category?: string | null;
          equipment_description: string;
          equipment_name: string;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          price_range?: string | null;
          rating?: number | null;
          recommended_for?: string[] | null;
          review_count?: number | null;
          updated_at?: string | null;
        };
        Update: {
          affiliate_provider?: string | null;
          affiliate_url?: string;
          commission_rate?: number | null;
          created_at?: string | null;
          effectiveness_rating?: number | null;
          equipment_category?: string | null;
          equipment_description?: string;
          equipment_name?: string;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          price_range?: string | null;
          rating?: number | null;
          recommended_for?: string[] | null;
          review_count?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      expert_articles: {
        Row: {
          article_content: string;
          article_slug: string;
          article_title: string;
          category: string;
          created_at: string | null;
          excerpt: string | null;
          expert_id: string;
          featured_image_url: string | null;
          id: string;
          is_featured: boolean | null;
          is_premium: boolean | null;
          is_published: boolean | null;
          like_count: number | null;
          published_at: string | null;
          share_count: number | null;
          tags: string[] | null;
          updated_at: string | null;
          video_url: string | null;
          view_count: number | null;
        };
        Insert: {
          article_content: string;
          article_slug: string;
          article_title: string;
          category: string;
          created_at?: string | null;
          excerpt?: string | null;
          expert_id: string;
          featured_image_url?: string | null;
          id?: string;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          is_published?: boolean | null;
          like_count?: number | null;
          published_at?: string | null;
          share_count?: number | null;
          tags?: string[] | null;
          updated_at?: string | null;
          video_url?: string | null;
          view_count?: number | null;
        };
        Update: {
          article_content?: string;
          article_slug?: string;
          article_title?: string;
          category?: string;
          created_at?: string | null;
          excerpt?: string | null;
          expert_id?: string;
          featured_image_url?: string | null;
          id?: string;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          is_published?: boolean | null;
          like_count?: number | null;
          published_at?: string | null;
          share_count?: number | null;
          tags?: string[] | null;
          updated_at?: string | null;
          video_url?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "expert_articles_expert_id_fkey";
            columns: ["expert_id"];
            isOneToOne: false;
            referencedRelation: "expert_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      expert_consultations: {
        Row: {
          cancellation_reason: string | null;
          cancelled_at: string | null;
          consultation_status: string | null;
          consultation_type: string;
          created_at: string | null;
          description: string | null;
          duration_minutes: number | null;
          expert_id: string;
          id: string;
          meeting_id: string | null;
          meeting_link: string | null;
          notes: string | null;
          payment_intent_id: string | null;
          payment_status: string | null;
          price: number;
          rating: number | null;
          review_text: string | null;
          scheduled_at: string;
          status: string | null;
          topic: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          consultation_status?: string | null;
          consultation_type: string;
          created_at?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          expert_id: string;
          id?: string;
          meeting_id?: string | null;
          meeting_link?: string | null;
          notes?: string | null;
          payment_intent_id?: string | null;
          payment_status?: string | null;
          price: number;
          rating?: number | null;
          review_text?: string | null;
          scheduled_at: string;
          status?: string | null;
          topic: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          consultation_status?: string | null;
          consultation_type?: string;
          created_at?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          expert_id?: string;
          id?: string;
          meeting_id?: string | null;
          meeting_link?: string | null;
          notes?: string | null;
          payment_intent_id?: string | null;
          payment_status?: string | null;
          price?: number;
          rating?: number | null;
          review_text?: string | null;
          scheduled_at?: string;
          status?: string | null;
          topic?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      expert_group_workshops: {
        Row: {
          created_at: string | null;
          current_participants: number | null;
          description: string | null;
          duration_minutes: number;
          expert_id: string;
          id: string;
          max_participants: number | null;
          meeting_url: string | null;
          price_per_person: number;
          recording_url: string | null;
          scheduled_at: string;
          status: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          current_participants?: number | null;
          description?: string | null;
          duration_minutes?: number;
          expert_id: string;
          id?: string;
          max_participants?: number | null;
          meeting_url?: string | null;
          price_per_person: number;
          recording_url?: string | null;
          scheduled_at: string;
          status?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          current_participants?: number | null;
          description?: string | null;
          duration_minutes?: number;
          expert_id?: string;
          id?: string;
          max_participants?: number | null;
          meeting_url?: string | null;
          price_per_person?: number;
          recording_url?: string | null;
          scheduled_at?: string;
          status?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "expert_group_workshops_expert_id_fkey";
            columns: ["expert_id"];
            isOneToOne: false;
            referencedRelation: "expert_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      expert_profiles: {
        Row: {
          availability_schedule: Json | null;
          average_rating: number | null;
          bio: string | null;
          consultation_rate_per_hour: number;
          cover_image_url: string | null;
          created_at: string | null;
          credentials: string[] | null;
          currency: string | null;
          email: string | null;
          expert_name: string;
          expert_title: string;
          group_workshop_rate: number | null;
          id: string;
          is_active: boolean | null;
          is_available: boolean | null;
          is_featured: boolean | null;
          is_verified: boolean | null;
          profile_image_url: string | null;
          social_media_links: Json | null;
          specialties: string[];
          timezone: string | null;
          total_consultations: number | null;
          total_ratings: number | null;
          total_workshops: number | null;
          updated_at: string | null;
          user_id: string;
          verification_date: string | null;
          video_intro_url: string | null;
          website_url: string | null;
          workshop_rate_per_person: number | null;
          years_experience: number | null;
        };
        Insert: {
          availability_schedule?: Json | null;
          average_rating?: number | null;
          bio?: string | null;
          consultation_rate_per_hour: number;
          cover_image_url?: string | null;
          created_at?: string | null;
          credentials?: string[] | null;
          currency?: string | null;
          email?: string | null;
          expert_name: string;
          expert_title: string;
          group_workshop_rate?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_available?: boolean | null;
          is_featured?: boolean | null;
          is_verified?: boolean | null;
          profile_image_url?: string | null;
          social_media_links?: Json | null;
          specialties: string[];
          timezone?: string | null;
          total_consultations?: number | null;
          total_ratings?: number | null;
          total_workshops?: number | null;
          updated_at?: string | null;
          user_id: string;
          verification_date?: string | null;
          video_intro_url?: string | null;
          website_url?: string | null;
          workshop_rate_per_person?: number | null;
          years_experience?: number | null;
        };
        Update: {
          availability_schedule?: Json | null;
          average_rating?: number | null;
          bio?: string | null;
          consultation_rate_per_hour?: number;
          cover_image_url?: string | null;
          created_at?: string | null;
          credentials?: string[] | null;
          currency?: string | null;
          email?: string | null;
          expert_name?: string;
          expert_title?: string;
          group_workshop_rate?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_available?: boolean | null;
          is_featured?: boolean | null;
          is_verified?: boolean | null;
          profile_image_url?: string | null;
          social_media_links?: Json | null;
          specialties?: string[];
          timezone?: string | null;
          total_consultations?: number | null;
          total_ratings?: number | null;
          total_workshops?: number | null;
          updated_at?: string | null;
          user_id?: string;
          verification_date?: string | null;
          video_intro_url?: string | null;
          website_url?: string | null;
          workshop_rate_per_person?: number | null;
          years_experience?: number | null;
        };
        Relationships: [];
      };
      expert_qa: {
        Row: {
          answer_text: string | null;
          answered_at: string | null;
          created_at: string | null;
          expert_id: string;
          helpful_count: number | null;
          id: string;
          is_anonymous: boolean | null;
          is_answered: boolean | null;
          is_featured: boolean | null;
          is_public: boolean | null;
          question_category: string | null;
          question_text: string;
          updated_at: string | null;
          user_id: string | null;
          view_count: number | null;
        };
        Insert: {
          answer_text?: string | null;
          answered_at?: string | null;
          created_at?: string | null;
          expert_id: string;
          helpful_count?: number | null;
          id?: string;
          is_anonymous?: boolean | null;
          is_answered?: boolean | null;
          is_featured?: boolean | null;
          is_public?: boolean | null;
          question_category?: string | null;
          question_text: string;
          updated_at?: string | null;
          user_id?: string | null;
          view_count?: number | null;
        };
        Update: {
          answer_text?: string | null;
          answered_at?: string | null;
          created_at?: string | null;
          expert_id?: string;
          helpful_count?: number | null;
          id?: string;
          is_anonymous?: boolean | null;
          is_answered?: boolean | null;
          is_featured?: boolean | null;
          is_public?: boolean | null;
          question_category?: string | null;
          question_text?: string;
          updated_at?: string | null;
          user_id?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "expert_qa_expert_id_fkey";
            columns: ["expert_id"];
            isOneToOne: false;
            referencedRelation: "expert_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      expert_questions: {
        Row: {
          answer: string | null;
          answered_at: string | null;
          category: string | null;
          created_at: string | null;
          expert_id: string;
          id: string;
          question: string;
          status: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          answer?: string | null;
          answered_at?: string | null;
          category?: string | null;
          created_at?: string | null;
          expert_id: string;
          id?: string;
          question: string;
          status?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          answer?: string | null;
          answered_at?: string | null;
          category?: string | null;
          created_at?: string | null;
          expert_id?: string;
          id?: string;
          question?: string;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expert_questions_expert_id_fkey";
            columns: ["expert_id"];
            isOneToOne: false;
            referencedRelation: "expert_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      expert_ratings: {
        Row: {
          communication_rating: number | null;
          consultation_id: string | null;
          created_at: string | null;
          expert_id: string;
          expertise_rating: number | null;
          helpful_count: number | null;
          helpfulness_rating: number | null;
          id: string;
          is_anonymous: boolean | null;
          is_featured: boolean | null;
          is_public: boolean | null;
          is_verified: boolean | null;
          overall_rating: number;
          review_text: string | null;
          review_title: string | null;
          updated_at: string | null;
          user_id: string;
          workshop_id: string | null;
        };
        Insert: {
          communication_rating?: number | null;
          consultation_id?: string | null;
          created_at?: string | null;
          expert_id: string;
          expertise_rating?: number | null;
          helpful_count?: number | null;
          helpfulness_rating?: number | null;
          id?: string;
          is_anonymous?: boolean | null;
          is_featured?: boolean | null;
          is_public?: boolean | null;
          is_verified?: boolean | null;
          overall_rating: number;
          review_text?: string | null;
          review_title?: string | null;
          updated_at?: string | null;
          user_id: string;
          workshop_id?: string | null;
        };
        Update: {
          communication_rating?: number | null;
          consultation_id?: string | null;
          created_at?: string | null;
          expert_id?: string;
          expertise_rating?: number | null;
          helpful_count?: number | null;
          helpfulness_rating?: number | null;
          id?: string;
          is_anonymous?: boolean | null;
          is_featured?: boolean | null;
          is_public?: boolean | null;
          is_verified?: boolean | null;
          overall_rating?: number;
          review_text?: string | null;
          review_title?: string | null;
          updated_at?: string | null;
          user_id?: string;
          workshop_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "expert_ratings_consultation_id_fkey";
            columns: ["consultation_id"];
            isOneToOne: false;
            referencedRelation: "consultation_bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expert_ratings_expert_id_fkey";
            columns: ["expert_id"];
            isOneToOne: false;
            referencedRelation: "expert_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expert_ratings_workshop_id_fkey";
            columns: ["workshop_id"];
            isOneToOne: false;
            referencedRelation: "workshop_bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      expert_videos: {
        Row: {
          category: string;
          created_at: string | null;
          currency: string | null;
          duration_seconds: number | null;
          expert_id: string;
          id: string;
          is_featured: boolean | null;
          is_free_preview: boolean | null;
          is_premium: boolean | null;
          is_published: boolean | null;
          like_count: number | null;
          preview_duration_seconds: number | null;
          price: number | null;
          published_at: string | null;
          purchase_count: number | null;
          tags: string[] | null;
          thumbnail_url: string | null;
          updated_at: string | null;
          video_description: string | null;
          video_title: string;
          video_url: string;
          view_count: number | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          currency?: string | null;
          duration_seconds?: number | null;
          expert_id: string;
          id?: string;
          is_featured?: boolean | null;
          is_free_preview?: boolean | null;
          is_premium?: boolean | null;
          is_published?: boolean | null;
          like_count?: number | null;
          preview_duration_seconds?: number | null;
          price?: number | null;
          published_at?: string | null;
          purchase_count?: number | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          updated_at?: string | null;
          video_description?: string | null;
          video_title: string;
          video_url: string;
          view_count?: number | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          currency?: string | null;
          duration_seconds?: number | null;
          expert_id?: string;
          id?: string;
          is_featured?: boolean | null;
          is_free_preview?: boolean | null;
          is_premium?: boolean | null;
          is_published?: boolean | null;
          like_count?: number | null;
          preview_duration_seconds?: number | null;
          price?: number | null;
          published_at?: string | null;
          purchase_count?: number | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          updated_at?: string | null;
          video_description?: string | null;
          video_title?: string;
          video_url?: string;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "expert_videos_expert_id_fkey";
            columns: ["expert_id"];
            isOneToOne: false;
            referencedRelation: "expert_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      export_audit_trail: {
        Row: {
          action: string;
          actor_identifier: string | null;
          actor_type: string | null;
          created_at: string | null;
          export_id: string;
          id: string;
          ip_address: unknown;
          metadata: Json | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          action: string;
          actor_identifier?: string | null;
          actor_type?: string | null;
          created_at?: string | null;
          export_id: string;
          id?: string;
          ip_address?: unknown;
          metadata?: Json | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          action?: string;
          actor_identifier?: string | null;
          actor_type?: string | null;
          created_at?: string | null;
          export_id?: string;
          id?: string;
          ip_address?: unknown;
          metadata?: Json | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "export_audit_trail_export_id_fkey";
            columns: ["export_id"];
            isOneToOne: false;
            referencedRelation: "medical_export_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      export_jobs: {
        Row: {
          cloud_file_id: string | null;
          cloud_file_url: string | null;
          cloud_service: string | null;
          completed_at: string | null;
          created_at: string | null;
          data_sources: string[];
          email_recipients: string[] | null;
          email_sent: boolean | null;
          email_sent_at: string | null;
          error_message: string | null;
          export_config: Json;
          export_name: string;
          export_status: string | null;
          export_type: string;
          failed_at: string | null;
          file_format: string | null;
          file_name: string | null;
          file_size_bytes: number | null;
          file_url: string | null;
          id: string;
          progress_percentage: number | null;
          started_at: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          cloud_file_id?: string | null;
          cloud_file_url?: string | null;
          cloud_service?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          data_sources: string[];
          email_recipients?: string[] | null;
          email_sent?: boolean | null;
          email_sent_at?: string | null;
          error_message?: string | null;
          export_config: Json;
          export_name: string;
          export_status?: string | null;
          export_type: string;
          failed_at?: string | null;
          file_format?: string | null;
          file_name?: string | null;
          file_size_bytes?: number | null;
          file_url?: string | null;
          id?: string;
          progress_percentage?: number | null;
          started_at?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          cloud_file_id?: string | null;
          cloud_file_url?: string | null;
          cloud_service?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          data_sources?: string[];
          email_recipients?: string[] | null;
          email_sent?: boolean | null;
          email_sent_at?: string | null;
          error_message?: string | null;
          export_config?: Json;
          export_name?: string;
          export_status?: string | null;
          export_type?: string;
          failed_at?: string | null;
          file_format?: string | null;
          file_name?: string | null;
          file_size_bytes?: number | null;
          file_url?: string | null;
          id?: string;
          progress_percentage?: number | null;
          started_at?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      export_templates: {
        Row: {
          created_at: string | null;
          export_type: string;
          id: string;
          is_public: boolean | null;
          is_system_template: boolean | null;
          template_config: Json;
          template_description: string | null;
          template_name: string;
          updated_at: string | null;
          usage_count: number | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          export_type: string;
          id?: string;
          is_public?: boolean | null;
          is_system_template?: boolean | null;
          template_config: Json;
          template_description?: string | null;
          template_name: string;
          updated_at?: string | null;
          usage_count?: number | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          export_type?: string;
          id?: string;
          is_public?: boolean | null;
          is_system_template?: boolean | null;
          template_config?: Json;
          template_description?: string | null;
          template_name?: string;
          updated_at?: string | null;
          usage_count?: number | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      exported_3d_models: {
        Row: {
          created_at: string | null;
          download_count: number | null;
          export_format: string;
          file_size_bytes: number | null;
          file_url: string;
          id: string;
          include_measurements: boolean | null;
          include_texture: boolean | null;
          last_downloaded_at: string | null;
          quality_level: string | null;
          session_id: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          download_count?: number | null;
          export_format: string;
          file_size_bytes?: number | null;
          file_url: string;
          id?: string;
          include_measurements?: boolean | null;
          include_texture?: boolean | null;
          last_downloaded_at?: string | null;
          quality_level?: string | null;
          session_id?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          download_count?: number | null;
          export_format?: string;
          file_size_bytes?: number | null;
          file_url?: string;
          id?: string;
          include_measurements?: boolean | null;
          include_texture?: boolean | null;
          last_downloaded_at?: string | null;
          quality_level?: string | null;
          session_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exported_3d_models_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "multi_angle_scan_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      follow_up_sessions: {
        Row: {
          amount: number | null;
          completed_at: string | null;
          created_at: string | null;
          currency: string | null;
          duration_minutes: number | null;
          expert_id: string;
          id: string;
          original_consultation_id: string;
          payment_status: string | null;
          progress_notes: string | null;
          recommendations: string | null;
          scheduled_at: string;
          session_status: string | null;
          session_type: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          amount?: number | null;
          completed_at?: string | null;
          created_at?: string | null;
          currency?: string | null;
          duration_minutes?: number | null;
          expert_id: string;
          id?: string;
          original_consultation_id: string;
          payment_status?: string | null;
          progress_notes?: string | null;
          recommendations?: string | null;
          scheduled_at: string;
          session_status?: string | null;
          session_type: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number | null;
          completed_at?: string | null;
          created_at?: string | null;
          currency?: string | null;
          duration_minutes?: number | null;
          expert_id?: string;
          id?: string;
          original_consultation_id?: string;
          payment_status?: string | null;
          progress_notes?: string | null;
          recommendations?: string | null;
          scheduled_at?: string;
          session_status?: string | null;
          session_type?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follow_up_sessions_expert_id_fkey";
            columns: ["expert_id"];
            isOneToOne: false;
            referencedRelation: "expert_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follow_up_sessions_original_consultation_id_fkey";
            columns: ["original_consultation_id"];
            isOneToOne: false;
            referencedRelation: "consultation_bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      forum_categories: {
        Row: {
          color: string | null;
          created_at: string | null;
          description: string | null;
          icon: string | null;
          id: string;
          is_nsfw: boolean | null;
          is_private: boolean | null;
          last_activity_at: string | null;
          name: string;
          order_index: number | null;
          post_count: number | null;
          requires_premium: boolean | null;
          slug: string;
          thread_count: number | null;
          updated_at: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_nsfw?: boolean | null;
          is_private?: boolean | null;
          last_activity_at?: string | null;
          name: string;
          order_index?: number | null;
          post_count?: number | null;
          requires_premium?: boolean | null;
          slug: string;
          thread_count?: number | null;
          updated_at?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_nsfw?: boolean | null;
          is_private?: boolean | null;
          last_activity_at?: string | null;
          name?: string;
          order_index?: number | null;
          post_count?: number | null;
          requires_premium?: boolean | null;
          slug?: string;
          thread_count?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      forum_comment_likes: {
        Row: {
          comment_id: string;
          created_at: string | null;
          id: string;
          user_id: string;
        };
        Insert: {
          comment_id: string;
          created_at?: string | null;
          id?: string;
          user_id: string;
        };
        Update: {
          comment_id?: string;
          created_at?: string | null;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forum_comment_likes_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "forum_comments";
            referencedColumns: ["id"];
          },
        ];
      };
      forum_comments: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          is_anonymous: boolean | null;
          like_count: number | null;
          parent_comment_id: string | null;
          post_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          is_anonymous?: boolean | null;
          like_count?: number | null;
          parent_comment_id?: string | null;
          post_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          is_anonymous?: boolean | null;
          like_count?: number | null;
          parent_comment_id?: string | null;
          post_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forum_comments_parent_comment_id_fkey";
            columns: ["parent_comment_id"];
            isOneToOne: false;
            referencedRelation: "forum_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "forum_comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "forum_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      forum_expert_sessions: {
        Row: {
          actual_end_at: string | null;
          actual_start_at: string | null;
          category_id: string | null;
          created_at: string | null;
          description: string | null;
          expert_id: string;
          id: string;
          question_count: number | null;
          scheduled_end_at: string | null;
          scheduled_start_at: string | null;
          status: string | null;
          title: string;
          updated_at: string | null;
          view_count: number | null;
        };
        Insert: {
          actual_end_at?: string | null;
          actual_start_at?: string | null;
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          expert_id: string;
          id?: string;
          question_count?: number | null;
          scheduled_end_at?: string | null;
          scheduled_start_at?: string | null;
          status?: string | null;
          title: string;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Update: {
          actual_end_at?: string | null;
          actual_start_at?: string | null;
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          expert_id?: string;
          id?: string;
          question_count?: number | null;
          scheduled_end_at?: string | null;
          scheduled_start_at?: string | null;
          status?: string | null;
          title?: string;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "forum_expert_sessions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "forum_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      forum_interactions: {
        Row: {
          content_id: string;
          content_type: string;
          created_at: string | null;
          id: string;
          interaction_type: string;
          user_id: string;
        };
        Insert: {
          content_id: string;
          content_type: string;
          created_at?: string | null;
          id?: string;
          interaction_type: string;
          user_id: string;
        };
        Update: {
          content_id?: string;
          content_type?: string;
          created_at?: string | null;
          id?: string;
          interaction_type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      forum_moderation_log: {
        Row: {
          action_type: string;
          content_id: string;
          content_type: string;
          created_at: string | null;
          id: string;
          moderator_id: string;
          notes: string | null;
          reason: string | null;
        };
        Insert: {
          action_type: string;
          content_id: string;
          content_type: string;
          created_at?: string | null;
          id?: string;
          moderator_id: string;
          notes?: string | null;
          reason?: string | null;
        };
        Update: {
          action_type?: string;
          content_id?: string;
          content_type?: string;
          created_at?: string | null;
          id?: string;
          moderator_id?: string;
          notes?: string | null;
          reason?: string | null;
        };
        Relationships: [];
      };
      forum_post_likes: {
        Row: {
          created_at: string | null;
          id: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forum_post_likes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "forum_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      forum_posts: {
        Row: {
          comment_count: number | null;
          content: string;
          created_at: string | null;
          forum_id: string;
          helpful_count: number | null;
          id: string;
          is_anonymous: boolean | null;
          is_approved: boolean | null;
          is_expert_answer: boolean | null;
          is_locked: boolean | null;
          is_pinned: boolean | null;
          like_count: number | null;
          moderated_at: string | null;
          moderated_by: string | null;
          moderation_notes: string | null;
          parent_post_id: string | null;
          tags: string[] | null;
          thread_id: string | null;
          title: string;
          updated_at: string | null;
          user_id: string;
          view_count: number | null;
        };
        Insert: {
          comment_count?: number | null;
          content: string;
          created_at?: string | null;
          forum_id: string;
          helpful_count?: number | null;
          id?: string;
          is_anonymous?: boolean | null;
          is_approved?: boolean | null;
          is_expert_answer?: boolean | null;
          is_locked?: boolean | null;
          is_pinned?: boolean | null;
          like_count?: number | null;
          moderated_at?: string | null;
          moderated_by?: string | null;
          moderation_notes?: string | null;
          parent_post_id?: string | null;
          tags?: string[] | null;
          thread_id?: string | null;
          title: string;
          updated_at?: string | null;
          user_id: string;
          view_count?: number | null;
        };
        Update: {
          comment_count?: number | null;
          content?: string;
          created_at?: string | null;
          forum_id?: string;
          helpful_count?: number | null;
          id?: string;
          is_anonymous?: boolean | null;
          is_approved?: boolean | null;
          is_expert_answer?: boolean | null;
          is_locked?: boolean | null;
          is_pinned?: boolean | null;
          like_count?: number | null;
          moderated_at?: string | null;
          moderated_by?: string | null;
          moderation_notes?: string | null;
          parent_post_id?: string | null;
          tags?: string[] | null;
          thread_id?: string | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "forum_posts_forum_id_fkey";
            columns: ["forum_id"];
            isOneToOne: false;
            referencedRelation: "community_forums";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "forum_posts_parent_post_id_fkey";
            columns: ["parent_post_id"];
            isOneToOne: false;
            referencedRelation: "forum_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "forum_posts_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "forum_threads";
            referencedColumns: ["id"];
          },
        ];
      };
      forum_support_group_members: {
        Row: {
          group_id: string;
          id: string;
          joined_at: string | null;
          role: string | null;
          user_id: string;
        };
        Insert: {
          group_id: string;
          id?: string;
          joined_at?: string | null;
          role?: string | null;
          user_id: string;
        };
        Update: {
          group_id?: string;
          id?: string;
          joined_at?: string | null;
          role?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forum_support_group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "forum_support_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      forum_support_groups: {
        Row: {
          category: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          is_private: boolean | null;
          member_count: number | null;
          name: string;
          post_count: number | null;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_private?: boolean | null;
          member_count?: number | null;
          name: string;
          post_count?: number | null;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_private?: boolean | null;
          member_count?: number | null;
          name?: string;
          post_count?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      forum_threads: {
        Row: {
          category_id: string;
          content: string;
          created_at: string | null;
          helpful_count: number | null;
          id: string;
          is_anonymous: boolean | null;
          is_approved: boolean | null;
          is_expert_qa: boolean | null;
          is_locked: boolean | null;
          is_pinned: boolean | null;
          is_success_story: boolean | null;
          last_reply_at: string | null;
          last_reply_by: string | null;
          like_count: number | null;
          moderated_at: string | null;
          moderated_by: string | null;
          moderation_notes: string | null;
          reply_count: number | null;
          title: string;
          updated_at: string | null;
          user_id: string | null;
          view_count: number | null;
        };
        Insert: {
          category_id: string;
          content: string;
          created_at?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_anonymous?: boolean | null;
          is_approved?: boolean | null;
          is_expert_qa?: boolean | null;
          is_locked?: boolean | null;
          is_pinned?: boolean | null;
          is_success_story?: boolean | null;
          last_reply_at?: string | null;
          last_reply_by?: string | null;
          like_count?: number | null;
          moderated_at?: string | null;
          moderated_by?: string | null;
          moderation_notes?: string | null;
          reply_count?: number | null;
          title: string;
          updated_at?: string | null;
          user_id?: string | null;
          view_count?: number | null;
        };
        Update: {
          category_id?: string;
          content?: string;
          created_at?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_anonymous?: boolean | null;
          is_approved?: boolean | null;
          is_expert_qa?: boolean | null;
          is_locked?: boolean | null;
          is_pinned?: boolean | null;
          is_success_story?: boolean | null;
          last_reply_at?: string | null;
          last_reply_by?: string | null;
          like_count?: number | null;
          moderated_at?: string | null;
          moderated_by?: string | null;
          moderation_notes?: string | null;
          reply_count?: number | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "forum_threads_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "forum_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      forum_user_reputation: {
        Row: {
          badges: string[] | null;
          expert_answers_count: number | null;
          helpful_marks_received: number | null;
          id: string;
          level: number | null;
          post_count: number | null;
          reputation_points: number | null;
          thread_count: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          badges?: string[] | null;
          expert_answers_count?: number | null;
          helpful_marks_received?: number | null;
          id?: string;
          level?: number | null;
          post_count?: number | null;
          reputation_points?: number | null;
          thread_count?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          badges?: string[] | null;
          expert_answers_count?: number | null;
          helpful_marks_received?: number | null;
          id?: string;
          level?: number | null;
          post_count?: number | null;
          reputation_points?: number | null;
          thread_count?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      generated_reports: {
        Row: {
          access_count: number | null;
          created_at: string | null;
          csv_url: string | null;
          custom_report_id: string | null;
          error_message: string | null;
          excel_url: string | null;
          expires_at: string | null;
          file_sizes: Json | null;
          generated_at: string | null;
          generation_method: string | null;
          generation_trigger: string | null;
          hl7_fhir_url: string | null;
          id: string;
          is_shared: boolean | null;
          json_url: string | null;
          last_accessed_at: string | null;
          pdf_url: string | null;
          report_data: Json;
          report_summary: Json | null;
          share_token: string | null;
          shared_with_doctors: string[] | null;
          shared_with_users: string[] | null;
          status: string | null;
          user_id: string;
          xml_url: string | null;
        };
        Insert: {
          access_count?: number | null;
          created_at?: string | null;
          csv_url?: string | null;
          custom_report_id?: string | null;
          error_message?: string | null;
          excel_url?: string | null;
          expires_at?: string | null;
          file_sizes?: Json | null;
          generated_at?: string | null;
          generation_method?: string | null;
          generation_trigger?: string | null;
          hl7_fhir_url?: string | null;
          id?: string;
          is_shared?: boolean | null;
          json_url?: string | null;
          last_accessed_at?: string | null;
          pdf_url?: string | null;
          report_data: Json;
          report_summary?: Json | null;
          share_token?: string | null;
          shared_with_doctors?: string[] | null;
          shared_with_users?: string[] | null;
          status?: string | null;
          user_id: string;
          xml_url?: string | null;
        };
        Update: {
          access_count?: number | null;
          created_at?: string | null;
          csv_url?: string | null;
          custom_report_id?: string | null;
          error_message?: string | null;
          excel_url?: string | null;
          expires_at?: string | null;
          file_sizes?: Json | null;
          generated_at?: string | null;
          generation_method?: string | null;
          generation_trigger?: string | null;
          hl7_fhir_url?: string | null;
          id?: string;
          is_shared?: boolean | null;
          json_url?: string | null;
          last_accessed_at?: string | null;
          pdf_url?: string | null;
          report_data?: Json;
          report_summary?: Json | null;
          share_token?: string | null;
          shared_with_doctors?: string[] | null;
          shared_with_users?: string[] | null;
          status?: string | null;
          user_id?: string;
          xml_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "generated_reports_custom_report_id_fkey";
            columns: ["custom_report_id"];
            isOneToOne: false;
            referencedRelation: "custom_reports";
            referencedColumns: ["id"];
          },
        ];
      };
      goal_progress_tracking: {
        Row: {
          created_at: string | null;
          goal_id: string;
          id: string;
          notes: string | null;
          user_id: string;
          value: number;
        };
        Insert: {
          created_at?: string | null;
          goal_id: string;
          id?: string;
          notes?: string | null;
          user_id: string;
          value: number;
        };
        Update: {
          created_at?: string | null;
          goal_id?: string;
          id?: string;
          notes?: string | null;
          user_id?: string;
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "goal_progress_tracking_goal_id_fkey";
            columns: ["goal_id"];
            isOneToOne: false;
            referencedRelation: "user_goals";
            referencedColumns: ["id"];
          },
        ];
      };
      group_chat_members: {
        Row: {
          group_id: string;
          id: string;
          is_muted: boolean | null;
          joined_at: string | null;
          last_read_at: string | null;
          role: string | null;
          user_id: string;
        };
        Insert: {
          group_id: string;
          id?: string;
          is_muted?: boolean | null;
          joined_at?: string | null;
          last_read_at?: string | null;
          role?: string | null;
          user_id: string;
        };
        Update: {
          group_id?: string;
          id?: string;
          is_muted?: boolean | null;
          joined_at?: string | null;
          last_read_at?: string | null;
          role?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_chat_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "group_chats";
            referencedColumns: ["id"];
          },
        ];
      };
      group_chat_message_reactions: {
        Row: {
          created_at: string | null;
          emoji: string;
          id: string;
          message_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          emoji: string;
          id?: string;
          message_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          emoji?: string;
          id?: string;
          message_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_chat_message_reactions_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "group_chat_messages";
            referencedColumns: ["id"];
          },
        ];
      };
      group_chat_messages: {
        Row: {
          attachments: Json | null;
          content: string;
          created_at: string | null;
          deleted_at: string | null;
          edited_at: string | null;
          group_id: string;
          id: string;
          is_deleted: boolean | null;
          is_edited: boolean | null;
          reply_to_message_id: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          attachments?: Json | null;
          content: string;
          created_at?: string | null;
          deleted_at?: string | null;
          edited_at?: string | null;
          group_id: string;
          id?: string;
          is_deleted?: boolean | null;
          is_edited?: boolean | null;
          reply_to_message_id?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          attachments?: Json | null;
          content?: string;
          created_at?: string | null;
          deleted_at?: string | null;
          edited_at?: string | null;
          group_id?: string;
          id?: string;
          is_deleted?: boolean | null;
          is_edited?: boolean | null;
          reply_to_message_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_chat_messages_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "group_chats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_chat_messages_reply_to_message_id_fkey";
            columns: ["reply_to_message_id"];
            isOneToOne: false;
            referencedRelation: "group_chat_messages";
            referencedColumns: ["id"];
          },
        ];
      };
      group_chats: {
        Row: {
          avatar_url: string | null;
          category: string | null;
          created_at: string | null;
          created_by: string;
          description: string | null;
          id: string;
          is_premium: boolean | null;
          is_private: boolean | null;
          last_message_at: string | null;
          member_count: number | null;
          message_count: number | null;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          category?: string | null;
          created_at?: string | null;
          created_by: string;
          description?: string | null;
          id?: string;
          is_premium?: boolean | null;
          is_private?: boolean | null;
          last_message_at?: string | null;
          member_count?: number | null;
          message_count?: number | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          category?: string | null;
          created_at?: string | null;
          created_by?: string;
          description?: string | null;
          id?: string;
          is_premium?: boolean | null;
          is_private?: boolean | null;
          last_message_at?: string | null;
          member_count?: number | null;
          message_count?: number | null;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      growth_predictions: {
        Row: {
          confidence_intervals: Json | null;
          confidence_level: number | null;
          contributing_factors: Json | null;
          created_at: string | null;
          id: string;
          input_data: Json;
          limiting_factors: Json | null;
          model_id: string | null;
          optimal_routine_suggestions: Json | null;
          predicted_growth: Json;
          prediction_date: string;
          prediction_horizon_days: number;
          recommendations: string[] | null;
          user_id: string;
        };
        Insert: {
          confidence_intervals?: Json | null;
          confidence_level?: number | null;
          contributing_factors?: Json | null;
          created_at?: string | null;
          id?: string;
          input_data: Json;
          limiting_factors?: Json | null;
          model_id?: string | null;
          optimal_routine_suggestions?: Json | null;
          predicted_growth: Json;
          prediction_date: string;
          prediction_horizon_days: number;
          recommendations?: string[] | null;
          user_id: string;
        };
        Update: {
          confidence_intervals?: Json | null;
          confidence_level?: number | null;
          contributing_factors?: Json | null;
          created_at?: string | null;
          id?: string;
          input_data?: Json;
          limiting_factors?: Json | null;
          model_id?: string | null;
          optimal_routine_suggestions?: Json | null;
          predicted_growth?: Json;
          prediction_date?: string;
          prediction_horizon_days?: number;
          recommendations?: string[] | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "growth_predictions_model_id_fkey";
            columns: ["model_id"];
            isOneToOne: false;
            referencedRelation: "predictive_models";
            referencedColumns: ["id"];
          },
        ];
      };
      habit_analytics: {
        Row: {
          average_value: number | null;
          completed_entries: number | null;
          completion_rate: number | null;
          created_at: string | null;
          current_streak: number | null;
          id: string;
          longest_streak: number | null;
          period_end: string;
          period_start: string;
          period_type: string | null;
          total_entries: number | null;
          user_habit_id: string;
        };
        Insert: {
          average_value?: number | null;
          completed_entries?: number | null;
          completion_rate?: number | null;
          created_at?: string | null;
          current_streak?: number | null;
          id?: string;
          longest_streak?: number | null;
          period_end: string;
          period_start: string;
          period_type?: string | null;
          total_entries?: number | null;
          user_habit_id: string;
        };
        Update: {
          average_value?: number | null;
          completed_entries?: number | null;
          completion_rate?: number | null;
          created_at?: string | null;
          current_streak?: number | null;
          id?: string;
          longest_streak?: number | null;
          period_end?: string;
          period_start?: string;
          period_type?: string | null;
          total_entries?: number | null;
          user_habit_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "habit_analytics_user_habit_id_fkey";
            columns: ["user_habit_id"];
            isOneToOne: false;
            referencedRelation: "user_habits";
            referencedColumns: ["id"];
          },
        ];
      };
      habit_definitions: {
        Row: {
          category: string | null;
          color: string | null;
          created_at: string | null;
          description: string | null;
          frequency: string;
          icon: string | null;
          id: string;
          is_active: boolean | null;
          is_template: boolean | null;
          linked_feature: string | null;
          linked_routine_id: string | null;
          name: string;
          order_index: number | null;
          reminder_days: number[] | null;
          reminder_enabled: boolean | null;
          reminder_times: string[] | null;
          target_value: number | null;
          unit: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          category?: string | null;
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          frequency: string;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_template?: boolean | null;
          linked_feature?: string | null;
          linked_routine_id?: string | null;
          name: string;
          order_index?: number | null;
          reminder_days?: number[] | null;
          reminder_enabled?: boolean | null;
          reminder_times?: string[] | null;
          target_value?: number | null;
          unit?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          category?: string | null;
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          frequency?: string;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_template?: boolean | null;
          linked_feature?: string | null;
          linked_routine_id?: string | null;
          name?: string;
          order_index?: number | null;
          reminder_days?: number[] | null;
          reminder_enabled?: boolean | null;
          reminder_times?: string[] | null;
          target_value?: number | null;
          unit?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      habit_entries: {
        Row: {
          completed_at: string | null;
          completed_value: number | null;
          created_at: string | null;
          difficulty_rating: number | null;
          duration_minutes: number | null;
          entry_date: string;
          id: string;
          mood: string | null;
          notes: string | null;
          target_value: number | null;
          updated_at: string | null;
          user_habit_id: string;
        };
        Insert: {
          completed_at?: string | null;
          completed_value?: number | null;
          created_at?: string | null;
          difficulty_rating?: number | null;
          duration_minutes?: number | null;
          entry_date: string;
          id?: string;
          mood?: string | null;
          notes?: string | null;
          target_value?: number | null;
          updated_at?: string | null;
          user_habit_id: string;
        };
        Update: {
          completed_at?: string | null;
          completed_value?: number | null;
          created_at?: string | null;
          difficulty_rating?: number | null;
          duration_minutes?: number | null;
          entry_date?: string;
          id?: string;
          mood?: string | null;
          notes?: string | null;
          target_value?: number | null;
          updated_at?: string | null;
          user_habit_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "habit_entries_user_habit_id_fkey";
            columns: ["user_habit_id"];
            isOneToOne: false;
            referencedRelation: "user_habits";
            referencedColumns: ["id"];
          },
        ];
      };
      habit_streaks: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          streak_end_date: string | null;
          streak_length: number | null;
          streak_start_date: string;
          updated_at: string | null;
          user_habit_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          streak_end_date?: string | null;
          streak_length?: number | null;
          streak_start_date: string;
          updated_at?: string | null;
          user_habit_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          streak_end_date?: string | null;
          streak_length?: number | null;
          streak_start_date?: string;
          updated_at?: string | null;
          user_habit_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "habit_streaks_user_habit_id_fkey";
            columns: ["user_habit_id"];
            isOneToOne: false;
            referencedRelation: "user_habits";
            referencedColumns: ["id"];
          },
        ];
      };
      habit_templates: {
        Row: {
          category: string | null;
          color: string | null;
          created_at: string | null;
          description: string | null;
          frequency: string | null;
          icon: string | null;
          id: string;
          is_featured: boolean | null;
          name: string;
          target_value: number | null;
          unit: string | null;
          usage_count: number | null;
        };
        Insert: {
          category?: string | null;
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          frequency?: string | null;
          icon?: string | null;
          id?: string;
          is_featured?: boolean | null;
          name: string;
          target_value?: number | null;
          unit?: string | null;
          usage_count?: number | null;
        };
        Update: {
          category?: string | null;
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          frequency?: string | null;
          icon?: string | null;
          id?: string;
          is_featured?: boolean | null;
          name?: string;
          target_value?: number | null;
          unit?: string | null;
          usage_count?: number | null;
        };
        Relationships: [];
      };
      haptic_feedback_preferences: {
        Row: {
          created_at: string | null;
          disable_on_low_battery: boolean | null;
          haptic_enabled: boolean | null;
          haptic_intensity: string | null;
          haptic_patterns: Json;
          id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          disable_on_low_battery?: boolean | null;
          haptic_enabled?: boolean | null;
          haptic_intensity?: string | null;
          haptic_patterns: Json;
          id?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          disable_on_low_battery?: boolean | null;
          haptic_enabled?: boolean | null;
          haptic_intensity?: string | null;
          haptic_patterns?: Json;
          id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      health_alerts: {
        Row: {
          action_required: boolean | null;
          action_url: string | null;
          alert_type: string;
          category: string;
          created_at: string | null;
          id: string;
          is_read: boolean | null;
          message: string;
          read_at: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          action_required?: boolean | null;
          action_url?: string | null;
          alert_type: string;
          category: string;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message: string;
          read_at?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          action_required?: boolean | null;
          action_url?: string | null;
          alert_type?: string;
          category?: string;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message?: string;
          read_at?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      health_app_integrations: {
        Row: {
          access_token_encrypted: string | null;
          api_key_encrypted: string | null;
          auto_sync_enabled: boolean | null;
          connection_status: string | null;
          created_at: string | null;
          id: string;
          integration_name: string;
          integration_type: string;
          is_connected: boolean | null;
          last_error: string | null;
          last_sync_at: string | null;
          last_sync_status: string | null;
          permissions_granted: string[] | null;
          permissions_required: string[] | null;
          refresh_token_encrypted: string | null;
          sync_data_types: string[];
          sync_frequency_minutes: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          access_token_encrypted?: string | null;
          api_key_encrypted?: string | null;
          auto_sync_enabled?: boolean | null;
          connection_status?: string | null;
          created_at?: string | null;
          id?: string;
          integration_name: string;
          integration_type: string;
          is_connected?: boolean | null;
          last_error?: string | null;
          last_sync_at?: string | null;
          last_sync_status?: string | null;
          permissions_granted?: string[] | null;
          permissions_required?: string[] | null;
          refresh_token_encrypted?: string | null;
          sync_data_types: string[];
          sync_frequency_minutes?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          access_token_encrypted?: string | null;
          api_key_encrypted?: string | null;
          auto_sync_enabled?: boolean | null;
          connection_status?: string | null;
          created_at?: string | null;
          id?: string;
          integration_name?: string;
          integration_type?: string;
          is_connected?: boolean | null;
          last_error?: string | null;
          last_sync_at?: string | null;
          last_sync_status?: string | null;
          permissions_granted?: string[] | null;
          permissions_required?: string[] | null;
          refresh_token_encrypted?: string | null;
          sync_data_types?: string[];
          sync_frequency_minutes?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      health_assessments: {
        Row: {
          category: string;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          questions: Json;
          recommendations: Json | null;
          risk_levels: Json | null;
          scoring_logic: Json | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          questions: Json;
          recommendations?: Json | null;
          risk_levels?: Json | null;
          scoring_logic?: Json | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          questions?: Json;
          recommendations?: Json | null;
          risk_levels?: Json | null;
          scoring_logic?: Json | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      health_data_conflicts: {
        Row: {
          conflict_type: string;
          created_at: string | null;
          data_type: string;
          external_data: Json;
          id: string;
          integration_id: string | null;
          is_resolved: boolean | null;
          local_data: Json;
          resolution_strategy: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          resolved_data: Json | null;
          user_id: string;
        };
        Insert: {
          conflict_type: string;
          created_at?: string | null;
          data_type: string;
          external_data: Json;
          id?: string;
          integration_id?: string | null;
          is_resolved?: boolean | null;
          local_data: Json;
          resolution_strategy?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          resolved_data?: Json | null;
          user_id: string;
        };
        Update: {
          conflict_type?: string;
          created_at?: string | null;
          data_type?: string;
          external_data?: Json;
          id?: string;
          integration_id?: string | null;
          is_resolved?: boolean | null;
          local_data?: Json;
          resolution_strategy?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          resolved_data?: Json | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "health_data_conflicts_integration_id_fkey";
            columns: ["integration_id"];
            isOneToOne: false;
            referencedRelation: "health_app_integrations";
            referencedColumns: ["id"];
          },
        ];
      };
      health_data_mapping: {
        Row: {
          created_at: string | null;
          data_type: string;
          id: string;
          integration_id: string;
          is_required: boolean | null;
          source_field: string;
          target_field: string;
          transformation_rule: Json | null;
          unit_conversion: Json | null;
          updated_at: string | null;
          validation_rules: Json | null;
        };
        Insert: {
          created_at?: string | null;
          data_type: string;
          id?: string;
          integration_id: string;
          is_required?: boolean | null;
          source_field: string;
          target_field: string;
          transformation_rule?: Json | null;
          unit_conversion?: Json | null;
          updated_at?: string | null;
          validation_rules?: Json | null;
        };
        Update: {
          created_at?: string | null;
          data_type?: string;
          id?: string;
          integration_id?: string;
          is_required?: boolean | null;
          source_field?: string;
          target_field?: string;
          transformation_rule?: Json | null;
          unit_conversion?: Json | null;
          updated_at?: string | null;
          validation_rules?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "health_data_mapping_integration_id_fkey";
            columns: ["integration_id"];
            isOneToOne: false;
            referencedRelation: "health_app_integrations";
            referencedColumns: ["id"];
          },
        ];
      };
      health_data_sync_history: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          data_type: string;
          error_details: Json | null;
          error_message: string | null;
          id: string;
          integration_id: string;
          records_added: number | null;
          records_failed: number | null;
          records_synced: number | null;
          records_updated: number | null;
          started_at: string | null;
          sync_status: string | null;
          sync_type: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          data_type: string;
          error_details?: Json | null;
          error_message?: string | null;
          id?: string;
          integration_id: string;
          records_added?: number | null;
          records_failed?: number | null;
          records_synced?: number | null;
          records_updated?: number | null;
          started_at?: string | null;
          sync_status?: string | null;
          sync_type: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          data_type?: string;
          error_details?: Json | null;
          error_message?: string | null;
          id?: string;
          integration_id?: string;
          records_added?: number | null;
          records_failed?: number | null;
          records_synced?: number | null;
          records_updated?: number | null;
          started_at?: string | null;
          sync_status?: string | null;
          sync_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "health_data_sync_history_integration_id_fkey";
            columns: ["integration_id"];
            isOneToOne: false;
            referencedRelation: "health_app_integrations";
            referencedColumns: ["id"];
          },
        ];
      };
      health_diary: {
        Row: {
          circumference: number | null;
          created_at: string;
          curvature_angle: number | null;
          curvature_direction: string | null;
          entry_date: string;
          id: string;
          length: number | null;
          notes: string | null;
          pain_level: number | null;
          symptoms: string[] | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          circumference?: number | null;
          created_at?: string;
          curvature_angle?: number | null;
          curvature_direction?: string | null;
          entry_date?: string;
          id?: string;
          length?: number | null;
          notes?: string | null;
          pain_level?: number | null;
          symptoms?: string[] | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          circumference?: number | null;
          created_at?: string;
          curvature_angle?: number | null;
          curvature_direction?: string | null;
          entry_date?: string;
          id?: string;
          length?: number | null;
          notes?: string | null;
          pain_level?: number | null;
          symptoms?: string[] | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      health_education_content: {
        Row: {
          category: string;
          content: string;
          content_type: string;
          created_at: string | null;
          difficulty_level: string | null;
          id: string;
          image_url: string | null;
          is_featured: boolean | null;
          is_premium: boolean | null;
          reading_time_minutes: number | null;
          summary: string | null;
          tags: string[] | null;
          title: string;
          updated_at: string | null;
          video_url: string | null;
          view_count: number | null;
        };
        Insert: {
          category: string;
          content: string;
          content_type: string;
          created_at?: string | null;
          difficulty_level?: string | null;
          id?: string;
          image_url?: string | null;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          reading_time_minutes?: number | null;
          summary?: string | null;
          tags?: string[] | null;
          title: string;
          updated_at?: string | null;
          video_url?: string | null;
          view_count?: number | null;
        };
        Update: {
          category?: string;
          content?: string;
          content_type?: string;
          created_at?: string | null;
          difficulty_level?: string | null;
          id?: string;
          image_url?: string | null;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          reading_time_minutes?: number | null;
          summary?: string | null;
          tags?: string[] | null;
          title?: string;
          updated_at?: string | null;
          video_url?: string | null;
          view_count?: number | null;
        };
        Relationships: [];
      };
      health_pattern_cache: {
        Row: {
          analyzed_at: string | null;
          created_at: string | null;
          expires_at: string | null;
          id: string;
          pattern_data: Json;
          user_id: string;
        };
        Insert: {
          analyzed_at?: string | null;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          pattern_data: Json;
          user_id: string;
        };
        Update: {
          analyzed_at?: string | null;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          pattern_data?: Json;
          user_id?: string;
        };
        Relationships: [];
      };
      health_prediction_cache: {
        Row: {
          created_at: string | null;
          expires_at: string | null;
          generated_at: string | null;
          id: string;
          prediction_data: Json;
          timeframe: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          expires_at?: string | null;
          generated_at?: string | null;
          id?: string;
          prediction_data: Json;
          timeframe: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          expires_at?: string | null;
          generated_at?: string | null;
          id?: string;
          prediction_data?: Json;
          timeframe?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      health_risk_factors: {
        Row: {
          assessed_at: string | null;
          created_at: string | null;
          id: string;
          recommendations: string[] | null;
          risk_factors: string[] | null;
          risk_level: string;
          risk_type: string;
          user_id: string;
        };
        Insert: {
          assessed_at?: string | null;
          created_at?: string | null;
          id?: string;
          recommendations?: string[] | null;
          risk_factors?: string[] | null;
          risk_level: string;
          risk_type: string;
          user_id: string;
        };
        Update: {
          assessed_at?: string | null;
          created_at?: string | null;
          id?: string;
          recommendations?: string[] | null;
          risk_factors?: string[] | null;
          risk_level?: string;
          risk_type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      health_risk_predictions: {
        Row: {
          actual_outcome: string | null;
          created_at: string | null;
          id: string;
          model_id: string | null;
          monitoring_recommendations: string[] | null;
          prediction_horizon_days: number;
          prevention_recommendations: string[] | null;
          probability: number | null;
          protective_factors: Json | null;
          risk_factors: Json;
          risk_level: string;
          risk_score: number;
          risk_type: string;
          user_id: string;
          validated: boolean | null;
          validation_date: string | null;
          when_to_see_doctor: string | null;
        };
        Insert: {
          actual_outcome?: string | null;
          created_at?: string | null;
          id?: string;
          model_id?: string | null;
          monitoring_recommendations?: string[] | null;
          prediction_horizon_days: number;
          prevention_recommendations?: string[] | null;
          probability?: number | null;
          protective_factors?: Json | null;
          risk_factors: Json;
          risk_level: string;
          risk_score: number;
          risk_type: string;
          user_id: string;
          validated?: boolean | null;
          validation_date?: string | null;
          when_to_see_doctor?: string | null;
        };
        Update: {
          actual_outcome?: string | null;
          created_at?: string | null;
          id?: string;
          model_id?: string | null;
          monitoring_recommendations?: string[] | null;
          prediction_horizon_days?: number;
          prevention_recommendations?: string[] | null;
          probability?: number | null;
          protective_factors?: Json | null;
          risk_factors?: Json;
          risk_level?: string;
          risk_score?: number;
          risk_type?: string;
          user_id?: string;
          validated?: boolean | null;
          validation_date?: string | null;
          when_to_see_doctor?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "health_risk_predictions_model_id_fkey";
            columns: ["model_id"];
            isOneToOne: false;
            referencedRelation: "predictive_models";
            referencedColumns: ["id"];
          },
        ];
      };
      health_risk_scores: {
        Row: {
          calculated_at: string | null;
          compared_to_population: boolean | null;
          contributing_metrics: Json | null;
          created_at: string | null;
          id: string;
          overall_risk_score: number | null;
          population_percentile: number | null;
          recommendations: string[] | null;
          risk_category: string;
          risk_factors: Json;
          risk_level: string;
          urgency_level: string | null;
          user_id: string;
          valid_until: string | null;
        };
        Insert: {
          calculated_at?: string | null;
          compared_to_population?: boolean | null;
          contributing_metrics?: Json | null;
          created_at?: string | null;
          id?: string;
          overall_risk_score?: number | null;
          population_percentile?: number | null;
          recommendations?: string[] | null;
          risk_category: string;
          risk_factors: Json;
          risk_level: string;
          urgency_level?: string | null;
          user_id: string;
          valid_until?: string | null;
        };
        Update: {
          calculated_at?: string | null;
          compared_to_population?: boolean | null;
          contributing_metrics?: Json | null;
          created_at?: string | null;
          id?: string;
          overall_risk_score?: number | null;
          population_percentile?: number | null;
          recommendations?: string[] | null;
          risk_category?: string;
          risk_factors?: Json;
          risk_level?: string;
          urgency_level?: string | null;
          user_id?: string;
          valid_until?: string | null;
        };
        Relationships: [];
      };
      health_trend_visualizations: {
        Row: {
          chart_config: Json | null;
          chart_image_url: string | null;
          created_at: string | null;
          data_points: Json | null;
          generated_at: string | null;
          id: string;
          insights: string[] | null;
          predictions: Json | null;
          time_period_days: number | null;
          trend_data: Json;
          user_id: string;
          visualization_type: string;
        };
        Insert: {
          chart_config?: Json | null;
          chart_image_url?: string | null;
          created_at?: string | null;
          data_points?: Json | null;
          generated_at?: string | null;
          id?: string;
          insights?: string[] | null;
          predictions?: Json | null;
          time_period_days?: number | null;
          trend_data: Json;
          user_id: string;
          visualization_type: string;
        };
        Update: {
          chart_config?: Json | null;
          chart_image_url?: string | null;
          created_at?: string | null;
          data_points?: Json | null;
          generated_at?: string | null;
          id?: string;
          insights?: string[] | null;
          predictions?: Json | null;
          time_period_days?: number | null;
          trend_data?: Json;
          user_id?: string;
          visualization_type?: string;
        };
        Relationships: [];
      };
      healthcare_providers: {
        Row: {
          address: string | null;
          baa_signed: boolean | null;
          baa_signed_date: string | null;
          created_at: string | null;
          credentials: string[] | null;
          current_patient_count: number | null;
          email: string;
          hipaa_certification_date: string | null;
          hipaa_compliant: boolean | null;
          id: string;
          is_active: boolean | null;
          license_number: string | null;
          license_state: string | null;
          max_patients: number | null;
          phone: string | null;
          provider_name: string;
          provider_type: string;
          specialty: string[] | null;
          subscription_end_date: string | null;
          subscription_start_date: string | null;
          subscription_status: string | null;
          subscription_tier: string | null;
          updated_at: string | null;
          user_id: string;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          baa_signed?: boolean | null;
          baa_signed_date?: string | null;
          created_at?: string | null;
          credentials?: string[] | null;
          current_patient_count?: number | null;
          email: string;
          hipaa_certification_date?: string | null;
          hipaa_compliant?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          license_number?: string | null;
          license_state?: string | null;
          max_patients?: number | null;
          phone?: string | null;
          provider_name: string;
          provider_type: string;
          specialty?: string[] | null;
          subscription_end_date?: string | null;
          subscription_start_date?: string | null;
          subscription_status?: string | null;
          subscription_tier?: string | null;
          updated_at?: string | null;
          user_id: string;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          baa_signed?: boolean | null;
          baa_signed_date?: string | null;
          created_at?: string | null;
          credentials?: string[] | null;
          current_patient_count?: number | null;
          email?: string;
          hipaa_certification_date?: string | null;
          hipaa_compliant?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          license_number?: string | null;
          license_state?: string | null;
          max_patients?: number | null;
          phone?: string | null;
          provider_name?: string;
          provider_type?: string;
          specialty?: string[] | null;
          subscription_end_date?: string | null;
          subscription_start_date?: string | null;
          subscription_status?: string | null;
          subscription_tier?: string | null;
          updated_at?: string | null;
          user_id?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      hipaa_audit_log: {
        Row: {
          action_description: string | null;
          action_result: string | null;
          action_type: string;
          created_at: string | null;
          error_message: string | null;
          hipaa_category: string | null;
          id: string;
          ip_address: unknown;
          patient_id: string | null;
          provider_id: string | null;
          resource_id: string | null;
          resource_type: string;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          action_description?: string | null;
          action_result?: string | null;
          action_type: string;
          created_at?: string | null;
          error_message?: string | null;
          hipaa_category?: string | null;
          id?: string;
          ip_address?: unknown;
          patient_id?: string | null;
          provider_id?: string | null;
          resource_id?: string | null;
          resource_type: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          action_description?: string | null;
          action_result?: string | null;
          action_type?: string;
          created_at?: string | null;
          error_message?: string | null;
          hipaa_category?: string | null;
          id?: string;
          ip_address?: unknown;
          patient_id?: string | null;
          provider_id?: string | null;
          resource_id?: string | null;
          resource_type?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "hipaa_audit_log_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "healthcare_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      hipaa_audit_logs: {
        Row: {
          action_type: string;
          created_at: string;
          description: string | null;
          id: string;
          ip_address: string | null;
          provider_id: string | null;
          resource_id: string | null;
          resource_type: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          action_type: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          ip_address?: string | null;
          provider_id?: string | null;
          resource_id?: string | null;
          resource_type: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          action_type?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          ip_address?: string | null;
          provider_id?: string | null;
          resource_id?: string | null;
          resource_type?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      hormone_levels: {
        Row: {
          created_at: string | null;
          fsh: number | null;
          id: string;
          lab_name: string | null;
          lh: number | null;
          notes: string | null;
          prolactin: number | null;
          shbg: number | null;
          test_date: string;
          testosterone_free: number | null;
          testosterone_total: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          fsh?: number | null;
          id?: string;
          lab_name?: string | null;
          lh?: number | null;
          notes?: string | null;
          prolactin?: number | null;
          shbg?: number | null;
          test_date: string;
          testosterone_free?: number | null;
          testosterone_total?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          fsh?: number | null;
          id?: string;
          lab_name?: string | null;
          lh?: number | null;
          notes?: string | null;
          prolactin?: number | null;
          shbg?: number | null;
          test_date?: string;
          testosterone_free?: number | null;
          testosterone_total?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      import_history: {
        Row: {
          error_message: string | null;
          external_id: string | null;
          id: string;
          import_job_id: string;
          import_status: string | null;
          imported_at: string | null;
          imported_data: Json | null;
          record_id: string | null;
          record_type: string;
          user_id: string;
        };
        Insert: {
          error_message?: string | null;
          external_id?: string | null;
          id?: string;
          import_job_id: string;
          import_status?: string | null;
          imported_at?: string | null;
          imported_data?: Json | null;
          record_id?: string | null;
          record_type: string;
          user_id: string;
        };
        Update: {
          error_message?: string | null;
          external_id?: string | null;
          id?: string;
          import_job_id?: string;
          import_status?: string | null;
          imported_at?: string | null;
          imported_data?: Json | null;
          record_id?: string | null;
          record_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "import_history_import_job_id_fkey";
            columns: ["import_job_id"];
            isOneToOne: false;
            referencedRelation: "import_jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      import_jobs: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          data_mapping: Json | null;
          error_message: string | null;
          failed_at: string | null;
          file_format: string | null;
          file_name: string | null;
          file_size_bytes: number | null;
          file_url: string | null;
          id: string;
          import_config: Json;
          import_errors: Json | null;
          import_name: string;
          import_status: string | null;
          import_type: string;
          progress_percentage: number | null;
          records_failed: number | null;
          records_imported: number | null;
          records_skipped: number | null;
          records_total: number | null;
          source_app: string | null;
          started_at: string | null;
          updated_at: string | null;
          user_id: string;
          validation_errors: Json | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          data_mapping?: Json | null;
          error_message?: string | null;
          failed_at?: string | null;
          file_format?: string | null;
          file_name?: string | null;
          file_size_bytes?: number | null;
          file_url?: string | null;
          id?: string;
          import_config: Json;
          import_errors?: Json | null;
          import_name: string;
          import_status?: string | null;
          import_type: string;
          progress_percentage?: number | null;
          records_failed?: number | null;
          records_imported?: number | null;
          records_skipped?: number | null;
          records_total?: number | null;
          source_app?: string | null;
          started_at?: string | null;
          updated_at?: string | null;
          user_id: string;
          validation_errors?: Json | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          data_mapping?: Json | null;
          error_message?: string | null;
          failed_at?: string | null;
          file_format?: string | null;
          file_name?: string | null;
          file_size_bytes?: number | null;
          file_url?: string | null;
          id?: string;
          import_config?: Json;
          import_errors?: Json | null;
          import_name?: string;
          import_status?: string | null;
          import_type?: string;
          progress_percentage?: number | null;
          records_failed?: number | null;
          records_imported?: number | null;
          records_skipped?: number | null;
          records_total?: number | null;
          source_app?: string | null;
          started_at?: string | null;
          updated_at?: string | null;
          user_id?: string;
          validation_errors?: Json | null;
        };
        Relationships: [];
      };
      injury_prevention_alerts: {
        Row: {
          acknowledged_at: string | null;
          action_taken: string | null;
          affected_exercises: string[] | null;
          alert_type: string;
          alerted_at: string | null;
          created_at: string | null;
          id: string;
          is_acknowledged: boolean | null;
          message: string;
          recommendations: string[] | null;
          risk_factors: Json | null;
          risk_score: number | null;
          routine_id: string | null;
          severity: string | null;
          user_id: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          action_taken?: string | null;
          affected_exercises?: string[] | null;
          alert_type: string;
          alerted_at?: string | null;
          created_at?: string | null;
          id?: string;
          is_acknowledged?: boolean | null;
          message: string;
          recommendations?: string[] | null;
          risk_factors?: Json | null;
          risk_score?: number | null;
          routine_id?: string | null;
          severity?: string | null;
          user_id: string;
        };
        Update: {
          acknowledged_at?: string | null;
          action_taken?: string | null;
          affected_exercises?: string[] | null;
          alert_type?: string;
          alerted_at?: string | null;
          created_at?: string | null;
          id?: string;
          is_acknowledged?: boolean | null;
          message?: string;
          recommendations?: string[] | null;
          risk_factors?: Json | null;
          risk_score?: number | null;
          routine_id?: string | null;
          severity?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      intimate_date_aftercare_items: {
        Row: {
          created_at: string | null;
          created_by: string;
          id: string;
          item: string;
          order_index: number | null;
          proposal_id: string;
        };
        Insert: {
          created_at?: string | null;
          created_by: string;
          id?: string;
          item: string;
          order_index?: number | null;
          proposal_id: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string;
          id?: string;
          item?: string;
          order_index?: number | null;
          proposal_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "intimate_date_aftercare_items_proposal_id_fkey";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "intimate_date_proposals";
            referencedColumns: ["id"];
          },
        ];
      };
      intimate_date_checklist_items: {
        Row: {
          category: string | null;
          created_at: string | null;
          created_by: string;
          id: string;
          is_required: boolean | null;
          item: string;
          order_index: number | null;
          proposal_id: string;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          created_by: string;
          id?: string;
          is_required?: boolean | null;
          item: string;
          order_index?: number | null;
          proposal_id: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          created_by?: string;
          id?: string;
          is_required?: boolean | null;
          item?: string;
          order_index?: number | null;
          proposal_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "intimate_date_checklist_items_proposal_id_fkey";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "intimate_date_proposals";
            referencedColumns: ["id"];
          },
        ];
      };
      intimate_date_distractions: {
        Row: {
          created_at: string | null;
          created_by: string;
          id: string;
          label: string;
          proposal_id: string;
        };
        Insert: {
          created_at?: string | null;
          created_by: string;
          id?: string;
          label: string;
          proposal_id: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string;
          id?: string;
          label?: string;
          proposal_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "intimate_date_distractions_proposal_id_fkey";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "intimate_date_proposals";
            referencedColumns: ["id"];
          },
        ];
      };
      intimate_date_itinerary_items: {
        Row: {
          created_at: string | null;
          created_by: string;
          id: string;
          location: string | null;
          notes: string | null;
          order_index: number | null;
          proposal_id: string;
          segment: string;
          time: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by: string;
          id?: string;
          location?: string | null;
          notes?: string | null;
          order_index?: number | null;
          proposal_id: string;
          segment: string;
          time?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string;
          id?: string;
          location?: string | null;
          notes?: string | null;
          order_index?: number | null;
          proposal_id?: string;
          segment?: string;
          time?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "intimate_date_itinerary_items_proposal_id_fkey";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "intimate_date_proposals";
            referencedColumns: ["id"];
          },
        ];
      };
      intimate_date_packing_items: {
        Row: {
          created_at: string | null;
          created_by: string;
          id: string;
          item: string;
          order_index: number | null;
          proposal_id: string;
        };
        Insert: {
          created_at?: string | null;
          created_by: string;
          id?: string;
          item: string;
          order_index?: number | null;
          proposal_id: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string;
          id?: string;
          item?: string;
          order_index?: number | null;
          proposal_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "intimate_date_packing_items_proposal_id_fkey";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "intimate_date_proposals";
            referencedColumns: ["id"];
          },
        ];
      };
      intimate_date_positions: {
        Row: {
          created_at: string | null;
          created_by: string;
          id: string;
          position_id: string | null;
          position_label: string;
          proposal_id: string;
        };
        Insert: {
          created_at?: string | null;
          created_by: string;
          id?: string;
          position_id?: string | null;
          position_label: string;
          proposal_id: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string;
          id?: string;
          position_id?: string | null;
          position_label?: string;
          proposal_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "intimate_date_positions_position_id_fkey";
            columns: ["position_id"];
            isOneToOne: false;
            referencedRelation: "nsfw_positions_gallery";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "intimate_date_positions_proposal_id_fkey";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "intimate_date_proposals";
            referencedColumns: ["id"];
          },
        ];
      };
      intimate_date_proposals: {
        Row: {
          accepted_at: string | null;
          activities: Json;
          adult_emojis: string[] | null;
          created_at: string | null;
          creator_id: string;
          duration_minutes: number | null;
          gifs_urls: string[] | null;
          id: string;
          images_urls: string[] | null;
          is_location_private: boolean | null;
          links: string[] | null;
          location_address: string | null;
          location_name: string | null;
          location_type: string | null;
          partner_id: string;
          partner_media_urls: string[] | null;
          partner_modified_date: string | null;
          partner_modified_time: string | null;
          partner_response: string | null;
          partner_suggestions: string | null;
          proposal_status: string | null;
          proposal_title: string;
          proposal_type: string | null;
          proposed_date: string;
          proposed_time: string;
          responded_at: string | null;
          reviewed_at: string | null;
          special_requests: string | null;
          specialty_intimacy: string[] | null;
          template_id: string | null;
          text_message: string | null;
          updated_at: string | null;
          videos_urls: string[] | null;
          voice_message_duration_seconds: number | null;
          voice_message_url: string | null;
        };
        Insert: {
          accepted_at?: string | null;
          activities: Json;
          adult_emojis?: string[] | null;
          created_at?: string | null;
          creator_id: string;
          duration_minutes?: number | null;
          gifs_urls?: string[] | null;
          id?: string;
          images_urls?: string[] | null;
          is_location_private?: boolean | null;
          links?: string[] | null;
          location_address?: string | null;
          location_name?: string | null;
          location_type?: string | null;
          partner_id: string;
          partner_media_urls?: string[] | null;
          partner_modified_date?: string | null;
          partner_modified_time?: string | null;
          partner_response?: string | null;
          partner_suggestions?: string | null;
          proposal_status?: string | null;
          proposal_title: string;
          proposal_type?: string | null;
          proposed_date: string;
          proposed_time: string;
          responded_at?: string | null;
          reviewed_at?: string | null;
          special_requests?: string | null;
          specialty_intimacy?: string[] | null;
          template_id?: string | null;
          text_message?: string | null;
          updated_at?: string | null;
          videos_urls?: string[] | null;
          voice_message_duration_seconds?: number | null;
          voice_message_url?: string | null;
        };
        Update: {
          accepted_at?: string | null;
          activities?: Json;
          adult_emojis?: string[] | null;
          created_at?: string | null;
          creator_id?: string;
          duration_minutes?: number | null;
          gifs_urls?: string[] | null;
          id?: string;
          images_urls?: string[] | null;
          is_location_private?: boolean | null;
          links?: string[] | null;
          location_address?: string | null;
          location_name?: string | null;
          location_type?: string | null;
          partner_id?: string;
          partner_media_urls?: string[] | null;
          partner_modified_date?: string | null;
          partner_modified_time?: string | null;
          partner_response?: string | null;
          partner_suggestions?: string | null;
          proposal_status?: string | null;
          proposal_title?: string;
          proposal_type?: string | null;
          proposed_date?: string;
          proposed_time?: string;
          responded_at?: string | null;
          reviewed_at?: string | null;
          special_requests?: string | null;
          specialty_intimacy?: string[] | null;
          template_id?: string | null;
          text_message?: string | null;
          updated_at?: string | null;
          videos_urls?: string[] | null;
          voice_message_duration_seconds?: number | null;
          voice_message_url?: string | null;
        };
        Relationships: [];
      };
      intimate_date_reflections: {
        Row: {
          created_at: string | null;
          id: string;
          notes: string | null;
          proposal_id: string;
          rating: number | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          proposal_id: string;
          rating?: number | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          proposal_id?: string;
          rating?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "intimate_date_reflections_proposal_id_fkey";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "intimate_date_proposals";
            referencedColumns: ["id"];
          },
        ];
      };
      intimate_date_reminders: {
        Row: {
          created_at: string | null;
          created_by: string;
          id: string;
          notes: string | null;
          proposal_id: string;
          remind_at: string;
          reminder_type: string;
        };
        Insert: {
          created_at?: string | null;
          created_by: string;
          id?: string;
          notes?: string | null;
          proposal_id: string;
          remind_at: string;
          reminder_type: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string;
          id?: string;
          notes?: string | null;
          proposal_id?: string;
          remind_at?: string;
          reminder_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "intimate_date_reminders_proposal_id_fkey";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "intimate_date_proposals";
            referencedColumns: ["id"];
          },
        ];
      };
      intimate_date_templates: {
        Row: {
          created_at: string | null;
          default_activities: Json;
          default_duration_minutes: number | null;
          default_location_type: string | null;
          default_message: string | null;
          default_positions: string[] | null;
          default_voice_script: string | null;
          id: string;
          is_public: boolean | null;
          template_category: string | null;
          template_name: string;
          updated_at: string | null;
          usage_count: number | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          default_activities: Json;
          default_duration_minutes?: number | null;
          default_location_type?: string | null;
          default_message?: string | null;
          default_positions?: string[] | null;
          default_voice_script?: string | null;
          id?: string;
          is_public?: boolean | null;
          template_category?: string | null;
          template_name: string;
          updated_at?: string | null;
          usage_count?: number | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          default_activities?: Json;
          default_duration_minutes?: number | null;
          default_location_type?: string | null;
          default_message?: string | null;
          default_positions?: string[] | null;
          default_voice_script?: string | null;
          id?: string;
          is_public?: boolean | null;
          template_category?: string | null;
          template_name?: string;
          updated_at?: string | null;
          usage_count?: number | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      leaderboard_entries: {
        Row: {
          display_name: string | null;
          id: string;
          is_anonymous: boolean | null;
          leaderboard_id: string;
          metrics: Json | null;
          rank: number | null;
          score: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          display_name?: string | null;
          id?: string;
          is_anonymous?: boolean | null;
          leaderboard_id: string;
          metrics?: Json | null;
          rank?: number | null;
          score?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          display_name?: string | null;
          id?: string;
          is_anonymous?: boolean | null;
          leaderboard_id?: string;
          metrics?: Json | null;
          rank?: number | null;
          score?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_leaderboard_id_fkey";
            columns: ["leaderboard_id"];
            isOneToOne: false;
            referencedRelation: "leaderboards";
            referencedColumns: ["id"];
          },
        ];
      };
      leaderboards: {
        Row: {
          created_at: string | null;
          description: string | null;
          display_name: string | null;
          id: string;
          is_active: boolean | null;
          is_anonymous: boolean | null;
          leaderboard_type: string;
          metric_type: string | null;
          name: string | null;
          period: string;
          period_end: string | null;
          period_start: string | null;
          rank: number | null;
          requires_opt_in: boolean | null;
          score: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          display_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_anonymous?: boolean | null;
          leaderboard_type: string;
          metric_type?: string | null;
          name?: string | null;
          period?: string;
          period_end?: string | null;
          period_start?: string | null;
          rank?: number | null;
          requires_opt_in?: boolean | null;
          score?: number;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          display_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_anonymous?: boolean | null;
          leaderboard_type?: string;
          metric_type?: string | null;
          name?: string | null;
          period?: string;
          period_end?: string | null;
          period_start?: string | null;
          rank?: number | null;
          requires_opt_in?: boolean | null;
          score?: number;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      learning_certificates: {
        Row: {
          certificate_number: string;
          course_id: string;
          created_at: string | null;
          id: string;
          issued_at: string | null;
          pdf_url: string | null;
          user_id: string;
        };
        Insert: {
          certificate_number: string;
          course_id: string;
          created_at?: string | null;
          id?: string;
          issued_at?: string | null;
          pdf_url?: string | null;
          user_id: string;
        };
        Update: {
          certificate_number?: string;
          course_id?: string;
          created_at?: string | null;
          id?: string;
          issued_at?: string | null;
          pdf_url?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "learning_certificates_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "learning_courses";
            referencedColumns: ["id"];
          },
        ];
      };
      learning_course_reviews: {
        Row: {
          course_id: string;
          created_at: string | null;
          id: string;
          rating: number;
          review_text: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          course_id: string;
          created_at?: string | null;
          id?: string;
          rating: number;
          review_text?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          course_id?: string;
          created_at?: string | null;
          id?: string;
          rating?: number;
          review_text?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "learning_course_reviews_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "learning_courses";
            referencedColumns: ["id"];
          },
        ];
      };
      learning_courses: {
        Row: {
          average_rating: number | null;
          category: string | null;
          completion_count: number | null;
          created_at: string | null;
          description: string | null;
          difficulty_level: string | null;
          enrollment_count: number | null;
          estimated_duration_minutes: number | null;
          id: string;
          intro_video_url: string | null;
          is_featured: boolean | null;
          is_premium: boolean | null;
          is_published: boolean | null;
          lesson_count: number | null;
          module_count: number | null;
          order_index: number | null;
          rating_count: number | null;
          thumbnail_url: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          average_rating?: number | null;
          category?: string | null;
          completion_count?: number | null;
          created_at?: string | null;
          description?: string | null;
          difficulty_level?: string | null;
          enrollment_count?: number | null;
          estimated_duration_minutes?: number | null;
          id?: string;
          intro_video_url?: string | null;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          is_published?: boolean | null;
          lesson_count?: number | null;
          module_count?: number | null;
          order_index?: number | null;
          rating_count?: number | null;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          average_rating?: number | null;
          category?: string | null;
          completion_count?: number | null;
          created_at?: string | null;
          description?: string | null;
          difficulty_level?: string | null;
          enrollment_count?: number | null;
          estimated_duration_minutes?: number | null;
          id?: string;
          intro_video_url?: string | null;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          is_published?: boolean | null;
          lesson_count?: number | null;
          module_count?: number | null;
          order_index?: number | null;
          rating_count?: number | null;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      learning_enrollments: {
        Row: {
          completed_at: string | null;
          course_id: string;
          current_lesson_id: string | null;
          current_module_id: string | null;
          id: string;
          last_accessed_at: string | null;
          progress_percentage: number | null;
          started_at: string | null;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          course_id: string;
          current_lesson_id?: string | null;
          current_module_id?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          progress_percentage?: number | null;
          started_at?: string | null;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          course_id?: string;
          current_lesson_id?: string | null;
          current_module_id?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          progress_percentage?: number | null;
          started_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "learning_enrollments_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "learning_courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "learning_enrollments_current_lesson_id_fkey";
            columns: ["current_lesson_id"];
            isOneToOne: false;
            referencedRelation: "learning_lessons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "learning_enrollments_current_module_id_fkey";
            columns: ["current_module_id"];
            isOneToOne: false;
            referencedRelation: "learning_modules";
            referencedColumns: ["id"];
          },
        ];
      };
      learning_lesson_progress: {
        Row: {
          attempts: number | null;
          completed_at: string | null;
          completion_percentage: number | null;
          id: string;
          is_completed: boolean | null;
          last_accessed_at: string | null;
          lesson_id: string;
          time_spent_minutes: number | null;
          user_id: string;
        };
        Insert: {
          attempts?: number | null;
          completed_at?: string | null;
          completion_percentage?: number | null;
          id?: string;
          is_completed?: boolean | null;
          last_accessed_at?: string | null;
          lesson_id: string;
          time_spent_minutes?: number | null;
          user_id: string;
        };
        Update: {
          attempts?: number | null;
          completed_at?: string | null;
          completion_percentage?: number | null;
          id?: string;
          is_completed?: boolean | null;
          last_accessed_at?: string | null;
          lesson_id?: string;
          time_spent_minutes?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "learning_lesson_progress_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "learning_lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      learning_lessons: {
        Row: {
          content_data: Json | null;
          content_type: string;
          created_at: string | null;
          estimated_duration_minutes: number | null;
          id: string;
          module_id: string;
          order_index: number | null;
          requires_completion_of: string[] | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          content_data?: Json | null;
          content_type: string;
          created_at?: string | null;
          estimated_duration_minutes?: number | null;
          id?: string;
          module_id: string;
          order_index?: number | null;
          requires_completion_of?: string[] | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          content_data?: Json | null;
          content_type?: string;
          created_at?: string | null;
          estimated_duration_minutes?: number | null;
          id?: string;
          module_id?: string;
          order_index?: number | null;
          requires_completion_of?: string[] | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "learning_lessons_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "learning_modules";
            referencedColumns: ["id"];
          },
        ];
      };
      learning_modules: {
        Row: {
          course_id: string;
          created_at: string | null;
          description: string | null;
          estimated_duration_minutes: number | null;
          id: string;
          lesson_count: number | null;
          order_index: number | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          course_id: string;
          created_at?: string | null;
          description?: string | null;
          estimated_duration_minutes?: number | null;
          id?: string;
          lesson_count?: number | null;
          order_index?: number | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          course_id?: string;
          created_at?: string | null;
          description?: string | null;
          estimated_duration_minutes?: number | null;
          id?: string;
          lesson_count?: number | null;
          order_index?: number | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "learning_modules_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "learning_courses";
            referencedColumns: ["id"];
          },
        ];
      };
      learning_paths: {
        Row: {
          completed_at: string | null;
          course_ids: string[];
          created_at: string | null;
          current_course_index: number | null;
          description: string | null;
          id: string;
          name: string;
          path_type: string | null;
          progress_percentage: number | null;
          started_at: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          course_ids: string[];
          created_at?: string | null;
          current_course_index?: number | null;
          description?: string | null;
          id?: string;
          name: string;
          path_type?: string | null;
          progress_percentage?: number | null;
          started_at?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          course_ids?: string[];
          created_at?: string | null;
          current_course_index?: number | null;
          description?: string | null;
          id?: string;
          name?: string;
          path_type?: string | null;
          progress_percentage?: number | null;
          started_at?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      learning_quiz_attempts: {
        Row: {
          answers: Json;
          completed_at: string | null;
          created_at: string | null;
          id: string;
          passed: boolean | null;
          percentage_score: number | null;
          quiz_id: string;
          score: number | null;
          started_at: string | null;
          time_taken_seconds: number | null;
          user_id: string;
        };
        Insert: {
          answers: Json;
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          passed?: boolean | null;
          percentage_score?: number | null;
          quiz_id: string;
          score?: number | null;
          started_at?: string | null;
          time_taken_seconds?: number | null;
          user_id: string;
        };
        Update: {
          answers?: Json;
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          passed?: boolean | null;
          percentage_score?: number | null;
          quiz_id?: string;
          score?: number | null;
          started_at?: string | null;
          time_taken_seconds?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "learning_quiz_attempts_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "learning_quizzes";
            referencedColumns: ["id"];
          },
        ];
      };
      learning_quizzes: {
        Row: {
          attempt_limit: number | null;
          course_id: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          lesson_id: string | null;
          passing_score: number | null;
          questions: Json;
          quiz_type: string | null;
          show_results_immediately: boolean | null;
          time_limit_minutes: number | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          attempt_limit?: number | null;
          course_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          lesson_id?: string | null;
          passing_score?: number | null;
          questions: Json;
          quiz_type?: string | null;
          show_results_immediately?: boolean | null;
          time_limit_minutes?: number | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          attempt_limit?: number | null;
          course_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          lesson_id?: string | null;
          passing_score?: number | null;
          questions?: Json;
          quiz_type?: string | null;
          show_results_immediately?: boolean | null;
          time_limit_minutes?: number | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "learning_quizzes_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "learning_courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "learning_quizzes_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "learning_lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      learning_recommendations: {
        Row: {
          confidence_score: number | null;
          course_id: string;
          created_at: string | null;
          id: string;
          is_enrolled: boolean | null;
          is_viewed: boolean | null;
          priority: number | null;
          recommendation_reason: string | null;
          user_id: string;
        };
        Insert: {
          confidence_score?: number | null;
          course_id: string;
          created_at?: string | null;
          id?: string;
          is_enrolled?: boolean | null;
          is_viewed?: boolean | null;
          priority?: number | null;
          recommendation_reason?: string | null;
          user_id: string;
        };
        Update: {
          confidence_score?: number | null;
          course_id?: string;
          created_at?: string | null;
          id?: string;
          is_enrolled?: boolean | null;
          is_viewed?: boolean | null;
          priority?: number | null;
          recommendation_reason?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "learning_recommendations_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "learning_courses";
            referencedColumns: ["id"];
          },
        ];
      };
      location_based_features: {
        Row: {
          action_data: Json;
          created_at: string | null;
          feature_name: string;
          feature_type: string;
          id: string;
          is_active: boolean | null;
          latitude: number | null;
          location_name: string | null;
          longitude: number | null;
          radius_meters: number | null;
          trigger_on_enter: boolean | null;
          trigger_on_exit: boolean | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          action_data: Json;
          created_at?: string | null;
          feature_name: string;
          feature_type: string;
          id?: string;
          is_active?: boolean | null;
          latitude?: number | null;
          location_name?: string | null;
          longitude?: number | null;
          radius_meters?: number | null;
          trigger_on_enter?: boolean | null;
          trigger_on_exit?: boolean | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          action_data?: Json;
          created_at?: string | null;
          feature_name?: string;
          feature_type?: string;
          id?: string;
          is_active?: boolean | null;
          latitude?: number | null;
          location_name?: string | null;
          longitude?: number | null;
          radius_meters?: number | null;
          trigger_on_enter?: boolean | null;
          trigger_on_exit?: boolean | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      login_history: {
        Row: {
          device_id: string | null;
          failure_reason: string | null;
          id: string;
          ip_address: unknown;
          is_suspicious: boolean | null;
          location_city: string | null;
          location_country: string | null;
          logged_at: string | null;
          login_method: string;
          login_status: string;
          suspicious_reasons: string[] | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          device_id?: string | null;
          failure_reason?: string | null;
          id?: string;
          ip_address?: unknown;
          is_suspicious?: boolean | null;
          location_city?: string | null;
          location_country?: string | null;
          logged_at?: string | null;
          login_method: string;
          login_status: string;
          suspicious_reasons?: string[] | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          device_id?: string | null;
          failure_reason?: string | null;
          id?: string;
          ip_address?: unknown;
          is_suspicious?: boolean | null;
          location_city?: string | null;
          location_country?: string | null;
          logged_at?: string | null;
          login_method?: string;
          login_status?: string;
          suspicious_reasons?: string[] | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "login_history_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "user_devices";
            referencedColumns: ["id"];
          },
        ];
      };
      long_term_health_forecasts: {
        Row: {
          best_case_trajectory: Json | null;
          confidence_intervals: Json | null;
          created_at: string | null;
          forecast_date: string;
          forecast_horizon_years: number;
          forecasted_metrics: Json;
          id: string;
          intervention_opportunities: Json | null;
          key_factors: Json | null;
          long_term_recommendations: string[] | null;
          milestone_goals: Json | null;
          model_id: string | null;
          most_likely_trajectory: Json | null;
          user_id: string;
          worst_case_trajectory: Json | null;
        };
        Insert: {
          best_case_trajectory?: Json | null;
          confidence_intervals?: Json | null;
          created_at?: string | null;
          forecast_date: string;
          forecast_horizon_years: number;
          forecasted_metrics: Json;
          id?: string;
          intervention_opportunities?: Json | null;
          key_factors?: Json | null;
          long_term_recommendations?: string[] | null;
          milestone_goals?: Json | null;
          model_id?: string | null;
          most_likely_trajectory?: Json | null;
          user_id: string;
          worst_case_trajectory?: Json | null;
        };
        Update: {
          best_case_trajectory?: Json | null;
          confidence_intervals?: Json | null;
          created_at?: string | null;
          forecast_date?: string;
          forecast_horizon_years?: number;
          forecasted_metrics?: Json;
          id?: string;
          intervention_opportunities?: Json | null;
          key_factors?: Json | null;
          long_term_recommendations?: string[] | null;
          milestone_goals?: Json | null;
          model_id?: string | null;
          most_likely_trajectory?: Json | null;
          user_id?: string;
          worst_case_trajectory?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "long_term_health_forecasts_model_id_fkey";
            columns: ["model_id"];
            isOneToOne: false;
            referencedRelation: "predictive_models";
            referencedColumns: ["id"];
          },
        ];
      };
      marketplace_categories: {
        Row: {
          category_description: string | null;
          category_name: string;
          category_type: string;
          created_at: string | null;
          icon_url: string | null;
          id: string;
          is_active: boolean | null;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          category_description?: string | null;
          category_name: string;
          category_type: string;
          created_at?: string | null;
          icon_url?: string | null;
          id?: string;
          is_active?: boolean | null;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          category_description?: string | null;
          category_name?: string;
          category_type?: string;
          created_at?: string | null;
          icon_url?: string | null;
          id?: string;
          is_active?: boolean | null;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      marketplace_items: {
        Row: {
          average_rating: number | null;
          category_id: string | null;
          content_data: Json;
          created_at: string | null;
          creator_id: string;
          currency: string | null;
          description: string;
          difficulty_level: string | null;
          expert_bio: string | null;
          expert_credentials: string | null;
          expert_name: string | null;
          id: string;
          is_active: boolean | null;
          is_approved: boolean | null;
          is_featured: boolean | null;
          is_free: boolean | null;
          is_subscription: boolean | null;
          is_trending: boolean | null;
          is_verified: boolean | null;
          item_type: string;
          moderation_notes: string | null;
          preview_content: Json | null;
          preview_images: string[] | null;
          preview_video_url: string | null;
          price: number;
          purchase_count: number | null;
          rating_count: number | null;
          revenue_total: number | null;
          review_count: number | null;
          seller_id: string | null;
          status: string | null;
          subscription_duration_days: number | null;
          tags: string[] | null;
          target_audience: string[] | null;
          thumbnail_url: string | null;
          title: string;
          updated_at: string | null;
          view_count: number | null;
        };
        Insert: {
          average_rating?: number | null;
          category_id?: string | null;
          content_data: Json;
          created_at?: string | null;
          creator_id: string;
          currency?: string | null;
          description: string;
          difficulty_level?: string | null;
          expert_bio?: string | null;
          expert_credentials?: string | null;
          expert_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          is_free?: boolean | null;
          is_subscription?: boolean | null;
          is_trending?: boolean | null;
          is_verified?: boolean | null;
          item_type: string;
          moderation_notes?: string | null;
          preview_content?: Json | null;
          preview_images?: string[] | null;
          preview_video_url?: string | null;
          price: number;
          purchase_count?: number | null;
          rating_count?: number | null;
          revenue_total?: number | null;
          review_count?: number | null;
          seller_id?: string | null;
          status?: string | null;
          subscription_duration_days?: number | null;
          tags?: string[] | null;
          target_audience?: string[] | null;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Update: {
          average_rating?: number | null;
          category_id?: string | null;
          content_data?: Json;
          created_at?: string | null;
          creator_id?: string;
          currency?: string | null;
          description?: string;
          difficulty_level?: string | null;
          expert_bio?: string | null;
          expert_credentials?: string | null;
          expert_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          is_free?: boolean | null;
          is_subscription?: boolean | null;
          is_trending?: boolean | null;
          is_verified?: boolean | null;
          item_type?: string;
          moderation_notes?: string | null;
          preview_content?: Json | null;
          preview_images?: string[] | null;
          preview_video_url?: string | null;
          price?: number;
          purchase_count?: number | null;
          rating_count?: number | null;
          revenue_total?: number | null;
          review_count?: number | null;
          seller_id?: string | null;
          status?: string | null;
          subscription_duration_days?: number | null;
          tags?: string[] | null;
          target_audience?: string[] | null;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "marketplace_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "marketplace_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      marketplace_purchases: {
        Row: {
          access_expires_at: string | null;
          access_granted_at: string | null;
          id: string;
          is_active: boolean | null;
          item_id: string;
          payment_intent_id: string | null;
          price_paid: number;
          purchase_type: string | null;
          purchased_at: string | null;
          user_id: string;
        };
        Insert: {
          access_expires_at?: string | null;
          access_granted_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          item_id: string;
          payment_intent_id?: string | null;
          price_paid: number;
          purchase_type?: string | null;
          purchased_at?: string | null;
          user_id: string;
        };
        Update: {
          access_expires_at?: string | null;
          access_granted_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          item_id?: string;
          payment_intent_id?: string | null;
          price_paid?: number;
          purchase_type?: string | null;
          purchased_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketplace_purchases_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "marketplace_items";
            referencedColumns: ["id"];
          },
        ];
      };
      measurement_suggestions: {
        Row: {
          applied_at: string | null;
          created_at: string | null;
          current_value: number | null;
          id: string;
          improvement_expected: number | null;
          is_applied: boolean | null;
          priority: string | null;
          reasoning: string | null;
          scan_id: string | null;
          suggested_value: number | null;
          suggestion_type: string;
          user_id: string;
        };
        Insert: {
          applied_at?: string | null;
          created_at?: string | null;
          current_value?: number | null;
          id?: string;
          improvement_expected?: number | null;
          is_applied?: boolean | null;
          priority?: string | null;
          reasoning?: string | null;
          scan_id?: string | null;
          suggested_value?: number | null;
          suggestion_type: string;
          user_id: string;
        };
        Update: {
          applied_at?: string | null;
          created_at?: string | null;
          current_value?: number | null;
          id?: string;
          improvement_expected?: number | null;
          is_applied?: boolean | null;
          priority?: string | null;
          reasoning?: string | null;
          scan_id?: string | null;
          suggested_value?: number | null;
          suggestion_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "measurement_suggestions_scan_id_fkey";
            columns: ["scan_id"];
            isOneToOne: false;
            referencedRelation: "scans";
            referencedColumns: ["id"];
          },
        ];
      };
      measurement_templates: {
        Row: {
          angle_requirements: Json | null;
          auto_capture_enabled: boolean | null;
          calibration_data: Json | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_default: boolean | null;
          is_shared: boolean | null;
          measurement_points: Json;
          quality_threshold: number | null;
          reference_object_size: number | null;
          template_name: string;
          updated_at: string | null;
          usage_count: number | null;
          user_id: string;
        };
        Insert: {
          angle_requirements?: Json | null;
          auto_capture_enabled?: boolean | null;
          calibration_data?: Json | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_default?: boolean | null;
          is_shared?: boolean | null;
          measurement_points: Json;
          quality_threshold?: number | null;
          reference_object_size?: number | null;
          template_name: string;
          updated_at?: string | null;
          usage_count?: number | null;
          user_id: string;
        };
        Update: {
          angle_requirements?: Json | null;
          auto_capture_enabled?: boolean | null;
          calibration_data?: Json | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_default?: boolean | null;
          is_shared?: boolean | null;
          measurement_points?: Json;
          quality_threshold?: number | null;
          reference_object_size?: number | null;
          template_name?: string;
          updated_at?: string | null;
          usage_count?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      medical_export_requests: {
        Row: {
          anonymize_data: boolean | null;
          completed_at: string | null;
          created_at: string | null;
          date_range_end: string;
          date_range_start: string;
          expires_at: string | null;
          export_password: string | null;
          export_type: string;
          file_size_bytes: number | null;
          file_url: string | null;
          id: string;
          include_diary_entries: boolean | null;
          include_photos: boolean | null;
          include_scans: boolean | null;
          include_wellness_scores: boolean | null;
          status: string | null;
          user_id: string;
        };
        Insert: {
          anonymize_data?: boolean | null;
          completed_at?: string | null;
          created_at?: string | null;
          date_range_end: string;
          date_range_start: string;
          expires_at?: string | null;
          export_password?: string | null;
          export_type: string;
          file_size_bytes?: number | null;
          file_url?: string | null;
          id?: string;
          include_diary_entries?: boolean | null;
          include_photos?: boolean | null;
          include_scans?: boolean | null;
          include_wellness_scores?: boolean | null;
          status?: string | null;
          user_id: string;
        };
        Update: {
          anonymize_data?: boolean | null;
          completed_at?: string | null;
          created_at?: string | null;
          date_range_end?: string;
          date_range_start?: string;
          expires_at?: string | null;
          export_password?: string | null;
          export_type?: string;
          file_size_bytes?: number | null;
          file_url?: string | null;
          id?: string;
          include_diary_entries?: boolean | null;
          include_photos?: boolean | null;
          include_scans?: boolean | null;
          include_wellness_scores?: boolean | null;
          status?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      medical_report_templates: {
        Row: {
          created_at: string | null;
          description: string | null;
          formatting_options: Json | null;
          id: string;
          is_active: boolean | null;
          is_default: boolean | null;
          name: string;
          sections: Json;
          template_type: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          formatting_options?: Json | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          name: string;
          sections: Json;
          template_type: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          formatting_options?: Json | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          name?: string;
          sections?: Json;
          template_type?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      medication_log: {
        Row: {
          created_at: string | null;
          dosage: string;
          id: string;
          medication_name: string;
          notes: string | null;
          schedule_id: string | null;
          scheduled_time: string | null;
          taken_at: string;
          user_id: string;
          was_missed: boolean | null;
          was_on_time: boolean | null;
        };
        Insert: {
          created_at?: string | null;
          dosage: string;
          id?: string;
          medication_name: string;
          notes?: string | null;
          schedule_id?: string | null;
          scheduled_time?: string | null;
          taken_at: string;
          user_id: string;
          was_missed?: boolean | null;
          was_on_time?: boolean | null;
        };
        Update: {
          created_at?: string | null;
          dosage?: string;
          id?: string;
          medication_name?: string;
          notes?: string | null;
          schedule_id?: string | null;
          scheduled_time?: string | null;
          taken_at?: string;
          user_id?: string;
          was_missed?: boolean | null;
          was_on_time?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "medication_log_schedule_id_fkey";
            columns: ["schedule_id"];
            isOneToOne: false;
            referencedRelation: "medication_schedules";
            referencedColumns: ["id"];
          },
        ];
      };
      medication_schedules: {
        Row: {
          adherence_percentage: number | null;
          created_at: string | null;
          days_of_week: number[] | null;
          dosage: string;
          end_date: string | null;
          frequency: string;
          id: string;
          is_active: boolean | null;
          medication_name: string;
          missed_doses: number | null;
          notes: string | null;
          reminder_enabled: boolean | null;
          reminder_minutes_before: number | null;
          specific_times: string[] | null;
          start_date: string | null;
          times_per_day: number | null;
          total_doses: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          adherence_percentage?: number | null;
          created_at?: string | null;
          days_of_week?: number[] | null;
          dosage: string;
          end_date?: string | null;
          frequency: string;
          id?: string;
          is_active?: boolean | null;
          medication_name: string;
          missed_doses?: number | null;
          notes?: string | null;
          reminder_enabled?: boolean | null;
          reminder_minutes_before?: number | null;
          specific_times?: string[] | null;
          start_date?: string | null;
          times_per_day?: number | null;
          total_doses?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          adherence_percentage?: number | null;
          created_at?: string | null;
          days_of_week?: number[] | null;
          dosage?: string;
          end_date?: string | null;
          frequency?: string;
          id?: string;
          is_active?: boolean | null;
          medication_name?: string;
          missed_doses?: number | null;
          notes?: string | null;
          reminder_enabled?: boolean | null;
          reminder_minutes_before?: number | null;
          specific_times?: string[] | null;
          start_date?: string | null;
          times_per_day?: number | null;
          total_doses?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      message_attachments: {
        Row: {
          created_at: string | null;
          file_name: string;
          file_size: number | null;
          file_type: string;
          file_url: string;
          id: string;
          message_id: string;
          message_type: string;
          thumbnail_url: string | null;
          uploaded_by: string;
        };
        Insert: {
          created_at?: string | null;
          file_name: string;
          file_size?: number | null;
          file_type: string;
          file_url: string;
          id?: string;
          message_id: string;
          message_type: string;
          thumbnail_url?: string | null;
          uploaded_by: string;
        };
        Update: {
          created_at?: string | null;
          file_name?: string;
          file_size?: number | null;
          file_type?: string;
          file_url?: string;
          id?: string;
          message_id?: string;
          message_type?: string;
          thumbnail_url?: string | null;
          uploaded_by?: string;
        };
        Relationships: [];
      };
      mobile_widget_configurations: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          is_pinned: boolean | null;
          platform: string;
          refresh_frequency_minutes: number | null;
          updated_at: string | null;
          user_id: string;
          widget_config: Json;
          widget_name: string;
          widget_type: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_pinned?: boolean | null;
          platform: string;
          refresh_frequency_minutes?: number | null;
          updated_at?: string | null;
          user_id: string;
          widget_config: Json;
          widget_name: string;
          widget_type: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_pinned?: boolean | null;
          platform?: string;
          refresh_frequency_minutes?: number | null;
          updated_at?: string | null;
          user_id?: string;
          widget_config?: Json;
          widget_name?: string;
          widget_type?: string;
        };
        Relationships: [];
      };
      multi_angle_scan_images: {
        Row: {
          angle_degrees: number | null;
          angle_index: number;
          camera_position: Json | null;
          camera_rotation: Json | null;
          contrast_score: number | null;
          created_at: string | null;
          focal_length: number | null;
          id: string;
          image_url: string;
          lighting_quality: number | null;
          measurements: Json | null;
          session_id: string;
          sharpness_score: number | null;
          thumbnail_url: string | null;
        };
        Insert: {
          angle_degrees?: number | null;
          angle_index: number;
          camera_position?: Json | null;
          camera_rotation?: Json | null;
          contrast_score?: number | null;
          created_at?: string | null;
          focal_length?: number | null;
          id?: string;
          image_url: string;
          lighting_quality?: number | null;
          measurements?: Json | null;
          session_id: string;
          sharpness_score?: number | null;
          thumbnail_url?: string | null;
        };
        Update: {
          angle_degrees?: number | null;
          angle_index?: number;
          camera_position?: Json | null;
          camera_rotation?: Json | null;
          contrast_score?: number | null;
          created_at?: string | null;
          focal_length?: number | null;
          id?: string;
          image_url?: string;
          lighting_quality?: number | null;
          measurements?: Json | null;
          session_id?: string;
          sharpness_score?: number | null;
          thumbnail_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "multi_angle_scan_images_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "multi_angle_scan_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      multi_angle_scan_sessions: {
        Row: {
          angles_captured: number | null;
          created_at: string | null;
          id: string;
          is_complete: boolean | null;
          model_format: string | null;
          point_cloud_url: string | null;
          processing_completed_at: string | null;
          processing_error: string | null;
          processing_started_at: string | null;
          processing_status: string | null;
          reconstructed_3d_model_url: string | null;
          scan_type: string | null;
          session_name: string | null;
          target_angles: number | null;
          texture_map_url: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          angles_captured?: number | null;
          created_at?: string | null;
          id?: string;
          is_complete?: boolean | null;
          model_format?: string | null;
          point_cloud_url?: string | null;
          processing_completed_at?: string | null;
          processing_error?: string | null;
          processing_started_at?: string | null;
          processing_status?: string | null;
          reconstructed_3d_model_url?: string | null;
          scan_type?: string | null;
          session_name?: string | null;
          target_angles?: number | null;
          texture_map_url?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          angles_captured?: number | null;
          created_at?: string | null;
          id?: string;
          is_complete?: boolean | null;
          model_format?: string | null;
          point_cloud_url?: string | null;
          processing_completed_at?: string | null;
          processing_error?: string | null;
          processing_started_at?: string | null;
          processing_status?: string | null;
          reconstructed_3d_model_url?: string | null;
          scan_type?: string | null;
          session_name?: string | null;
          target_angles?: number | null;
          texture_map_url?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      multi_camera_sessions: {
        Row: {
          camera_count: number | null;
          completed_at: string | null;
          created_at: string | null;
          duration_seconds: number | null;
          id: string;
          is_private: boolean | null;
          partner_id: string | null;
          quality: string | null;
          recording_status: string | null;
          session_name: string;
          session_type: string;
          share_with_partner: boolean | null;
          started_at: string | null;
          sync_enabled: boolean | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          camera_count?: number | null;
          completed_at?: string | null;
          created_at?: string | null;
          duration_seconds?: number | null;
          id?: string;
          is_private?: boolean | null;
          partner_id?: string | null;
          quality?: string | null;
          recording_status?: string | null;
          session_name: string;
          session_type: string;
          share_with_partner?: boolean | null;
          started_at?: string | null;
          sync_enabled?: boolean | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          camera_count?: number | null;
          completed_at?: string | null;
          created_at?: string | null;
          duration_seconds?: number | null;
          id?: string;
          is_private?: boolean | null;
          partner_id?: string | null;
          quality?: string | null;
          recording_status?: string | null;
          session_name?: string;
          session_type?: string;
          share_with_partner?: boolean | null;
          started_at?: string | null;
          sync_enabled?: boolean | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      multi_week_programs: {
        Row: {
          actual_end_date: string | null;
          base_template_id: string | null;
          completion_percentage: number | null;
          created_at: string | null;
          current_week: number | null;
          description: string | null;
          id: string;
          milestones: Json | null;
          phases: Json;
          program_goals: string[] | null;
          program_name: string;
          start_date: string;
          status: string | null;
          target_end_date: string | null;
          total_weeks: number;
          updated_at: string | null;
          user_id: string;
          weeks_completed: number | null;
        };
        Insert: {
          actual_end_date?: string | null;
          base_template_id?: string | null;
          completion_percentage?: number | null;
          created_at?: string | null;
          current_week?: number | null;
          description?: string | null;
          id?: string;
          milestones?: Json | null;
          phases: Json;
          program_goals?: string[] | null;
          program_name: string;
          start_date: string;
          status?: string | null;
          target_end_date?: string | null;
          total_weeks: number;
          updated_at?: string | null;
          user_id: string;
          weeks_completed?: number | null;
        };
        Update: {
          actual_end_date?: string | null;
          base_template_id?: string | null;
          completion_percentage?: number | null;
          created_at?: string | null;
          current_week?: number | null;
          description?: string | null;
          id?: string;
          milestones?: Json | null;
          phases?: Json;
          program_goals?: string[] | null;
          program_name?: string;
          start_date?: string;
          status?: string | null;
          target_end_date?: string | null;
          total_weeks?: number;
          updated_at?: string | null;
          user_id?: string;
          weeks_completed?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "multi_week_programs_base_template_id_fkey";
            columns: ["base_template_id"];
            isOneToOne: false;
            referencedRelation: "routine_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      nsfw_ai_chat_sessions: {
        Row: {
          chat_type: string | null;
          context_data: Json | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          last_message_at: string | null;
          message_count: number | null;
          messages: Json | null;
          preferences: Json | null;
          session_name: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          chat_type?: string | null;
          context_data?: Json | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_message_at?: string | null;
          message_count?: number | null;
          messages?: Json | null;
          preferences?: Json | null;
          session_name?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          chat_type?: string | null;
          context_data?: Json | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_message_at?: string | null;
          message_count?: number | null;
          messages?: Json | null;
          preferences?: Json | null;
          session_name?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      nsfw_challenge_participants: {
        Row: {
          challenge_id: string;
          completed_at: string | null;
          created_at: string | null;
          id: string;
          is_anonymous: boolean | null;
          is_completed: boolean | null;
          joined_at: string | null;
          leaderboard_position: number | null;
          points_earned: number | null;
          progress_percentage: number | null;
          user_id: string;
        };
        Insert: {
          challenge_id: string;
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          is_anonymous?: boolean | null;
          is_completed?: boolean | null;
          joined_at?: string | null;
          leaderboard_position?: number | null;
          points_earned?: number | null;
          progress_percentage?: number | null;
          user_id: string;
        };
        Update: {
          challenge_id?: string;
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          is_anonymous?: boolean | null;
          is_completed?: boolean | null;
          joined_at?: string | null;
          leaderboard_position?: number | null;
          points_earned?: number | null;
          progress_percentage?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "nsfw_challenge_participants_challenge_id_fkey";
            columns: ["challenge_id"];
            isOneToOne: false;
            referencedRelation: "nsfw_community_challenges";
            referencedColumns: ["id"];
          },
        ];
      };
      nsfw_community_challenges: {
        Row: {
          category: string | null;
          challenge_name: string;
          completion_count: number | null;
          created_at: string | null;
          description: string;
          duration_days: number | null;
          end_date: string;
          has_leaderboard: boolean | null;
          id: string;
          is_active: boolean | null;
          is_anonymous_leaderboard: boolean | null;
          is_featured: boolean | null;
          participant_count: number | null;
          start_date: string;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          challenge_name: string;
          completion_count?: number | null;
          created_at?: string | null;
          description: string;
          duration_days?: number | null;
          end_date: string;
          has_leaderboard?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          is_anonymous_leaderboard?: boolean | null;
          is_featured?: boolean | null;
          participant_count?: number | null;
          start_date: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          challenge_name?: string;
          completion_count?: number | null;
          created_at?: string | null;
          description?: string;
          duration_days?: number | null;
          end_date?: string;
          has_leaderboard?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          is_anonymous_leaderboard?: boolean | null;
          is_featured?: boolean | null;
          participant_count?: number | null;
          start_date?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      nsfw_consent_events: {
        Row: {
          accepted_at: string;
          consent_method: string;
          created_at: string;
          id: string;
          policy_key: string;
          policy_version: string;
          revoked_at: string | null;
          user_id: string;
        };
        Insert: {
          accepted_at?: string;
          consent_method?: string;
          created_at?: string;
          id?: string;
          policy_key: string;
          policy_version: string;
          revoked_at?: string | null;
          user_id: string;
        };
        Update: {
          accepted_at?: string;
          consent_method?: string;
          created_at?: string;
          id?: string;
          policy_key?: string;
          policy_version?: string;
          revoked_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "nsfw_consent_events_policy_key_fkey";
            columns: ["policy_key"];
            isOneToOne: false;
            referencedRelation: "nsfw_consent_policies";
            referencedColumns: ["policy_key"];
          },
        ];
      };
      nsfw_consent_policies: {
        Row: {
          body: string;
          created_at: string;
          is_active: boolean;
          policy_key: string;
          required_for_features: string[];
          summary: string | null;
          title: string;
          updated_at: string;
          version: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          is_active?: boolean;
          policy_key: string;
          required_for_features?: string[];
          summary?: string | null;
          title: string;
          updated_at?: string;
          version: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          is_active?: boolean;
          policy_key?: string;
          required_for_features?: string[];
          summary?: string | null;
          title?: string;
          updated_at?: string;
          version?: string;
        };
        Relationships: [];
      };
      nsfw_content_sharing: {
        Row: {
          content_text: string | null;
          content_type: string;
          content_url: string | null;
          created_at: string | null;
          id: string;
          is_approved: boolean | null;
          like_count: number | null;
          moderated_at: string | null;
          moderated_by: string | null;
          moderation_notes: string | null;
          moderation_status: string | null;
          shared_in_group_id: string | null;
          shared_in_thread_id: string | null;
          user_id: string | null;
          view_count: number | null;
        };
        Insert: {
          content_text?: string | null;
          content_type: string;
          content_url?: string | null;
          created_at?: string | null;
          id?: string;
          is_approved?: boolean | null;
          like_count?: number | null;
          moderated_at?: string | null;
          moderated_by?: string | null;
          moderation_notes?: string | null;
          moderation_status?: string | null;
          shared_in_group_id?: string | null;
          shared_in_thread_id?: string | null;
          user_id?: string | null;
          view_count?: number | null;
        };
        Update: {
          content_text?: string | null;
          content_type?: string;
          content_url?: string | null;
          created_at?: string | null;
          id?: string;
          is_approved?: boolean | null;
          like_count?: number | null;
          moderated_at?: string | null;
          moderated_by?: string | null;
          moderation_notes?: string | null;
          moderation_status?: string | null;
          shared_in_group_id?: string | null;
          shared_in_thread_id?: string | null;
          user_id?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "nsfw_content_sharing_shared_in_group_id_fkey";
            columns: ["shared_in_group_id"];
            isOneToOne: false;
            referencedRelation: "nsfw_support_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "nsfw_content_sharing_shared_in_thread_id_fkey";
            columns: ["shared_in_thread_id"];
            isOneToOne: false;
            referencedRelation: "nsfw_forum_threads";
            referencedColumns: ["id"];
          },
        ];
      };
      nsfw_detection_models: {
        Row: {
          accuracy_score: number | null;
          config: Json | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          model_type: string;
          name: string;
          provider: string;
          updated_at: string | null;
          version: string;
        };
        Insert: {
          accuracy_score?: number | null;
          config?: Json | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          model_type: string;
          name: string;
          provider: string;
          updated_at?: string | null;
          version: string;
        };
        Update: {
          accuracy_score?: number | null;
          config?: Json | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          model_type?: string;
          name?: string;
          provider?: string;
          updated_at?: string | null;
          version?: string;
        };
        Relationships: [];
      };
      nsfw_detection_results: {
        Row: {
          created_at: string | null;
          execution_time_ms: number | null;
          id: string;
          model_id: string | null;
          overall_confidence: number;
          predictions: Json;
          scan_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          execution_time_ms?: number | null;
          id?: string;
          model_id?: string | null;
          overall_confidence: number;
          predictions: Json;
          scan_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          execution_time_ms?: number | null;
          id?: string;
          model_id?: string | null;
          overall_confidence?: number;
          predictions?: Json;
          scan_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "nsfw_detection_results_model_id_fkey";
            columns: ["model_id"];
            isOneToOne: false;
            referencedRelation: "nsfw_detection_models";
            referencedColumns: ["id"];
          },
        ];
      };
      nsfw_ensemble_results: {
        Row: {
          combined_confidence: number;
          confidence_intervals: Json | null;
          created_at: string | null;
          final_classification: string;
          id: string;
          model_results: Json;
          scan_id: string;
          user_id: string;
        };
        Insert: {
          combined_confidence: number;
          confidence_intervals?: Json | null;
          created_at?: string | null;
          final_classification: string;
          id?: string;
          model_results: Json;
          scan_id: string;
          user_id: string;
        };
        Update: {
          combined_confidence?: number;
          confidence_intervals?: Json | null;
          created_at?: string | null;
          final_classification?: string;
          id?: string;
          model_results?: Json;
          scan_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      nsfw_expert_content: {
        Row: {
          average_rating: number | null;
          category: string | null;
          content_body: string | null;
          content_type: string;
          created_at: string | null;
          description: string | null;
          difficulty_level: string | null;
          dlc_pack_id: string | null;
          estimated_duration_minutes: number | null;
          expert_id: string | null;
          id: string;
          is_active: boolean | null;
          is_approved: boolean | null;
          is_featured: boolean | null;
          is_premium: boolean | null;
          like_count: number | null;
          media_url: string | null;
          published_at: string | null;
          rating_count: number | null;
          requires_dlc: boolean | null;
          tags: string[] | null;
          thumbnail_url: string | null;
          title: string;
          updated_at: string | null;
          view_count: number | null;
        };
        Insert: {
          average_rating?: number | null;
          category?: string | null;
          content_body?: string | null;
          content_type: string;
          created_at?: string | null;
          description?: string | null;
          difficulty_level?: string | null;
          dlc_pack_id?: string | null;
          estimated_duration_minutes?: number | null;
          expert_id?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          like_count?: number | null;
          media_url?: string | null;
          published_at?: string | null;
          rating_count?: number | null;
          requires_dlc?: boolean | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Update: {
          average_rating?: number | null;
          category?: string | null;
          content_body?: string | null;
          content_type?: string;
          created_at?: string | null;
          description?: string | null;
          difficulty_level?: string | null;
          dlc_pack_id?: string | null;
          estimated_duration_minutes?: number | null;
          expert_id?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          like_count?: number | null;
          media_url?: string | null;
          published_at?: string | null;
          rating_count?: number | null;
          requires_dlc?: boolean | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "nsfw_expert_content_dlc_pack_id_fkey";
            columns: ["dlc_pack_id"];
            isOneToOne: false;
            referencedRelation: "dlc_packs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "nsfw_expert_content_expert_id_fkey";
            columns: ["expert_id"];
            isOneToOne: false;
            referencedRelation: "expert_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      nsfw_expert_moderators: {
        Row: {
          approval_count: number | null;
          bio: string | null;
          created_at: string | null;
          credentials: string | null;
          expert_name: string;
          id: string;
          is_active: boolean | null;
          is_verified: boolean | null;
          moderation_count: number | null;
          rejection_count: number | null;
          specialization: string[] | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          approval_count?: number | null;
          bio?: string | null;
          created_at?: string | null;
          credentials?: string | null;
          expert_name: string;
          id?: string;
          is_active?: boolean | null;
          is_verified?: boolean | null;
          moderation_count?: number | null;
          rejection_count?: number | null;
          specialization?: string[] | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          approval_count?: number | null;
          bio?: string | null;
          created_at?: string | null;
          credentials?: string | null;
          expert_name?: string;
          id?: string;
          is_active?: boolean | null;
          is_verified?: boolean | null;
          moderation_count?: number | null;
          rejection_count?: number | null;
          specialization?: string[] | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      nsfw_forum_categories: {
        Row: {
          allows_anonymous: boolean | null;
          category_name: string;
          color: string | null;
          created_at: string | null;
          description: string | null;
          icon: string | null;
          id: string;
          is_expert_moderated: boolean | null;
          last_activity_at: string | null;
          post_count: number | null;
          requires_moderation: boolean | null;
          slug: string;
          thread_count: number | null;
          updated_at: string | null;
        };
        Insert: {
          allows_anonymous?: boolean | null;
          category_name: string;
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_expert_moderated?: boolean | null;
          last_activity_at?: string | null;
          post_count?: number | null;
          requires_moderation?: boolean | null;
          slug: string;
          thread_count?: number | null;
          updated_at?: string | null;
        };
        Update: {
          allows_anonymous?: boolean | null;
          category_name?: string;
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_expert_moderated?: boolean | null;
          last_activity_at?: string | null;
          post_count?: number | null;
          requires_moderation?: boolean | null;
          slug?: string;
          thread_count?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      nsfw_forum_posts: {
        Row: {
          content: string;
          created_at: string | null;
          helpful_count: number | null;
          id: string;
          is_anonymous: boolean | null;
          is_approved: boolean | null;
          is_expert_answer: boolean | null;
          like_count: number | null;
          moderation_notes: string | null;
          thread_id: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_anonymous?: boolean | null;
          is_approved?: boolean | null;
          is_expert_answer?: boolean | null;
          like_count?: number | null;
          moderation_notes?: string | null;
          thread_id: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_anonymous?: boolean | null;
          is_approved?: boolean | null;
          is_expert_answer?: boolean | null;
          like_count?: number | null;
          moderation_notes?: string | null;
          thread_id?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "nsfw_forum_posts_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "nsfw_forum_threads";
            referencedColumns: ["id"];
          },
        ];
      };
      nsfw_forum_threads: {
        Row: {
          category_id: string;
          content: string;
          created_at: string | null;
          helpful_count: number | null;
          id: string;
          is_anonymous: boolean | null;
          is_approved: boolean | null;
          is_locked: boolean | null;
          is_pinned: boolean | null;
          is_qa_thread: boolean | null;
          is_success_story: boolean | null;
          is_support_group: boolean | null;
          last_reply_at: string | null;
          last_reply_by: string | null;
          like_count: number | null;
          moderated_at: string | null;
          moderated_by: string | null;
          moderation_notes: string | null;
          reply_count: number | null;
          title: string;
          updated_at: string | null;
          user_id: string | null;
          view_count: number | null;
        };
        Insert: {
          category_id: string;
          content: string;
          created_at?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_anonymous?: boolean | null;
          is_approved?: boolean | null;
          is_locked?: boolean | null;
          is_pinned?: boolean | null;
          is_qa_thread?: boolean | null;
          is_success_story?: boolean | null;
          is_support_group?: boolean | null;
          last_reply_at?: string | null;
          last_reply_by?: string | null;
          like_count?: number | null;
          moderated_at?: string | null;
          moderated_by?: string | null;
          moderation_notes?: string | null;
          reply_count?: number | null;
          title: string;
          updated_at?: string | null;
          user_id?: string | null;
          view_count?: number | null;
        };
        Update: {
          category_id?: string;
          content?: string;
          created_at?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_anonymous?: boolean | null;
          is_approved?: boolean | null;
          is_locked?: boolean | null;
          is_pinned?: boolean | null;
          is_qa_thread?: boolean | null;
          is_success_story?: boolean | null;
          is_support_group?: boolean | null;
          last_reply_at?: string | null;
          last_reply_by?: string | null;
          like_count?: number | null;
          moderated_at?: string | null;
          moderated_by?: string | null;
          moderation_notes?: string | null;
          reply_count?: number | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "nsfw_forum_threads_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "nsfw_forum_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      nsfw_frequency_tracking: {
        Row: {
          average_per_month: number | null;
          average_per_week: number | null;
          created_at: string | null;
          frequency_trend: string | null;
          goal_achieved: boolean | null;
          id: string;
          partner_activity_count: number | null;
          period_type: string | null;
          solo_activity_count: number | null;
          target_frequency_per_week: number | null;
          total_activity_count: number | null;
          tracking_period_end: string;
          tracking_period_start: string;
          trend_strength: number | null;
          user_id: string;
        };
        Insert: {
          average_per_month?: number | null;
          average_per_week?: number | null;
          created_at?: string | null;
          frequency_trend?: string | null;
          goal_achieved?: boolean | null;
          id?: string;
          partner_activity_count?: number | null;
          period_type?: string | null;
          solo_activity_count?: number | null;
          target_frequency_per_week?: number | null;
          total_activity_count?: number | null;
          tracking_period_end: string;
          tracking_period_start: string;
          trend_strength?: number | null;
          user_id: string;
        };
        Update: {
          average_per_month?: number | null;
          average_per_week?: number | null;
          created_at?: string | null;
          frequency_trend?: string | null;
          goal_achieved?: boolean | null;
          id?: string;
          partner_activity_count?: number | null;
          period_type?: string | null;
          solo_activity_count?: number | null;
          target_frequency_per_week?: number | null;
          total_activity_count?: number | null;
          tracking_period_end?: string;
          tracking_period_start?: string;
          trend_strength?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      nsfw_libido_tracking: {
        Row: {
          contributing_factors: Json | null;
          created_at: string | null;
          desire_frequency: string | null;
          desire_intensity: number | null;
          entry_date: string;
          id: string;
          inhibiting_factors: Json | null;
          libido_direction: string | null;
          libido_level: number;
          notes: string | null;
          user_id: string;
        };
        Insert: {
          contributing_factors?: Json | null;
          created_at?: string | null;
          desire_frequency?: string | null;
          desire_intensity?: number | null;
          entry_date: string;
          id?: string;
          inhibiting_factors?: Json | null;
          libido_direction?: string | null;
          libido_level: number;
          notes?: string | null;
          user_id: string;
        };
        Update: {
          contributing_factors?: Json | null;
          created_at?: string | null;
          desire_frequency?: string | null;
          desire_intensity?: number | null;
          entry_date?: string;
          id?: string;
          inhibiting_factors?: Json | null;
          libido_direction?: string | null;
          libido_level?: number;
          notes?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      nsfw_position_ratings: {
        Row: {
          created_at: string | null;
          helpful_count: number | null;
          id: string;
          is_anonymous: boolean | null;
          position_id: string;
          rating: number;
          review_text: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_anonymous?: boolean | null;
          position_id: string;
          rating: number;
          review_text?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_anonymous?: boolean | null;
          position_id?: string;
          rating?: number;
          review_text?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "nsfw_position_ratings_position_id_fkey";
            columns: ["position_id"];
            isOneToOne: false;
            referencedRelation: "nsfw_positions_gallery";
            referencedColumns: ["id"];
          },
        ];
      };
      nsfw_positions_favorites: {
        Row: {
          created_at: string | null;
          id: string;
          last_tried_at: string | null;
          notes: string | null;
          personal_rating: number | null;
          position_id: string;
          tried_count: number | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          last_tried_at?: string | null;
          notes?: string | null;
          personal_rating?: number | null;
          position_id: string;
          tried_count?: number | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          last_tried_at?: string | null;
          notes?: string | null;
          personal_rating?: number | null;
          position_id?: string;
          tried_count?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "nsfw_positions_favorites_position_id_fkey";
            columns: ["position_id"];
            isOneToOne: false;
            referencedRelation: "nsfw_positions_gallery";
            referencedColumns: ["id"];
          },
        ];
      };
      nsfw_positions_gallery: {
        Row: {
          animation_url: string | null;
          average_rating: number | null;
          benefits: string[] | null;
          best_for: string[] | null;
          category: string;
          created_at: string | null;
          description: string;
          detailed_instructions: string | null;
          difficulty_level: string | null;
          dlc_pack_id: string | null;
          favorite_count: number | null;
          id: string;
          image_url: string | null;
          image_url_illustrated: string | null;
          intimacy_level: string | null;
          is_active: boolean | null;
          is_featured: boolean | null;
          is_premium: boolean | null;
          physical_intensity: string | null;
          position_name: string;
          position_slug: string;
          rating_count: number | null;
          recommended_duration_minutes: number | null;
          related_position_ids: string[] | null;
          required_flexibility: string | null;
          requires_dlc: boolean | null;
          sort_order: number | null;
          tags: string[] | null;
          thumbnail_url: string | null;
          tips: string[] | null;
          updated_at: string | null;
          variations: string[] | null;
          video_tutorial_url: string | null;
          view_count: number | null;
        };
        Insert: {
          animation_url?: string | null;
          average_rating?: number | null;
          benefits?: string[] | null;
          best_for?: string[] | null;
          category: string;
          created_at?: string | null;
          description: string;
          detailed_instructions?: string | null;
          difficulty_level?: string | null;
          dlc_pack_id?: string | null;
          favorite_count?: number | null;
          id?: string;
          image_url?: string | null;
          image_url_illustrated?: string | null;
          intimacy_level?: string | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          physical_intensity?: string | null;
          position_name: string;
          position_slug: string;
          rating_count?: number | null;
          recommended_duration_minutes?: number | null;
          related_position_ids?: string[] | null;
          required_flexibility?: string | null;
          requires_dlc?: boolean | null;
          sort_order?: number | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          tips?: string[] | null;
          updated_at?: string | null;
          variations?: string[] | null;
          video_tutorial_url?: string | null;
          view_count?: number | null;
        };
        Update: {
          animation_url?: string | null;
          average_rating?: number | null;
          benefits?: string[] | null;
          best_for?: string[] | null;
          category?: string;
          created_at?: string | null;
          description?: string;
          detailed_instructions?: string | null;
          difficulty_level?: string | null;
          dlc_pack_id?: string | null;
          favorite_count?: number | null;
          id?: string;
          image_url?: string | null;
          image_url_illustrated?: string | null;
          intimacy_level?: string | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          physical_intensity?: string | null;
          position_name?: string;
          position_slug?: string;
          rating_count?: number | null;
          recommended_duration_minutes?: number | null;
          related_position_ids?: string[] | null;
          required_flexibility?: string | null;
          requires_dlc?: boolean | null;
          sort_order?: number | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          tips?: string[] | null;
          updated_at?: string | null;
          variations?: string[] | null;
          video_tutorial_url?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "nsfw_positions_gallery_dlc_pack_id_fkey";
            columns: ["dlc_pack_id"];
            isOneToOne: false;
            referencedRelation: "dlc_packs";
            referencedColumns: ["id"];
          },
        ];
      };
      nsfw_satisfaction_tracking: {
        Row: {
          activity_type: string | null;
          created_at: string | null;
          dissatisfaction_factors: Json | null;
          emotional_satisfaction: number | null;
          entry_date: string;
          id: string;
          mutual_satisfaction: number | null;
          notes: string | null;
          overall_satisfaction: number;
          partner_present: boolean | null;
          partner_satisfaction: number | null;
          physical_satisfaction: number | null;
          satisfaction_factors: Json | null;
          user_id: string;
        };
        Insert: {
          activity_type?: string | null;
          created_at?: string | null;
          dissatisfaction_factors?: Json | null;
          emotional_satisfaction?: number | null;
          entry_date: string;
          id?: string;
          mutual_satisfaction?: number | null;
          notes?: string | null;
          overall_satisfaction: number;
          partner_present?: boolean | null;
          partner_satisfaction?: number | null;
          physical_satisfaction?: number | null;
          satisfaction_factors?: Json | null;
          user_id: string;
        };
        Update: {
          activity_type?: string | null;
          created_at?: string | null;
          dissatisfaction_factors?: Json | null;
          emotional_satisfaction?: number | null;
          entry_date?: string;
          id?: string;
          mutual_satisfaction?: number | null;
          notes?: string | null;
          overall_satisfaction?: number;
          partner_present?: boolean | null;
          partner_satisfaction?: number | null;
          physical_satisfaction?: number | null;
          satisfaction_factors?: Json | null;
          user_id?: string;
        };
        Relationships: [];
      };
      nsfw_sexual_function_tracking: {
        Row: {
          activity_type: string | null;
          control_level: number | null;
          created_at: string | null;
          entry_date: string;
          entry_time: string | null;
          environment: string | null;
          erectile_function_score: number | null;
          erection_duration_minutes: number | null;
          erection_quality: string | null;
          erection_stability: number | null;
          factors_affecting: Json | null;
          id: string;
          notes: string | null;
          partner_present: boolean | null;
          recovery_time_minutes: number | null;
          stamina_minutes: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          activity_type?: string | null;
          control_level?: number | null;
          created_at?: string | null;
          entry_date: string;
          entry_time?: string | null;
          environment?: string | null;
          erectile_function_score?: number | null;
          erection_duration_minutes?: number | null;
          erection_quality?: string | null;
          erection_stability?: number | null;
          factors_affecting?: Json | null;
          id?: string;
          notes?: string | null;
          partner_present?: boolean | null;
          recovery_time_minutes?: number | null;
          stamina_minutes?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          activity_type?: string | null;
          control_level?: number | null;
          created_at?: string | null;
          entry_date?: string;
          entry_time?: string | null;
          environment?: string | null;
          erectile_function_score?: number | null;
          erection_duration_minutes?: number | null;
          erection_quality?: string | null;
          erection_stability?: number | null;
          factors_affecting?: Json | null;
          id?: string;
          notes?: string | null;
          partner_present?: boolean | null;
          recovery_time_minutes?: number | null;
          stamina_minutes?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      nsfw_support_group_members: {
        Row: {
          group_id: string;
          id: string;
          is_anonymous: boolean | null;
          joined_at: string | null;
          last_active_at: string | null;
          role: string | null;
          user_id: string;
        };
        Insert: {
          group_id: string;
          id?: string;
          is_anonymous?: boolean | null;
          joined_at?: string | null;
          last_active_at?: string | null;
          role?: string | null;
          user_id: string;
        };
        Update: {
          group_id?: string;
          id?: string;
          is_anonymous?: boolean | null;
          joined_at?: string | null;
          last_active_at?: string | null;
          role?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "nsfw_support_group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "nsfw_support_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      nsfw_support_groups: {
        Row: {
          category: string | null;
          created_at: string | null;
          description: string | null;
          group_name: string;
          id: string;
          is_anonymous: boolean | null;
          is_private: boolean | null;
          last_activity_at: string | null;
          member_count: number | null;
          post_count: number | null;
          requires_approval: boolean | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          group_name: string;
          id?: string;
          is_anonymous?: boolean | null;
          is_private?: boolean | null;
          last_activity_at?: string | null;
          member_count?: number | null;
          post_count?: number | null;
          requires_approval?: boolean | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          group_name?: string;
          id?: string;
          is_anonymous?: boolean | null;
          is_private?: boolean | null;
          last_activity_at?: string | null;
          member_count?: number | null;
          post_count?: number | null;
          requires_approval?: boolean | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      nsfw_topic_library_items: {
        Row: {
          body: string | null;
          content_rating: string;
          created_at: string;
          id: string;
          is_active: boolean;
          requires_dlc: boolean;
          requires_feature_id: string;
          resources: Json;
          source_import_key: string | null;
          summary: string | null;
          tags: string[];
          title: string;
          topic_id: string;
          updated_at: string;
        };
        Insert: {
          body?: string | null;
          content_rating?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          requires_dlc?: boolean;
          requires_feature_id: string;
          resources?: Json;
          source_import_key?: string | null;
          summary?: string | null;
          tags?: string[];
          title: string;
          topic_id: string;
          updated_at?: string;
        };
        Update: {
          body?: string | null;
          content_rating?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          requires_dlc?: boolean;
          requires_feature_id?: string;
          resources?: Json;
          source_import_key?: string | null;
          summary?: string | null;
          tags?: string[];
          title?: string;
          topic_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "nsfw_topic_library_items_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "nsfw_topics";
            referencedColumns: ["topic_id"];
          },
        ];
      };
      nsfw_topics: {
        Row: {
          content_rating: string;
          created_at: string;
          description: string | null;
          display_name: string;
          is_active: boolean;
          requires_feature_id: string;
          sort_order: number;
          topic_id: string;
          updated_at: string;
        };
        Insert: {
          content_rating?: string;
          created_at?: string;
          description?: string | null;
          display_name: string;
          is_active?: boolean;
          requires_feature_id: string;
          sort_order?: number;
          topic_id: string;
          updated_at?: string;
        };
        Update: {
          content_rating?: string;
          created_at?: string;
          description?: string | null;
          display_name?: string;
          is_active?: boolean;
          requires_feature_id?: string;
          sort_order?: number;
          topic_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      nsfw_video_bookmarks: {
        Row: {
          created_at: string;
          id: string;
          user_id: string;
          video_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          user_id: string;
          video_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          user_id?: string;
          video_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "nsfw_video_bookmarks_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "nsfw_video_content";
            referencedColumns: ["id"];
          },
        ];
      };
      nsfw_video_content: {
        Row: {
          average_rating: number | null;
          category: string;
          content_rating: string | null;
          content_slug: string | null;
          created_at: string | null;
          description: string;
          difficulty_level: string | null;
          dlc_pack_id: string | null;
          expert_credentials: string | null;
          expert_id: string | null;
          expert_name: string | null;
          favorite_count: number | null;
          id: string;
          is_active: boolean | null;
          is_approved: boolean | null;
          is_featured: boolean | null;
          is_premium: boolean | null;
          key_points: string[] | null;
          like_count: number | null;
          prerequisites: string[] | null;
          preview_gif_url: string | null;
          rating_count: number | null;
          requires_dlc: boolean | null;
          share_count: number | null;
          source_import_key: string | null;
          step_by_step_guide: Json | null;
          tags: string[] | null;
          thumbnail_url: string | null;
          title: string;
          updated_at: string | null;
          video_duration_seconds: number | null;
          video_url_2k: string | null;
          video_url_4k: string | null;
          video_url_hd: string | null;
          video_url_sd: string | null;
          view_count: number | null;
          warnings: string[] | null;
        };
        Insert: {
          average_rating?: number | null;
          category: string;
          content_rating?: string | null;
          content_slug?: string | null;
          created_at?: string | null;
          description: string;
          difficulty_level?: string | null;
          dlc_pack_id?: string | null;
          expert_credentials?: string | null;
          expert_id?: string | null;
          expert_name?: string | null;
          favorite_count?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          key_points?: string[] | null;
          like_count?: number | null;
          prerequisites?: string[] | null;
          preview_gif_url?: string | null;
          rating_count?: number | null;
          requires_dlc?: boolean | null;
          share_count?: number | null;
          source_import_key?: string | null;
          step_by_step_guide?: Json | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string | null;
          video_duration_seconds?: number | null;
          video_url_2k?: string | null;
          video_url_4k?: string | null;
          video_url_hd?: string | null;
          video_url_sd?: string | null;
          view_count?: number | null;
          warnings?: string[] | null;
        };
        Update: {
          average_rating?: number | null;
          category?: string;
          content_rating?: string | null;
          content_slug?: string | null;
          created_at?: string | null;
          description?: string;
          difficulty_level?: string | null;
          dlc_pack_id?: string | null;
          expert_credentials?: string | null;
          expert_id?: string | null;
          expert_name?: string | null;
          favorite_count?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          key_points?: string[] | null;
          like_count?: number | null;
          prerequisites?: string[] | null;
          preview_gif_url?: string | null;
          rating_count?: number | null;
          requires_dlc?: boolean | null;
          share_count?: number | null;
          source_import_key?: string | null;
          step_by_step_guide?: Json | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string | null;
          video_duration_seconds?: number | null;
          video_url_2k?: string | null;
          video_url_4k?: string | null;
          video_url_hd?: string | null;
          video_url_sd?: string | null;
          view_count?: number | null;
          warnings?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "nsfw_video_content_dlc_pack_id_fkey";
            columns: ["dlc_pack_id"];
            isOneToOne: false;
            referencedRelation: "dlc_packages";
            referencedColumns: ["id"];
          },
        ];
      };
      nsfw_video_downloads: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          download_progress: number | null;
          download_status: string | null;
          downloaded_at: string | null;
          downloaded_bytes: number | null;
          expires_at: string | null;
          file_path: string;
          file_size_bytes: number | null;
          id: string;
          quality: string;
          updated_at: string | null;
          user_id: string;
          video_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          download_progress?: number | null;
          download_status?: string | null;
          downloaded_at?: string | null;
          downloaded_bytes?: number | null;
          expires_at?: string | null;
          file_path: string;
          file_size_bytes?: number | null;
          id?: string;
          quality: string;
          updated_at?: string | null;
          user_id: string;
          video_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          download_progress?: number | null;
          download_status?: string | null;
          downloaded_at?: string | null;
          downloaded_bytes?: number | null;
          expires_at?: string | null;
          file_path?: string;
          file_size_bytes?: number | null;
          id?: string;
          quality?: string;
          updated_at?: string | null;
          user_id?: string;
          video_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "nsfw_video_downloads_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "nsfw_video_content";
            referencedColumns: ["id"];
          },
        ];
      };
      nsfw_video_playlists: {
        Row: {
          auto_play_next: boolean | null;
          category: string | null;
          copy_count: number | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_curated: boolean | null;
          is_featured: boolean | null;
          is_public: boolean | null;
          like_count: number | null;
          playlist_name: string;
          shuffle_enabled: boolean | null;
          total_duration_seconds: number | null;
          updated_at: string | null;
          user_id: string | null;
          video_count: number | null;
          video_ids: string[];
          view_count: number | null;
        };
        Insert: {
          auto_play_next?: boolean | null;
          category?: string | null;
          copy_count?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_curated?: boolean | null;
          is_featured?: boolean | null;
          is_public?: boolean | null;
          like_count?: number | null;
          playlist_name: string;
          shuffle_enabled?: boolean | null;
          total_duration_seconds?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
          video_count?: number | null;
          video_ids: string[];
          view_count?: number | null;
        };
        Update: {
          auto_play_next?: boolean | null;
          category?: string | null;
          copy_count?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_curated?: boolean | null;
          is_featured?: boolean | null;
          is_public?: boolean | null;
          like_count?: number | null;
          playlist_name?: string;
          shuffle_enabled?: boolean | null;
          total_duration_seconds?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
          video_count?: number | null;
          video_ids?: string[];
          view_count?: number | null;
        };
        Relationships: [];
      };
      nsfw_video_progress: {
        Row: {
          completed_at: string | null;
          completion_percentage: number | null;
          created_at: string | null;
          current_position_seconds: number | null;
          id: string;
          is_completed: boolean | null;
          last_position_updated_at: string | null;
          playback_speed: number | null;
          quality_preference: string | null;
          updated_at: string | null;
          user_id: string;
          video_id: string;
          watched_at: string | null;
          watched_duration_seconds: number | null;
        };
        Insert: {
          completed_at?: string | null;
          completion_percentage?: number | null;
          created_at?: string | null;
          current_position_seconds?: number | null;
          id?: string;
          is_completed?: boolean | null;
          last_position_updated_at?: string | null;
          playback_speed?: number | null;
          quality_preference?: string | null;
          updated_at?: string | null;
          user_id: string;
          video_id: string;
          watched_at?: string | null;
          watched_duration_seconds?: number | null;
        };
        Update: {
          completed_at?: string | null;
          completion_percentage?: number | null;
          created_at?: string | null;
          current_position_seconds?: number | null;
          id?: string;
          is_completed?: boolean | null;
          last_position_updated_at?: string | null;
          playback_speed?: number | null;
          quality_preference?: string | null;
          updated_at?: string | null;
          user_id?: string;
          video_id?: string;
          watched_at?: string | null;
          watched_duration_seconds?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "nsfw_video_progress_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "nsfw_video_content";
            referencedColumns: ["id"];
          },
        ];
      };
      nsfw_video_recommendations: {
        Row: {
          ai_model_version: string | null;
          confidence_score: number | null;
          created_at: string | null;
          id: string;
          reasoning: string | null;
          recommendation_type: string | null;
          recommended_at: string | null;
          user_feedback: string | null;
          user_id: string;
          video_id: string;
          was_viewed: boolean | null;
          was_watched: boolean | null;
        };
        Insert: {
          ai_model_version?: string | null;
          confidence_score?: number | null;
          created_at?: string | null;
          id?: string;
          reasoning?: string | null;
          recommendation_type?: string | null;
          recommended_at?: string | null;
          user_feedback?: string | null;
          user_id: string;
          video_id: string;
          was_viewed?: boolean | null;
          was_watched?: boolean | null;
        };
        Update: {
          ai_model_version?: string | null;
          confidence_score?: number | null;
          created_at?: string | null;
          id?: string;
          reasoning?: string | null;
          recommendation_type?: string | null;
          recommended_at?: string | null;
          user_feedback?: string | null;
          user_id?: string;
          video_id?: string;
          was_viewed?: boolean | null;
          was_watched?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "nsfw_video_recommendations_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "nsfw_video_content";
            referencedColumns: ["id"];
          },
        ];
      };
      nsfw_video_reviews: {
        Row: {
          created_at: string | null;
          helpful_count: number | null;
          id: string;
          is_approved: boolean | null;
          rating: number;
          review_text: string | null;
          updated_at: string | null;
          user_id: string;
          video_id: string;
        };
        Insert: {
          created_at?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_approved?: boolean | null;
          rating: number;
          review_text?: string | null;
          updated_at?: string | null;
          user_id: string;
          video_id: string;
        };
        Update: {
          created_at?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_approved?: boolean | null;
          rating?: number;
          review_text?: string | null;
          updated_at?: string | null;
          user_id?: string;
          video_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "nsfw_video_reviews_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "nsfw_video_content";
            referencedColumns: ["id"];
          },
        ];
      };
      nsfw_video_watch_history: {
        Row: {
          completion_percentage: number | null;
          created_at: string | null;
          id: string;
          referrer_id: string | null;
          user_id: string;
          video_id: string;
          watch_duration_seconds: number | null;
          watch_source: string | null;
          watched_at: string | null;
        };
        Insert: {
          completion_percentage?: number | null;
          created_at?: string | null;
          id?: string;
          referrer_id?: string | null;
          user_id: string;
          video_id: string;
          watch_duration_seconds?: number | null;
          watch_source?: string | null;
          watched_at?: string | null;
        };
        Update: {
          completion_percentage?: number | null;
          created_at?: string | null;
          id?: string;
          referrer_id?: string | null;
          user_id?: string;
          video_id?: string;
          watch_duration_seconds?: number | null;
          watch_source?: string | null;
          watched_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "nsfw_video_watch_history_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "nsfw_video_content";
            referencedColumns: ["id"];
          },
        ];
      };
      nsfw_wellness_correlations: {
        Row: {
          calculated_at: string | null;
          correlation_coefficient: number | null;
          correlation_strength: string | null;
          correlation_type: string;
          created_at: string | null;
          id: string;
          interpretation: string | null;
          is_statistically_significant: boolean | null;
          metric_a: string;
          metric_b: string;
          p_value: number | null;
          recommendations: string[] | null;
          user_id: string;
        };
        Insert: {
          calculated_at?: string | null;
          correlation_coefficient?: number | null;
          correlation_strength?: string | null;
          correlation_type: string;
          created_at?: string | null;
          id?: string;
          interpretation?: string | null;
          is_statistically_significant?: boolean | null;
          metric_a: string;
          metric_b: string;
          p_value?: number | null;
          recommendations?: string[] | null;
          user_id: string;
        };
        Update: {
          calculated_at?: string | null;
          correlation_coefficient?: number | null;
          correlation_strength?: string | null;
          correlation_type?: string;
          created_at?: string | null;
          id?: string;
          interpretation?: string | null;
          is_statistically_significant?: boolean | null;
          metric_a?: string;
          metric_b?: string;
          p_value?: number | null;
          recommendations?: string[] | null;
          user_id?: string;
        };
        Relationships: [];
      };
      nsfw_wellness_dashboards: {
        Row: {
          chart_types: Json | null;
          created_at: string | null;
          dashboard_config: Json;
          dashboard_name: string;
          date_range: Json | null;
          description: string | null;
          id: string;
          is_default: boolean | null;
          is_shared: boolean | null;
          selected_metrics: string[];
          theme: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          chart_types?: Json | null;
          created_at?: string | null;
          dashboard_config: Json;
          dashboard_name: string;
          date_range?: Json | null;
          description?: string | null;
          id?: string;
          is_default?: boolean | null;
          is_shared?: boolean | null;
          selected_metrics: string[];
          theme?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          chart_types?: Json | null;
          created_at?: string | null;
          dashboard_config?: Json;
          dashboard_name?: string;
          date_range?: Json | null;
          description?: string | null;
          id?: string;
          is_default?: boolean | null;
          is_shared?: boolean | null;
          selected_metrics?: string[];
          theme?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      nsfw_wellness_scores: {
        Row: {
          calculated_at: string | null;
          calculation_date: string;
          calculation_period_days: number | null;
          created_at: string | null;
          frequency_score: number | null;
          function_score: number | null;
          id: string;
          insights: string[] | null;
          libido_score: number | null;
          overall_wellness_score: number;
          recommendations: string[] | null;
          relationship_score: number | null;
          satisfaction_score: number | null;
          score_change: number | null;
          score_trend: string | null;
          user_id: string;
        };
        Insert: {
          calculated_at?: string | null;
          calculation_date: string;
          calculation_period_days?: number | null;
          created_at?: string | null;
          frequency_score?: number | null;
          function_score?: number | null;
          id?: string;
          insights?: string[] | null;
          libido_score?: number | null;
          overall_wellness_score: number;
          recommendations?: string[] | null;
          relationship_score?: number | null;
          satisfaction_score?: number | null;
          score_change?: number | null;
          score_trend?: string | null;
          user_id: string;
        };
        Update: {
          calculated_at?: string | null;
          calculation_date?: string;
          calculation_period_days?: number | null;
          created_at?: string | null;
          frequency_score?: number | null;
          function_score?: number | null;
          id?: string;
          insights?: string[] | null;
          libido_score?: number | null;
          overall_wellness_score?: number;
          recommendations?: string[] | null;
          relationship_score?: number | null;
          satisfaction_score?: number | null;
          score_change?: number | null;
          score_trend?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      outcome_simulations: {
        Row: {
          action_items: string[] | null;
          baseline_data: Json;
          created_at: string | null;
          id: string;
          improvement_percentage: number | null;
          recommendations: string[] | null;
          scenario_name: string;
          scenario_type: string;
          simulated_outcomes: Json;
          simulation_parameters: Json;
          time_horizon_days: number;
          user_id: string;
          vs_baseline: Json | null;
        };
        Insert: {
          action_items?: string[] | null;
          baseline_data: Json;
          created_at?: string | null;
          id?: string;
          improvement_percentage?: number | null;
          recommendations?: string[] | null;
          scenario_name: string;
          scenario_type: string;
          simulated_outcomes: Json;
          simulation_parameters: Json;
          time_horizon_days: number;
          user_id: string;
          vs_baseline?: Json | null;
        };
        Update: {
          action_items?: string[] | null;
          baseline_data?: Json;
          created_at?: string | null;
          id?: string;
          improvement_percentage?: number | null;
          recommendations?: string[] | null;
          scenario_name?: string;
          scenario_type?: string;
          simulated_outcomes?: Json;
          simulation_parameters?: Json;
          time_horizon_days?: number;
          user_id?: string;
          vs_baseline?: Json | null;
        };
        Relationships: [];
      };
      partner_comments: {
        Row: {
          activity_id: string;
          comment: string;
          connection_id: string;
          created_at: string | null;
          id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          activity_id: string;
          comment: string;
          connection_id: string;
          created_at?: string | null;
          id?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          activity_id?: string;
          comment?: string;
          connection_id?: string;
          created_at?: string | null;
          id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partner_comments_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "partner_shared_activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "partner_comments_connection_id_fkey";
            columns: ["connection_id"];
            isOneToOne: false;
            referencedRelation: "partner_connections";
            referencedColumns: ["id"];
          },
        ];
      };
      partner_comparison_data: {
        Row: {
          connection_id: string;
          created_at: string | null;
          id: string;
          metric_type: string;
          period_end: string | null;
          period_start: string | null;
          user1_id: string;
          user1_value: number | null;
          user2_id: string;
          user2_value: number | null;
        };
        Insert: {
          connection_id: string;
          created_at?: string | null;
          id?: string;
          metric_type: string;
          period_end?: string | null;
          period_start?: string | null;
          user1_id: string;
          user1_value?: number | null;
          user2_id: string;
          user2_value?: number | null;
        };
        Update: {
          connection_id?: string;
          created_at?: string | null;
          id?: string;
          metric_type?: string;
          period_end?: string | null;
          period_start?: string | null;
          user1_id?: string;
          user1_value?: number | null;
          user2_id?: string;
          user2_value?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "partner_comparison_data_connection_id_fkey";
            columns: ["connection_id"];
            isOneToOne: false;
            referencedRelation: "partner_connections";
            referencedColumns: ["id"];
          },
        ];
      };
      partner_connections: {
        Row: {
          accepted_at: string | null;
          connected_at: string | null;
          connection_code: string;
          connection_status: string;
          created_at: string | null;
          id: string;
          invitation_code: string | null;
          invitation_expires_at: string | null;
          partner_email: string | null;
          partner_id: string | null;
          partner_user_id: string | null;
          share_goals: boolean | null;
          share_insights: boolean | null;
          share_wellness_data: boolean | null;
          status: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          accepted_at?: string | null;
          connected_at?: string | null;
          connection_code: string;
          connection_status?: string;
          created_at?: string | null;
          id?: string;
          invitation_code?: string | null;
          invitation_expires_at?: string | null;
          partner_email?: string | null;
          partner_id?: string | null;
          partner_user_id?: string | null;
          share_goals?: boolean | null;
          share_insights?: boolean | null;
          share_wellness_data?: boolean | null;
          status?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          accepted_at?: string | null;
          connected_at?: string | null;
          connection_code?: string;
          connection_status?: string;
          created_at?: string | null;
          id?: string;
          invitation_code?: string | null;
          invitation_expires_at?: string | null;
          partner_email?: string | null;
          partner_id?: string | null;
          partner_user_id?: string | null;
          share_goals?: boolean | null;
          share_insights?: boolean | null;
          share_wellness_data?: boolean | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      partner_data_permissions: {
        Row: {
          can_comment: boolean | null;
          can_view: boolean | null;
          connection_id: string;
          created_at: string | null;
          data_type: string;
          id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          can_comment?: boolean | null;
          can_view?: boolean | null;
          connection_id: string;
          created_at?: string | null;
          data_type: string;
          id?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          can_comment?: boolean | null;
          can_view?: boolean | null;
          connection_id?: string;
          created_at?: string | null;
          data_type?: string;
          id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partner_data_permissions_connection_id_fkey";
            columns: ["connection_id"];
            isOneToOne: false;
            referencedRelation: "partner_connections";
            referencedColumns: ["id"];
          },
        ];
      };
      partner_position_activity_log: {
        Row: {
          action_type: string;
          connection_id: string;
          created_at: string | null;
          id: string;
          position_id: string | null;
          user_id: string;
        };
        Insert: {
          action_type: string;
          connection_id: string;
          created_at?: string | null;
          id?: string;
          position_id?: string | null;
          user_id: string;
        };
        Update: {
          action_type?: string;
          connection_id?: string;
          created_at?: string | null;
          id?: string;
          position_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partner_position_activity_log_connection_id_fkey";
            columns: ["connection_id"];
            isOneToOne: false;
            referencedRelation: "partner_connections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "partner_position_activity_log_position_id_fkey";
            columns: ["position_id"];
            isOneToOne: false;
            referencedRelation: "nsfw_positions_gallery";
            referencedColumns: ["id"];
          },
        ];
      };
      partner_position_selections: {
        Row: {
          availability_tags: string[] | null;
          boundary_tags: string[] | null;
          connection_id: string;
          constraints: Json | null;
          created_at: string | null;
          custom_description: string | null;
          custom_position_name: string | null;
          favorite_together: boolean | null;
          id: string;
          intensity: string | null;
          note: string | null;
          partner_note: string | null;
          position_id: string | null;
          priority: string | null;
          privacy_level: string | null;
          private_note_encrypted: string | null;
          rating: number | null;
          responded_at: string | null;
          safety_checklist: Json | null;
          selection_status: string | null;
          success_notes: string | null;
          success_tags: string[] | null;
          suggested_by: string;
          suggested_for: string;
          swap_group_id: string | null;
          theme_tags: string[] | null;
          tried_at: string | null;
          try_later: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          availability_tags?: string[] | null;
          boundary_tags?: string[] | null;
          connection_id: string;
          constraints?: Json | null;
          created_at?: string | null;
          custom_description?: string | null;
          custom_position_name?: string | null;
          favorite_together?: boolean | null;
          id?: string;
          intensity?: string | null;
          note?: string | null;
          partner_note?: string | null;
          position_id?: string | null;
          priority?: string | null;
          privacy_level?: string | null;
          private_note_encrypted?: string | null;
          rating?: number | null;
          responded_at?: string | null;
          safety_checklist?: Json | null;
          selection_status?: string | null;
          success_notes?: string | null;
          success_tags?: string[] | null;
          suggested_by: string;
          suggested_for: string;
          swap_group_id?: string | null;
          theme_tags?: string[] | null;
          tried_at?: string | null;
          try_later?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          availability_tags?: string[] | null;
          boundary_tags?: string[] | null;
          connection_id?: string;
          constraints?: Json | null;
          created_at?: string | null;
          custom_description?: string | null;
          custom_position_name?: string | null;
          favorite_together?: boolean | null;
          id?: string;
          intensity?: string | null;
          note?: string | null;
          partner_note?: string | null;
          position_id?: string | null;
          priority?: string | null;
          privacy_level?: string | null;
          private_note_encrypted?: string | null;
          rating?: number | null;
          responded_at?: string | null;
          safety_checklist?: Json | null;
          selection_status?: string | null;
          success_notes?: string | null;
          success_tags?: string[] | null;
          suggested_by?: string;
          suggested_for?: string;
          swap_group_id?: string | null;
          theme_tags?: string[] | null;
          tried_at?: string | null;
          try_later?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "partner_position_selections_connection_id_fkey";
            columns: ["connection_id"];
            isOneToOne: false;
            referencedRelation: "partner_connections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "partner_position_selections_position_id_fkey";
            columns: ["position_id"];
            isOneToOne: false;
            referencedRelation: "nsfw_positions_gallery";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "partner_position_selections_swap_group_id_fkey";
            columns: ["swap_group_id"];
            isOneToOne: false;
            referencedRelation: "partner_position_selections";
            referencedColumns: ["id"];
          },
        ];
      };
      partner_quick_reply_templates: {
        Row: {
          created_at: string | null;
          id: string;
          is_favorite: boolean | null;
          label: string;
          message: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_favorite?: boolean | null;
          label: string;
          message: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_favorite?: boolean | null;
          label?: string;
          message?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      partner_shared_activities: {
        Row: {
          activity_type: string;
          connection_id: string;
          created_at: string | null;
          data_reference: string | null;
          id: string;
          metadata: Json | null;
          user_id: string;
        };
        Insert: {
          activity_type: string;
          connection_id: string;
          created_at?: string | null;
          data_reference?: string | null;
          id?: string;
          metadata?: Json | null;
          user_id: string;
        };
        Update: {
          activity_type?: string;
          connection_id?: string;
          created_at?: string | null;
          data_reference?: string | null;
          id?: string;
          metadata?: Json | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partner_shared_activities_connection_id_fkey";
            columns: ["connection_id"];
            isOneToOne: false;
            referencedRelation: "partner_connections";
            referencedColumns: ["id"];
          },
        ];
      };
      partner_sync_abuse_signals: {
        Row: {
          actor_id: string;
          connection_id: string | null;
          created_at: string | null;
          id: string;
          metadata: Json | null;
          severity: string | null;
          signal_type: string;
        };
        Insert: {
          actor_id: string;
          connection_id?: string | null;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          severity?: string | null;
          signal_type: string;
        };
        Update: {
          actor_id?: string;
          connection_id?: string | null;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          severity?: string | null;
          signal_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partner_sync_abuse_signals_connection_id_fkey";
            columns: ["connection_id"];
            isOneToOne: false;
            referencedRelation: "partner_connections";
            referencedColumns: ["id"];
          },
        ];
      };
      partner_sync_audit_log: {
        Row: {
          action_type: string;
          actor_id: string;
          connection_id: string;
          created_at: string | null;
          id: string;
          payload: Json | null;
          target_user_id: string | null;
        };
        Insert: {
          action_type: string;
          actor_id: string;
          connection_id: string;
          created_at?: string | null;
          id?: string;
          payload?: Json | null;
          target_user_id?: string | null;
        };
        Update: {
          action_type?: string;
          actor_id?: string;
          connection_id?: string;
          created_at?: string | null;
          id?: string;
          payload?: Json | null;
          target_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "partner_sync_audit_log_connection_id_fkey";
            columns: ["connection_id"];
            isOneToOne: false;
            referencedRelation: "partner_connections";
            referencedColumns: ["id"];
          },
        ];
      };
      partner_sync_consent: {
        Row: {
          accepted_at: string;
          connection_id: string;
          consent_version: string;
          created_at: string | null;
          id: string;
          revoked_at: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          accepted_at?: string;
          connection_id: string;
          consent_version: string;
          created_at?: string | null;
          id?: string;
          revoked_at?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          accepted_at?: string;
          connection_id?: string;
          consent_version?: string;
          created_at?: string | null;
          id?: string;
          revoked_at?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partner_sync_consent_connection_id_fkey";
            columns: ["connection_id"];
            isOneToOne: false;
            referencedRelation: "partner_connections";
            referencedColumns: ["id"];
          },
        ];
      };
      partner_sync_events: {
        Row: {
          actor_id: string;
          connection_id: string;
          created_at: string | null;
          event_type: string;
          id: string;
          metadata: Json | null;
        };
        Insert: {
          actor_id: string;
          connection_id: string;
          created_at?: string | null;
          event_type: string;
          id?: string;
          metadata?: Json | null;
        };
        Update: {
          actor_id?: string;
          connection_id?: string;
          created_at?: string | null;
          event_type?: string;
          id?: string;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "partner_sync_events_connection_id_fkey";
            columns: ["connection_id"];
            isOneToOne: false;
            referencedRelation: "partner_connections";
            referencedColumns: ["id"];
          },
        ];
      };
      partner_sync_preferences: {
        Row: {
          allow_media: boolean | null;
          allow_push_notifications: boolean | null;
          allow_scheduled_pings: boolean | null;
          created_at: string | null;
          quiet_hours_enabled: boolean | null;
          quiet_hours_end: string | null;
          quiet_hours_start: string | null;
          rate_limit_per_hour: number | null;
          timezone: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          allow_media?: boolean | null;
          allow_push_notifications?: boolean | null;
          allow_scheduled_pings?: boolean | null;
          created_at?: string | null;
          quiet_hours_enabled?: boolean | null;
          quiet_hours_end?: string | null;
          quiet_hours_start?: string | null;
          rate_limit_per_hour?: number | null;
          timezone?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          allow_media?: boolean | null;
          allow_push_notifications?: boolean | null;
          allow_scheduled_pings?: boolean | null;
          created_at?: string | null;
          quiet_hours_enabled?: boolean | null;
          quiet_hours_end?: string | null;
          quiet_hours_start?: string | null;
          rate_limit_per_hour?: number | null;
          timezone?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      partner_sync_retention_policies: {
        Row: {
          connection_id: string;
          created_at: string | null;
          id: string;
          retention_days_events: number | null;
          retention_days_pings: number | null;
          retention_days_plans: number | null;
          retention_days_selections: number | null;
          set_by: string;
          updated_at: string | null;
        };
        Insert: {
          connection_id: string;
          created_at?: string | null;
          id?: string;
          retention_days_events?: number | null;
          retention_days_pings?: number | null;
          retention_days_plans?: number | null;
          retention_days_selections?: number | null;
          set_by: string;
          updated_at?: string | null;
        };
        Update: {
          connection_id?: string;
          created_at?: string | null;
          id?: string;
          retention_days_events?: number | null;
          retention_days_pings?: number | null;
          retention_days_plans?: number | null;
          retention_days_selections?: number | null;
          set_by?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "partner_sync_retention_policies_connection_id_fkey";
            columns: ["connection_id"];
            isOneToOne: true;
            referencedRelation: "partner_connections";
            referencedColumns: ["id"];
          },
        ];
      };
      partner_sync_settings: {
        Row: {
          connection_id: string;
          created_at: string | null;
          id: string;
          notification_preferences: Json | null;
          privacy_mode: string | null;
          real_time_sync: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          connection_id: string;
          created_at?: string | null;
          id?: string;
          notification_preferences?: Json | null;
          privacy_mode?: string | null;
          real_time_sync?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          connection_id?: string;
          created_at?: string | null;
          id?: string;
          notification_preferences?: Json | null;
          privacy_mode?: string | null;
          real_time_sync?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "partner_sync_settings_connection_id_fkey";
            columns: ["connection_id"];
            isOneToOne: true;
            referencedRelation: "partner_connections";
            referencedColumns: ["id"];
          },
        ];
      };
      partner_thought_ping_reactions: {
        Row: {
          created_at: string | null;
          emoji: string;
          id: string;
          ping_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          emoji: string;
          id?: string;
          ping_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          emoji?: string;
          id?: string;
          ping_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partner_thought_ping_reactions_ping_id_fkey";
            columns: ["ping_id"];
            isOneToOne: false;
            referencedRelation: "partner_thought_pings";
            referencedColumns: ["id"];
          },
        ];
      };
      partner_thought_ping_templates: {
        Row: {
          created_at: string | null;
          detailed_message: string | null;
          id: string;
          intensity: string | null;
          is_favorite: boolean | null;
          message: string;
          theme: string | null;
          title: string;
          tone_tags: string[] | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          detailed_message?: string | null;
          id?: string;
          intensity?: string | null;
          is_favorite?: boolean | null;
          message: string;
          theme?: string | null;
          title: string;
          tone_tags?: string[] | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          detailed_message?: string | null;
          id?: string;
          intensity?: string | null;
          is_favorite?: boolean | null;
          message?: string;
          theme?: string | null;
          title?: string;
          tone_tags?: string[] | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      partner_thought_pings: {
        Row: {
          connection_id: string;
          created_at: string | null;
          delivery_state: string | null;
          detailed_message: string | null;
          gifs_urls: string[] | null;
          id: string;
          images_urls: string[] | null;
          intensity: string | null;
          is_pinned: boolean | null;
          message: string;
          priority: string | null;
          private_note_encrypted: string | null;
          quick_reply_used: string | null;
          reaction_summary: Json | null;
          read_at: string | null;
          read_receipt_requested: boolean | null;
          recipient_id: string;
          remind_at: string | null;
          responded_at: string | null;
          response_message: string | null;
          scheduled_at: string | null;
          sender_id: string;
          status: string | null;
          theme: string | null;
          tone_tags: string[] | null;
          updated_at: string | null;
          voice_message_url: string | null;
        };
        Insert: {
          connection_id: string;
          created_at?: string | null;
          delivery_state?: string | null;
          detailed_message?: string | null;
          gifs_urls?: string[] | null;
          id?: string;
          images_urls?: string[] | null;
          intensity?: string | null;
          is_pinned?: boolean | null;
          message: string;
          priority?: string | null;
          private_note_encrypted?: string | null;
          quick_reply_used?: string | null;
          reaction_summary?: Json | null;
          read_at?: string | null;
          read_receipt_requested?: boolean | null;
          recipient_id: string;
          remind_at?: string | null;
          responded_at?: string | null;
          response_message?: string | null;
          scheduled_at?: string | null;
          sender_id: string;
          status?: string | null;
          theme?: string | null;
          tone_tags?: string[] | null;
          updated_at?: string | null;
          voice_message_url?: string | null;
        };
        Update: {
          connection_id?: string;
          created_at?: string | null;
          delivery_state?: string | null;
          detailed_message?: string | null;
          gifs_urls?: string[] | null;
          id?: string;
          images_urls?: string[] | null;
          intensity?: string | null;
          is_pinned?: boolean | null;
          message?: string;
          priority?: string | null;
          private_note_encrypted?: string | null;
          quick_reply_used?: string | null;
          reaction_summary?: Json | null;
          read_at?: string | null;
          read_receipt_requested?: boolean | null;
          recipient_id?: string;
          remind_at?: string | null;
          responded_at?: string | null;
          response_message?: string | null;
          scheduled_at?: string | null;
          sender_id?: string;
          status?: string | null;
          theme?: string | null;
          tone_tags?: string[] | null;
          updated_at?: string | null;
          voice_message_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "partner_thought_pings_connection_id_fkey";
            columns: ["connection_id"];
            isOneToOne: false;
            referencedRelation: "partner_connections";
            referencedColumns: ["id"];
          },
        ];
      };
      patient_provider_relationships: {
        Row: {
          access_level: string | null;
          can_view_analytics: boolean | null;
          can_view_diary: boolean | null;
          can_view_reports: boolean | null;
          can_view_scans: boolean | null;
          consent_date: string | null;
          consent_expires_date: string | null;
          consent_granted: boolean | null;
          consent_scope: string[];
          created_at: string | null;
          id: string;
          patient_id: string;
          provider_id: string;
          provider_notes: string | null;
          relationship_type: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          access_level?: string | null;
          can_view_analytics?: boolean | null;
          can_view_diary?: boolean | null;
          can_view_reports?: boolean | null;
          can_view_scans?: boolean | null;
          consent_date?: string | null;
          consent_expires_date?: string | null;
          consent_granted?: boolean | null;
          consent_scope: string[];
          created_at?: string | null;
          id?: string;
          patient_id: string;
          provider_id: string;
          provider_notes?: string | null;
          relationship_type?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          access_level?: string | null;
          can_view_analytics?: boolean | null;
          can_view_diary?: boolean | null;
          can_view_reports?: boolean | null;
          can_view_scans?: boolean | null;
          consent_date?: string | null;
          consent_expires_date?: string | null;
          consent_granted?: boolean | null;
          consent_scope?: string[];
          created_at?: string | null;
          id?: string;
          patient_id?: string;
          provider_id?: string;
          provider_notes?: string | null;
          relationship_type?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "patient_provider_relationships_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "healthcare_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_history: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          id: string;
          status: string;
          stripe_customer_id: string | null;
          stripe_invoice_id: string | null;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency?: string;
          id?: string;
          status: string;
          stripe_customer_id?: string | null;
          stripe_invoice_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_invoice_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      personalized_insights: {
        Row: {
          action_required: boolean | null;
          created_at: string | null;
          data_source: Json | null;
          description: string;
          dismissed: boolean | null;
          id: string;
          insight_type: string;
          priority: string | null;
          title: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          action_required?: boolean | null;
          created_at?: string | null;
          data_source?: Json | null;
          description: string;
          dismissed?: boolean | null;
          id?: string;
          insight_type: string;
          priority?: string | null;
          title: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          action_required?: boolean | null;
          created_at?: string | null;
          data_source?: Json | null;
          description?: string;
          dismissed?: boolean | null;
          id?: string;
          insight_type?: string;
          priority?: string | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      playlist_videos: {
        Row: {
          added_at: string | null;
          id: string;
          order_index: number | null;
          playlist_id: string;
          video_id: string;
        };
        Insert: {
          added_at?: string | null;
          id?: string;
          order_index?: number | null;
          playlist_id: string;
          video_id: string;
        };
        Update: {
          added_at?: string | null;
          id?: string;
          order_index?: number | null;
          playlist_id?: string;
          video_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "playlist_videos_playlist_id_fkey";
            columns: ["playlist_id"];
            isOneToOne: false;
            referencedRelation: "video_playlists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "playlist_videos_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "video_library";
            referencedColumns: ["id"];
          },
        ];
      };
      pornmd_integration: {
        Row: {
          api_key_encrypted: string | null;
          api_secret_encrypted: string | null;
          content_preferences: Json | null;
          created_at: string | null;
          id: string;
          is_enabled: boolean | null;
          is_partner: boolean | null;
          last_sync_at: string | null;
          partner_tier: string | null;
          sync_count: number | null;
          sync_enabled: boolean | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          api_key_encrypted?: string | null;
          api_secret_encrypted?: string | null;
          content_preferences?: Json | null;
          created_at?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          is_partner?: boolean | null;
          last_sync_at?: string | null;
          partner_tier?: string | null;
          sync_count?: number | null;
          sync_enabled?: boolean | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          api_key_encrypted?: string | null;
          api_secret_encrypted?: string | null;
          content_preferences?: Json | null;
          created_at?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          is_partner?: boolean | null;
          last_sync_at?: string | null;
          partner_tier?: string | null;
          sync_count?: number | null;
          sync_enabled?: boolean | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      position_collections: {
        Row: {
          benefits: string[] | null;
          category: string;
          created_at: string | null;
          description: string | null;
          difficulty_level: number | null;
          id: string;
          name: string;
          prerequisites: string[] | null;
          thumbnail_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          benefits?: string[] | null;
          category: string;
          created_at?: string | null;
          description?: string | null;
          difficulty_level?: number | null;
          id?: string;
          name: string;
          prerequisites?: string[] | null;
          thumbnail_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          benefits?: string[] | null;
          category?: string;
          created_at?: string | null;
          description?: string | null;
          difficulty_level?: number | null;
          id?: string;
          name?: string;
          prerequisites?: string[] | null;
          thumbnail_url?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      position_comparisons: {
        Row: {
          comparison_name: string | null;
          comparison_results: Json | null;
          created_at: string | null;
          id: string;
          insights: string[] | null;
          position_ids: string[];
          user_id: string;
        };
        Insert: {
          comparison_name?: string | null;
          comparison_results?: Json | null;
          created_at?: string | null;
          id?: string;
          insights?: string[] | null;
          position_ids: string[];
          user_id: string;
        };
        Update: {
          comparison_name?: string | null;
          comparison_results?: Json | null;
          created_at?: string | null;
          id?: string;
          insights?: string[] | null;
          position_ids?: string[];
          user_id?: string;
        };
        Relationships: [];
      };
      position_difficulty_ratings: {
        Row: {
          coordination_difficulty: number | null;
          created_at: string | null;
          difficulty_rating: number;
          id: string;
          notes: string | null;
          physical_difficulty: number | null;
          position_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          coordination_difficulty?: number | null;
          created_at?: string | null;
          difficulty_rating: number;
          id?: string;
          notes?: string | null;
          physical_difficulty?: number | null;
          position_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          coordination_difficulty?: number | null;
          created_at?: string | null;
          difficulty_rating?: number;
          id?: string;
          notes?: string | null;
          physical_difficulty?: number | null;
          position_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      position_effectiveness_tracking: {
        Row: {
          comfort_rating: number | null;
          created_at: string | null;
          effectiveness_rating: number;
          id: string;
          intensity_rating: number | null;
          notes: string | null;
          partner_feedback: string | null;
          pleasure_rating: number | null;
          position_id: string;
          session_date: string | null;
          user_id: string;
        };
        Insert: {
          comfort_rating?: number | null;
          created_at?: string | null;
          effectiveness_rating: number;
          id?: string;
          intensity_rating?: number | null;
          notes?: string | null;
          partner_feedback?: string | null;
          pleasure_rating?: number | null;
          position_id: string;
          session_date?: string | null;
          user_id: string;
        };
        Update: {
          comfort_rating?: number | null;
          created_at?: string | null;
          effectiveness_rating?: number;
          id?: string;
          intensity_rating?: number | null;
          notes?: string | null;
          partner_feedback?: string | null;
          pleasure_rating?: number | null;
          position_id?: string;
          session_date?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      position_playlists: {
        Row: {
          copy_count: number | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_featured: boolean | null;
          is_public: boolean | null;
          like_count: number | null;
          playlist_name: string;
          position_count: number | null;
          position_ids: string[];
          updated_at: string | null;
          user_id: string;
          view_count: number | null;
        };
        Insert: {
          copy_count?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_featured?: boolean | null;
          is_public?: boolean | null;
          like_count?: number | null;
          playlist_name: string;
          position_count?: number | null;
          position_ids: string[];
          updated_at?: string | null;
          user_id: string;
          view_count?: number | null;
        };
        Update: {
          copy_count?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_featured?: boolean | null;
          is_public?: boolean | null;
          like_count?: number | null;
          playlist_name?: string;
          position_count?: number | null;
          position_ids?: string[];
          updated_at?: string | null;
          user_id?: string;
          view_count?: number | null;
        };
        Relationships: [];
      };
      position_recommendations: {
        Row: {
          ai_model_version: string | null;
          confidence_score: number | null;
          created_at: string | null;
          id: string;
          position_id: string;
          reasoning: string | null;
          recommendation_type: string | null;
          recommended_at: string | null;
          user_feedback: string | null;
          user_id: string;
          was_tried: boolean | null;
          was_viewed: boolean | null;
        };
        Insert: {
          ai_model_version?: string | null;
          confidence_score?: number | null;
          created_at?: string | null;
          id?: string;
          position_id: string;
          reasoning?: string | null;
          recommendation_type?: string | null;
          recommended_at?: string | null;
          user_feedback?: string | null;
          user_id: string;
          was_tried?: boolean | null;
          was_viewed?: boolean | null;
        };
        Update: {
          ai_model_version?: string | null;
          confidence_score?: number | null;
          created_at?: string | null;
          id?: string;
          position_id?: string;
          reasoning?: string | null;
          recommendation_type?: string | null;
          recommended_at?: string | null;
          user_feedback?: string | null;
          user_id?: string;
          was_tried?: boolean | null;
          was_viewed?: boolean | null;
        };
        Relationships: [];
      };
      position_reviews: {
        Row: {
          cons: string[] | null;
          created_at: string | null;
          helpful_count: number | null;
          id: string;
          is_approved: boolean | null;
          is_featured: boolean | null;
          position_id: string;
          pros: string[] | null;
          rating: number;
          review_text: string | null;
          times_tried: number | null;
          tips: string[] | null;
          updated_at: string | null;
          user_id: string;
          would_recommend: boolean | null;
        };
        Insert: {
          cons?: string[] | null;
          created_at?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          position_id: string;
          pros?: string[] | null;
          rating: number;
          review_text?: string | null;
          times_tried?: number | null;
          tips?: string[] | null;
          updated_at?: string | null;
          user_id: string;
          would_recommend?: boolean | null;
        };
        Update: {
          cons?: string[] | null;
          created_at?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          position_id?: string;
          pros?: string[] | null;
          rating?: number;
          review_text?: string | null;
          times_tried?: number | null;
          tips?: string[] | null;
          updated_at?: string | null;
          user_id?: string;
          would_recommend?: boolean | null;
        };
        Relationships: [];
      };
      position_variations: {
        Row: {
          base_position_id: string;
          benefits: string[] | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          difficulty_modifier: number | null;
          id: string;
          images: string[] | null;
          is_verified: boolean | null;
          modifications: string[] | null;
          tips: string[] | null;
          updated_at: string | null;
          variation_name: string;
          videos: string[] | null;
        };
        Insert: {
          base_position_id: string;
          benefits?: string[] | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          difficulty_modifier?: number | null;
          id?: string;
          images?: string[] | null;
          is_verified?: boolean | null;
          modifications?: string[] | null;
          tips?: string[] | null;
          updated_at?: string | null;
          variation_name: string;
          videos?: string[] | null;
        };
        Update: {
          base_position_id?: string;
          benefits?: string[] | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          difficulty_modifier?: number | null;
          id?: string;
          images?: string[] | null;
          is_verified?: boolean | null;
          modifications?: string[] | null;
          tips?: string[] | null;
          updated_at?: string | null;
          variation_name?: string;
          videos?: string[] | null;
        };
        Relationships: [];
      };
      position_viewing_analytics: {
        Row: {
          id: string;
          interaction_count: number | null;
          playback_speed: number | null;
          position_id: string;
          user_id: string | null;
          view_duration_seconds: number | null;
          view_type: string | null;
          viewed_at: string | null;
          viewing_angle: string | null;
          zoom_level: number | null;
        };
        Insert: {
          id?: string;
          interaction_count?: number | null;
          playback_speed?: number | null;
          position_id: string;
          user_id?: string | null;
          view_duration_seconds?: number | null;
          view_type?: string | null;
          viewed_at?: string | null;
          viewing_angle?: string | null;
          zoom_level?: number | null;
        };
        Update: {
          id?: string;
          interaction_count?: number | null;
          playback_speed?: number | null;
          position_id?: string;
          user_id?: string | null;
          view_duration_seconds?: number | null;
          view_type?: string | null;
          viewed_at?: string | null;
          viewing_angle?: string | null;
          zoom_level?: number | null;
        };
        Relationships: [];
      };
      positions: {
        Row: {
          collection_id: string | null;
          created_at: string | null;
          description: string | null;
          duration_minutes: number | null;
          health_benefits: string[] | null;
          id: string;
          image_url: string | null;
          instructions: string;
          muscle_groups: string[] | null;
          name: string;
          safety_notes: string[] | null;
          tags: string[] | null;
          updated_at: string | null;
          video_url: string | null;
        };
        Insert: {
          collection_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          health_benefits?: string[] | null;
          id?: string;
          image_url?: string | null;
          instructions: string;
          muscle_groups?: string[] | null;
          name: string;
          safety_notes?: string[] | null;
          tags?: string[] | null;
          updated_at?: string | null;
          video_url?: string | null;
        };
        Update: {
          collection_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          health_benefits?: string[] | null;
          id?: string;
          image_url?: string | null;
          instructions?: string;
          muscle_groups?: string[] | null;
          name?: string;
          safety_notes?: string[] | null;
          tags?: string[] | null;
          updated_at?: string | null;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "positions_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "position_collections";
            referencedColumns: ["id"];
          },
        ];
      };
      predictive_modeling_results: {
        Row: {
          confidence_intervals: Json | null;
          confidence_level: number | null;
          created_at: string | null;
          generated_at: string | null;
          id: string;
          input_data: Json;
          model_accuracy: number | null;
          model_type: string;
          model_version: string | null;
          prediction_horizon_days: number | null;
          predictions: Json;
          recommendations: string[] | null;
          scenarios: Json | null;
          user_id: string;
        };
        Insert: {
          confidence_intervals?: Json | null;
          confidence_level?: number | null;
          created_at?: string | null;
          generated_at?: string | null;
          id?: string;
          input_data: Json;
          model_accuracy?: number | null;
          model_type: string;
          model_version?: string | null;
          prediction_horizon_days?: number | null;
          predictions: Json;
          recommendations?: string[] | null;
          scenarios?: Json | null;
          user_id: string;
        };
        Update: {
          confidence_intervals?: Json | null;
          confidence_level?: number | null;
          created_at?: string | null;
          generated_at?: string | null;
          id?: string;
          input_data?: Json;
          model_accuracy?: number | null;
          model_type?: string;
          model_version?: string | null;
          prediction_horizon_days?: number | null;
          predictions?: Json;
          recommendations?: string[] | null;
          scenarios?: Json | null;
          user_id?: string;
        };
        Relationships: [];
      };
      predictive_models: {
        Row: {
          accuracy_score: number | null;
          created_at: string | null;
          id: string;
          input_features: string[];
          is_active: boolean | null;
          is_production: boolean | null;
          last_updated: string | null;
          model_config: Json;
          model_description: string | null;
          model_name: string;
          model_type: string;
          model_version: string;
          output_features: string[];
          training_date: string | null;
          updated_at: string | null;
        };
        Insert: {
          accuracy_score?: number | null;
          created_at?: string | null;
          id?: string;
          input_features: string[];
          is_active?: boolean | null;
          is_production?: boolean | null;
          last_updated?: string | null;
          model_config: Json;
          model_description?: string | null;
          model_name: string;
          model_type: string;
          model_version: string;
          output_features: string[];
          training_date?: string | null;
          updated_at?: string | null;
        };
        Update: {
          accuracy_score?: number | null;
          created_at?: string | null;
          id?: string;
          input_features?: string[];
          is_active?: boolean | null;
          is_production?: boolean | null;
          last_updated?: string | null;
          model_config?: Json;
          model_description?: string | null;
          model_name?: string;
          model_type?: string;
          model_version?: string;
          output_features?: string[];
          training_date?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      premium_add_ons: {
        Row: {
          addon_description: string;
          addon_id: string;
          addon_name: string;
          annual_discount_percentage: number | null;
          annual_price: number | null;
          category: string | null;
          created_at: string | null;
          features: Json;
          icon_url: string | null;
          id: string;
          incompatible_addons: string[] | null;
          is_active: boolean | null;
          is_featured: boolean | null;
          is_popular: boolean | null;
          lifetime_price: number | null;
          limitations: Json | null;
          monthly_price: number;
          requires_tier: string[] | null;
          sort_order: number | null;
          stripe_annual_price_id: string | null;
          stripe_lifetime_price_id: string | null;
          stripe_monthly_price_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          addon_description: string;
          addon_id: string;
          addon_name: string;
          annual_discount_percentage?: number | null;
          annual_price?: number | null;
          category?: string | null;
          created_at?: string | null;
          features: Json;
          icon_url?: string | null;
          id?: string;
          incompatible_addons?: string[] | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_popular?: boolean | null;
          lifetime_price?: number | null;
          limitations?: Json | null;
          monthly_price: number;
          requires_tier?: string[] | null;
          sort_order?: number | null;
          stripe_annual_price_id?: string | null;
          stripe_lifetime_price_id?: string | null;
          stripe_monthly_price_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          addon_description?: string;
          addon_id?: string;
          addon_name?: string;
          annual_discount_percentage?: number | null;
          annual_price?: number | null;
          category?: string | null;
          created_at?: string | null;
          features?: Json;
          icon_url?: string | null;
          id?: string;
          incompatible_addons?: string[] | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_popular?: boolean | null;
          lifetime_price?: number | null;
          limitations?: Json | null;
          monthly_price?: number;
          requires_tier?: string[] | null;
          sort_order?: number | null;
          stripe_annual_price_id?: string | null;
          stripe_lifetime_price_id?: string | null;
          stripe_monthly_price_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      premium_content_bundles: {
        Row: {
          bundle_name: string;
          bundle_price: number;
          content_count: number | null;
          content_ids: string[];
          created_at: string | null;
          creator_id: string | null;
          description: string;
          discount_percentage: number | null;
          expires_at: string | null;
          id: string;
          is_active: boolean | null;
          is_featured: boolean | null;
          is_limited_time: boolean | null;
          original_price: number | null;
          preview_description: string | null;
          preview_image_url: string | null;
          revenue_total: number | null;
          sales_count: number | null;
          updated_at: string | null;
        };
        Insert: {
          bundle_name: string;
          bundle_price: number;
          content_count?: number | null;
          content_ids: string[];
          created_at?: string | null;
          creator_id?: string | null;
          description: string;
          discount_percentage?: number | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_limited_time?: boolean | null;
          original_price?: number | null;
          preview_description?: string | null;
          preview_image_url?: string | null;
          revenue_total?: number | null;
          sales_count?: number | null;
          updated_at?: string | null;
        };
        Update: {
          bundle_name?: string;
          bundle_price?: number;
          content_count?: number | null;
          content_ids?: string[];
          created_at?: string | null;
          creator_id?: string | null;
          description?: string;
          discount_percentage?: number | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_limited_time?: boolean | null;
          original_price?: number | null;
          preview_description?: string | null;
          preview_image_url?: string | null;
          revenue_total?: number | null;
          sales_count?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      premium_content_categories: {
        Row: {
          category_name: string;
          color: string | null;
          content_count: number | null;
          created_at: string | null;
          description: string | null;
          icon_url: string | null;
          id: string;
          order_index: number | null;
          parent_category_id: string | null;
          total_sales: number | null;
          updated_at: string | null;
        };
        Insert: {
          category_name: string;
          color?: string | null;
          content_count?: number | null;
          created_at?: string | null;
          description?: string | null;
          icon_url?: string | null;
          id?: string;
          order_index?: number | null;
          parent_category_id?: string | null;
          total_sales?: number | null;
          updated_at?: string | null;
        };
        Update: {
          category_name?: string;
          color?: string | null;
          content_count?: number | null;
          created_at?: string | null;
          description?: string | null;
          icon_url?: string | null;
          id?: string;
          order_index?: number | null;
          parent_category_id?: string | null;
          total_sales?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "premium_content_categories_parent_category_id_fkey";
            columns: ["parent_category_id"];
            isOneToOne: false;
            referencedRelation: "premium_content_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      premium_content_items: {
        Row: {
          average_rating: number | null;
          category: string | null;
          content_data: Json;
          content_rating: string | null;
          content_type: string;
          created_at: string | null;
          creator_id: string;
          currency: string | null;
          description: string;
          difficulty_level: string | null;
          expert_bio: string | null;
          expert_credentials: string | null;
          expert_name: string | null;
          id: string;
          is_active: boolean | null;
          is_approved: boolean | null;
          is_featured: boolean | null;
          is_subscription: boolean | null;
          is_trending: boolean | null;
          is_verified: boolean | null;
          moderation_notes: string | null;
          preview_content: Json | null;
          preview_images: string[] | null;
          preview_video_url: string | null;
          price: number;
          purchase_count: number | null;
          rating_count: number | null;
          revenue_total: number | null;
          review_count: number | null;
          subscription_duration_days: number | null;
          tags: string[] | null;
          target_audience: string[] | null;
          thumbnail_url: string | null;
          title: string;
          updated_at: string | null;
          view_count: number | null;
        };
        Insert: {
          average_rating?: number | null;
          category?: string | null;
          content_data: Json;
          content_rating?: string | null;
          content_type: string;
          created_at?: string | null;
          creator_id: string;
          currency?: string | null;
          description: string;
          difficulty_level?: string | null;
          expert_bio?: string | null;
          expert_credentials?: string | null;
          expert_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          is_subscription?: boolean | null;
          is_trending?: boolean | null;
          is_verified?: boolean | null;
          moderation_notes?: string | null;
          preview_content?: Json | null;
          preview_images?: string[] | null;
          preview_video_url?: string | null;
          price: number;
          purchase_count?: number | null;
          rating_count?: number | null;
          revenue_total?: number | null;
          review_count?: number | null;
          subscription_duration_days?: number | null;
          tags?: string[] | null;
          target_audience?: string[] | null;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Update: {
          average_rating?: number | null;
          category?: string | null;
          content_data?: Json;
          content_rating?: string | null;
          content_type?: string;
          created_at?: string | null;
          creator_id?: string;
          currency?: string | null;
          description?: string;
          difficulty_level?: string | null;
          expert_bio?: string | null;
          expert_credentials?: string | null;
          expert_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          is_subscription?: boolean | null;
          is_trending?: boolean | null;
          is_verified?: boolean | null;
          moderation_notes?: string | null;
          preview_content?: Json | null;
          preview_images?: string[] | null;
          preview_video_url?: string | null;
          price?: number;
          purchase_count?: number | null;
          rating_count?: number | null;
          revenue_total?: number | null;
          review_count?: number | null;
          subscription_duration_days?: number | null;
          tags?: string[] | null;
          target_audience?: string[] | null;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Relationships: [];
      };
      premium_content_purchases: {
        Row: {
          access_expires_at: string | null;
          access_granted_at: string | null;
          content_id: string;
          download_enabled: boolean | null;
          id: string;
          is_active: boolean | null;
          payment_intent_id: string | null;
          price_paid: number;
          purchase_type: string | null;
          purchased_at: string | null;
          stream_enabled: boolean | null;
          user_id: string;
        };
        Insert: {
          access_expires_at?: string | null;
          access_granted_at?: string | null;
          content_id: string;
          download_enabled?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          payment_intent_id?: string | null;
          price_paid: number;
          purchase_type?: string | null;
          purchased_at?: string | null;
          stream_enabled?: boolean | null;
          user_id: string;
        };
        Update: {
          access_expires_at?: string | null;
          access_granted_at?: string | null;
          content_id?: string;
          download_enabled?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          payment_intent_id?: string | null;
          price_paid?: number;
          purchase_type?: string | null;
          purchased_at?: string | null;
          stream_enabled?: boolean | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "premium_content_purchases_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "premium_content_items";
            referencedColumns: ["id"];
          },
        ];
      };
      premium_content_recommendations: {
        Row: {
          ai_model_version: string | null;
          confidence_score: number | null;
          content_id: string;
          created_at: string | null;
          id: string;
          reasoning: string | null;
          recommendation_type: string | null;
          recommended_at: string | null;
          user_feedback: string | null;
          user_id: string;
          was_purchased: boolean | null;
          was_viewed: boolean | null;
        };
        Insert: {
          ai_model_version?: string | null;
          confidence_score?: number | null;
          content_id: string;
          created_at?: string | null;
          id?: string;
          reasoning?: string | null;
          recommendation_type?: string | null;
          recommended_at?: string | null;
          user_feedback?: string | null;
          user_id: string;
          was_purchased?: boolean | null;
          was_viewed?: boolean | null;
        };
        Update: {
          ai_model_version?: string | null;
          confidence_score?: number | null;
          content_id?: string;
          created_at?: string | null;
          id?: string;
          reasoning?: string | null;
          recommendation_type?: string | null;
          recommended_at?: string | null;
          user_feedback?: string | null;
          user_id?: string;
          was_purchased?: boolean | null;
          was_viewed?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "premium_content_recommendations_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "premium_content_items";
            referencedColumns: ["id"];
          },
        ];
      };
      premium_content_reviews: {
        Row: {
          cons: string[] | null;
          content_id: string;
          created_at: string | null;
          has_used_content: boolean | null;
          helpful_count: number | null;
          id: string;
          is_approved: boolean | null;
          is_featured: boolean | null;
          is_verified_purchase: boolean | null;
          pros: string[] | null;
          rating: number;
          results_achieved: string | null;
          review_text: string | null;
          updated_at: string | null;
          usage_duration_days: number | null;
          user_id: string;
        };
        Insert: {
          cons?: string[] | null;
          content_id: string;
          created_at?: string | null;
          has_used_content?: boolean | null;
          helpful_count?: number | null;
          id?: string;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          is_verified_purchase?: boolean | null;
          pros?: string[] | null;
          rating: number;
          results_achieved?: string | null;
          review_text?: string | null;
          updated_at?: string | null;
          usage_duration_days?: number | null;
          user_id: string;
        };
        Update: {
          cons?: string[] | null;
          content_id?: string;
          created_at?: string | null;
          has_used_content?: boolean | null;
          helpful_count?: number | null;
          id?: string;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          is_verified_purchase?: boolean | null;
          pros?: string[] | null;
          rating?: number;
          results_achieved?: string | null;
          review_text?: string | null;
          updated_at?: string | null;
          usage_duration_days?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "premium_content_reviews_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "premium_content_items";
            referencedColumns: ["id"];
          },
        ];
      };
      premium_content_viewing: {
        Row: {
          content_id: string;
          id: string;
          interaction_count: number | null;
          user_id: string | null;
          view_duration_seconds: number | null;
          view_type: string | null;
          viewed_at: string | null;
        };
        Insert: {
          content_id: string;
          id?: string;
          interaction_count?: number | null;
          user_id?: string | null;
          view_duration_seconds?: number | null;
          view_type?: string | null;
          viewed_at?: string | null;
        };
        Update: {
          content_id?: string;
          id?: string;
          interaction_count?: number | null;
          user_id?: string | null;
          view_duration_seconds?: number | null;
          view_type?: string | null;
          viewed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "premium_content_viewing_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "premium_content_items";
            referencedColumns: ["id"];
          },
        ];
      };
      premium_content_wishlist: {
        Row: {
          added_at: string | null;
          content_id: string;
          id: string;
          notes: string | null;
          user_id: string;
        };
        Insert: {
          added_at?: string | null;
          content_id: string;
          id?: string;
          notes?: string | null;
          user_id: string;
        };
        Update: {
          added_at?: string | null;
          content_id?: string;
          id?: string;
          notes?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "premium_content_wishlist_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "premium_content_items";
            referencedColumns: ["id"];
          },
        ];
      };
      pricing_tiers: {
        Row: {
          created_at: string | null;
          distribution_channel: string;
          features: Json | null;
          id: string;
          is_active: boolean | null;
          price_amount: number;
          price_type: string;
          stripe_price_id: string | null;
          stripe_product_id: string | null;
          tier_name: string;
          updated_at: string | null;
          version_type: string;
        };
        Insert: {
          created_at?: string | null;
          distribution_channel: string;
          features?: Json | null;
          id?: string;
          is_active?: boolean | null;
          price_amount: number;
          price_type: string;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          tier_name: string;
          updated_at?: string | null;
          version_type: string;
        };
        Update: {
          created_at?: string | null;
          distribution_channel?: string;
          features?: Json | null;
          id?: string;
          is_active?: boolean | null;
          price_amount?: number;
          price_type?: string;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          tier_name?: string;
          updated_at?: string | null;
          version_type?: string;
        };
        Relationships: [];
      };
      privacy_audit_log: {
        Row: {
          action_description: string;
          action_result: string | null;
          action_type: string;
          data_count: number | null;
          data_types: string[] | null;
          id: string;
          ip_address: unknown;
          performed_at: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          action_description: string;
          action_result?: string | null;
          action_type: string;
          data_count?: number | null;
          data_types?: string[] | null;
          id?: string;
          ip_address?: unknown;
          performed_at?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          action_description?: string;
          action_result?: string | null;
          action_type?: string;
          data_count?: number | null;
          data_types?: string[] | null;
          id?: string;
          ip_address?: unknown;
          performed_at?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      privacy_controls: {
        Row: {
          anonymization_level: string | null;
          anonymize_data: boolean | null;
          auto_delete_enabled: boolean | null;
          created_at: string | null;
          data_processing_consent: boolean | null;
          gdpr_consent_date: string | null;
          gdpr_consent_given: boolean | null;
          id: string;
          profile_visibility: string | null;
          retention_period_days: number | null;
          share_analytics: boolean | null;
          share_location_data: boolean | null;
          share_usage_data: boolean | null;
          show_in_search: boolean | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          anonymization_level?: string | null;
          anonymize_data?: boolean | null;
          auto_delete_enabled?: boolean | null;
          created_at?: string | null;
          data_processing_consent?: boolean | null;
          gdpr_consent_date?: string | null;
          gdpr_consent_given?: boolean | null;
          id?: string;
          profile_visibility?: string | null;
          retention_period_days?: number | null;
          share_analytics?: boolean | null;
          share_location_data?: boolean | null;
          share_usage_data?: boolean | null;
          show_in_search?: boolean | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          anonymization_level?: string | null;
          anonymize_data?: boolean | null;
          auto_delete_enabled?: boolean | null;
          created_at?: string | null;
          data_processing_consent?: boolean | null;
          gdpr_consent_date?: string | null;
          gdpr_consent_given?: boolean | null;
          id?: string;
          profile_visibility?: string | null;
          retention_period_days?: number | null;
          share_analytics?: boolean | null;
          share_location_data?: boolean | null;
          share_usage_data?: boolean | null;
          show_in_search?: boolean | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          email: string | null;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      program_phases: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          description: string | null;
          duration_weeks: number;
          end_week: number;
          id: string;
          is_completed: boolean | null;
          phase_goals: string[] | null;
          phase_name: string;
          phase_number: number;
          phase_routine: Json;
          program_id: string;
          start_week: number;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          duration_weeks: number;
          end_week: number;
          id?: string;
          is_completed?: boolean | null;
          phase_goals?: string[] | null;
          phase_name: string;
          phase_number: number;
          phase_routine: Json;
          program_id: string;
          start_week: number;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          duration_weeks?: number;
          end_week?: number;
          id?: string;
          is_completed?: boolean | null;
          phase_goals?: string[] | null;
          phase_name?: string;
          phase_number?: number;
          phase_routine?: Json;
          program_id?: string;
          start_week?: number;
        };
        Relationships: [
          {
            foreignKeyName: "program_phases_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "multi_week_programs";
            referencedColumns: ["id"];
          },
        ];
      };
      progress_photos: {
        Row: {
          after_image_url: string | null;
          before_image_url: string | null;
          category: string | null;
          created_at: string | null;
          display_name: string | null;
          id: string;
          is_anonymous: boolean | null;
          is_approved: boolean | null;
          is_featured: boolean | null;
          is_verified: boolean | null;
          time_period: string | null;
          user_id: string | null;
        };
        Insert: {
          after_image_url?: string | null;
          before_image_url?: string | null;
          category?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          id?: string;
          is_anonymous?: boolean | null;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          is_verified?: boolean | null;
          time_period?: string | null;
          user_id?: string | null;
        };
        Update: {
          after_image_url?: string | null;
          before_image_url?: string | null;
          category?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          id?: string;
          is_anonymous?: boolean | null;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          is_verified?: boolean | null;
          time_period?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      progress_share_interactions: {
        Row: {
          comment_text: string | null;
          created_at: string | null;
          id: string;
          interaction_type: string;
          share_id: string;
          user_id: string;
        };
        Insert: {
          comment_text?: string | null;
          created_at?: string | null;
          id?: string;
          interaction_type: string;
          share_id: string;
          user_id: string;
        };
        Update: {
          comment_text?: string | null;
          created_at?: string | null;
          id?: string;
          interaction_type?: string;
          share_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "progress_share_interactions_share_id_fkey";
            columns: ["share_id"];
            isOneToOne: false;
            referencedRelation: "progress_shares";
            referencedColumns: ["id"];
          },
        ];
      };
      progress_shares: {
        Row: {
          comment_count: number | null;
          content_data: Json | null;
          content_type: string;
          created_at: string | null;
          description: string | null;
          display_name: string | null;
          id: string;
          is_anonymous: boolean | null;
          is_approved: boolean | null;
          is_featured: boolean | null;
          like_count: number | null;
          share_count: number | null;
          share_type: string;
          title: string | null;
          updated_at: string | null;
          user_id: string;
          view_count: number | null;
        };
        Insert: {
          comment_count?: number | null;
          content_data?: Json | null;
          content_type: string;
          created_at?: string | null;
          description?: string | null;
          display_name?: string | null;
          id?: string;
          is_anonymous?: boolean | null;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          like_count?: number | null;
          share_count?: number | null;
          share_type: string;
          title?: string | null;
          updated_at?: string | null;
          user_id: string;
          view_count?: number | null;
        };
        Update: {
          comment_count?: number | null;
          content_data?: Json | null;
          content_type?: string;
          created_at?: string | null;
          description?: string | null;
          display_name?: string | null;
          id?: string;
          is_anonymous?: boolean | null;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          like_count?: number | null;
          share_count?: number | null;
          share_type?: string;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string;
          view_count?: number | null;
        };
        Relationships: [];
      };
      prostate_health: {
        Row: {
          blood_in_urine: boolean | null;
          created_at: string | null;
          entry_date: string;
          id: string;
          notes: string | null;
          pain_level: number | null;
          psa_level: number | null;
          symptoms: string[] | null;
          updated_at: string | null;
          urination_difficulty: string | null;
          urination_frequency: number | null;
          user_id: string;
        };
        Insert: {
          blood_in_urine?: boolean | null;
          created_at?: string | null;
          entry_date?: string;
          id?: string;
          notes?: string | null;
          pain_level?: number | null;
          psa_level?: number | null;
          symptoms?: string[] | null;
          updated_at?: string | null;
          urination_difficulty?: string | null;
          urination_frequency?: number | null;
          user_id: string;
        };
        Update: {
          blood_in_urine?: boolean | null;
          created_at?: string | null;
          entry_date?: string;
          id?: string;
          notes?: string | null;
          pain_level?: number | null;
          psa_level?: number | null;
          symptoms?: string[] | null;
          updated_at?: string | null;
          urination_difficulty?: string | null;
          urination_frequency?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      provider_dashboard_metrics: {
        Row: {
          active_patients: number | null;
          average_patient_engagement: number | null;
          consultations_count: number | null;
          created_at: string | null;
          id: string;
          metric_date: string;
          new_patients: number | null;
          patients_with_recent_activity: number | null;
          provider_id: string;
          reports_generated: number | null;
          total_patients: number | null;
        };
        Insert: {
          active_patients?: number | null;
          average_patient_engagement?: number | null;
          consultations_count?: number | null;
          created_at?: string | null;
          id?: string;
          metric_date: string;
          new_patients?: number | null;
          patients_with_recent_activity?: number | null;
          provider_id: string;
          reports_generated?: number | null;
          total_patients?: number | null;
        };
        Update: {
          active_patients?: number | null;
          average_patient_engagement?: number | null;
          consultations_count?: number | null;
          created_at?: string | null;
          id?: string;
          metric_date?: string;
          new_patients?: number | null;
          patients_with_recent_activity?: number | null;
          provider_id?: string;
          reports_generated?: number | null;
          total_patients?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "provider_dashboard_metrics_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "healthcare_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      provider_patient_communications: {
        Row: {
          communication_type: string;
          content: string;
          created_at: string | null;
          direction: string;
          from_user_id: string;
          id: string;
          is_archived: boolean | null;
          is_encrypted: boolean | null;
          is_read: boolean | null;
          patient_id: string;
          provider_id: string;
          read_at: string | null;
          subject: string | null;
          to_user_id: string;
        };
        Insert: {
          communication_type: string;
          content: string;
          created_at?: string | null;
          direction: string;
          from_user_id: string;
          id?: string;
          is_archived?: boolean | null;
          is_encrypted?: boolean | null;
          is_read?: boolean | null;
          patient_id: string;
          provider_id: string;
          read_at?: string | null;
          subject?: string | null;
          to_user_id: string;
        };
        Update: {
          communication_type?: string;
          content?: string;
          created_at?: string | null;
          direction?: string;
          from_user_id?: string;
          id?: string;
          is_archived?: boolean | null;
          is_encrypted?: boolean | null;
          is_read?: boolean | null;
          patient_id?: string;
          provider_id?: string;
          read_at?: string | null;
          subject?: string | null;
          to_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "provider_patient_communications_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "healthcare_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      provider_professional_reports: {
        Row: {
          created_at: string | null;
          file_format: string | null;
          file_url: string | null;
          findings: string[] | null;
          id: string;
          is_shared_with_patient: boolean | null;
          patient_id: string;
          provider_id: string;
          recommendations: string[] | null;
          report_content: Json;
          report_status: string | null;
          report_title: string;
          report_type: string;
          shared_at: string | null;
          treatment_plan: Json | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          file_format?: string | null;
          file_url?: string | null;
          findings?: string[] | null;
          id?: string;
          is_shared_with_patient?: boolean | null;
          patient_id: string;
          provider_id: string;
          recommendations?: string[] | null;
          report_content: Json;
          report_status?: string | null;
          report_title: string;
          report_type: string;
          shared_at?: string | null;
          treatment_plan?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          file_format?: string | null;
          file_url?: string | null;
          findings?: string[] | null;
          id?: string;
          is_shared_with_patient?: boolean | null;
          patient_id?: string;
          provider_id?: string;
          recommendations?: string[] | null;
          report_content?: Json;
          report_status?: string | null;
          report_title?: string;
          report_type?: string;
          shared_at?: string | null;
          treatment_plan?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "provider_professional_reports_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "healthcare_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      provider_reports: {
        Row: {
          created_at: string | null;
          file_format: string | null;
          file_url: string | null;
          findings: string[] | null;
          id: string;
          is_shared_with_patient: boolean | null;
          patient_id: string;
          provider_id: string;
          recommendations: string[] | null;
          report_content: Json | null;
          report_title: string;
          report_type: string;
          shared_at: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          file_format?: string | null;
          file_url?: string | null;
          findings?: string[] | null;
          id?: string;
          is_shared_with_patient?: boolean | null;
          patient_id: string;
          provider_id: string;
          recommendations?: string[] | null;
          report_content?: Json | null;
          report_title: string;
          report_type: string;
          shared_at?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          file_format?: string | null;
          file_url?: string | null;
          findings?: string[] | null;
          id?: string;
          is_shared_with_patient?: boolean | null;
          patient_id?: string;
          provider_id?: string;
          recommendations?: string[] | null;
          report_content?: Json | null;
          report_title?: string;
          report_type?: string;
          shared_at?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      provider_sharing: {
        Row: {
          access_expires_at: string;
          access_granted_at: string | null;
          access_revoked: boolean | null;
          created_at: string | null;
          export_id: string | null;
          id: string;
          last_viewed_at: string | null;
          provider_email: string;
          provider_name: string;
          provider_npi: string | null;
          sharing_code: string;
          updated_at: string | null;
          user_id: string;
          view_count: number | null;
        };
        Insert: {
          access_expires_at: string;
          access_granted_at?: string | null;
          access_revoked?: boolean | null;
          created_at?: string | null;
          export_id?: string | null;
          id?: string;
          last_viewed_at?: string | null;
          provider_email: string;
          provider_name: string;
          provider_npi?: string | null;
          sharing_code: string;
          updated_at?: string | null;
          user_id: string;
          view_count?: number | null;
        };
        Update: {
          access_expires_at?: string;
          access_granted_at?: string | null;
          access_revoked?: boolean | null;
          created_at?: string | null;
          export_id?: string | null;
          id?: string;
          last_viewed_at?: string | null;
          provider_email?: string;
          provider_name?: string;
          provider_npi?: string | null;
          sharing_code?: string;
          updated_at?: string | null;
          user_id?: string;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "provider_sharing_export_id_fkey";
            columns: ["export_id"];
            isOneToOne: false;
            referencedRelation: "medical_export_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      provider_staff: {
        Row: {
          added_at: string | null;
          id: string;
          is_active: boolean | null;
          permissions: Json | null;
          provider_id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          added_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          permissions?: Json | null;
          provider_id: string;
          role: string;
          user_id: string;
        };
        Update: {
          added_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          permissions?: Json | null;
          provider_id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "provider_staff_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "healthcare_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      provider_subscriptions: {
        Row: {
          created_at: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          features_included: Json | null;
          id: string;
          max_patients: number | null;
          max_staff: number | null;
          price_per_month: number;
          provider_id: string;
          status: string;
          stripe_price_id: string | null;
          stripe_subscription_id: string | null;
          subscription_tier: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          features_included?: Json | null;
          id?: string;
          max_patients?: number | null;
          max_staff?: number | null;
          price_per_month: number;
          provider_id: string;
          status: string;
          stripe_price_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_tier: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          features_included?: Json | null;
          id?: string;
          max_patients?: number | null;
          max_staff?: number | null;
          price_per_month?: number;
          provider_id?: string;
          status?: string;
          stripe_price_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_tier?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "provider_subscriptions_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "healthcare_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      quality_assessment_history: {
        Row: {
          angle_score: number | null;
          assessed_at: string | null;
          average_score: number | null;
          compared_to_average: boolean | null;
          contrast_score: number | null;
          created_at: string | null;
          critical_issues: string[] | null;
          distance_score: number | null;
          focus_score: number | null;
          id: string;
          lighting_score: number | null;
          overall_score: number;
          percentile_rank: number | null;
          recommendations: string[] | null;
          scan_id: string | null;
          stability_score: number | null;
          user_id: string;
        };
        Insert: {
          angle_score?: number | null;
          assessed_at?: string | null;
          average_score?: number | null;
          compared_to_average?: boolean | null;
          contrast_score?: number | null;
          created_at?: string | null;
          critical_issues?: string[] | null;
          distance_score?: number | null;
          focus_score?: number | null;
          id?: string;
          lighting_score?: number | null;
          overall_score: number;
          percentile_rank?: number | null;
          recommendations?: string[] | null;
          scan_id?: string | null;
          stability_score?: number | null;
          user_id: string;
        };
        Update: {
          angle_score?: number | null;
          assessed_at?: string | null;
          average_score?: number | null;
          compared_to_average?: boolean | null;
          contrast_score?: number | null;
          created_at?: string | null;
          critical_issues?: string[] | null;
          distance_score?: number | null;
          focus_score?: number | null;
          id?: string;
          lighting_score?: number | null;
          overall_score?: number;
          percentile_rank?: number | null;
          recommendations?: string[] | null;
          scan_id?: string | null;
          stability_score?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quality_assessment_history_scan_id_fkey";
            columns: ["scan_id"];
            isOneToOne: false;
            referencedRelation: "scans";
            referencedColumns: ["id"];
          },
        ];
      };
      real_time_scan_feedback: {
        Row: {
          created_at: string | null;
          detected_conditions: Json | null;
          detected_objects: Json | null;
          frame_analysis: Json | null;
          frame_timestamp: string | null;
          id: string;
          measurement_confidence: number | null;
          preview_measurements: Json | null;
          quality_score: number | null;
          session_id: string | null;
          suggestions: Json | null;
          user_id: string;
          warnings: Json | null;
        };
        Insert: {
          created_at?: string | null;
          detected_conditions?: Json | null;
          detected_objects?: Json | null;
          frame_analysis?: Json | null;
          frame_timestamp?: string | null;
          id?: string;
          measurement_confidence?: number | null;
          preview_measurements?: Json | null;
          quality_score?: number | null;
          session_id?: string | null;
          suggestions?: Json | null;
          user_id: string;
          warnings?: Json | null;
        };
        Update: {
          created_at?: string | null;
          detected_conditions?: Json | null;
          detected_objects?: Json | null;
          frame_analysis?: Json | null;
          frame_timestamp?: string | null;
          id?: string;
          measurement_confidence?: number | null;
          preview_measurements?: Json | null;
          quality_score?: number | null;
          session_id?: string | null;
          suggestions?: Json | null;
          user_id?: string;
          warnings?: Json | null;
        };
        Relationships: [];
      };
      referral_codes: {
        Row: {
          code: string;
          created_at: string | null;
          expires_at: string | null;
          id: string;
          is_active: boolean | null;
          max_uses: number | null;
          updated_at: string | null;
          usage_count: number | null;
          user_id: string;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_uses?: number | null;
          updated_at?: string | null;
          usage_count?: number | null;
          user_id: string;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_uses?: number | null;
          updated_at?: string | null;
          usage_count?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      referral_rewards: {
        Row: {
          applied_at: string | null;
          created_at: string | null;
          expires_at: string | null;
          id: string;
          referral_tracking_id: string;
          reward_status: string;
          reward_type: string;
          reward_value: number;
          user_id: string;
        };
        Insert: {
          applied_at?: string | null;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          referral_tracking_id: string;
          reward_status?: string;
          reward_type: string;
          reward_value: number;
          user_id: string;
        };
        Update: {
          applied_at?: string | null;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          referral_tracking_id?: string;
          reward_status?: string;
          reward_type?: string;
          reward_value?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referral_tracking_id_fkey";
            columns: ["referral_tracking_id"];
            isOneToOne: false;
            referencedRelation: "referral_tracking";
            referencedColumns: ["id"];
          },
        ];
      };
      referral_tracking: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          id: string;
          referral_code_id: string;
          referred_id: string;
          referred_subscribed: boolean | null;
          referred_subscription_tier: string | null;
          referrer_id: string;
          reward_applied: boolean | null;
          reward_type: string | null;
          reward_value: number | null;
          rewarded_at: string | null;
          status: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          referral_code_id: string;
          referred_id: string;
          referred_subscribed?: boolean | null;
          referred_subscription_tier?: string | null;
          referrer_id: string;
          reward_applied?: boolean | null;
          reward_type?: string | null;
          reward_value?: number | null;
          rewarded_at?: string | null;
          status?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          referral_code_id?: string;
          referred_id?: string;
          referred_subscribed?: boolean | null;
          referred_subscription_tier?: string | null;
          referrer_id?: string;
          reward_applied?: boolean | null;
          reward_type?: string | null;
          reward_value?: number | null;
          rewarded_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "referral_tracking_referral_code_id_fkey";
            columns: ["referral_code_id"];
            isOneToOne: false;
            referencedRelation: "referral_codes";
            referencedColumns: ["id"];
          },
        ];
      };
      report_sharing_access_log: {
        Row: {
          access_token: string | null;
          accessed_at: string | null;
          accessed_by_id: string | null;
          accessed_by_type: string;
          duration_seconds: number | null;
          export_format: string | null;
          exported: boolean | null;
          id: string;
          ip_address: string | null;
          pages_viewed: number | null;
          report_id: string;
          user_agent: string | null;
        };
        Insert: {
          access_token?: string | null;
          accessed_at?: string | null;
          accessed_by_id?: string | null;
          accessed_by_type: string;
          duration_seconds?: number | null;
          export_format?: string | null;
          exported?: boolean | null;
          id?: string;
          ip_address?: string | null;
          pages_viewed?: number | null;
          report_id: string;
          user_agent?: string | null;
        };
        Update: {
          access_token?: string | null;
          accessed_at?: string | null;
          accessed_by_id?: string | null;
          accessed_by_type?: string;
          duration_seconds?: number | null;
          export_format?: string | null;
          exported?: boolean | null;
          id?: string;
          ip_address?: string | null;
          pages_viewed?: number | null;
          report_id?: string;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "report_sharing_access_log_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "generated_reports";
            referencedColumns: ["id"];
          },
        ];
      };
      report_templates: {
        Row: {
          category: string | null;
          created_at: string | null;
          created_by: string | null;
          default_color_scheme: Json | null;
          default_date_range: Json | null;
          default_metrics: string[] | null;
          default_theme: string | null;
          description: string | null;
          id: string;
          is_featured: boolean | null;
          is_premium: boolean | null;
          preview_description: string | null;
          preview_image_url: string | null;
          template_config: Json;
          template_name: string;
          updated_at: string | null;
          usage_count: number | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          default_color_scheme?: Json | null;
          default_date_range?: Json | null;
          default_metrics?: string[] | null;
          default_theme?: string | null;
          description?: string | null;
          id?: string;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          preview_description?: string | null;
          preview_image_url?: string | null;
          template_config: Json;
          template_name: string;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          default_color_scheme?: Json | null;
          default_date_range?: Json | null;
          default_metrics?: string[] | null;
          default_theme?: string | null;
          description?: string | null;
          id?: string;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          preview_description?: string | null;
          preview_image_url?: string | null;
          template_config?: Json;
          template_name?: string;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Relationships: [];
      };
      research_contribution_stats: {
        Row: {
          contributions_by_type: Json | null;
          created_at: string | null;
          id: string;
          impact_score: number | null;
          last_contribution_at: string | null;
          total_contributions: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          contributions_by_type?: Json | null;
          created_at?: string | null;
          id?: string;
          impact_score?: number | null;
          last_contribution_at?: string | null;
          total_contributions?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          contributions_by_type?: Json | null;
          created_at?: string | null;
          id?: string;
          impact_score?: number | null;
          last_contribution_at?: string | null;
          total_contributions?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      research_participation: {
        Row: {
          anonymization_level: string | null;
          consent_given_at: string | null;
          consent_version: string | null;
          created_at: string | null;
          data_sharing_preferences: Json | null;
          id: string;
          opted_in: boolean | null;
          program_id: string;
          updated_at: string | null;
          user_id: string;
          withdrawal_date: string | null;
        };
        Insert: {
          anonymization_level?: string | null;
          consent_given_at?: string | null;
          consent_version?: string | null;
          created_at?: string | null;
          data_sharing_preferences?: Json | null;
          id?: string;
          opted_in?: boolean | null;
          program_id: string;
          updated_at?: string | null;
          user_id: string;
          withdrawal_date?: string | null;
        };
        Update: {
          anonymization_level?: string | null;
          consent_given_at?: string | null;
          consent_version?: string | null;
          created_at?: string | null;
          data_sharing_preferences?: Json | null;
          id?: string;
          opted_in?: boolean | null;
          program_id?: string;
          updated_at?: string | null;
          user_id?: string;
          withdrawal_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "research_participation_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "research_programs";
            referencedColumns: ["id"];
          },
        ];
      };
      research_programs: {
        Row: {
          compensation_points: number | null;
          created_at: string | null;
          current_participants: number | null;
          data_requirements: Json;
          description: string;
          end_date: string | null;
          id: string;
          inclusion_criteria: Json | null;
          institution: string;
          irb_approval_number: string | null;
          max_participants: number | null;
          name: string;
          principal_investigator: string | null;
          start_date: string;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          compensation_points?: number | null;
          created_at?: string | null;
          current_participants?: number | null;
          data_requirements: Json;
          description: string;
          end_date?: string | null;
          id?: string;
          inclusion_criteria?: Json | null;
          institution: string;
          irb_approval_number?: string | null;
          max_participants?: number | null;
          name: string;
          principal_investigator?: string | null;
          start_date: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          compensation_points?: number | null;
          created_at?: string | null;
          current_participants?: number | null;
          data_requirements?: Json;
          description?: string;
          end_date?: string | null;
          id?: string;
          inclusion_criteria?: Json | null;
          institution?: string;
          irb_approval_number?: string | null;
          max_participants?: number | null;
          name?: string;
          principal_investigator?: string | null;
          start_date?: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      research_rewards: {
        Row: {
          created_at: string | null;
          id: string;
          points_balance: number | null;
          total_points_earned: number | null;
          total_points_redeemed: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          points_balance?: number | null;
          total_points_earned?: number | null;
          total_points_redeemed?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          points_balance?: number | null;
          total_points_earned?: number | null;
          total_points_redeemed?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      rest_day_recommendations: {
        Row: {
          confidence: number | null;
          created_at: string | null;
          factors_considered: Json | null;
          id: string;
          reason: string;
          recommendation_type: string | null;
          recommended_at: string | null;
          recommended_date: string;
          routine_id: string | null;
          user_feedback: string | null;
          user_id: string;
          was_followed: boolean | null;
        };
        Insert: {
          confidence?: number | null;
          created_at?: string | null;
          factors_considered?: Json | null;
          id?: string;
          reason: string;
          recommendation_type?: string | null;
          recommended_at?: string | null;
          recommended_date: string;
          routine_id?: string | null;
          user_feedback?: string | null;
          user_id: string;
          was_followed?: boolean | null;
        };
        Update: {
          confidence?: number | null;
          created_at?: string | null;
          factors_considered?: Json | null;
          id?: string;
          reason?: string;
          recommendation_type?: string | null;
          recommended_at?: string | null;
          recommended_date?: string;
          routine_id?: string | null;
          user_feedback?: string | null;
          user_id?: string;
          was_followed?: boolean | null;
        };
        Relationships: [];
      };
      rewards_transactions: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          metadata: Json | null;
          points: number;
          source: string;
          transaction_type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          points: number;
          source: string;
          transaction_type: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          points?: number;
          source?: string;
          transaction_type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      risk_factor_data: {
        Row: {
          created_at: string | null;
          description: string | null;
          factor_name: string;
          factor_weight: number | null;
          id: string;
          mitigation_strategies: string[] | null;
          risk_type: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          factor_name: string;
          factor_weight?: number | null;
          id?: string;
          mitigation_strategies?: string[] | null;
          risk_type: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          factor_name?: string;
          factor_weight?: number | null;
          id?: string;
          mitigation_strategies?: string[] | null;
          risk_type?: string;
        };
        Relationships: [];
      };
      routine_analytics: {
        Row: {
          analysis_period_end: string;
          analysis_period_start: string;
          average_session_duration_minutes: number | null;
          calculated_at: string | null;
          completed_sessions: number | null;
          completion_rate: number | null;
          consistency_score: number | null;
          created_at: string | null;
          current_measurements: Json | null;
          difficulty_adjustments_made: number | null;
          engagement_score: number | null;
          goals_achieved: string[] | null;
          goals_in_progress: string[] | null;
          goals_not_met: string[] | null;
          id: string;
          insights: string[] | null;
          progress_made: Json | null;
          recommendations: string[] | null;
          routine_id: string | null;
          skipped_sessions: number | null;
          starting_measurements: Json | null;
          total_sessions: number | null;
          total_time_spent_minutes: number | null;
          user_id: string;
        };
        Insert: {
          analysis_period_end: string;
          analysis_period_start: string;
          average_session_duration_minutes?: number | null;
          calculated_at?: string | null;
          completed_sessions?: number | null;
          completion_rate?: number | null;
          consistency_score?: number | null;
          created_at?: string | null;
          current_measurements?: Json | null;
          difficulty_adjustments_made?: number | null;
          engagement_score?: number | null;
          goals_achieved?: string[] | null;
          goals_in_progress?: string[] | null;
          goals_not_met?: string[] | null;
          id?: string;
          insights?: string[] | null;
          progress_made?: Json | null;
          recommendations?: string[] | null;
          routine_id?: string | null;
          skipped_sessions?: number | null;
          starting_measurements?: Json | null;
          total_sessions?: number | null;
          total_time_spent_minutes?: number | null;
          user_id: string;
        };
        Update: {
          analysis_period_end?: string;
          analysis_period_start?: string;
          average_session_duration_minutes?: number | null;
          calculated_at?: string | null;
          completed_sessions?: number | null;
          completion_rate?: number | null;
          consistency_score?: number | null;
          created_at?: string | null;
          current_measurements?: Json | null;
          difficulty_adjustments_made?: number | null;
          engagement_score?: number | null;
          goals_achieved?: string[] | null;
          goals_in_progress?: string[] | null;
          goals_not_met?: string[] | null;
          id?: string;
          insights?: string[] | null;
          progress_made?: Json | null;
          recommendations?: string[] | null;
          routine_id?: string | null;
          skipped_sessions?: number | null;
          starting_measurements?: Json | null;
          total_sessions?: number | null;
          total_time_spent_minutes?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      routine_marketplace: {
        Row: {
          average_rating: number | null;
          created_at: string | null;
          creator_id: string;
          currency: string | null;
          featured_image_url: string | null;
          id: string;
          is_active: boolean | null;
          is_featured: boolean | null;
          is_subscription: boolean | null;
          marketplace_category: string | null;
          preview_video_url: string | null;
          price: number;
          revenue_total: number | null;
          sales_count: number | null;
          subscription_duration_days: number | null;
          tags: string[] | null;
          template_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          average_rating?: number | null;
          created_at?: string | null;
          creator_id: string;
          currency?: string | null;
          featured_image_url?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_subscription?: boolean | null;
          marketplace_category?: string | null;
          preview_video_url?: string | null;
          price: number;
          revenue_total?: number | null;
          sales_count?: number | null;
          subscription_duration_days?: number | null;
          tags?: string[] | null;
          template_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          average_rating?: number | null;
          created_at?: string | null;
          creator_id?: string;
          currency?: string | null;
          featured_image_url?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_subscription?: boolean | null;
          marketplace_category?: string | null;
          preview_video_url?: string | null;
          price?: number;
          revenue_total?: number | null;
          sales_count?: number | null;
          subscription_duration_days?: number | null;
          tags?: string[] | null;
          template_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "routine_marketplace_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "routine_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      routine_purchases: {
        Row: {
          access_expires_at: string | null;
          access_granted_at: string | null;
          id: string;
          is_active: boolean | null;
          marketplace_id: string;
          payment_intent_id: string | null;
          price_paid: number;
          purchase_type: string | null;
          purchased_at: string | null;
          user_id: string;
        };
        Insert: {
          access_expires_at?: string | null;
          access_granted_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          marketplace_id: string;
          payment_intent_id?: string | null;
          price_paid: number;
          purchase_type?: string | null;
          purchased_at?: string | null;
          user_id: string;
        };
        Update: {
          access_expires_at?: string | null;
          access_granted_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          marketplace_id?: string;
          payment_intent_id?: string | null;
          price_paid?: number;
          purchase_type?: string | null;
          purchased_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "routine_purchases_marketplace_id_fkey";
            columns: ["marketplace_id"];
            isOneToOne: false;
            referencedRelation: "routine_marketplace";
            referencedColumns: ["id"];
          },
        ];
      };
      routine_template_reviews: {
        Row: {
          completed_routine: boolean | null;
          cons: string[] | null;
          created_at: string | null;
          helpful_count: number | null;
          id: string;
          is_verified_purchase: boolean | null;
          pros: string[] | null;
          rating: number;
          results_achieved: string | null;
          review_text: string | null;
          template_id: string;
          updated_at: string | null;
          user_id: string;
          weeks_completed: number | null;
        };
        Insert: {
          completed_routine?: boolean | null;
          cons?: string[] | null;
          created_at?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_verified_purchase?: boolean | null;
          pros?: string[] | null;
          rating: number;
          results_achieved?: string | null;
          review_text?: string | null;
          template_id: string;
          updated_at?: string | null;
          user_id: string;
          weeks_completed?: number | null;
        };
        Update: {
          completed_routine?: boolean | null;
          cons?: string[] | null;
          created_at?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_verified_purchase?: boolean | null;
          pros?: string[] | null;
          rating?: number;
          results_achieved?: string | null;
          review_text?: string | null;
          template_id?: string;
          updated_at?: string | null;
          user_id?: string;
          weeks_completed?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "routine_template_reviews_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "routine_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      routine_templates: {
        Row: {
          average_rating: number | null;
          category: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string;
          difficulty_level: number | null;
          duration_weeks: number | null;
          equipment_required: string[] | null;
          estimated_time_per_session_minutes: number | null;
          exercises: Json;
          expected_outcomes: string | null;
          experience_required: string | null;
          has_video_guidance: boolean | null;
          id: string;
          intensity_level: string | null;
          is_featured: boolean | null;
          is_premium: boolean | null;
          is_system_template: boolean | null;
          is_verified: boolean | null;
          rating_count: number | null;
          review_count: number | null;
          sessions_per_week: number | null;
          success_rate: number | null;
          target_goals: string[] | null;
          template_name: string;
          time_commitment: string | null;
          updated_at: string | null;
          usage_count: number | null;
          video_urls: Json | null;
        };
        Insert: {
          average_rating?: number | null;
          category?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description: string;
          difficulty_level?: number | null;
          duration_weeks?: number | null;
          equipment_required?: string[] | null;
          estimated_time_per_session_minutes?: number | null;
          exercises: Json;
          expected_outcomes?: string | null;
          experience_required?: string | null;
          has_video_guidance?: boolean | null;
          id?: string;
          intensity_level?: string | null;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          is_system_template?: boolean | null;
          is_verified?: boolean | null;
          rating_count?: number | null;
          review_count?: number | null;
          sessions_per_week?: number | null;
          success_rate?: number | null;
          target_goals?: string[] | null;
          template_name: string;
          time_commitment?: string | null;
          updated_at?: string | null;
          usage_count?: number | null;
          video_urls?: Json | null;
        };
        Update: {
          average_rating?: number | null;
          category?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string;
          difficulty_level?: number | null;
          duration_weeks?: number | null;
          equipment_required?: string[] | null;
          estimated_time_per_session_minutes?: number | null;
          exercises?: Json;
          expected_outcomes?: string | null;
          experience_required?: string | null;
          has_video_guidance?: boolean | null;
          id?: string;
          intensity_level?: string | null;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          is_system_template?: boolean | null;
          is_verified?: boolean | null;
          rating_count?: number | null;
          review_count?: number | null;
          sessions_per_week?: number | null;
          success_rate?: number | null;
          target_goals?: string[] | null;
          template_name?: string;
          time_commitment?: string | null;
          updated_at?: string | null;
          usage_count?: number | null;
          video_urls?: Json | null;
        };
        Relationships: [];
      };
      routine_timing_predictions: {
        Row: {
          created_at: string | null;
          expected_effectiveness: number | null;
          expected_progress: Json | null;
          id: string;
          model_id: string | null;
          optimal_days: Json | null;
          optimal_duration_minutes: number | null;
          optimal_frequency_per_week: number | null;
          optimal_times: Json;
          prediction_date: string;
          prediction_period_days: number | null;
          timing_factors: Json | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          expected_effectiveness?: number | null;
          expected_progress?: Json | null;
          id?: string;
          model_id?: string | null;
          optimal_days?: Json | null;
          optimal_duration_minutes?: number | null;
          optimal_frequency_per_week?: number | null;
          optimal_times: Json;
          prediction_date: string;
          prediction_period_days?: number | null;
          timing_factors?: Json | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          expected_effectiveness?: number | null;
          expected_progress?: Json | null;
          id?: string;
          model_id?: string | null;
          optimal_days?: Json | null;
          optimal_duration_minutes?: number | null;
          optimal_frequency_per_week?: number | null;
          optimal_times?: Json;
          prediction_date?: string;
          prediction_period_days?: number | null;
          timing_factors?: Json | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "routine_timing_predictions_model_id_fkey";
            columns: ["model_id"];
            isOneToOne: false;
            referencedRelation: "predictive_models";
            referencedColumns: ["id"];
          },
        ];
      };
      scan_history: {
        Row: {
          circumference: number | null;
          created_at: string;
          curvature_angle: number | null;
          curvature_direction: string | null;
          id: string;
          image_path: string | null;
          length: number | null;
          notes: string | null;
          scan_type: string;
          user_id: string;
        };
        Insert: {
          circumference?: number | null;
          created_at?: string;
          curvature_angle?: number | null;
          curvature_direction?: string | null;
          id?: string;
          image_path?: string | null;
          length?: number | null;
          notes?: string | null;
          scan_type?: string;
          user_id: string;
        };
        Update: {
          circumference?: number | null;
          created_at?: string;
          curvature_angle?: number | null;
          curvature_direction?: string | null;
          id?: string;
          image_path?: string | null;
          length?: number | null;
          notes?: string | null;
          scan_type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      scans: {
        Row: {
          analysis_result: Json | null;
          calibration_factor: number | null;
          conditions: Json | null;
          confidence_level: number | null;
          created_at: string | null;
          curvature_angle: number | null;
          curvature_detected: boolean | null;
          curvature_direction: string | null;
          curvature_severity: string | null;
          erect_girth: number | null;
          erect_length: number | null;
          girth: number | null;
          has_image: boolean | null;
          id: string;
          image_hash: string | null;
          length: number | null;
          notes: string | null;
          overall_health: string | null;
          recommendations: string[] | null;
          reference_object: string | null;
          scan_source: string | null;
          scan_type: string;
          scanned_at: string | null;
          skin_health_status: string | null;
          skin_observations: string[] | null;
          tags: string[] | null;
          updated_at: string | null;
          urgency: string | null;
          user_id: string;
        };
        Insert: {
          analysis_result?: Json | null;
          calibration_factor?: number | null;
          conditions?: Json | null;
          confidence_level?: number | null;
          created_at?: string | null;
          curvature_angle?: number | null;
          curvature_detected?: boolean | null;
          curvature_direction?: string | null;
          curvature_severity?: string | null;
          erect_girth?: number | null;
          erect_length?: number | null;
          girth?: number | null;
          has_image?: boolean | null;
          id?: string;
          image_hash?: string | null;
          length?: number | null;
          notes?: string | null;
          overall_health?: string | null;
          recommendations?: string[] | null;
          reference_object?: string | null;
          scan_source?: string | null;
          scan_type?: string;
          scanned_at?: string | null;
          skin_health_status?: string | null;
          skin_observations?: string[] | null;
          tags?: string[] | null;
          updated_at?: string | null;
          urgency?: string | null;
          user_id: string;
        };
        Update: {
          analysis_result?: Json | null;
          calibration_factor?: number | null;
          conditions?: Json | null;
          confidence_level?: number | null;
          created_at?: string | null;
          curvature_angle?: number | null;
          curvature_detected?: boolean | null;
          curvature_direction?: string | null;
          curvature_severity?: string | null;
          erect_girth?: number | null;
          erect_length?: number | null;
          girth?: number | null;
          has_image?: boolean | null;
          id?: string;
          image_hash?: string | null;
          length?: number | null;
          notes?: string | null;
          overall_health?: string | null;
          recommendations?: string[] | null;
          reference_object?: string | null;
          scan_source?: string | null;
          scan_type?: string;
          scanned_at?: string | null;
          skin_health_status?: string | null;
          skin_observations?: string[] | null;
          tags?: string[] | null;
          updated_at?: string | null;
          urgency?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      screening_reminders: {
        Row: {
          created_at: string | null;
          frequency_months: number | null;
          id: string;
          is_active: boolean | null;
          last_reminder_date: string | null;
          next_reminder_date: string;
          notes: string | null;
          reminder_type: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          frequency_months?: number | null;
          id?: string;
          is_active?: boolean | null;
          last_reminder_date?: string | null;
          next_reminder_date: string;
          notes?: string | null;
          reminder_type: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          frequency_months?: number | null;
          id?: string;
          is_active?: boolean | null;
          last_reminder_date?: string | null;
          next_reminder_date?: string;
          notes?: string | null;
          reminder_type?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      security_alerts: {
        Row: {
          acknowledged_at: string | null;
          action_data: Json | null;
          action_taken: string | null;
          alert_message: string;
          alert_severity: string | null;
          alert_title: string;
          alert_type: string;
          created_at: string | null;
          device_id: string | null;
          id: string;
          ip_address: unknown;
          is_acknowledged: boolean | null;
          is_read: boolean | null;
          location_city: string | null;
          location_country: string | null;
          read_at: string | null;
          user_id: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          action_data?: Json | null;
          action_taken?: string | null;
          alert_message: string;
          alert_severity?: string | null;
          alert_title: string;
          alert_type: string;
          created_at?: string | null;
          device_id?: string | null;
          id?: string;
          ip_address?: unknown;
          is_acknowledged?: boolean | null;
          is_read?: boolean | null;
          location_city?: string | null;
          location_country?: string | null;
          read_at?: string | null;
          user_id: string;
        };
        Update: {
          acknowledged_at?: string | null;
          action_data?: Json | null;
          action_taken?: string | null;
          alert_message?: string;
          alert_severity?: string | null;
          alert_title?: string;
          alert_type?: string;
          created_at?: string | null;
          device_id?: string | null;
          id?: string;
          ip_address?: unknown;
          is_acknowledged?: boolean | null;
          is_read?: boolean | null;
          location_city?: string | null;
          location_country?: string | null;
          read_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "security_alerts_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "user_devices";
            referencedColumns: ["id"];
          },
        ];
      };
      seductive_ai_messages: {
        Row: {
          adult_emojis: string[] | null;
          ai_confidence: number | null;
          ai_sentiment: string | null;
          ai_suggestions: string[] | null;
          context_data: Json | null;
          created_at: string | null;
          gifs_urls: string[] | null;
          id: string;
          images_urls: string[] | null;
          message_content: string;
          message_type: string;
          session_id: string;
          user_id: string;
          videos_urls: string[] | null;
          voice_message_url: string | null;
        };
        Insert: {
          adult_emojis?: string[] | null;
          ai_confidence?: number | null;
          ai_sentiment?: string | null;
          ai_suggestions?: string[] | null;
          context_data?: Json | null;
          created_at?: string | null;
          gifs_urls?: string[] | null;
          id?: string;
          images_urls?: string[] | null;
          message_content: string;
          message_type: string;
          session_id: string;
          user_id: string;
          videos_urls?: string[] | null;
          voice_message_url?: string | null;
        };
        Update: {
          adult_emojis?: string[] | null;
          ai_confidence?: number | null;
          ai_sentiment?: string | null;
          ai_suggestions?: string[] | null;
          context_data?: Json | null;
          created_at?: string | null;
          gifs_urls?: string[] | null;
          id?: string;
          images_urls?: string[] | null;
          message_content?: string;
          message_type?: string;
          session_id?: string;
          user_id?: string;
          videos_urls?: string[] | null;
          voice_message_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "seductive_ai_messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "seductive_ai_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      seductive_ai_sessions: {
        Row: {
          ai_intensity: string | null;
          ai_personality: string | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          partner_id: string | null;
          session_name: string | null;
          session_type: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          ai_intensity?: string | null;
          ai_personality?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          partner_id?: string | null;
          session_name?: string | null;
          session_type?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          ai_intensity?: string | null;
          ai_personality?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          partner_id?: string | null;
          session_name?: string | null;
          session_type?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      self_examination_guides: {
        Row: {
          created_at: string | null;
          exam_type: string;
          frequency_recommendation: string | null;
          id: string;
          image_urls: string[] | null;
          is_active: boolean | null;
          step_by_step_instructions: string[];
          title: string;
          updated_at: string | null;
          video_url: string | null;
          warning_signs: string[] | null;
          when_to_see_doctor: string | null;
        };
        Insert: {
          created_at?: string | null;
          exam_type: string;
          frequency_recommendation?: string | null;
          id?: string;
          image_urls?: string[] | null;
          is_active?: boolean | null;
          step_by_step_instructions: string[];
          title: string;
          updated_at?: string | null;
          video_url?: string | null;
          warning_signs?: string[] | null;
          when_to_see_doctor?: string | null;
        };
        Update: {
          created_at?: string | null;
          exam_type?: string;
          frequency_recommendation?: string | null;
          id?: string;
          image_urls?: string[] | null;
          is_active?: boolean | null;
          step_by_step_instructions?: string[];
          title?: string;
          updated_at?: string | null;
          video_url?: string | null;
          warning_signs?: string[] | null;
          when_to_see_doctor?: string | null;
        };
        Relationships: [];
      };
      sex_positions_library: {
        Row: {
          created_at: string | null;
          description: string | null;
          difficulty_level: string | null;
          gif_url: string | null;
          id: string;
          image_url: string | null;
          instructions: string[] | null;
          is_featured: boolean | null;
          popularity_score: number | null;
          position_category: string | null;
          position_name: string;
          tips: string[] | null;
          updated_at: string | null;
          video_url: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          difficulty_level?: string | null;
          gif_url?: string | null;
          id?: string;
          image_url?: string | null;
          instructions?: string[] | null;
          is_featured?: boolean | null;
          popularity_score?: number | null;
          position_category?: string | null;
          position_name: string;
          tips?: string[] | null;
          updated_at?: string | null;
          video_url?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          difficulty_level?: string | null;
          gif_url?: string | null;
          id?: string;
          image_url?: string | null;
          instructions?: string[] | null;
          is_featured?: boolean | null;
          popularity_score?: number | null;
          position_category?: string | null;
          position_name?: string;
          tips?: string[] | null;
          updated_at?: string | null;
          video_url?: string | null;
        };
        Relationships: [];
      };
      sexual_health_education_modules: {
        Row: {
          age_group: string | null;
          author: string | null;
          category: string;
          content_html: string | null;
          content_text: string | null;
          content_type: string | null;
          created_at: string | null;
          description: string | null;
          difficulty_level: string | null;
          estimated_duration_minutes: number | null;
          expert_reviewed: boolean | null;
          id: string;
          is_featured: boolean | null;
          is_premium: boolean | null;
          last_updated: string | null;
          order_index: number | null;
          rating_average: number | null;
          rating_count: number | null;
          thumbnail_url: string | null;
          title: string;
          updated_at: string | null;
          video_url: string | null;
          view_count: number | null;
        };
        Insert: {
          age_group?: string | null;
          author?: string | null;
          category: string;
          content_html?: string | null;
          content_text?: string | null;
          content_type?: string | null;
          created_at?: string | null;
          description?: string | null;
          difficulty_level?: string | null;
          estimated_duration_minutes?: number | null;
          expert_reviewed?: boolean | null;
          id?: string;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          last_updated?: string | null;
          order_index?: number | null;
          rating_average?: number | null;
          rating_count?: number | null;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string | null;
          video_url?: string | null;
          view_count?: number | null;
        };
        Update: {
          age_group?: string | null;
          author?: string | null;
          category?: string;
          content_html?: string | null;
          content_text?: string | null;
          content_type?: string | null;
          created_at?: string | null;
          description?: string | null;
          difficulty_level?: string | null;
          estimated_duration_minutes?: number | null;
          expert_reviewed?: boolean | null;
          id?: string;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          last_updated?: string | null;
          order_index?: number | null;
          rating_average?: number | null;
          rating_count?: number | null;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string | null;
          video_url?: string | null;
          view_count?: number | null;
        };
        Relationships: [];
      };
      sexual_health_metrics: {
        Row: {
          created_at: string | null;
          delayed_ejaculation: boolean | null;
          entry_date: string;
          erectile_function_score: number | null;
          frequency_per_week: number | null;
          id: string;
          libido_level: number | null;
          notes: string | null;
          orgasm_quality: number | null;
          premature_ejaculation: boolean | null;
          satisfaction_level: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          delayed_ejaculation?: boolean | null;
          entry_date?: string;
          erectile_function_score?: number | null;
          frequency_per_week?: number | null;
          id?: string;
          libido_level?: number | null;
          notes?: string | null;
          orgasm_quality?: number | null;
          premature_ejaculation?: boolean | null;
          satisfaction_level?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          delayed_ejaculation?: boolean | null;
          entry_date?: string;
          erectile_function_score?: number | null;
          frequency_per_week?: number | null;
          id?: string;
          libido_level?: number | null;
          notes?: string | null;
          orgasm_quality?: number | null;
          premature_ejaculation?: boolean | null;
          satisfaction_level?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      sexual_wellness_entries: {
        Row: {
          activity_type: string | null;
          alcohol_consumption: string | null;
          communication_quality: number | null;
          created_at: string | null;
          desire_frequency: string | null;
          ejaculation_quality_score: number | null;
          entry_date: string;
          erectile_function_score: number | null;
          exercise_level: string | null;
          id: string;
          intimacy_level: number | null;
          libido_level: number | null;
          masturbation_count: number | null;
          morning_erections: boolean | null;
          notes: string | null;
          orgasm_intensity_score: number | null;
          overall_satisfaction: number | null;
          partner_satisfaction: number | null;
          relationship_satisfaction: number | null;
          sexual_activity_count: number | null;
          sexual_confidence: number | null;
          sleep_quality: number | null;
          stamina_duration_minutes: number | null;
          stress_level: number | null;
          updated_at: string | null;
          user_id: string;
          wellness_score: number | null;
        };
        Insert: {
          activity_type?: string | null;
          alcohol_consumption?: string | null;
          communication_quality?: number | null;
          created_at?: string | null;
          desire_frequency?: string | null;
          ejaculation_quality_score?: number | null;
          entry_date: string;
          erectile_function_score?: number | null;
          exercise_level?: string | null;
          id?: string;
          intimacy_level?: number | null;
          libido_level?: number | null;
          masturbation_count?: number | null;
          morning_erections?: boolean | null;
          notes?: string | null;
          orgasm_intensity_score?: number | null;
          overall_satisfaction?: number | null;
          partner_satisfaction?: number | null;
          relationship_satisfaction?: number | null;
          sexual_activity_count?: number | null;
          sexual_confidence?: number | null;
          sleep_quality?: number | null;
          stamina_duration_minutes?: number | null;
          stress_level?: number | null;
          updated_at?: string | null;
          user_id: string;
          wellness_score?: number | null;
        };
        Update: {
          activity_type?: string | null;
          alcohol_consumption?: string | null;
          communication_quality?: number | null;
          created_at?: string | null;
          desire_frequency?: string | null;
          ejaculation_quality_score?: number | null;
          entry_date?: string;
          erectile_function_score?: number | null;
          exercise_level?: string | null;
          id?: string;
          intimacy_level?: number | null;
          libido_level?: number | null;
          masturbation_count?: number | null;
          morning_erections?: boolean | null;
          notes?: string | null;
          orgasm_intensity_score?: number | null;
          overall_satisfaction?: number | null;
          partner_satisfaction?: number | null;
          relationship_satisfaction?: number | null;
          sexual_activity_count?: number | null;
          sexual_confidence?: number | null;
          sleep_quality?: number | null;
          stamina_duration_minutes?: number | null;
          stress_level?: number | null;
          updated_at?: string | null;
          user_id?: string;
          wellness_score?: number | null;
        };
        Relationships: [];
      };
      sexual_wellness_goals: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          current_value: number | null;
          goal_type: string;
          id: string;
          is_active: boolean | null;
          progress_percentage: number | null;
          target_date: string | null;
          target_value: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          current_value?: number | null;
          goal_type: string;
          id?: string;
          is_active?: boolean | null;
          progress_percentage?: number | null;
          target_date?: string | null;
          target_value?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          current_value?: number | null;
          goal_type?: string;
          id?: string;
          is_active?: boolean | null;
          progress_percentage?: number | null;
          target_date?: string | null;
          target_value?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      sexual_wellness_patterns: {
        Row: {
          acknowledged_at: string | null;
          affected_metrics: string[] | null;
          confidence_score: number | null;
          correlation_factors: string[] | null;
          created_at: string | null;
          detected_at: string | null;
          id: string;
          pattern_description: string;
          pattern_type: string;
          user_id: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          affected_metrics?: string[] | null;
          confidence_score?: number | null;
          correlation_factors?: string[] | null;
          created_at?: string | null;
          detected_at?: string | null;
          id?: string;
          pattern_description: string;
          pattern_type: string;
          user_id: string;
        };
        Update: {
          acknowledged_at?: string | null;
          affected_metrics?: string[] | null;
          confidence_score?: number | null;
          correlation_factors?: string[] | null;
          created_at?: string | null;
          detected_at?: string | null;
          id?: string;
          pattern_description?: string;
          pattern_type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      sexual_wellness_scores: {
        Row: {
          created_at: string | null;
          emotional_score: number | null;
          entry_date: string;
          factors: Json | null;
          id: string;
          overall_score: number | null;
          physical_score: number | null;
          relationship_score: number | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          emotional_score?: number | null;
          entry_date?: string;
          factors?: Json | null;
          id?: string;
          overall_score?: number | null;
          physical_score?: number | null;
          relationship_score?: number | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          emotional_score?: number | null;
          entry_date?: string;
          factors?: Json | null;
          id?: string;
          overall_score?: number | null;
          physical_score?: number | null;
          relationship_score?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      shared_routines: {
        Row: {
          copy_count: number | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_public: boolean | null;
          rating_average: number | null;
          rating_count: number | null;
          routine_data: Json;
          routine_id: string | null;
          share_name: string;
          share_token: string | null;
          shared_with_users: string[] | null;
          updated_at: string | null;
          user_id: string;
          view_count: number | null;
        };
        Insert: {
          copy_count?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          rating_average?: number | null;
          rating_count?: number | null;
          routine_data: Json;
          routine_id?: string | null;
          share_name: string;
          share_token?: string | null;
          shared_with_users?: string[] | null;
          updated_at?: string | null;
          user_id: string;
          view_count?: number | null;
        };
        Update: {
          copy_count?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          rating_average?: number | null;
          rating_count?: number | null;
          routine_data?: Json;
          routine_id?: string | null;
          share_name?: string;
          share_token?: string | null;
          shared_with_users?: string[] | null;
          updated_at?: string | null;
          user_id?: string;
          view_count?: number | null;
        };
        Relationships: [];
      };
      stripe_webhook_events: {
        Row: {
          created_at: string | null;
          error_message: string | null;
          event_id: string;
          event_type: string;
          id: string;
          metadata: Json;
          payload: Json;
          processed: boolean | null;
          processed_at: string | null;
          received_at: string;
          status: string;
          stripe_created_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          error_message?: string | null;
          event_id: string;
          event_type: string;
          id?: string;
          metadata?: Json;
          payload?: Json;
          processed?: boolean | null;
          processed_at?: string | null;
          received_at?: string;
          status?: string;
          stripe_created_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          error_message?: string | null;
          event_id?: string;
          event_type?: string;
          id?: string;
          metadata?: Json;
          payload?: Json;
          processed?: boolean | null;
          processed_at?: string | null;
          received_at?: string;
          status?: string;
          stripe_created_at?: string | null;
        };
        Relationships: [];
      };
      subscription_changes: {
        Row: {
          change_type: string;
          changed_at: string | null;
          created_at: string | null;
          from_tier_id: string | null;
          id: string;
          new_price: number | null;
          previous_price: number | null;
          prorated_amount: number | null;
          reason: string | null;
          subscription_plan_id: string;
          to_tier_id: string;
          user_id: string;
          user_initiated: boolean | null;
        };
        Insert: {
          change_type: string;
          changed_at?: string | null;
          created_at?: string | null;
          from_tier_id?: string | null;
          id?: string;
          new_price?: number | null;
          previous_price?: number | null;
          prorated_amount?: number | null;
          reason?: string | null;
          subscription_plan_id: string;
          to_tier_id: string;
          user_id: string;
          user_initiated?: boolean | null;
        };
        Update: {
          change_type?: string;
          changed_at?: string | null;
          created_at?: string | null;
          from_tier_id?: string | null;
          id?: string;
          new_price?: number | null;
          previous_price?: number | null;
          prorated_amount?: number | null;
          reason?: string | null;
          subscription_plan_id?: string;
          to_tier_id?: string;
          user_id?: string;
          user_initiated?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "subscription_changes_subscription_plan_id_fkey";
            columns: ["subscription_plan_id"];
            isOneToOne: false;
            referencedRelation: "subscription_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      subscription_plans: {
        Row: {
          cancel_at_period_end: boolean | null;
          canceled_at: string | null;
          created_at: string | null;
          currency: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          plan_type: string;
          price_paid: number;
          status: string;
          stripe_customer_id: string | null;
          stripe_price_id: string | null;
          stripe_subscription_id: string | null;
          tier_id: string;
          trial_end: string | null;
          trial_start: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          created_at?: string | null;
          currency?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          plan_type: string;
          price_paid: number;
          status: string;
          stripe_customer_id?: string | null;
          stripe_price_id?: string | null;
          stripe_subscription_id?: string | null;
          tier_id: string;
          trial_end?: string | null;
          trial_start?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          created_at?: string | null;
          currency?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          plan_type?: string;
          price_paid?: number;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_price_id?: string | null;
          stripe_subscription_id?: string | null;
          tier_id?: string;
          trial_end?: string | null;
          trial_start?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscription_plans_tier_id_fkey";
            columns: ["tier_id"];
            isOneToOne: false;
            referencedRelation: "subscription_tiers";
            referencedColumns: ["tier_id"];
          },
        ];
      };
      subscription_tiers: {
        Row: {
          annual_discount_percentage: number | null;
          annual_price: number | null;
          color_scheme: string | null;
          created_at: string | null;
          features: Json;
          icon_url: string | null;
          id: string;
          is_active: boolean | null;
          is_featured: boolean | null;
          is_popular: boolean | null;
          lifetime_discount_percentage: number | null;
          lifetime_price: number | null;
          limitations: Json | null;
          monthly_price: number;
          sort_order: number | null;
          stripe_annual_price_id: string | null;
          stripe_lifetime_price_id: string | null;
          stripe_monthly_price_id: string | null;
          tier_description: string | null;
          tier_id: string;
          tier_name: string;
          updated_at: string | null;
        };
        Insert: {
          annual_discount_percentage?: number | null;
          annual_price?: number | null;
          color_scheme?: string | null;
          created_at?: string | null;
          features: Json;
          icon_url?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_popular?: boolean | null;
          lifetime_discount_percentage?: number | null;
          lifetime_price?: number | null;
          limitations?: Json | null;
          monthly_price: number;
          sort_order?: number | null;
          stripe_annual_price_id?: string | null;
          stripe_lifetime_price_id?: string | null;
          stripe_monthly_price_id?: string | null;
          tier_description?: string | null;
          tier_id: string;
          tier_name: string;
          updated_at?: string | null;
        };
        Update: {
          annual_discount_percentage?: number | null;
          annual_price?: number | null;
          color_scheme?: string | null;
          created_at?: string | null;
          features?: Json;
          icon_url?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_popular?: boolean | null;
          lifetime_discount_percentage?: number | null;
          lifetime_price?: number | null;
          limitations?: Json | null;
          monthly_price?: number;
          sort_order?: number | null;
          stripe_annual_price_id?: string | null;
          stripe_lifetime_price_id?: string | null;
          stripe_monthly_price_id?: string | null;
          tier_description?: string | null;
          tier_id?: string;
          tier_name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      success_stories: {
        Row: {
          after_data: Json | null;
          before_data: Json | null;
          category: string | null;
          created_at: string | null;
          display_name: string | null;
          featured: boolean | null;
          id: string;
          is_anonymous: boolean | null;
          is_approved: boolean | null;
          is_featured: boolean | null;
          is_verified: boolean | null;
          story: string;
          time_period: string | null;
          title: string;
          updated_at: string | null;
          user_id: string | null;
          verified: boolean | null;
        };
        Insert: {
          after_data?: Json | null;
          before_data?: Json | null;
          category?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          featured?: boolean | null;
          id?: string;
          is_anonymous?: boolean | null;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          is_verified?: boolean | null;
          story: string;
          time_period?: string | null;
          title: string;
          updated_at?: string | null;
          user_id?: string | null;
          verified?: boolean | null;
        };
        Update: {
          after_data?: Json | null;
          before_data?: Json | null;
          category?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          featured?: boolean | null;
          id?: string;
          is_anonymous?: boolean | null;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          is_verified?: boolean | null;
          story?: string;
          time_period?: string | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string | null;
          verified?: boolean | null;
        };
        Relationships: [];
      };
      supplement_recommendations: {
        Row: {
          affiliate_provider: string | null;
          affiliate_url: string;
          commission_rate: number | null;
          created_at: string | null;
          health_benefits: string[] | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          is_featured: boolean | null;
          price_range: string | null;
          rating: number | null;
          recommended_dosage: string | null;
          review_count: number | null;
          supplement_description: string;
          supplement_name: string;
          supplement_type: string | null;
          updated_at: string | null;
          warnings: string[] | null;
        };
        Insert: {
          affiliate_provider?: string | null;
          affiliate_url: string;
          commission_rate?: number | null;
          created_at?: string | null;
          health_benefits?: string[] | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          price_range?: string | null;
          rating?: number | null;
          recommended_dosage?: string | null;
          review_count?: number | null;
          supplement_description: string;
          supplement_name: string;
          supplement_type?: string | null;
          updated_at?: string | null;
          warnings?: string[] | null;
        };
        Update: {
          affiliate_provider?: string | null;
          affiliate_url?: string;
          commission_rate?: number | null;
          created_at?: string | null;
          health_benefits?: string[] | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          price_range?: string | null;
          rating?: number | null;
          recommended_dosage?: string | null;
          review_count?: number | null;
          supplement_description?: string;
          supplement_name?: string;
          supplement_type?: string | null;
          updated_at?: string | null;
          warnings?: string[] | null;
        };
        Relationships: [];
      };
      support_chat_ai_training: {
        Row: {
          ai_response: string;
          created_at: string | null;
          id: string;
          session_id: string | null;
          user_message: string;
          was_escalated: boolean | null;
          was_helpful: boolean | null;
        };
        Insert: {
          ai_response: string;
          created_at?: string | null;
          id?: string;
          session_id?: string | null;
          user_message: string;
          was_escalated?: boolean | null;
          was_helpful?: boolean | null;
        };
        Update: {
          ai_response?: string;
          created_at?: string | null;
          id?: string;
          session_id?: string | null;
          user_message?: string;
          was_escalated?: boolean | null;
          was_helpful?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "support_chat_ai_training_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "support_chat_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      support_chat_messages: {
        Row: {
          ai_confidence: number | null;
          ai_model: string | null;
          attachments: Json | null;
          content: string;
          created_at: string | null;
          id: string;
          is_ai_generated: boolean | null;
          is_read: boolean | null;
          quick_actions: Json | null;
          read_at: string | null;
          sender_id: string | null;
          sender_type: string;
          session_id: string;
          suggested_escalation: boolean | null;
          suggested_escalation_reason: string | null;
        };
        Insert: {
          ai_confidence?: number | null;
          ai_model?: string | null;
          attachments?: Json | null;
          content: string;
          created_at?: string | null;
          id?: string;
          is_ai_generated?: boolean | null;
          is_read?: boolean | null;
          quick_actions?: Json | null;
          read_at?: string | null;
          sender_id?: string | null;
          sender_type: string;
          session_id: string;
          suggested_escalation?: boolean | null;
          suggested_escalation_reason?: string | null;
        };
        Update: {
          ai_confidence?: number | null;
          ai_model?: string | null;
          attachments?: Json | null;
          content?: string;
          created_at?: string | null;
          id?: string;
          is_ai_generated?: boolean | null;
          is_read?: boolean | null;
          quick_actions?: Json | null;
          read_at?: string | null;
          sender_id?: string | null;
          sender_type?: string;
          session_id?: string;
          suggested_escalation?: boolean | null;
          suggested_escalation_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "support_chat_messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "support_chat_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      support_chat_quick_responses: {
        Row: {
          category: string | null;
          content: string;
          created_at: string | null;
          created_by: string | null;
          id: string;
          is_ai_enabled: boolean | null;
          is_staff_only: boolean | null;
          success_rate: number | null;
          title: string;
          updated_at: string | null;
          usage_count: number | null;
        };
        Insert: {
          category?: string | null;
          content: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_ai_enabled?: boolean | null;
          is_staff_only?: boolean | null;
          success_rate?: number | null;
          title: string;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Update: {
          category?: string | null;
          content?: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_ai_enabled?: boolean | null;
          is_staff_only?: boolean | null;
          success_rate?: number | null;
          title?: string;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Relationships: [];
      };
      support_chat_sessions: {
        Row: {
          ai_handled: boolean | null;
          assigned_at: string | null;
          assigned_to: string | null;
          created_at: string | null;
          escalated_at: string | null;
          escalated_to_human: boolean | null;
          escalation_reason: string | null;
          feedback_text: string | null;
          id: string;
          ip_address: string | null;
          is_premium_user: boolean | null;
          language: string | null;
          last_message_at: string | null;
          priority: string | null;
          resolution_summary: string | null;
          resolved_at: string | null;
          satisfaction_rating: number | null;
          status: string | null;
          updated_at: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          ai_handled?: boolean | null;
          assigned_at?: string | null;
          assigned_to?: string | null;
          created_at?: string | null;
          escalated_at?: string | null;
          escalated_to_human?: boolean | null;
          escalation_reason?: string | null;
          feedback_text?: string | null;
          id?: string;
          ip_address?: string | null;
          is_premium_user?: boolean | null;
          language?: string | null;
          last_message_at?: string | null;
          priority?: string | null;
          resolution_summary?: string | null;
          resolved_at?: string | null;
          satisfaction_rating?: number | null;
          status?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          ai_handled?: boolean | null;
          assigned_at?: string | null;
          assigned_to?: string | null;
          created_at?: string | null;
          escalated_at?: string | null;
          escalated_to_human?: boolean | null;
          escalation_reason?: string | null;
          feedback_text?: string | null;
          id?: string;
          ip_address?: string | null;
          is_premium_user?: boolean | null;
          language?: string | null;
          last_message_at?: string | null;
          priority?: string | null;
          resolution_summary?: string | null;
          resolved_at?: string | null;
          satisfaction_rating?: number | null;
          status?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      support_staff_availability: {
        Row: {
          current_chat_count: number | null;
          id: string;
          is_available: boolean | null;
          last_active_at: string | null;
          max_concurrent_chats: number | null;
          staff_id: string;
          status_message: string | null;
          timezone: string | null;
          updated_at: string | null;
          working_hours: Json | null;
        };
        Insert: {
          current_chat_count?: number | null;
          id?: string;
          is_available?: boolean | null;
          last_active_at?: string | null;
          max_concurrent_chats?: number | null;
          staff_id: string;
          status_message?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
          working_hours?: Json | null;
        };
        Update: {
          current_chat_count?: number | null;
          id?: string;
          is_available?: boolean | null;
          last_active_at?: string | null;
          max_concurrent_chats?: number | null;
          staff_id?: string;
          status_message?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
          working_hours?: Json | null;
        };
        Relationships: [];
      };
      support_ticket_messages: {
        Row: {
          attachments: Json | null;
          content: string;
          created_at: string | null;
          id: string;
          is_internal: boolean | null;
          is_read: boolean | null;
          is_staff: boolean | null;
          read_at: string | null;
          ticket_id: string;
          user_id: string | null;
        };
        Insert: {
          attachments?: Json | null;
          content: string;
          created_at?: string | null;
          id?: string;
          is_internal?: boolean | null;
          is_read?: boolean | null;
          is_staff?: boolean | null;
          read_at?: string | null;
          ticket_id: string;
          user_id?: string | null;
        };
        Update: {
          attachments?: Json | null;
          content?: string;
          created_at?: string | null;
          id?: string;
          is_internal?: boolean | null;
          is_read?: boolean | null;
          is_staff?: boolean | null;
          read_at?: string | null;
          ticket_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "support_tickets";
            referencedColumns: ["id"];
          },
        ];
      };
      support_tickets: {
        Row: {
          assigned_at: string | null;
          assigned_to: string | null;
          category: string;
          created_at: string | null;
          description: string;
          feedback_text: string | null;
          id: string;
          priority: string | null;
          resolution: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          satisfaction_rating: number | null;
          status: string | null;
          subject: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          assigned_at?: string | null;
          assigned_to?: string | null;
          category: string;
          created_at?: string | null;
          description: string;
          feedback_text?: string | null;
          id?: string;
          priority?: string | null;
          resolution?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          satisfaction_rating?: number | null;
          status?: string | null;
          subject: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          assigned_at?: string | null;
          assigned_to?: string | null;
          category?: string;
          created_at?: string | null;
          description?: string;
          feedback_text?: string | null;
          id?: string;
          priority?: string | null;
          resolution?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          satisfaction_rating?: number | null;
          status?: string | null;
          subject?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      symptom_patterns: {
        Row: {
          category: string;
          created_at: string | null;
          id: string;
          is_urgent: boolean | null;
          possible_conditions: string[] | null;
          self_care_tips: string[] | null;
          severity_levels: string[] | null;
          symptom_name: string;
          user_id: string | null;
          when_to_see_doctor: string | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          id?: string;
          is_urgent?: boolean | null;
          possible_conditions?: string[] | null;
          self_care_tips?: string[] | null;
          severity_levels?: string[] | null;
          symptom_name: string;
          user_id?: string | null;
          when_to_see_doctor?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          id?: string;
          is_urgent?: boolean | null;
          possible_conditions?: string[] | null;
          self_care_tips?: string[] | null;
          severity_levels?: string[] | null;
          symptom_name?: string;
          user_id?: string | null;
          when_to_see_doctor?: string | null;
        };
        Relationships: [];
      };
      synced_health_data: {
        Row: {
          created_at: string | null;
          data_type: string;
          data_values: Json;
          external_id: string | null;
          external_timestamp: string | null;
          id: string;
          integration_id: string;
          is_merged: boolean | null;
          sync_source: string;
          sync_timestamp: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          data_type: string;
          data_values: Json;
          external_id?: string | null;
          external_timestamp?: string | null;
          id?: string;
          integration_id: string;
          is_merged?: boolean | null;
          sync_source: string;
          sync_timestamp?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          data_type?: string;
          data_values?: Json;
          external_id?: string | null;
          external_timestamp?: string | null;
          id?: string;
          integration_id?: string;
          is_merged?: boolean | null;
          sync_source?: string;
          sync_timestamp?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "synced_health_data_integration_id_fkey";
            columns: ["integration_id"];
            isOneToOne: false;
            referencedRelation: "health_app_integrations";
            referencedColumns: ["id"];
          },
        ];
      };
      testicular_health: {
        Row: {
          abnormalities_found: boolean | null;
          abnormality_description: string | null;
          created_at: string | null;
          entry_date: string;
          id: string;
          lumps_detected: boolean | null;
          notes: string | null;
          pain_level: number | null;
          self_exam_performed: boolean | null;
          size_changes: string | null;
          swelling: boolean | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          abnormalities_found?: boolean | null;
          abnormality_description?: string | null;
          created_at?: string | null;
          entry_date?: string;
          id?: string;
          lumps_detected?: boolean | null;
          notes?: string | null;
          pain_level?: number | null;
          self_exam_performed?: boolean | null;
          size_changes?: string | null;
          swelling?: boolean | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          abnormalities_found?: boolean | null;
          abnormality_description?: string | null;
          created_at?: string | null;
          entry_date?: string;
          id?: string;
          lumps_detected?: boolean | null;
          notes?: string | null;
          pain_level?: number | null;
          self_exam_performed?: boolean | null;
          size_changes?: string | null;
          swelling?: boolean | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      testimonial_votes: {
        Row: {
          created_at: string | null;
          id: string;
          is_helpful: boolean;
          testimonial_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_helpful: boolean;
          testimonial_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_helpful?: boolean;
          testimonial_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "testimonial_votes_testimonial_id_fkey";
            columns: ["testimonial_id"];
            isOneToOne: false;
            referencedRelation: "testimonials";
            referencedColumns: ["id"];
          },
        ];
      };
      testimonials: {
        Row: {
          category: string | null;
          content: string;
          created_at: string | null;
          display_name: string | null;
          featured: boolean | null;
          helpful_count: number | null;
          id: string;
          is_anonymous: boolean | null;
          is_approved: boolean | null;
          is_featured: boolean | null;
          is_verified: boolean | null;
          rating: number;
          title: string;
          updated_at: string | null;
          user_id: string | null;
          verified: boolean | null;
        };
        Insert: {
          category?: string | null;
          content: string;
          created_at?: string | null;
          display_name?: string | null;
          featured?: boolean | null;
          helpful_count?: number | null;
          id?: string;
          is_anonymous?: boolean | null;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          is_verified?: boolean | null;
          rating: number;
          title: string;
          updated_at?: string | null;
          user_id?: string | null;
          verified?: boolean | null;
        };
        Update: {
          category?: string | null;
          content?: string;
          created_at?: string | null;
          display_name?: string | null;
          featured?: boolean | null;
          helpful_count?: number | null;
          id?: string;
          is_anonymous?: boolean | null;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          is_verified?: boolean | null;
          rating?: number;
          title?: string;
          updated_at?: string | null;
          user_id?: string | null;
          verified?: boolean | null;
        };
        Relationships: [];
      };
      tier_comparison_features: {
        Row: {
          available_tiers: string[];
          created_at: string | null;
          feature_category: string | null;
          feature_description: string | null;
          feature_name: string;
          id: string;
          is_core: boolean | null;
          is_premium: boolean | null;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          available_tiers: string[];
          created_at?: string | null;
          feature_category?: string | null;
          feature_description?: string | null;
          feature_name: string;
          id?: string;
          is_core?: boolean | null;
          is_premium?: boolean | null;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          available_tiers?: string[];
          created_at?: string | null;
          feature_category?: string | null;
          feature_description?: string | null;
          feature_name?: string;
          id?: string;
          is_core?: boolean | null;
          is_premium?: boolean | null;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      time_lapse_comparisons: {
        Row: {
          animated_gif_url: string | null;
          circumference_change: number | null;
          comparison_image_url: string | null;
          comparison_name: string | null;
          created_at: string | null;
          curvature_change: number | null;
          end_scan_id: string | null;
          growth_percentage: number | null;
          growth_rate_per_month: number | null;
          id: string;
          length_change: number | null;
          overlay_image_url: string | null;
          slider_image_url: string | null;
          start_scan_id: string | null;
          time_period_days: number | null;
          user_id: string;
        };
        Insert: {
          animated_gif_url?: string | null;
          circumference_change?: number | null;
          comparison_image_url?: string | null;
          comparison_name?: string | null;
          created_at?: string | null;
          curvature_change?: number | null;
          end_scan_id?: string | null;
          growth_percentage?: number | null;
          growth_rate_per_month?: number | null;
          id?: string;
          length_change?: number | null;
          overlay_image_url?: string | null;
          slider_image_url?: string | null;
          start_scan_id?: string | null;
          time_period_days?: number | null;
          user_id: string;
        };
        Update: {
          animated_gif_url?: string | null;
          circumference_change?: number | null;
          comparison_image_url?: string | null;
          comparison_name?: string | null;
          created_at?: string | null;
          curvature_change?: number | null;
          end_scan_id?: string | null;
          growth_percentage?: number | null;
          growth_rate_per_month?: number | null;
          id?: string;
          length_change?: number | null;
          overlay_image_url?: string | null;
          slider_image_url?: string | null;
          start_scan_id?: string | null;
          time_period_days?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "time_lapse_comparisons_end_scan_id_fkey";
            columns: ["end_scan_id"];
            isOneToOne: false;
            referencedRelation: "scans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "time_lapse_comparisons_start_scan_id_fkey";
            columns: ["start_scan_id"];
            isOneToOne: false;
            referencedRelation: "scans";
            referencedColumns: ["id"];
          },
        ];
      };
      treatment_plans: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          end_date: string | null;
          goals: string[] | null;
          id: string;
          milestones: string[] | null;
          milestones_completed: number | null;
          patient_id: string;
          plan_data: Json;
          plan_description: string | null;
          plan_name: string;
          plan_status: string | null;
          progress_percentage: number | null;
          provider_id: string;
          start_date: string | null;
          timeline_days: number | null;
          updated_at: string | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          end_date?: string | null;
          goals?: string[] | null;
          id?: string;
          milestones?: string[] | null;
          milestones_completed?: number | null;
          patient_id: string;
          plan_data: Json;
          plan_description?: string | null;
          plan_name: string;
          plan_status?: string | null;
          progress_percentage?: number | null;
          provider_id: string;
          start_date?: string | null;
          timeline_days?: number | null;
          updated_at?: string | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          end_date?: string | null;
          goals?: string[] | null;
          id?: string;
          milestones?: string[] | null;
          milestones_completed?: number | null;
          patient_id?: string;
          plan_data?: Json;
          plan_description?: string | null;
          plan_name?: string;
          plan_status?: string | null;
          progress_percentage?: number | null;
          provider_id?: string;
          start_date?: string | null;
          timeline_days?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "treatment_plans_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "healthcare_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      trust_badges: {
        Row: {
          badge_name: string;
          badge_type: string;
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          icon_url: string | null;
          id: string;
          is_active: boolean | null;
          link_url: string | null;
        };
        Insert: {
          badge_name: string;
          badge_type: string;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          icon_url?: string | null;
          id?: string;
          is_active?: boolean | null;
          link_url?: string | null;
        };
        Update: {
          badge_name?: string;
          badge_type?: string;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          icon_url?: string | null;
          id?: string;
          is_active?: boolean | null;
          link_url?: string | null;
        };
        Relationships: [];
      };
      two_factor_authentication: {
        Row: {
          created_at: string | null;
          email_address: string | null;
          id: string;
          is_enabled: boolean | null;
          is_verified: boolean | null;
          method: string;
          phone_number_encrypted: string | null;
          recovery_codes_encrypted: string[] | null;
          recovery_codes_used: string[] | null;
          totp_backup_codes_encrypted: string[] | null;
          totp_secret_encrypted: string | null;
          updated_at: string | null;
          user_id: string;
          verified_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email_address?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          is_verified?: boolean | null;
          method: string;
          phone_number_encrypted?: string | null;
          recovery_codes_encrypted?: string[] | null;
          recovery_codes_used?: string[] | null;
          totp_backup_codes_encrypted?: string[] | null;
          totp_secret_encrypted?: string | null;
          updated_at?: string | null;
          user_id: string;
          verified_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          email_address?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          is_verified?: boolean | null;
          method?: string;
          phone_number_encrypted?: string | null;
          recovery_codes_encrypted?: string[] | null;
          recovery_codes_used?: string[] | null;
          totp_backup_codes_encrypted?: string[] | null;
          totp_secret_encrypted?: string | null;
          updated_at?: string | null;
          user_id?: string;
          verified_at?: string | null;
        };
        Relationships: [];
      };
      urinary_health: {
        Row: {
          blood_in_urine: boolean | null;
          created_at: string | null;
          entry_date: string;
          frequency_per_day: number | null;
          id: string;
          incomplete_emptying: boolean | null;
          incontinence: boolean | null;
          incontinence_type: string | null;
          nocturia_count: number | null;
          notes: string | null;
          pain_on_urination: boolean | null;
          stream_strength: number | null;
          updated_at: string | null;
          urgency_level: number | null;
          user_id: string;
        };
        Insert: {
          blood_in_urine?: boolean | null;
          created_at?: string | null;
          entry_date?: string;
          frequency_per_day?: number | null;
          id?: string;
          incomplete_emptying?: boolean | null;
          incontinence?: boolean | null;
          incontinence_type?: string | null;
          nocturia_count?: number | null;
          notes?: string | null;
          pain_on_urination?: boolean | null;
          stream_strength?: number | null;
          updated_at?: string | null;
          urgency_level?: number | null;
          user_id: string;
        };
        Update: {
          blood_in_urine?: boolean | null;
          created_at?: string | null;
          entry_date?: string;
          frequency_per_day?: number | null;
          id?: string;
          incomplete_emptying?: boolean | null;
          incontinence?: boolean | null;
          incontinence_type?: string | null;
          nocturia_count?: number | null;
          notes?: string | null;
          pain_on_urination?: boolean | null;
          stream_strength?: number | null;
          updated_at?: string | null;
          urgency_level?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          achievement_id: string;
          created_at: string | null;
          id: string;
          is_unlocked: boolean | null;
          progress: number | null;
          progress_data: Json | null;
          unlocked_at: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          achievement_id: string;
          created_at?: string | null;
          id?: string;
          is_unlocked?: boolean | null;
          progress?: number | null;
          progress_data?: Json | null;
          unlocked_at?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          achievement_id?: string;
          created_at?: string | null;
          id?: string;
          is_unlocked?: boolean | null;
          progress?: number | null;
          progress_data?: Json | null;
          unlocked_at?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey";
            columns: ["achievement_id"];
            isOneToOne: false;
            referencedRelation: "achievement_definitions";
            referencedColumns: ["id"];
          },
        ];
      };
      user_add_ons: {
        Row: {
          addon_id: string;
          cancel_at_period_end: boolean | null;
          canceled_at: string | null;
          created_at: string | null;
          currency: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          plan_type: string;
          price_paid: number;
          status: string;
          stripe_payment_intent_id: string | null;
          stripe_price_id: string | null;
          stripe_subscription_id: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          addon_id: string;
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          created_at?: string | null;
          currency?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          plan_type: string;
          price_paid: number;
          status: string;
          stripe_payment_intent_id?: string | null;
          stripe_price_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          addon_id?: string;
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          created_at?: string | null;
          currency?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          plan_type?: string;
          price_paid?: number;
          status?: string;
          stripe_payment_intent_id?: string | null;
          stripe_price_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_add_ons_addon_id_fkey";
            columns: ["addon_id"];
            isOneToOne: false;
            referencedRelation: "premium_add_ons";
            referencedColumns: ["addon_id"];
          },
        ];
      };
      user_assessment_results: {
        Row: {
          answers: Json;
          assessment_id: string;
          completed_at: string | null;
          created_at: string | null;
          id: string;
          recommendations: string[] | null;
          risk_level: string | null;
          score: number | null;
          user_id: string;
        };
        Insert: {
          answers: Json;
          assessment_id: string;
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          recommendations?: string[] | null;
          risk_level?: string | null;
          score?: number | null;
          user_id: string;
        };
        Update: {
          answers?: Json;
          assessment_id?: string;
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          recommendations?: string[] | null;
          risk_level?: string | null;
          score?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_assessment_results_assessment_id_fkey";
            columns: ["assessment_id"];
            isOneToOne: false;
            referencedRelation: "health_assessments";
            referencedColumns: ["id"];
          },
        ];
      };
      user_custom_collection_positions: {
        Row: {
          collection_id: string;
          created_at: string | null;
          id: string;
          order_index: number | null;
          position_id: string;
        };
        Insert: {
          collection_id: string;
          created_at?: string | null;
          id?: string;
          order_index?: number | null;
          position_id: string;
        };
        Update: {
          collection_id?: string;
          created_at?: string | null;
          id?: string;
          order_index?: number | null;
          position_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_custom_collection_positions_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "user_custom_collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_custom_collection_positions_position_id_fkey";
            columns: ["position_id"];
            isOneToOne: false;
            referencedRelation: "positions";
            referencedColumns: ["id"];
          },
        ];
      };
      user_custom_collections: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          is_public: boolean | null;
          name: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          name: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          name?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_detection_preferences: {
        Row: {
          confidence_threshold: number | null;
          created_at: string | null;
          enable_comparison_mode: boolean | null;
          enabled_models: string[] | null;
          ensemble_mode: boolean | null;
          id: string;
          show_detailed_breakdown: boolean | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          confidence_threshold?: number | null;
          created_at?: string | null;
          enable_comparison_mode?: boolean | null;
          enabled_models?: string[] | null;
          ensemble_mode?: boolean | null;
          id?: string;
          show_detailed_breakdown?: boolean | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          confidence_threshold?: number | null;
          created_at?: string | null;
          enable_comparison_mode?: boolean | null;
          enabled_models?: string[] | null;
          ensemble_mode?: boolean | null;
          id?: string;
          show_detailed_breakdown?: boolean | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_devices: {
        Row: {
          app_version: string | null;
          created_at: string | null;
          device_identifier: string;
          device_name: string;
          device_type: string | null;
          encryption_enabled: boolean | null;
          has_biometric: boolean | null;
          has_pin: boolean | null;
          id: string;
          is_active: boolean | null;
          is_trusted: boolean | null;
          last_seen_at: string | null;
          os_version: string | null;
          platform: string | null;
          trust_level: string | null;
          trusted_at: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          app_version?: string | null;
          created_at?: string | null;
          device_identifier: string;
          device_name: string;
          device_type?: string | null;
          encryption_enabled?: boolean | null;
          has_biometric?: boolean | null;
          has_pin?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          is_trusted?: boolean | null;
          last_seen_at?: string | null;
          os_version?: string | null;
          platform?: string | null;
          trust_level?: string | null;
          trusted_at?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          app_version?: string | null;
          created_at?: string | null;
          device_identifier?: string;
          device_name?: string;
          device_type?: string | null;
          encryption_enabled?: boolean | null;
          has_biometric?: boolean | null;
          has_pin?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          is_trusted?: boolean | null;
          last_seen_at?: string | null;
          os_version?: string | null;
          platform?: string | null;
          trust_level?: string | null;
          trusted_at?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_feedback: {
        Row: {
          actual: string | null;
          admin_response: string | null;
          allow_contact: boolean;
          attachments: Json | null;
          audit_snapshot: Json | null;
          contact_email: string | null;
          created_at: string;
          description: string;
          environment: Json | null;
          expected: string | null;
          frequency: string | null;
          id: string;
          kind: string;
          rating: number | null;
          sentiment: string | null;
          severity: string | null;
          source: string;
          status: string;
          steps_to_reproduce: string | null;
          tags: string[] | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          actual?: string | null;
          admin_response?: string | null;
          allow_contact?: boolean;
          attachments?: Json | null;
          audit_snapshot?: Json | null;
          contact_email?: string | null;
          created_at?: string;
          description: string;
          environment?: Json | null;
          expected?: string | null;
          frequency?: string | null;
          id?: string;
          kind: string;
          rating?: number | null;
          sentiment?: string | null;
          severity?: string | null;
          source?: string;
          status?: string;
          steps_to_reproduce?: string | null;
          tags?: string[] | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          actual?: string | null;
          admin_response?: string | null;
          allow_contact?: boolean;
          attachments?: Json | null;
          audit_snapshot?: Json | null;
          contact_email?: string | null;
          created_at?: string;
          description?: string;
          environment?: Json | null;
          expected?: string | null;
          frequency?: string | null;
          id?: string;
          kind?: string;
          rating?: number | null;
          sentiment?: string | null;
          severity?: string | null;
          source?: string;
          status?: string;
          steps_to_reproduce?: string | null;
          tags?: string[] | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_follows: {
        Row: {
          created_at: string | null;
          follower_id: string;
          following_id: string;
          id: string;
        };
        Insert: {
          created_at?: string | null;
          follower_id: string;
          following_id: string;
          id?: string;
        };
        Update: {
          created_at?: string | null;
          follower_id?: string;
          following_id?: string;
          id?: string;
        };
        Relationships: [];
      };
      user_goals: {
        Row: {
          created_at: string | null;
          current_value: number | null;
          description: string | null;
          goal_type: string;
          id: string;
          progress_percentage: number | null;
          status: string | null;
          target_date: string | null;
          target_value: number | null;
          title: string;
          unit: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          current_value?: number | null;
          description?: string | null;
          goal_type: string;
          id?: string;
          progress_percentage?: number | null;
          status?: string | null;
          target_date?: string | null;
          target_value?: number | null;
          title: string;
          unit?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          current_value?: number | null;
          description?: string | null;
          goal_type?: string;
          id?: string;
          progress_percentage?: number | null;
          status?: string | null;
          target_date?: string | null;
          target_value?: number | null;
          title?: string;
          unit?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_habits: {
        Row: {
          archived_at: string | null;
          completion_rate: number | null;
          created_at: string | null;
          current_streak: number | null;
          custom_name: string | null;
          custom_target_value: number | null;
          habit_definition_id: string;
          id: string;
          is_active: boolean | null;
          longest_streak: number | null;
          paused_at: string | null;
          started_at: string | null;
          total_completions: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          archived_at?: string | null;
          completion_rate?: number | null;
          created_at?: string | null;
          current_streak?: number | null;
          custom_name?: string | null;
          custom_target_value?: number | null;
          habit_definition_id: string;
          id?: string;
          is_active?: boolean | null;
          longest_streak?: number | null;
          paused_at?: string | null;
          started_at?: string | null;
          total_completions?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          archived_at?: string | null;
          completion_rate?: number | null;
          created_at?: string | null;
          current_streak?: number | null;
          custom_name?: string | null;
          custom_target_value?: number | null;
          habit_definition_id?: string;
          id?: string;
          is_active?: boolean | null;
          longest_streak?: number | null;
          paused_at?: string | null;
          started_at?: string | null;
          total_completions?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_habits_habit_definition_id_fkey";
            columns: ["habit_definition_id"];
            isOneToOne: false;
            referencedRelation: "habit_definitions";
            referencedColumns: ["id"];
          },
        ];
      };
      user_milestones: {
        Row: {
          achieved_at: string | null;
          created_at: string | null;
          id: string;
          milestone_data: Json | null;
          milestone_type: string;
          milestone_value: number;
          user_id: string;
        };
        Insert: {
          achieved_at?: string | null;
          created_at?: string | null;
          id?: string;
          milestone_data?: Json | null;
          milestone_type: string;
          milestone_value: number;
          user_id: string;
        };
        Update: {
          achieved_at?: string | null;
          created_at?: string | null;
          id?: string;
          milestone_data?: Json | null;
          milestone_type?: string;
          milestone_value?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      user_position_favorites: {
        Row: {
          created_at: string | null;
          id: string;
          notes: string | null;
          position_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          position_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          position_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_position_favorites_position_id_fkey";
            columns: ["position_id"];
            isOneToOne: false;
            referencedRelation: "positions";
            referencedColumns: ["id"];
          },
        ];
      };
      user_position_media_overrides: {
        Row: {
          bucket: string | null;
          created_at: string | null;
          id: string;
          media_kind: string;
          mime_type: string | null;
          position_key: string;
          public_url: string | null;
          storage_path: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          bucket?: string | null;
          created_at?: string | null;
          id?: string;
          media_kind: string;
          mime_type?: string | null;
          position_key: string;
          public_url?: string | null;
          storage_path?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          bucket?: string | null;
          created_at?: string | null;
          id?: string;
          media_kind?: string;
          mime_type?: string | null;
          position_key?: string;
          public_url?: string | null;
          storage_path?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          color_blind_mode: string | null;
          created_at: string;
          data_retention_preferences: Json | null;
          font_size: string | null;
          haptic_enabled: boolean | null;
          id: string;
          notification_preferences: Json | null;
          notifications_enabled: boolean | null;
          reminder_days: number[] | null;
          reminder_time: string | null;
          theme: string | null;
          theme_preset: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color_blind_mode?: string | null;
          created_at?: string;
          data_retention_preferences?: Json | null;
          font_size?: string | null;
          haptic_enabled?: boolean | null;
          id?: string;
          notification_preferences?: Json | null;
          notifications_enabled?: boolean | null;
          reminder_days?: number[] | null;
          reminder_time?: string | null;
          theme?: string | null;
          theme_preset?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          color_blind_mode?: string | null;
          created_at?: string;
          data_retention_preferences?: Json | null;
          font_size?: string | null;
          haptic_enabled?: boolean | null;
          id?: string;
          notification_preferences?: Json | null;
          notifications_enabled?: boolean | null;
          reminder_days?: number[] | null;
          reminder_time?: string | null;
          theme?: string | null;
          theme_preset?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_privacy_settings: {
        Row: {
          app_lock_enabled: boolean | null;
          app_lock_method: string | null;
          content_lock_enabled: boolean | null;
          created_at: string | null;
          data_anonymization_enabled: boolean | null;
          hidden_mode_enabled: boolean | null;
          id: string;
          incognito_mode_enabled: boolean | null;
          locked_content_ids: string[] | null;
          privacy_dashboard_enabled: boolean | null;
          private_browsing_enabled: boolean | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          app_lock_enabled?: boolean | null;
          app_lock_method?: string | null;
          content_lock_enabled?: boolean | null;
          created_at?: string | null;
          data_anonymization_enabled?: boolean | null;
          hidden_mode_enabled?: boolean | null;
          id?: string;
          incognito_mode_enabled?: boolean | null;
          locked_content_ids?: string[] | null;
          privacy_dashboard_enabled?: boolean | null;
          private_browsing_enabled?: boolean | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          app_lock_enabled?: boolean | null;
          app_lock_method?: string | null;
          content_lock_enabled?: boolean | null;
          created_at?: string | null;
          data_anonymization_enabled?: boolean | null;
          hidden_mode_enabled?: boolean | null;
          id?: string;
          incognito_mode_enabled?: boolean | null;
          locked_content_ids?: string[] | null;
          privacy_dashboard_enabled?: boolean | null;
          private_browsing_enabled?: boolean | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      user_saved_positions: {
        Row: {
          created_at: string | null;
          favorite: boolean | null;
          id: string;
          personal_notes: string | null;
          position_id: string;
          rating: number | null;
          tried: boolean | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          favorite?: boolean | null;
          id?: string;
          personal_notes?: string | null;
          position_id: string;
          rating?: number | null;
          tried?: boolean | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          favorite?: boolean | null;
          id?: string;
          personal_notes?: string | null;
          position_id?: string;
          rating?: number | null;
          tried?: boolean | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_saved_positions_position_id_fkey";
            columns: ["position_id"];
            isOneToOne: false;
            referencedRelation: "sex_positions_library";
            referencedColumns: ["id"];
          },
        ];
      };
      user_streaks: {
        Row: {
          created_at: string | null;
          current_streak: number | null;
          id: string;
          is_active: boolean | null;
          last_activity_date: string | null;
          longest_streak: number | null;
          streak_start_date: string | null;
          streak_type: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          current_streak?: number | null;
          id?: string;
          is_active?: boolean | null;
          last_activity_date?: string | null;
          longest_streak?: number | null;
          streak_start_date?: string | null;
          streak_type: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          current_streak?: number | null;
          id?: string;
          is_active?: boolean | null;
          last_activity_date?: string | null;
          longest_streak?: number | null;
          streak_start_date?: string | null;
          streak_type?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null;
          canceled_at: string | null;
          created_at: string;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          plan_id: string | null;
          status: string;
          stripe_customer_id: string | null;
          stripe_price_id: string | null;
          stripe_subscription_id: string | null;
          subscription_tier: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          plan_id?: string | null;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_price_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_tier?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          plan_id?: string | null;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_price_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_tier?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      video_bookmarks: {
        Row: {
          created_at: string | null;
          id: string;
          notes: string | null;
          user_id: string;
          video_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          user_id: string;
          video_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          user_id?: string;
          video_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "video_bookmarks_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "video_library";
            referencedColumns: ["id"];
          },
        ];
      };
      video_downloads: {
        Row: {
          created_at: string | null;
          download_progress: number | null;
          download_status: string | null;
          downloaded_at: string | null;
          expires_at: string | null;
          file_size_bytes: number | null;
          id: string;
          local_file_path: string | null;
          updated_at: string | null;
          user_id: string;
          video_id: string;
        };
        Insert: {
          created_at?: string | null;
          download_progress?: number | null;
          download_status?: string | null;
          downloaded_at?: string | null;
          expires_at?: string | null;
          file_size_bytes?: number | null;
          id?: string;
          local_file_path?: string | null;
          updated_at?: string | null;
          user_id: string;
          video_id: string;
        };
        Update: {
          created_at?: string | null;
          download_progress?: number | null;
          download_status?: string | null;
          downloaded_at?: string | null;
          expires_at?: string | null;
          file_size_bytes?: number | null;
          id?: string;
          local_file_path?: string | null;
          updated_at?: string | null;
          user_id?: string;
          video_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "video_downloads_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "video_library";
            referencedColumns: ["id"];
          },
        ];
      };
      video_edits: {
        Row: {
          camera_switches: Json | null;
          created_at: string | null;
          edit_config: Json;
          edit_name: string | null;
          edit_status: string | null;
          edit_type: string;
          edited_video_storage_path: string | null;
          edited_video_url: string | null;
          id: string;
          masking_data: Json | null;
          preview_url: string | null;
          recording_id: string;
          transitions: Json | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          camera_switches?: Json | null;
          created_at?: string | null;
          edit_config: Json;
          edit_name?: string | null;
          edit_status?: string | null;
          edit_type: string;
          edited_video_storage_path?: string | null;
          edited_video_url?: string | null;
          id?: string;
          masking_data?: Json | null;
          preview_url?: string | null;
          recording_id: string;
          transitions?: Json | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          camera_switches?: Json | null;
          created_at?: string | null;
          edit_config?: Json;
          edit_name?: string | null;
          edit_status?: string | null;
          edit_type?: string;
          edited_video_storage_path?: string | null;
          edited_video_url?: string | null;
          id?: string;
          masking_data?: Json | null;
          preview_url?: string | null;
          recording_id?: string;
          transitions?: Json | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "video_edits_recording_id_fkey";
            columns: ["recording_id"];
            isOneToOne: false;
            referencedRelation: "video_recordings";
            referencedColumns: ["id"];
          },
        ];
      };
      video_guided_sessions: {
        Row: {
          completed_at: string | null;
          completion_percentage: number | null;
          created_at: string | null;
          difficulty_rating: number | null;
          helpful_rating: number | null;
          id: string;
          notes: string | null;
          paused_count: number | null;
          rewind_count: number | null;
          routine_id: string | null;
          session_date: string;
          session_type: string | null;
          skipped: boolean | null;
          started_at: string | null;
          user_id: string;
          video_duration_seconds: number | null;
          video_thumbnail_url: string | null;
          video_url: string;
          watched_duration_seconds: number | null;
        };
        Insert: {
          completed_at?: string | null;
          completion_percentage?: number | null;
          created_at?: string | null;
          difficulty_rating?: number | null;
          helpful_rating?: number | null;
          id?: string;
          notes?: string | null;
          paused_count?: number | null;
          rewind_count?: number | null;
          routine_id?: string | null;
          session_date: string;
          session_type?: string | null;
          skipped?: boolean | null;
          started_at?: string | null;
          user_id: string;
          video_duration_seconds?: number | null;
          video_thumbnail_url?: string | null;
          video_url: string;
          watched_duration_seconds?: number | null;
        };
        Update: {
          completed_at?: string | null;
          completion_percentage?: number | null;
          created_at?: string | null;
          difficulty_rating?: number | null;
          helpful_rating?: number | null;
          id?: string;
          notes?: string | null;
          paused_count?: number | null;
          rewind_count?: number | null;
          routine_id?: string | null;
          session_date?: string;
          session_type?: string | null;
          skipped?: boolean | null;
          started_at?: string | null;
          user_id?: string;
          video_duration_seconds?: number | null;
          video_thumbnail_url?: string | null;
          video_url?: string;
          watched_duration_seconds?: number | null;
        };
        Relationships: [];
      };
      video_library: {
        Row: {
          category: string;
          created_at: string | null;
          description: string | null;
          difficulty_level: string | null;
          duration_seconds: number | null;
          file_size_bytes: number | null;
          id: string;
          instructor_credentials: string | null;
          instructor_name: string | null;
          is_featured: boolean | null;
          is_nsfw: boolean | null;
          is_premium: boolean | null;
          like_count: number | null;
          order_index: number | null;
          rating_average: number | null;
          rating_count: number | null;
          tags: string[] | null;
          thumbnail_url: string | null;
          title: string;
          updated_at: string | null;
          video_url: string;
          view_count: number | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          description?: string | null;
          difficulty_level?: string | null;
          duration_seconds?: number | null;
          file_size_bytes?: number | null;
          id?: string;
          instructor_credentials?: string | null;
          instructor_name?: string | null;
          is_featured?: boolean | null;
          is_nsfw?: boolean | null;
          is_premium?: boolean | null;
          like_count?: number | null;
          order_index?: number | null;
          rating_average?: number | null;
          rating_count?: number | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string | null;
          video_url: string;
          view_count?: number | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          description?: string | null;
          difficulty_level?: string | null;
          duration_seconds?: number | null;
          file_size_bytes?: number | null;
          id?: string;
          instructor_credentials?: string | null;
          instructor_name?: string | null;
          is_featured?: boolean | null;
          is_nsfw?: boolean | null;
          is_premium?: boolean | null;
          like_count?: number | null;
          order_index?: number | null;
          rating_average?: number | null;
          rating_count?: number | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string | null;
          video_url?: string;
          view_count?: number | null;
        };
        Relationships: [];
      };
      video_playlists: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          is_featured: boolean | null;
          is_public: boolean | null;
          name: string;
          updated_at: string | null;
          user_id: string | null;
          video_count: number | null;
          view_count: number | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_featured?: boolean | null;
          is_public?: boolean | null;
          name: string;
          updated_at?: string | null;
          user_id?: string | null;
          video_count?: number | null;
          view_count?: number | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_featured?: boolean | null;
          is_public?: boolean | null;
          name?: string;
          updated_at?: string | null;
          user_id?: string | null;
          video_count?: number | null;
          view_count?: number | null;
        };
        Relationships: [];
      };
      video_progress: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          id: string;
          is_completed: boolean | null;
          last_watched_at: string | null;
          progress_percentage: number | null;
          progress_seconds: number | null;
          updated_at: string | null;
          user_id: string;
          video_id: string;
          watch_count: number | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          is_completed?: boolean | null;
          last_watched_at?: string | null;
          progress_percentage?: number | null;
          progress_seconds?: number | null;
          updated_at?: string | null;
          user_id: string;
          video_id: string;
          watch_count?: number | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          is_completed?: boolean | null;
          last_watched_at?: string | null;
          progress_percentage?: number | null;
          progress_seconds?: number | null;
          updated_at?: string | null;
          user_id?: string;
          video_id?: string;
          watch_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "video_progress_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "video_library";
            referencedColumns: ["id"];
          },
        ];
      };
      video_ratings: {
        Row: {
          created_at: string | null;
          id: string;
          rating: number;
          review_text: string | null;
          updated_at: string | null;
          user_id: string;
          video_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          rating: number;
          review_text?: string | null;
          updated_at?: string | null;
          user_id: string;
          video_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          rating?: number;
          review_text?: string | null;
          updated_at?: string | null;
          user_id?: string;
          video_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "video_ratings_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "video_library";
            referencedColumns: ["id"];
          },
        ];
      };
      video_recordings: {
        Row: {
          codec: string | null;
          created_at: string | null;
          duration_seconds: number | null;
          edit_version: number | null;
          file_size_bytes: number | null;
          fps: number | null;
          id: string;
          is_edited: boolean | null;
          is_private: boolean | null;
          original_recording_id: string | null;
          recording_name: string;
          recording_type: string | null;
          resolution_height: number | null;
          resolution_width: number | null;
          session_id: string;
          share_with_partner: boolean | null;
          thumbnail_url: string | null;
          updated_at: string | null;
          user_id: string;
          video_storage_path: string | null;
          video_url: string | null;
        };
        Insert: {
          codec?: string | null;
          created_at?: string | null;
          duration_seconds?: number | null;
          edit_version?: number | null;
          file_size_bytes?: number | null;
          fps?: number | null;
          id?: string;
          is_edited?: boolean | null;
          is_private?: boolean | null;
          original_recording_id?: string | null;
          recording_name: string;
          recording_type?: string | null;
          resolution_height?: number | null;
          resolution_width?: number | null;
          session_id: string;
          share_with_partner?: boolean | null;
          thumbnail_url?: string | null;
          updated_at?: string | null;
          user_id: string;
          video_storage_path?: string | null;
          video_url?: string | null;
        };
        Update: {
          codec?: string | null;
          created_at?: string | null;
          duration_seconds?: number | null;
          edit_version?: number | null;
          file_size_bytes?: number | null;
          fps?: number | null;
          id?: string;
          is_edited?: boolean | null;
          is_private?: boolean | null;
          original_recording_id?: string | null;
          recording_name?: string;
          recording_type?: string | null;
          resolution_height?: number | null;
          resolution_width?: number | null;
          session_id?: string;
          share_with_partner?: boolean | null;
          thumbnail_url?: string | null;
          updated_at?: string | null;
          user_id?: string;
          video_storage_path?: string | null;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "video_recordings_original_recording_id_fkey";
            columns: ["original_recording_id"];
            isOneToOne: false;
            referencedRelation: "video_recordings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "video_recordings_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "multi_camera_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      video_screenshots: {
        Row: {
          created_at: string | null;
          edit_data: Json | null;
          id: string;
          image_storage_path: string | null;
          image_url: string | null;
          is_edited: boolean | null;
          recording_id: string;
          screenshot_name: string | null;
          thumbnail_url: string | null;
          timestamp_seconds: number;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          edit_data?: Json | null;
          id?: string;
          image_storage_path?: string | null;
          image_url?: string | null;
          is_edited?: boolean | null;
          recording_id: string;
          screenshot_name?: string | null;
          thumbnail_url?: string | null;
          timestamp_seconds: number;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          edit_data?: Json | null;
          id?: string;
          image_storage_path?: string | null;
          image_url?: string | null;
          is_edited?: boolean | null;
          recording_id?: string;
          screenshot_name?: string | null;
          thumbnail_url?: string | null;
          timestamp_seconds?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "video_screenshots_recording_id_fkey";
            columns: ["recording_id"];
            isOneToOne: false;
            referencedRelation: "video_recordings";
            referencedColumns: ["id"];
          },
        ];
      };
      wearable_data_sync: {
        Row: {
          data_type: string;
          id: string;
          sync_direction: string;
          sync_status: string | null;
          sync_type: string;
          synced_at: string | null;
          synced_data: Json;
          user_id: string;
          wearable_id: string;
        };
        Insert: {
          data_type: string;
          id?: string;
          sync_direction: string;
          sync_status?: string | null;
          sync_type: string;
          synced_at?: string | null;
          synced_data: Json;
          user_id: string;
          wearable_id: string;
        };
        Update: {
          data_type?: string;
          id?: string;
          sync_direction?: string;
          sync_status?: string | null;
          sync_type?: string;
          synced_at?: string | null;
          synced_data?: Json;
          user_id?: string;
          wearable_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wearable_data_sync_wearable_id_fkey";
            columns: ["wearable_id"];
            isOneToOne: false;
            referencedRelation: "wearable_devices";
            referencedColumns: ["id"];
          },
        ];
      };
      wearable_devices: {
        Row: {
          auto_sync_enabled: boolean | null;
          capabilities: Json | null;
          connection_status: string | null;
          created_at: string | null;
          device_identifier: string | null;
          device_model: string | null;
          device_name: string;
          device_type: string;
          id: string;
          is_connected: boolean | null;
          last_connected_at: string | null;
          last_sync_at: string | null;
          sync_frequency_minutes: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          auto_sync_enabled?: boolean | null;
          capabilities?: Json | null;
          connection_status?: string | null;
          created_at?: string | null;
          device_identifier?: string | null;
          device_model?: string | null;
          device_name: string;
          device_type: string;
          id?: string;
          is_connected?: boolean | null;
          last_connected_at?: string | null;
          last_sync_at?: string | null;
          sync_frequency_minutes?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          auto_sync_enabled?: boolean | null;
          capabilities?: Json | null;
          connection_status?: string | null;
          created_at?: string | null;
          device_identifier?: string | null;
          device_model?: string | null;
          device_name?: string;
          device_type?: string;
          id?: string;
          is_connected?: boolean | null;
          last_connected_at?: string | null;
          last_sync_at?: string | null;
          sync_frequency_minutes?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      wearable_notifications: {
        Row: {
          action_data: Json | null;
          created_at: string | null;
          delivered_at: string | null;
          delivery_status: string | null;
          dismissed_at: string | null;
          id: string;
          notification_body: string;
          notification_title: string;
          notification_type: string;
          sent_at: string | null;
          user_id: string;
          wearable_id: string | null;
        };
        Insert: {
          action_data?: Json | null;
          created_at?: string | null;
          delivered_at?: string | null;
          delivery_status?: string | null;
          dismissed_at?: string | null;
          id?: string;
          notification_body: string;
          notification_title: string;
          notification_type: string;
          sent_at?: string | null;
          user_id: string;
          wearable_id?: string | null;
        };
        Update: {
          action_data?: Json | null;
          created_at?: string | null;
          delivered_at?: string | null;
          delivery_status?: string | null;
          dismissed_at?: string | null;
          id?: string;
          notification_body?: string;
          notification_title?: string;
          notification_type?: string;
          sent_at?: string | null;
          user_id?: string;
          wearable_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "wearable_notifications_wearable_id_fkey";
            columns: ["wearable_id"];
            isOneToOne: false;
            referencedRelation: "wearable_devices";
            referencedColumns: ["id"];
          },
        ];
      };
      webhook_deliveries: {
        Row: {
          attempted_at: string | null;
          delivered_at: string | null;
          delivery_status: string | null;
          event_data: Json;
          event_type: string;
          failed_at: string | null;
          http_status_code: number | null;
          id: string;
          next_retry_at: string | null;
          payload: Json;
          response_body: string | null;
          retry_count: number | null;
          webhook_id: string;
        };
        Insert: {
          attempted_at?: string | null;
          delivered_at?: string | null;
          delivery_status?: string | null;
          event_data: Json;
          event_type: string;
          failed_at?: string | null;
          http_status_code?: number | null;
          id?: string;
          next_retry_at?: string | null;
          payload: Json;
          response_body?: string | null;
          retry_count?: number | null;
          webhook_id: string;
        };
        Update: {
          attempted_at?: string | null;
          delivered_at?: string | null;
          delivery_status?: string | null;
          event_data?: Json;
          event_type?: string;
          failed_at?: string | null;
          http_status_code?: number | null;
          id?: string;
          next_retry_at?: string | null;
          payload?: Json;
          response_body?: string | null;
          retry_count?: number | null;
          webhook_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey";
            columns: ["webhook_id"];
            isOneToOne: false;
            referencedRelation: "webhooks";
            referencedColumns: ["id"];
          },
        ];
      };
      webhooks: {
        Row: {
          created_at: string | null;
          failed_deliveries: number | null;
          id: string;
          is_active: boolean | null;
          is_verified: boolean | null;
          last_delivery_at: string | null;
          max_retries: number | null;
          retry_delay_seconds: number | null;
          subscribed_events: string[];
          successful_deliveries: number | null;
          total_deliveries: number | null;
          updated_at: string | null;
          user_id: string;
          verification_token: string | null;
          webhook_name: string;
          webhook_secret: string | null;
          webhook_url: string;
        };
        Insert: {
          created_at?: string | null;
          failed_deliveries?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_verified?: boolean | null;
          last_delivery_at?: string | null;
          max_retries?: number | null;
          retry_delay_seconds?: number | null;
          subscribed_events: string[];
          successful_deliveries?: number | null;
          total_deliveries?: number | null;
          updated_at?: string | null;
          user_id: string;
          verification_token?: string | null;
          webhook_name: string;
          webhook_secret?: string | null;
          webhook_url: string;
        };
        Update: {
          created_at?: string | null;
          failed_deliveries?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_verified?: boolean | null;
          last_delivery_at?: string | null;
          max_retries?: number | null;
          retry_delay_seconds?: number | null;
          subscribed_events?: string[];
          successful_deliveries?: number | null;
          total_deliveries?: number | null;
          updated_at?: string | null;
          user_id?: string;
          verification_token?: string | null;
          webhook_name?: string;
          webhook_secret?: string | null;
          webhook_url?: string;
        };
        Relationships: [];
      };
      what_if_scenarios: {
        Row: {
          baseline_comparison: Json | null;
          created_at: string | null;
          feasibility_score: number | null;
          id: string;
          impact_analysis: Json | null;
          scenario_description: string | null;
          scenario_name: string;
          simulated_outcomes: Json;
          time_horizon_days: number;
          user_id: string;
          what_if_parameters: Json;
        };
        Insert: {
          baseline_comparison?: Json | null;
          created_at?: string | null;
          feasibility_score?: number | null;
          id?: string;
          impact_analysis?: Json | null;
          scenario_description?: string | null;
          scenario_name: string;
          simulated_outcomes: Json;
          time_horizon_days: number;
          user_id: string;
          what_if_parameters: Json;
        };
        Update: {
          baseline_comparison?: Json | null;
          created_at?: string | null;
          feasibility_score?: number | null;
          id?: string;
          impact_analysis?: Json | null;
          scenario_description?: string | null;
          scenario_name?: string;
          simulated_outcomes?: Json;
          time_horizon_days?: number;
          user_id?: string;
          what_if_parameters?: Json;
        };
        Relationships: [];
      };
      workshop_bookings: {
        Row: {
          booking_status: string | null;
          created_at: string | null;
          currency: string | null;
          current_participants: number | null;
          duration_minutes: number | null;
          expert_id: string;
          id: string;
          materials_url: string | null;
          max_participants: number | null;
          price_per_person: number;
          scheduled_at: string;
          session_recording_url: string | null;
          session_url: string | null;
          timezone: string | null;
          updated_at: string | null;
          workshop_id: string;
          workshop_title: string;
          workshop_type: string;
        };
        Insert: {
          booking_status?: string | null;
          created_at?: string | null;
          currency?: string | null;
          current_participants?: number | null;
          duration_minutes?: number | null;
          expert_id: string;
          id?: string;
          materials_url?: string | null;
          max_participants?: number | null;
          price_per_person: number;
          scheduled_at: string;
          session_recording_url?: string | null;
          session_url?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
          workshop_id: string;
          workshop_title: string;
          workshop_type: string;
        };
        Update: {
          booking_status?: string | null;
          created_at?: string | null;
          currency?: string | null;
          current_participants?: number | null;
          duration_minutes?: number | null;
          expert_id?: string;
          id?: string;
          materials_url?: string | null;
          max_participants?: number | null;
          price_per_person?: number;
          scheduled_at?: string;
          session_recording_url?: string | null;
          session_url?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
          workshop_id?: string;
          workshop_title?: string;
          workshop_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workshop_bookings_expert_id_fkey";
            columns: ["expert_id"];
            isOneToOne: false;
            referencedRelation: "expert_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      workshop_participants: {
        Row: {
          amount_paid: number;
          attendance_notes: string | null;
          attended: boolean | null;
          currency: string | null;
          feedback_text: string | null;
          id: string;
          payment_intent_id: string | null;
          payment_status: string | null;
          rating: number | null;
          registered_at: string | null;
          updated_at: string | null;
          user_id: string;
          workshop_booking_id: string;
          workshop_id: string | null;
        };
        Insert: {
          amount_paid: number;
          attendance_notes?: string | null;
          attended?: boolean | null;
          currency?: string | null;
          feedback_text?: string | null;
          id?: string;
          payment_intent_id?: string | null;
          payment_status?: string | null;
          rating?: number | null;
          registered_at?: string | null;
          updated_at?: string | null;
          user_id: string;
          workshop_booking_id: string;
          workshop_id?: string | null;
        };
        Update: {
          amount_paid?: number;
          attendance_notes?: string | null;
          attended?: boolean | null;
          currency?: string | null;
          feedback_text?: string | null;
          id?: string;
          payment_intent_id?: string | null;
          payment_status?: string | null;
          rating?: number | null;
          registered_at?: string | null;
          updated_at?: string | null;
          user_id?: string;
          workshop_booking_id?: string;
          workshop_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workshop_participants_workshop_booking_id_fkey";
            columns: ["workshop_booking_id"];
            isOneToOne: false;
            referencedRelation: "workshop_bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workshop_participants_workshop_id_fkey";
            columns: ["workshop_id"];
            isOneToOne: false;
            referencedRelation: "expert_group_workshops";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      email_analytics_summary: {
        Row: {
          count: number | null;
          date: string | null;
          event_type: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      calculate_habit_completion_rate: {
        Args: { days_back?: number; user_habit_id: string };
        Returns: number;
      };
      calculate_sexual_wellness_score: {
        Args: {
          p_confidence: number;
          p_erectile_function: number;
          p_frequency_count: number;
          p_libido: number;
          p_satisfaction: number;
        };
        Returns: number;
      };
      check_achievement_progress: {
        Args: {
          p_achievement_code: string;
          p_progress_increment?: number;
          p_user_id: string;
        };
        Returns: boolean;
      };
      claim_stripe_webhook_event: {
        Args: {
          _event_id: string;
          _event_type: string;
          _metadata?: Json;
          _stripe_created_at: string;
        };
        Returns: boolean;
      };
      forum_interactions_apply_delta: {
        Args: {
          p_content_id: string;
          p_content_type: string;
          p_delta: number;
          p_interaction_type: string;
        };
        Returns: undefined;
      };
      forum_reputation_ensure: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      forum_reputation_recompute_level: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      generate_referral_code: { Args: never; Returns: string };
      get_app_userbase_measurement_averages: {
        Args: { p_days?: number; p_min_sample?: number };
        Returns: {
          avg_girth: number;
          avg_length: number;
          computed_at: string;
          is_sufficient: boolean;
          sample_size: number;
          window_days: number;
        }[];
      };
      get_public_leaderboards: {
        Args: {
          p_leaderboard_type?: string;
          p_limit?: number;
          p_period?: string;
        };
        Returns: {
          created_at: string;
          display_name: string;
          id: string;
          is_anonymous: boolean;
          leaderboard_type: string;
          period: string;
          rank: number;
          score: number;
          updated_at: string;
        }[];
      };
      get_scan_statistics: {
        Args: { p_days?: number; p_user_id: string };
        Returns: {
          avg_girth: number;
          avg_length: number;
          girth_change: number;
          length_change: number;
          total_scans: number;
        }[];
      };
      get_user_education_completion: {
        Args: { user_id: string };
        Returns: number;
      };
      get_user_roles: {
        Args: { _user_id: string };
        Returns: Database["public"]["Enums"]["app_role"][];
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      increment_module_view_count: {
        Args: { module_id: string };
        Returns: undefined;
      };
      increment_patient_count: {
        Args: { p_provider_id: string };
        Returns: undefined;
      };
      is_nsfw_enabled: { Args: never; Returns: boolean };
      partner_sync_apply_retention: {
        Args: { p_connection_id: string };
        Returns: undefined;
      };
      partner_sync_create_date_plan: {
        Args: {
          p_activities?: Json;
          p_aftercare?: string[];
          p_budget?: number;
          p_checklist?: string[];
          p_date: string;
          p_distractions?: string[];
          p_duration_minutes?: number;
          p_is_location_private?: boolean;
          p_itinerary?: Json;
          p_location_address?: string;
          p_location_name?: string;
          p_location_type?: string;
          p_message?: string;
          p_packing_list?: string[];
          p_partner_id: string;
          p_positions?: string[];
          p_reminders?: Json;
          p_special_requests?: string;
          p_time: string;
          p_title: string;
          p_travel_minutes?: number;
        };
        Returns: string;
      };
      partner_sync_create_thought_ping: {
        Args: {
          p_connection_id: string;
          p_detailed_message?: string;
          p_gifs_urls?: string[];
          p_images_urls?: string[];
          p_intensity?: string;
          p_is_pinned?: boolean;
          p_message: string;
          p_priority?: string;
          p_private_note_encrypted?: string;
          p_read_receipt_requested?: boolean;
          p_recipient_id: string;
          p_remind_at?: string;
          p_scheduled_at?: string;
          p_theme?: string;
          p_tone_tags?: string[];
          p_voice_message_url?: string;
        };
        Returns: {
          connection_id: string;
          created_at: string | null;
          delivery_state: string | null;
          detailed_message: string | null;
          gifs_urls: string[] | null;
          id: string;
          images_urls: string[] | null;
          intensity: string | null;
          is_pinned: boolean | null;
          message: string;
          priority: string | null;
          private_note_encrypted: string | null;
          quick_reply_used: string | null;
          reaction_summary: Json | null;
          read_at: string | null;
          read_receipt_requested: boolean | null;
          recipient_id: string;
          remind_at: string | null;
          responded_at: string | null;
          response_message: string | null;
          scheduled_at: string | null;
          sender_id: string;
          status: string | null;
          theme: string | null;
          tone_tags: string[] | null;
          updated_at: string | null;
          voice_message_url: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "partner_thought_pings";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      partner_sync_panic_delete: {
        Args: { p_connection_id: string };
        Returns: undefined;
      };
      update_streak: {
        Args: { p_streak_type: string; p_user_id: string };
        Returns: number;
      };
    };
    Enums: {
      app_role: "admin" | "pro" | "user" | "support_staff" | "super_admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "pro", "user", "support_staff", "super_admin"],
    },
  },
} as const;
