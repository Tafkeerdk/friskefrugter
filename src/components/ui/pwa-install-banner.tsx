import React, { useState } from 'react';
import { X, Download, Share, Plus, Smartphone, AlertTriangle, Globe } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PWAInstallBannerProps {
  className?: string;
  onDismiss?: () => void;
  showDismiss?: boolean;
  compact?: boolean;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  className,
  onDismiss,
  showDismiss = true,
  compact = false
}) => {
  const { 
    canInstall, 
    isInstallable, 
    isIOSInstallable, 
    promptInstall, 
    platformInstructions,
    needsManualInstall,
    browserSupported
  } = usePWA();
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleInstall = async () => {
    if (needsManualInstall) {
      // For iOS Safari and other browsers that require manual installation
      setIsExpanded(true);
    } else if (isInstallable) {
      // For browsers that support automatic install prompts
      await promptInstall();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (!canInstall || isDismissed) {
    return null;
  }

  const getButtonText = () => {
    if (needsManualInstall) {
      return isMobile ? "Se Guide" : "Se Installations Guide";
    }
    return isMobile ? "Installér" : "Installér Nu";
  };

  const getButtonIcon = () => {
    if (needsManualInstall) {
      return isIOSInstallable ? Share : AlertTriangle;
    }
    return Download;
  };

  const ButtonIcon = getButtonIcon();

  const renderCompactBanner = () => (
    <div className={cn(
      "flex items-center justify-between border rounded-lg p-3",
      browserSupported 
        ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200" 
        : "bg-gradient-to-r from-orange-50 to-red-50 border-orange-200",
      className
    )}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className={cn(
          "rounded-lg p-1.5 flex-shrink-0",
          browserSupported ? "bg-green-600" : "bg-orange-500"
        )}>
          {browserSupported ? (
            <Smartphone className="h-4 w-4 text-white" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-white" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn(
            "text-sm font-medium truncate",
            browserSupported ? "text-green-800" : "text-orange-800"
          )}>
            {browserSupported ? "Installér Multi Grønt app" : "Browser ikke understøttet"}
          </p>
          <p className={cn(
            "text-xs truncate",
            browserSupported ? "text-green-600" : "text-orange-600"
          )}>
            {browserSupported 
              ? (needsManualInstall ? "Manuel installation påkrævet" : "Hurtigere adgang og bedre oplevelse")
              : "Åbn i Safari eller Chrome for installation"
            }
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          size="sm"
          onClick={handleInstall}
          className={cn(
            "h-8 px-3 text-xs",
            browserSupported 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "bg-orange-500 hover:bg-orange-600 text-white"
          )}
        >
          <ButtonIcon className="h-3 w-3 mr-1" />
          {getButtonText()}
        </Button>
        {showDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className={cn(
              "h-8 w-8 p-0",
              browserSupported 
                ? "text-green-600 hover:bg-green-100" 
                : "text-orange-600 hover:bg-orange-100"
            )}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );

  const renderFullBanner = () => (
    <Card className={cn(
      "border",
      browserSupported 
        ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200" 
        : "bg-gradient-to-br from-orange-50 to-red-50 border-orange-200",
      className
    )}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "rounded-xl p-3",
              browserSupported ? "bg-green-600" : "bg-orange-500"
            )}>
              {browserSupported ? (
                <Smartphone className="h-6 w-6 text-white" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h3 className={cn(
                "font-semibold text-lg",
                browserSupported ? "text-green-800" : "text-orange-800"
              )}>
                {browserSupported ? "Installér Multi Grønt App" : "Browser Begrænsning"}
              </h3>
              <p className={cn(
                "text-sm",
                browserSupported ? "text-green-600" : "text-orange-600"
              )}>
                {browserSupported 
                  ? (needsManualInstall 
                      ? "Manuel installation påkrævet på denne platform" 
                      : "Få hurtigere adgang og en bedre mobil oplevelse")
                  : "PWA installation er ikke tilgængelig i denne browser"
                }
              </p>
            </div>
          </div>
          {showDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className={cn(
                browserSupported 
                  ? "text-green-600 hover:bg-green-100" 
                  : "text-orange-600 hover:bg-orange-100"
              )}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {browserSupported && (
            <div className="flex flex-wrap gap-2">
              <div className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                browserSupported ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
              )}>
                <Download className="h-3 w-3 mr-1" />
                Offline adgang
              </div>
              <div className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                browserSupported ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
              )}>
                <Plus className="h-3 w-3 mr-1" />
                Hjemmeskærm genvej
              </div>
              <div className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                browserSupported ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
              )}>
                <Share className="h-3 w-3 mr-1" />
                App-lignende oplevelse
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            {browserSupported ? (
              <Button
                onClick={handleInstall}
                className={cn(
                  "flex-1 sm:flex-none",
                  needsManualInstall 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "bg-green-600 hover:bg-green-700 text-white"
                )}
              >
                <ButtonIcon className="h-4 w-4 mr-2" />
                {getButtonText()}
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => window.open('https://www.google.com/chrome/', '_blank')}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Chrome
                </Button>
                {/iPad|iPhone|iPod/.test(navigator.userAgent) && (
                  <Button
                    onClick={() => {
                      // Open current page in Safari on iOS
                      const url = window.location.href;
                      window.open(url.replace(/^https?:\/\//, 'x-safari-https://'), '_blank');
                    }}
                    variant="outline"
                    className="flex-1 sm:flex-none border-orange-200 text-orange-700 hover:bg-orange-50"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Åbn i Safari
                  </Button>
                )}
              </div>
            )}
            
            {browserSupported && (needsManualInstall || isExpanded) && (
              <Button
                variant="outline"
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                  browserSupported 
                    ? "border-green-200 text-green-700 hover:bg-green-50" 
                    : "border-orange-200 text-orange-700 hover:bg-orange-50"
                )}
              >
                {isExpanded ? 'Skjul' : 'Vis'} Instruktioner
              </Button>
            )}
          </div>

          {(isExpanded || needsManualInstall) && browserSupported && (
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">
                Sådan installerer du på {platformInstructions.platform}:
              </h4>
              <ol className="space-y-2 text-sm text-green-700">
                {platformInstructions.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2">
                    {step.startsWith('⚠️') ? (
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                        {step.match(/^\d+/) ? step.match(/^\d+/)[0] : index + 1}
                      </span>
                    )}
                    <span className={step.startsWith('⚠️') ? 'text-orange-700 font-medium' : ''}>{step}</span>
                  </li>
                ))}
              </ol>
              
              {needsManualInstall && (
                <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs text-blue-700">
                    💡 <strong>Tip:</strong> Efter installation vil appen åbne som en selvstændig app uden browser-interface.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return compact ? renderCompactBanner() : renderFullBanner();
};

export default PWAInstallBanner;