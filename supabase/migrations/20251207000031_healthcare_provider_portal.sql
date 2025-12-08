-- Migration: Healthcare Provider Portal
-- Creates tables for provider portal, doctor dashboard, patient data access, professional reporting, treatment planning, and HIPAA compliance

-- Healthcare Providers
CREATE TABLE IF NOT EXISTS healthcare_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Provider Information
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('doctor', 'clinic', 'hospital', 'organization')),
  specialty TEXT[],
  credentials TEXT[],
  license_number TEXT,
  license_state TEXT,
  
  -- Contact
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  website TEXT,
  
  -- Subscription
  subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'professional', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
  subscription_start_date DATE,
  subscription_end_date DATE,
  
  -- HIPAA Compliance
  hipaa_compliant BOOLEAN DEFAULT false,
  hipaa_certification_date DATE,
  baa_signed BOOLEAN DEFAULT false,
  baa_signed_date DATE,
  
  -- Settings
  max_patients INTEGER DEFAULT 100,
  current_patient_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Provider Staff Members
CREATE TABLE IF NOT EXISTS provider_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES healthcare_providers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'nurse', 'assistant', 'viewer')),
  permissions JSONB, -- Specific permissions
  
  is_active BOOLEAN DEFAULT true,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(provider_id, user_id)
);

-- Patient-Provider Relationships
CREATE TABLE IF NOT EXISTS patient_provider_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES healthcare_providers(id) ON DELETE CASCADE,
  
  -- Consent
  consent_granted BOOLEAN DEFAULT false,
  consent_date DATE,
  consent_expires_date DATE,
  consent_scope TEXT[] NOT NULL, -- What data can be accessed
  
  -- Relationship
  relationship_type TEXT DEFAULT 'primary' CHECK (relationship_type IN ('primary', 'consulting', 'specialist', 'temporary')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
  
  -- Access
  access_level TEXT DEFAULT 'read' CHECK (access_level IN ('read', 'read_write', 'full')),
  can_view_scans BOOLEAN DEFAULT true,
  can_view_diary BOOLEAN DEFAULT true,
  can_view_analytics BOOLEAN DEFAULT true,
  can_view_reports BOOLEAN DEFAULT true,
  
  -- Notes
  provider_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(patient_id, provider_id)
);

-- Provider Dashboard Data
CREATE TABLE IF NOT EXISTS provider_dashboard_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES healthcare_providers(id) ON DELETE CASCADE,
  
  -- Metrics
  metric_date DATE NOT NULL,
  total_patients INTEGER DEFAULT 0,
  active_patients INTEGER DEFAULT 0,
  new_patients INTEGER DEFAULT 0,
  consultations_count INTEGER DEFAULT 0,
  reports_generated INTEGER DEFAULT 0,
  
  -- Engagement
  average_patient_engagement DECIMAL(5, 2),
  patients_with_recent_activity INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(provider_id, metric_date)
);

