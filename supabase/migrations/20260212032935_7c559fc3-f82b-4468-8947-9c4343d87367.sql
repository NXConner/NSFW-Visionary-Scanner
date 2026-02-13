
-- ============================================================================
-- BATCH 2 (retry): Partner, Wellness, Diary, Messaging, Predictive, Export/Import
-- ============================================================================

-- Sexual Wellness
CREATE TABLE IF NOT EXISTS public.sexual_wellness_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, entry_date date DEFAULT CURRENT_DATE, wellness_type text, score numeric, notes text, data jsonb, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.sexual_wellness_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wellness entries" ON public.sexual_wellness_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.sexual_wellness_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, goal_name text NOT NULL, target_value numeric, current_value numeric DEFAULT 0, status text DEFAULT 'active', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.sexual_wellness_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wellness goals" ON public.sexual_wellness_goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.sexual_wellness_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, pattern_type text, pattern_data jsonb, detected_at timestamptz DEFAULT now(), created_at timestamptz DEFAULT now()
);
ALTER TABLE public.sexual_wellness_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own patterns" ON public.sexual_wellness_patterns FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.sexual_wellness_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, score_date date DEFAULT CURRENT_DATE, overall_score numeric, dimensions jsonb, created_at timestamptz DEFAULT now()
);
ALTER TABLE public.sexual_wellness_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own scores" ON public.sexual_wellness_scores FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Partner Sync extended tables
CREATE TABLE IF NOT EXISTS public.partner_data_permissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, partner_id uuid, permission_type text NOT NULL, is_granted boolean DEFAULT false, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.partner_data_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "perm_own" ON public.partner_data_permissions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.partner_thought_ping_reactions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ping_id uuid, user_id uuid NOT NULL, reaction_type text NOT NULL, created_at timestamptz DEFAULT now());
ALTER TABLE public.partner_thought_ping_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "react_own" ON public.partner_thought_ping_reactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.partner_thought_ping_templates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), template_text text NOT NULL, category text, is_default boolean DEFAULT false, order_index int DEFAULT 0, created_at timestamptz DEFAULT now());
ALTER TABLE public.partner_thought_ping_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_ping_tpl" ON public.partner_thought_ping_templates FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.partner_quick_reply_templates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reply_text text NOT NULL, category text, order_index int DEFAULT 0, created_at timestamptz DEFAULT now());
ALTER TABLE public.partner_quick_reply_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_reply_tpl" ON public.partner_quick_reply_templates FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.partner_sync_preferences (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE, sync_enabled boolean DEFAULT true, notification_enabled boolean DEFAULT true, auto_share_enabled boolean DEFAULT false, preferences jsonb DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.partner_sync_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sync_pref_own" ON public.partner_sync_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.partner_sync_consent (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, partner_id uuid, consent_type text NOT NULL, is_granted boolean DEFAULT false, granted_at timestamptz, revoked_at timestamptz, created_at timestamptz DEFAULT now());
ALTER TABLE public.partner_sync_consent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consent_own" ON public.partner_sync_consent FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.partner_sync_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, partner_id uuid, event_type text NOT NULL, event_data jsonb, created_at timestamptz DEFAULT now());
ALTER TABLE public.partner_sync_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sync_ev_own" ON public.partner_sync_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.partner_sync_audit_log (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, action text NOT NULL, details jsonb, created_at timestamptz DEFAULT now());
ALTER TABLE public.partner_sync_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_own" ON public.partner_sync_audit_log FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.partner_sync_abuse_signals (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reporter_id uuid NOT NULL, reported_user_id uuid, signal_type text NOT NULL, description text, status text DEFAULT 'pending', created_at timestamptz DEFAULT now());
ALTER TABLE public.partner_sync_abuse_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "abuse_own" ON public.partner_sync_abuse_signals FOR ALL USING (auth.uid() = reporter_id) WITH CHECK (auth.uid() = reporter_id);

