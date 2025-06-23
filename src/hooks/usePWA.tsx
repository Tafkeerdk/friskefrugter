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
      
      setIsIOSInstallable(isIOS && isSafari && !isStandalone);
    };

    // Check on mount
    checkIfInstalled();
    checkIOSInstallable();

    // Listen for install prompt
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

    // Add event listeners
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

    if (isIOS && isSafari) {
      return {
        platform: 'iOS Safari',
        steps: [
          'Tryk på del-knappen (firkant med pil op)',
          'Scroll ned og tryk "Føj til hjemmeskærm"',
          'Tryk "Tilføj" for at installere appen'
        ]
      };
    } else if (isAndroid && isChrome) {
      return {
        platform: 'Android Chrome',
        steps: [
          'Tryk på menu-knappen (tre prikker)',
          'Tryk "Tilføj til hjemmeskærm"',
          'Tryk "Installér" for at installere appen'
        ]
      };
    } else if (isChrome) {
      return {
        platform: 'Chrome Desktop',
        steps: [
          'Klik på installér-ikonet i adresselinjen',
          'Eller tryk Ctrl+Shift+A (Windows) / Cmd+Shift+A (Mac)',
          'Klik "Installér" for at installere appen'
        ]
      };
    }

    return {
      platform: 'Browser',
      steps: [
        'Kig efter en "Installér app" knap i din browser',
        'Eller check browser-menuen for installationsmuligheder'
      ]
    };
  };

  const canInstall = isInstallable || isIOSInstallable;

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
  };
}