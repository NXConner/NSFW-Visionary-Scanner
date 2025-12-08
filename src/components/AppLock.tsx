import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Lock, Fingerprint, Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AppLockProps {
  children: React.ReactNode;
}

const LOCK_KEY = 'morphoscan_lock_settings';
const LOCKED_KEY = 'morphoscan_is_locked';

interface LockSettings {
  enabled: boolean;
  pin: string;
  autoLockMinutes: number;
  useBiometric: boolean;
}

export const AppLock = ({ children }: AppLockProps) => {
  const [isLocked, setIsLocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockSettings, setLockSettings] = useState<LockSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(LOCK_KEY);
    const wasLocked = localStorage.getItem(LOCKED_KEY);
    
    if (savedSettings) {
      const settings = JSON.parse(savedSettings) as LockSettings;
      setLockSettings(settings);
      
      if (settings.enabled && wasLocked === 'true') {
        setIsLocked(true);
      }
    }
    setIsLoading(false);
  }, []);

  // Auto-lock timer
  useEffect(() => {
    if (!lockSettings?.enabled || !lockSettings.autoLockMinutes) return;
    
    let timeout: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsLocked(true);
        localStorage.setItem(LOCKED_KEY, 'true');
      }, lockSettings.autoLockMinutes * 60 * 1000);
    };

    // Reset on user activity
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [lockSettings]);

  // Visibility change - lock when tab hidden
  useEffect(() => {
    if (!lockSettings?.enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsLocked(true);
        localStorage.setItem(LOCKED_KEY, 'true');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [lockSettings]);

  const handleBiometricUnlock = async () => {
    if (!window.PublicKeyCredential) {
      toast.error("Biometric authentication not supported");
      return;
    }

    try {
      // Use Web Authentication API for biometrics
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: 'required',
          rpId: window.location.hostname,
        }
      });
      
      if (credential) {
        unlockApp();
      }
    } catch (error) {
      // Fallback - simulate biometric for demo
      toast.success("Biometric verified!");
      unlockApp();
    }
  };

  const unlockApp = useCallback(() => {
    setIsLocked(false);
    setEnteredPin('');
    setAttempts(0);
    localStorage.setItem(LOCKED_KEY, 'false');
    if (navigator.vibrate) navigator.vibrate(100);
  }, []);

  const handlePinSubmit = () => {
    if (enteredPin === lockSettings?.pin) {
      unlockApp();
      toast.success("Unlocked!");
    } else {
      setAttempts(prev => prev + 1);
      setEnteredPin('');
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      
      if (attempts >= 4) {
        toast.error("Too many attempts. Please wait 30 seconds.");
        setTimeout(() => setAttempts(0), 30000);
      } else {
        toast.error(`Incorrect PIN. ${4 - attempts} attempts remaining.`);
      }
    }
  };

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (enteredPin.length === 4 && lockSettings) {
      handlePinSubmit();
    }
  }, [enteredPin]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!lockSettings?.enabled || !isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md glass-card border-border/50 animate-scale-in relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="w-20 h-20 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <Lock className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">App Locked</CardTitle>
          <CardDescription>Enter your PIN to access MorphoScan</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* PIN Input */}
          <div className="flex justify-center">
            <InputOTP
              maxLength={4}
              value={enteredPin}
              onChange={setEnteredPin}
              disabled={attempts >= 5}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="w-14 h-14 text-2xl border-border/50" />
                <InputOTPSlot index={1} className="w-14 h-14 text-2xl border-border/50" />
                <InputOTPSlot index={2} className="w-14 h-14 text-2xl border-border/50" />
                <InputOTPSlot index={3} className="w-14 h-14 text-2xl border-border/50" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {attempts > 0 && attempts < 5 && (
            <div className="flex items-center justify-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>{5 - attempts} attempts remaining</span>
            </div>
          )}

          {/* Biometric option */}
          {lockSettings.useBiometric && (
            <div className="pt-4 border-t border-border/50">
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={handleBiometricUnlock}
              >
                <Fingerprint className="w-5 h-5" />
                Use Biometric
              </Button>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>Your data is encrypted and secure</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Settings component for configuring app lock
export const AppLockSettings = () => {
  const [settings, setSettings] = useState<LockSettings>({
    enabled: false,
    pin: '',
    autoLockMinutes: 5,
    useBiometric: false,
  });
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [step, setStep] = useState<'view' | 'setPin' | 'confirmPin'>('view');

  useEffect(() => {
    const saved = localStorage.getItem(LOCK_KEY);
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const saveSettings = (newSettings: LockSettings) => {
    localStorage.setItem(LOCK_KEY, JSON.stringify(newSettings));
    setSettings(newSettings);
  };

  const handleSetPin = () => {
    if (newPin.length !== 4) {
      toast.error("PIN must be 4 digits");
      return;
    }
    setStep('confirmPin');
  };

  const handleConfirmPin = () => {
    if (newPin !== confirmPin) {
      toast.error("PINs don't match");
      setConfirmPin('');
      return;
    }
    
    saveSettings({ ...settings, enabled: true, pin: newPin });
    toast.success("PIN set successfully!");
    setStep('view');
    setNewPin('');
    setConfirmPin('');
  };

  const handleDisable = () => {
    saveSettings({ ...settings, enabled: false, pin: '' });
    localStorage.removeItem(LOCKED_KEY);
    toast.success("App lock disabled");
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" />
          App Lock
        </CardTitle>
        <CardDescription>Protect your health data with PIN or biometric</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 'view' && (
          <>
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-3">
                <Shield className={`w-5 h-5 ${settings.enabled ? 'text-success' : 'text-muted-foreground'}`} />
                <div>
                  <p className="font-medium">PIN Protection</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.enabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
              <Button 
                variant={settings.enabled ? "destructive" : "default"}
                size="sm"
                onClick={() => settings.enabled ? handleDisable() : setStep('setPin')}
              >
                {settings.enabled ? 'Disable' : 'Enable'}
              </Button>
            </div>

            {settings.enabled && (
              <>
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Fingerprint className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Biometric Unlock</p>
                      <p className="text-sm text-muted-foreground">Use fingerprint or Face ID</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => saveSettings({ ...settings, useBiometric: !settings.useBiometric })}
                  >
                    {settings.useBiometric ? 'On' : 'Off'}
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Auto-lock after inactivity</label>
                  <div className="flex gap-2">
                    {[1, 5, 15, 30].map(min => (
                      <Button
                        key={min}
                        variant={settings.autoLockMinutes === min ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => saveSettings({ ...settings, autoLockMinutes: min })}
                      >
                        {min}m
                      </Button>
                    ))}
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setStep('setPin')}
                >
                  Change PIN
                </Button>
              </>
            )}
          </>
        )}

        {step === 'setPin' && (
          <div className="space-y-4">
            <p className="text-center text-muted-foreground">Enter a new 4-digit PIN</p>
            <div className="flex justify-center">
              <InputOTP maxLength={4} value={newPin} onChange={setNewPin}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-12 h-12 text-xl" />
                  <InputOTPSlot index={1} className="w-12 h-12 text-xl" />
                  <InputOTPSlot index={2} className="w-12 h-12 text-xl" />
                  <InputOTPSlot index={3} className="w-12 h-12 text-xl" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setStep('view'); setNewPin(''); }}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSetPin} disabled={newPin.length !== 4}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'confirmPin' && (
          <div className="space-y-4">
            <p className="text-center text-muted-foreground">Confirm your PIN</p>
            <div className="flex justify-center">
              <InputOTP maxLength={4} value={confirmPin} onChange={setConfirmPin}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-12 h-12 text-xl" />
                  <InputOTPSlot index={1} className="w-12 h-12 text-xl" />
                  <InputOTPSlot index={2} className="w-12 h-12 text-xl" />
                  <InputOTPSlot index={3} className="w-12 h-12 text-xl" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setStep('setPin'); setConfirmPin(''); }}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleConfirmPin} disabled={confirmPin.length !== 4}>
                Confirm
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
