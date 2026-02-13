import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.morphoscan.pro',
  appName: 'MorphoScan Pro',
  webDir: 'dist',
  bundledWebRuntime: false,
  // Development server configuration (only in development mode)
  // WARNING: cleartext HTTP is ONLY enabled in development with explicit flag.
  // Never enable in production builds. This is a security risk.
  ...(function() {
    const isDev = process.env.NODE_ENV === 'development';
    const serverUrl = process.env.CAPACITOR_SERVER_URL;
    const allowCleartext = process.env.ALLOW_CLEARTEXT === 'true';
    
    if (!serverUrl) return {};
    
    // Production: Force HTTPS, never allow cleartext
    if (!isDev) {
      const httpsUrl = serverUrl.startsWith('https://') 
        ? serverUrl 
        : serverUrl.replace('http://', 'https://');
      console.warn('⚠️  Production build: Forcing HTTPS for Capacitor server URL');
      return {
        server: {
          url: httpsUrl,
          cleartext: false // Never allow cleartext in production
        }
      };
    }
    
    // Development: Only allow cleartext with explicit flag and HTTP URL
    if (isDev && allowCleartext && serverUrl.startsWith('http://')) {
      console.warn('⚠️  Development mode: Cleartext HTTP enabled (ALLOW_CLEARTEXT=true)');
      return {
        server: {
          url: serverUrl,
          cleartext: true
        }
      };
    }
    
    // Development with HTTPS or no cleartext flag: Use HTTPS
    if (isDev && serverUrl) {
      return {
        server: {
          url: serverUrl.startsWith('https://') ? serverUrl : serverUrl.replace('http://', 'https://'),
          cleartext: false
        }
      };
    }
    
    return {};
  })(),
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: true,
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0a0a',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#8B5CF6'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0a0a'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#8B5CF6',
      sound: 'default'
    }
  }
};

export default config;
