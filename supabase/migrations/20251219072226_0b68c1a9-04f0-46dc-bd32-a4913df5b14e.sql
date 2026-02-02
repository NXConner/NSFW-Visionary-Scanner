-- Fix HIPAA audit logs to be append-only (users cannot UPDATE or DELETE their own logs)
-- First, drop any existing UPDATE/DELETE policies on hipaa_audit_logs
DROP POLICY IF EXISTS "Users can update own logs" ON public.hipaa_audit_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON public.hipaa_audit_logs;

-- Ensure only INSERT and SELECT policies exist for users
-- Check existing policies and create proper append-only structure

-- Drop all existing policies to recreate properly
DROP POLICY IF EXISTS "Users can view own logs" ON public.hipaa_audit_logs;
DROP POLICY IF EXISTS "Users can create own logs" ON public.hipaa_audit_logs;

-- Recreate with append-only pattern
CREATE POLICY "Users can view their own audit logs"
ON public.hipaa_audit_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create audit log entries"
ON public.hipaa_audit_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE policies - making it append-only