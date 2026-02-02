/**
 * Feature Gate Component
 * Conditionally renders content based on DLC ownership
 * SUPER ADMIN BYPASS: Super admin users always get immediate access
 */

import React from "react";
import { useDLC } from "../context/DLCContext";
import { LockedFeature } from "./LockedFeature";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { isAnySuperAdminPersisted } from "@/lib/superAdmin";

// CRITICAL: Module-level cached super admin check - runs ONCE at import time
// This ensures privileged status is known BEFORE any component renders
// NO DEPENDENCY ON USER ID - directly checks if any super admin is persisted
const INITIAL_SUPER_ADMIN_STATUS = isAnySuperAdminPersisted();

interface FeatureGateProps {
  packageId?: string;
  featureId?: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
  showLocked?: boolean;
  onUnlockRequest?: () => void;
  children: React.ReactNode;
}

export function FeatureGate({
  packageId,
  featureId,
  fallbackTitle = "Premium Feature",
  fallbackDescription = "This feature requires a premium package",
  showLocked = true,
  onUnlockRequest,
  children,
}: FeatureGateProps) {
  const { hasFeature, ownsPackage, isLoading, isInitialized } = useDLC();
  const { isSuperAdmin, hasFullAccess, allFeaturesUnlocked } = useAuth();
  const { isAdmin, isSuperAdmin: isSuperAdminRole } = useUserRoles();

  // CRITICAL FIX: Check localStorage SYNCHRONOUSLY at module level (see below)
  // This ensures privileged status is known on the VERY FIRST render
  
  // SUPER ADMIN BYPASS: Immediately grant access for privileged users
  // INITIAL_SUPER_ADMIN_STATUS is computed at module load time - before any render
  const isPrivileged =
    INITIAL_SUPER_ADMIN_STATUS ||
    isSuperAdmin ||
    hasFullAccess ||
    allFeaturesUnlocked ||
    isAdmin ||
    isSuperAdminRole;
  
  if (isPrivileged) {
    return <>{children}</>;
  }

  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  // Check access by packageId or featureId
  const hasAccess = packageId ? ownsPackage(packageId) : featureId ? hasFeature(featureId) : false;

  if (hasAccess) {
    return <>{children}</>;
  }

  if (!showLocked) {
    return null;
  }

  return (
    <LockedFeature
      packageId={packageId}
      featureId={featureId}
      title={fallbackTitle}
      description={fallbackDescription}
      onUnlock={onUnlockRequest}
    />
  );
}

export default FeatureGate;
