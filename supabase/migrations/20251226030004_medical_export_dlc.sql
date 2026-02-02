-- Medical Export DLC ($29.99/month)
-- HIPAA-compliant data export and medical reporting

-- Create medical export requests table
CREATE TABLE IF NOT EXISTS public.medical_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('pdf_report', 'json_data', 'csv_data', 'hl7_fhir', 'medical_summary')),
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  include_scans BOOLEAN DEFAULT TRUE,
  include_wellness_scores BOOLEAN DEFAULT TRUE,
  include_diary_entries BOOLEAN DEFAULT FALSE,
  include_photos BOOLEAN DEFAULT FALSE,
  anonymize_data BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url TEXT,
  file_size_bytes BIGINT,
  export_password TEXT, -- Encrypted
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create provider sharing table
CREATE TABLE IF NOT EXISTS public.provider_sharing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_id UUID REFERENCES public.medical_export_requests(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  provider_email TEXT NOT NULL,
  provider_npi TEXT, -- National Provider Identifier
  sharing_code TEXT UNIQUE NOT NULL,
  access_granted_at TIMESTAMPTZ,
  access_expires_at TIMESTAMPTZ NOT NULL,
  access_revoked BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create export audit trail
CREATE TABLE IF NOT EXISTS public.export_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_id UUID NOT NULL REFERENCES public.medical_export_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'downloaded', 'shared', 'viewed', 'revoked', 'expired')),
  actor_type TEXT DEFAULT 'user' CHECK (actor_type IN ('user', 'provider', 'system')),
  actor_identifier TEXT, -- Email or system identifier
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medical report templates table
CREATE TABLE IF NOT EXISTS public.medical_report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN ('general', 'specialist', 'insurance', 'research')),
  sections JSONB NOT NULL, -- Define which sections to include
  formatting_options JSONB,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create anonymization rules table
CREATE TABLE IF NOT EXISTS public.anonymization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name TEXT NOT NULL,
  anonymization_method TEXT NOT NULL CHECK (anonymization_method IN ('redact', 'hash', 'generalize', 'perturb', 'encrypt')),
  applies_to TEXT[] NOT NULL, -- Table names
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_medical_export_requests_user_id ON public.medical_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_export_requests_status ON public.medical_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_medical_export_requests_created_at ON public.medical_export_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_sharing_user_id ON public.provider_sharing(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_sharing_sharing_code ON public.provider_sharing(sharing_code);
CREATE INDEX IF NOT EXISTS idx_export_audit_trail_export_id ON public.export_audit_trail(export_id);
CREATE INDEX IF NOT EXISTS idx_export_audit_trail_created_at ON public.export_audit_trail(created_at DESC);

-- Enable RLS
ALTER TABLE public.medical_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_sharing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymization_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their export requests" ON public.medical_export_requests
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage provider sharing" ON public.provider_sharing
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their export audit trail" ON public.export_audit_trail
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active report templates" ON public.medical_report_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active anonymization rules" ON public.anonymization_rules
  FOR SELECT USING (is_active = true);

-- Seed data: Default templates
INSERT INTO public.medical_report_templates (name, description, template_type, sections, is_default) VALUES
  ('General Health Report', 'Comprehensive health overview', 'general', 
   '{"sections": ["patient_info", "scan_history", "wellness_trends", "measurements", "recommendations"]}'::jsonb, true),
  ('Specialist Referral', 'Focused report for specialist referral', 'specialist',
   '{"sections": ["patient_info", "chief_complaint", "relevant_scans", "current_medications"]}'::jsonb, false),
  ('Insurance Documentation', 'Medical necessity documentation', 'insurance',
   '{"sections": ["patient_info", "diagnosis", "treatment_plan", "supporting_data"]}'::jsonb, false);

-- Seed data: Anonymization rules
INSERT INTO public.anonymization_rules (field_name, anonymization_method, applies_to) VALUES
  ('email', 'hash', ARRAY['users', 'profiles']),
  ('phone_number', 'redact', ARRAY['profiles']),
  ('date_of_birth', 'generalize', ARRAY['profiles']),
  ('full_name', 'hash', ARRAY['users', 'profiles']),
  ('address', 'redact', ARRAY['profiles']);

COMMENT ON TABLE public.medical_export_requests IS 'Medical Export DLC: HIPAA-compliant export requests';
COMMENT ON TABLE public.provider_sharing IS 'Medical Export DLC: Secure provider data sharing';
COMMENT ON TABLE public.export_audit_trail IS 'Medical Export DLC: HIPAA audit trail for exports';
COMMENT ON TABLE public.medical_report_templates IS 'Medical Export DLC: Customizable report templates';