CREATE TABLE IF NOT EXISTS public.partner_sync_retention_policies (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), policy_name text NOT NULL, retention_days int DEFAULT 30, data_type text, is_active boolean DEFAULT true, created_at timestamptz DEFAULT now());
ALTER TABLE public.partner_sync_retention_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_retention" ON public.partner_sync_retention_policies FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.partner_position_activity_log (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, position_id uuid, activity_type text, notes text, created_at timestamptz DEFAULT now());
ALTER TABLE public.partner_position_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_act_own" ON public.partner_position_activity_log FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- AI Conversation
CREATE TABLE IF NOT EXISTS public.ai_conversation_sessions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, session_name text, context_type text, is_active boolean DEFAULT true, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.ai_conversation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_sess_own" ON public.ai_conversation_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.ai_conversation_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), session_id uuid REFERENCES public.ai_conversation_sessions(id) ON DELETE CASCADE, user_id uuid NOT NULL, role text NOT NULL, content text NOT NULL, created_at timestamptz DEFAULT now());
ALTER TABLE public.ai_conversation_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_msg_own" ON public.ai_conversation_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.ai_contextual_memory (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, memory_key text NOT NULL, memory_value text, context_type text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.ai_contextual_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_mem_own" ON public.ai_contextual_memory FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.ai_proactive_suggestions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, suggestion_type text, suggestion_text text NOT NULL, is_dismissed boolean DEFAULT false, created_at timestamptz DEFAULT now());
ALTER TABLE public.ai_proactive_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_sug_own" ON public.ai_proactive_suggestions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Email Marketing
CREATE TABLE IF NOT EXISTS public.email_templates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), template_name text NOT NULL, subject text NOT NULL, body_html text, body_text text, template_type text, is_active boolean DEFAULT true, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_email_tpl" ON public.email_templates FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.email_send_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, template_id uuid, recipient_email text NOT NULL, status text DEFAULT 'sent', sent_at timestamptz DEFAULT now(), opened_at timestamptz, clicked_at timestamptz, created_at timestamptz DEFAULT now());
ALTER TABLE public.email_send_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_email_ev" ON public.email_send_events FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Two Factor Auth
CREATE TABLE IF NOT EXISTS public.two_factor_authentication (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE, is_enabled boolean DEFAULT false, secret_key text, backup_codes text[], verified_at timestamptz, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.two_factor_authentication ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tfa_own" ON public.two_factor_authentication FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Support Chat
CREATE TABLE IF NOT EXISTS public.support_chat_sessions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, status text DEFAULT 'open', subject text, assigned_agent_id uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.support_chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sup_sess_own" ON public.support_chat_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.support_chat_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), session_id uuid REFERENCES public.support_chat_sessions(id) ON DELETE CASCADE, sender_id uuid NOT NULL, message text NOT NULL, is_from_agent boolean DEFAULT false, created_at timestamptz DEFAULT now());
ALTER TABLE public.support_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sup_msg_own" ON public.support_chat_messages FOR ALL USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);

CREATE TABLE IF NOT EXISTS public.support_chat_quick_responses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), response_text text NOT NULL, category text, order_index int DEFAULT 0, is_active boolean DEFAULT true, created_at timestamptz DEFAULT now());
ALTER TABLE public.support_chat_quick_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_quick_resp" ON public.support_chat_quick_responses FOR SELECT USING (true);

-- Expert QA & Ratings & Bookings
CREATE TABLE IF NOT EXISTS public.expert_qa (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), expert_id uuid, user_id uuid NOT NULL, question text NOT NULL, answer text, category text, status text DEFAULT 'pending', answered_at timestamptz, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.expert_qa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eqa_own" ON public.expert_qa FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.expert_ratings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), expert_id uuid, user_id uuid NOT NULL, consultation_id uuid, rating int NOT NULL, review_title text, review_text text, is_approved boolean DEFAULT false, helpful_count int DEFAULT 0, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.expert_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "erat_own" ON public.expert_ratings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.consultation_bookings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), expert_id uuid, user_id uuid NOT NULL, consultation_type text, scheduled_at timestamptz NOT NULL, duration_minutes int DEFAULT 30, status text DEFAULT 'pending', payment_status text DEFAULT 'pending', payment_amount numeric, notes text, meeting_url text, rating int, review text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "book_own" ON public.consultation_bookings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.workshop_bookings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workshop_id uuid, user_id uuid NOT NULL, status text DEFAULT 'confirmed', payment_status text DEFAULT 'pending', created_at timestamptz DEFAULT now());
ALTER TABLE public.workshop_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_book_own" ON public.workshop_bookings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Security & Privacy
CREATE TABLE IF NOT EXISTS public.security_alerts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, alert_type text NOT NULL, severity text DEFAULT 'info', message text NOT NULL, is_resolved boolean DEFAULT false, resolved_at timestamptz, created_at timestamptz DEFAULT now());
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sec_own" ON public.security_alerts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.privacy_controls (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, control_type text NOT NULL, is_enabled boolean DEFAULT true, settings jsonb DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.privacy_controls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "priv_own" ON public.privacy_controls FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.login_history (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, login_at timestamptz DEFAULT now(), ip_address text, user_agent text, device_type text, location text, is_successful boolean DEFAULT true);
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "login_own" ON public.login_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Enhanced Diary
CREATE TABLE IF NOT EXISTS public.enhanced_diary_entries (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, entry_date date DEFAULT CURRENT_DATE, title text, content text, mood_score int, tags text[], attachments jsonb, is_private boolean DEFAULT true, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.enhanced_diary_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diary_own" ON public.enhanced_diary_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.diary_search_index (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), entry_id uuid, user_id uuid NOT NULL, search_text text, created_at timestamptz DEFAULT now());
ALTER TABLE public.diary_search_index ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dsearch_own" ON public.diary_search_index FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.diary_templates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), template_name text NOT NULL, template_content text, category text, is_default boolean DEFAULT false, created_at timestamptz DEFAULT now());
ALTER TABLE public.diary_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_diary_tpl" ON public.diary_templates FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.medication_schedules (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, medication_name text NOT NULL, dosage text, frequency text, start_date date, end_date date, is_active boolean DEFAULT true, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.medication_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "med_sched_own" ON public.medication_schedules FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.medication_log (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, schedule_id uuid, taken_at timestamptz DEFAULT now(), notes text, created_at timestamptz DEFAULT now());
ALTER TABLE public.medication_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "med_log_own" ON public.medication_log FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.diary_analytics (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, analytics_type text, data jsonb, period_start date, period_end date, created_at timestamptz DEFAULT now());
ALTER TABLE public.diary_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diary_anal_own" ON public.diary_analytics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- In-App Messaging (fixed order - members table first)
CREATE TABLE IF NOT EXISTS public.group_chat_members (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), group_id uuid, user_id uuid NOT NULL, role text DEFAULT 'member', joined_at timestamptz DEFAULT now());
ALTER TABLE public.group_chat_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gcm_own" ON public.group_chat_members FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.group_chats (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, description text, created_by uuid NOT NULL, is_active boolean DEFAULT true, member_count int DEFAULT 0, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.group_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gc_read" ON public.group_chats FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.group_chat_members WHERE group_id = id AND user_id = auth.uid())
);
CREATE POLICY "gc_manage" ON public.group_chats FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "gc_update" ON public.group_chats FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "gc_delete" ON public.group_chats FOR DELETE USING (auth.uid() = created_by);