-- Professional Reports (Provider-Generated)
CREATE TABLE IF NOT EXISTS provider_professional_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES healthcare_providers(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  report_type TEXT NOT NULL CHECK (report_type IN ('assessment', 'progress', 'treatment_plan', 'summary', 'referral')),
  report_title TEXT NOT NULL,
  
  -- Report content
  report_content JSONB NOT NULL,
  findings TEXT[],
  recommendations TEXT[],
  treatment_plan JSONB,
  
  -- Status
  report_status TEXT DEFAULT 'draft' CHECK (report_status IN ('draft', 'final', 'shared', 'archived')),
  is_shared_with_patient BOOLEAN DEFAULT false,
  shared_at TIMESTAMPTZ,
  
  -- File
  file_url TEXT,
  file_format TEXT CHECK (file_format IN ('pdf', 'docx', 'hl7_fhir')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Treatment Plans
CREATE TABLE IF NOT EXISTS treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES healthcare_providers(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  plan_name TEXT NOT NULL,
  plan_description TEXT,
  
  -- Plan details
  plan_data JSONB NOT NULL, -- Structured treatment plan
  goals TEXT[],
  milestones TEXT[],
  timeline_days INTEGER,
  
  -- Status
  plan_status TEXT DEFAULT 'active' CHECK (plan_status IN ('draft', 'active', 'completed', 'cancelled')),
  start_date DATE,
  end_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Progress
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  milestones_completed INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provider-Patient Communications
CREATE TABLE IF NOT EXISTS provider_patient_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES healthcare_providers(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  communication_type TEXT NOT NULL CHECK (communication_type IN ('message', 'note', 'alert', 'reminder')),
  subject TEXT,
  content TEXT NOT NULL,
  
  -- Direction
  direction TEXT NOT NULL CHECK (direction IN ('provider_to_patient', 'patient_to_provider')),
  from_user_id UUID NOT NULL REFERENCES auth.users(id),
  to_user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT false,
  
  -- HIPAA
  is_encrypted BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HIPAA Audit Log
CREATE TABLE IF NOT EXISTS hipaa_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES healthcare_providers(id) ON DELETE SET NULL,
  
  -- Action
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'create', 'update', 'delete', 'export', 'share', 'access_denied')),
  resource_type TEXT NOT NULL, -- 'patient_data', 'report', 'scan', etc.
  resource_id UUID,
  
  -- Details
  action_description TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Result
  action_result TEXT CHECK (action_result IN ('success', 'failure', 'denied')),
  error_message TEXT,
  
  -- HIPAA
  hipaa_category TEXT, -- 'access', 'disclosure', 'modification', 'deletion'
  patient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provider Subscriptions
CREATE TABLE IF NOT EXISTS provider_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES healthcare_providers(id) ON DELETE CASCADE,
  
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('basic', 'professional', 'enterprise')),
  price_per_month DECIMAL(10, 2) NOT NULL,
  
  -- Stripe
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  
  -- Features
  max_patients INTEGER,
  max_staff INTEGER,
  features_included JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_healthcare_providers_user_id ON healthcare_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_providers_status ON healthcare_providers(subscription_status);
CREATE INDEX IF NOT EXISTS idx_provider_staff_provider_id ON provider_staff(provider_id);
CREATE INDEX IF NOT EXISTS idx_patient_provider_relationships_patient_id ON patient_provider_relationships(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_provider_relationships_provider_id ON patient_provider_relationships(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_dashboard_metrics_provider_id ON provider_dashboard_metrics(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_professional_reports_provider_id ON provider_professional_reports(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_professional_reports_patient_id ON provider_professional_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_provider_id ON treatment_plans(provider_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient_id ON treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_provider_patient_communications_provider_id ON provider_patient_communications(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_patient_communications_patient_id ON provider_patient_communications(patient_id);
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_log_user_id ON hipaa_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_log_patient_id ON hipaa_audit_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_log_created_at ON hipaa_audit_log(created_at);

-- RLS Policies
ALTER TABLE healthcare_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_provider_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_dashboard_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_professional_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_patient_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE hipaa_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_subscriptions ENABLE ROW LEVEL SECURITY;

-- Healthcare Providers: Users can view their own
CREATE POLICY "Users can view own provider profile"
  ON healthcare_providers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own provider profile"
  ON healthcare_providers FOR ALL
  USING (auth.uid() = user_id);

-- Provider Staff: Staff can view their provider
CREATE POLICY "Staff can view their provider"
  ON provider_staff FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM provider_staff ps
      WHERE ps.provider_id = provider_staff.provider_id
      AND ps.user_id = auth.uid()
    )
  );

-- Patient-Provider Relationships: Patients and providers can view their relationships
CREATE POLICY "Patients and providers can view relationships"
  ON patient_provider_relationships FOR SELECT
  USING (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = patient_provider_relationships.provider_id
      AND hp.user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can create relationships"
  ON patient_provider_relationships FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- Provider Dashboard Metrics: Providers can view their own
CREATE POLICY "Providers can view own dashboard metrics"
  ON provider_dashboard_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_dashboard_metrics.provider_id
      AND hp.user_id = auth.uid()
    )
  );

-- Provider Professional Reports: Providers and patients can view
CREATE POLICY "Providers and patients can view reports"
  ON provider_professional_reports FOR SELECT
  USING (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_professional_reports.provider_id
      AND hp.user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can create reports"
  ON provider_professional_reports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_professional_reports.provider_id
      AND hp.user_id = auth.uid()
    )
  );

-- Treatment Plans: Providers and patients can view
CREATE POLICY "Providers and patients can view treatment plans"
  ON treatment_plans FOR SELECT
  USING (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = treatment_plans.provider_id
      AND hp.user_id = auth.uid()
    )
  );

-- Provider-Patient Communications: Participants can view
CREATE POLICY "Communication participants can view messages"
  ON provider_patient_communications FOR SELECT
  USING (
    auth.uid() = from_user_id OR
    auth.uid() = to_user_id
  );

CREATE POLICY "Users can create communications"
  ON provider_patient_communications FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- HIPAA Audit Log: System and admins only (read-only for most users)
CREATE POLICY "System can create audit logs"
  ON hipaa_audit_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own audit logs"
  ON hipaa_audit_log FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin')
    )
  );

-- Provider Subscriptions: Providers can view their own
CREATE POLICY "Providers can view own subscriptions"
  ON provider_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_subscriptions.provider_id
      AND hp.user_id = auth.uid()
    )
  );

