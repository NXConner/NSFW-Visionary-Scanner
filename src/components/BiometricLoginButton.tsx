import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Fingerprint, Scan, Eye, Loader2 } from "lucide-react";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { toast } from "sonner";

interface BiometricLoginButtonProps {
  onSuccess: (credentials: { username: string; password: string }) => void;
  className?: string;
}

export const BiometricLoginButton = ({ onSuccess, className }: BiometricLoginButtonProps) => {
  const { settings, isAvailable, isLoading, getCredentials, getBiometricTypeName } =
    useBiometricAuth();
  const [loading, setLoading] = useState(false);

  if (!isAvailable || !settings.enabled) {
    return null;
  }

  const handleBiometricLogin = async () => {
    setLoading(true);
    try {
      const credentials = await getCredentials();
      if (credentials) {
        onSuccess(credentials);
      } else {
        toast.error("Biometric authentication failed");
      }
    } catch (error) {
      toast.error("Biometric authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const getIcon = () => {
    switch (settings.type) {
      case "face":
        return <Scan className="w-5 h-5" />;
      case "iris":
        return <Eye className="w-5 h-5" />;
      default:
        return <Fingerprint className="w-5 h-5" />;
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={`w-full h-12 ${className}`}
      onClick={handleBiometricLogin}
      disabled={loading || isLoading}
    >
      {loading || isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : getIcon()}
      <span className="ml-2">{getBiometricTypeName()} Login</span>
    </Button>
  );
};

export default BiometricLoginButton;