CREATE TABLE IF NOT EXISTS public.group_chat_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), group_id uuid, sender_id uuid NOT NULL, message text NOT NULL, created_at timestamptz DEFAULT now());
ALTER TABLE public.group_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gcmsg_read" ON public.group_chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.group_chat_members WHERE group_id = group_chat_messages.group_id AND user_id = auth.uid())
);
CREATE POLICY "gcmsg_insert" ON public.group_chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE TABLE IF NOT EXISTS public.direct_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sender_id uuid NOT NULL, recipient_id uuid NOT NULL, message text NOT NULL, is_read boolean DEFAULT false, read_at timestamptz, created_at timestamptz DEFAULT now());
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dm_own" ON public.direct_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "dm_insert" ON public.direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Export/Import
CREATE TABLE IF NOT EXISTS public.export_jobs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, export_type text NOT NULL, export_name text NOT NULL, export_status text DEFAULT 'pending', progress_percentage numeric DEFAULT 0, file_url text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exp_own" ON public.export_jobs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.import_jobs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, import_type text NOT NULL, import_name text NOT NULL, import_status text DEFAULT 'pending', progress_percentage numeric DEFAULT 0, records_total int DEFAULT 0, records_imported int DEFAULT 0, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "imp_own" ON public.import_jobs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.cloud_service_connections (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, service_type text NOT NULL, service_name text NOT NULL, is_connected boolean DEFAULT false, connection_status text DEFAULT 'disconnected', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.cloud_service_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "csc_own" ON public.cloud_service_connections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- API Keys
CREATE TABLE IF NOT EXISTS public.api_keys (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, key_name text NOT NULL, key_hash text NOT NULL, key_prefix text NOT NULL, permissions text[] DEFAULT '{}', is_active boolean DEFAULT true, last_used_at timestamptz, expires_at timestamptz, created_at timestamptz DEFAULT now());
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_own" ON public.api_keys FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, subject text NOT NULL, description text, status text DEFAULT 'open', priority text DEFAULT 'normal', category text, assigned_to uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tkt_own" ON public.support_tickets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE, sender_id uuid NOT NULL, message text NOT NULL, is_staff_reply boolean DEFAULT false, created_at timestamptz DEFAULT now());
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tktmsg_own" ON public.support_ticket_messages FOR ALL USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);

-- Predictive Modeling
CREATE TABLE IF NOT EXISTS public.predictive_models (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, model_type text NOT NULL, model_data jsonb, accuracy numeric, last_trained_at timestamptz, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.predictive_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pred_own" ON public.predictive_models FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.long_term_health_forecasts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, forecast_type text, forecast_data jsonb, confidence numeric, forecast_date date, created_at timestamptz DEFAULT now());
ALTER TABLE public.long_term_health_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forecast_own" ON public.long_term_health_forecasts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.growth_predictions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, prediction_data jsonb, confidence numeric, created_at timestamptz DEFAULT now());
ALTER TABLE public.growth_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "growth_own" ON public.growth_predictions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.health_risk_predictions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, risk_type text, risk_level text, risk_data jsonb, created_at timestamptz DEFAULT now());
ALTER TABLE public.health_risk_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hrisk_own" ON public.health_risk_predictions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.routine_timing_predictions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, prediction_data jsonb, optimal_times jsonb, created_at timestamptz DEFAULT now());
ALTER TABLE public.routine_timing_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rtime_own" ON public.routine_timing_predictions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.outcome_simulations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, simulation_type text, input_data jsonb, results jsonb, created_at timestamptz DEFAULT now());
ALTER TABLE public.outcome_simulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "osim_own" ON public.outcome_simulations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
