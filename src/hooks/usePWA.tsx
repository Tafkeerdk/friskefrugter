import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWA() {
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isIOSInstallable, setIsIOSInstallable] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installPromptOutcome, setInstallPromptOutcome] = useState<string | null>(null);

  useEffect(() => {
    // Check if running in standalone mode (PWA installed)
    const checkIfInstalled = () => {
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://');
      
      setIsInstalled(isStandalone);
    };

    // Check if running on iOS Safari and not installed
    const checkIOSInstallable = () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isStandalone = (window.navigator as any).standalone;
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      const isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
      
      // iOS can only install PWA through Safari, not other browsers
      const canInstallOnIOS = isIOS && isSafari && !isStandalone && !isFirefox && !isChrome;
      
      setIsIOSInstallable(canInstallOnIOS);
    };

    // Check on mount
    checkIfInstalled();
    checkIOSInstallable();

    // Listen for install prompt (NOT available on iOS)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setIsIOSInstallable(false);
      setDeferredPrompt(null);
      setInstallPromptOutcome('installed');
    };

    // Add event listeners (beforeinstallprompt is NOT supported on iOS)
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      setIsInstalled(mediaQuery.matches);
    };
    
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    // Check for iOS home screen icon changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkIfInstalled();
        checkIOSInstallable();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const promptInstall = async () => {
    // iOS Safari does NOT support programmatic install prompts
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      // Cannot programmatically install on iOS - user must do it manually
      console.log('iOS detected: Manual installation required via Share → Add to Home Screen');
      return false;
    }

    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      setInstallPromptOutcome(outcome);
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error prompting install:', error);
      return false;
    }
  };

  const getInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

    if (isIOS && isSafari) {
      return {
        platform: 'iOS Safari',
        canAutoInstall: false,
        steps: [
          '1. Tryk på del-knappen (📤) nederst på skærmen',
          '2. Scroll ned og find "Føj til hjemmeskærm"',
          '3. Tryk "Føj til hjemmeskærm"',
          '4. Tryk "Tilføj" for at installere appen'
        ]
      };
    } else if (isIOS && (isFirefox || isChrome)) {
      return {
        platform: 'iOS (Ikke Safari)',
        canAutoInstall: false,
        steps: [
          '⚠️ PWA kan kun installeres via Safari på iOS',
          '1. Åbn denne side i Safari browser',
          '2. Tryk på del-knappen (📤)',
          '3. Vælg "Føj til hjemmeskærm"'
        ]
      };
    } else if (isAndroid && isChrome) {
      return {
        platform: 'Android Chrome',
        canAutoInstall: true,
        steps: [
          '1. Tryk på menu-knappen (⋮)',
          '2. Tryk "Installér app" eller "Tilføj til hjemmeskærm"',
          '3. Tryk "Installér" for at installere appen'
        ]
      };
    } else if (isChrome && !isAndroid) {
      return {
        platform: 'Chrome Desktop',
        canAutoInstall: true,
        steps: [
          '1. Klik på installér-ikonet (⬇️) i adresselinjen',
          '2. Eller tryk Ctrl+Shift+A (Windows) / Cmd+Shift+A (Mac)',
          '3. Klik "Installér" for at installere appen'
        ]
      };
    }

    return {
      platform: 'Anden Browser',
      canAutoInstall: false,
      steps: [
        '⚠️ PWA installation er begrænset i denne browser',
        'Prøv at åbne siden i Chrome eller Safari',
        'Eller kig efter en "Installér app" knap i browser-menuen'
      ]
    };
  };

  const canInstall = isInstallable || isIOSInstallable;
  const instructions = getInstallInstructions();

  return {
    isInstalled,
    isInstallable,
    isIOSInstallable,
    canInstall,
    promptInstall,
    installPromptOutcome,
    getInstallInstructions,
    // Additional PWA info
    isPWASupported: 'serviceWorker' in navigator && 'PushManager' in window,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    isFullscreen: window.matchMedia('(display-mode: fullscreen)').matches,
    // New properties for better iOS handling
    needsManualInstall: instructions.canAutoInstall === false,
    browserSupported: !instructions.platform.includes('⚠️'),
    platformInstructions: instructions,
  };
}