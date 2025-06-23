import React, { useState } from 'react';
import { X, Download, Share, Plus, Smartphone } from 'lucide-react';
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
    getInstallInstructions 
  } = usePWA();
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const instructions = getInstallInstructions();

  const handleInstall = async () => {
    if (isInstallable) {
      await promptInstall();
    } else if (isIOSInstallable) {
      setIsExpanded(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (!canInstall || isDismissed) {
    return null;
  }

  const renderCompactBanner = () => (
    <div className={cn(
      "flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3",
      className
    )}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="bg-green-600 rounded-lg p-1.5 flex-shrink-0">
          <Smartphone className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-green-800 truncate">
            Installér Multi Grønt app
          </p>
          <p className="text-xs text-green-600 truncate">
            Hurtigere adgang og bedre oplevelse
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          size="sm"
          onClick={handleInstall}
          className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-xs"
        >
          <Download className="h-3 w-3 mr-1" />
          Installér
        </Button>
        {showDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0 text-green-600 hover:bg-green-100"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );

  const renderFullBanner = () => (
    <Card className={cn(
      "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200",
      className
    )}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 rounded-xl p-3">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800 text-lg">
                Installér Multi Grønt App
              </h3>
              <p className="text-green-600 text-sm">
                Få hurtigere adgang og en bedre mobil oplevelse
              </p>
            </div>
          </div>
          {showDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-green-600 hover:bg-green-100"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <Download className="h-3 w-3 mr-1" />
              Offline adgang
            </div>
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <Plus className="h-3 w-3 mr-1" />
              Hjemmeskærm genvej
            </div>
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <Share className="h-3 w-3 mr-1" />
              App-lignende oplevelse
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleInstall}
              className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
            >
              <Download className="h-4 w-4 mr-2" />
              {isInstallable ? 'Installér Nu' : 'Se Instruktioner'}
            </Button>
            
            {isIOSInstallable && (
              <Button
                variant="outline"
                onClick={() => setIsExpanded(!isExpanded)}
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                {isExpanded ? 'Skjul' : 'Vis'} Instruktioner
              </Button>
            )}
          </div>

          {(isExpanded || isIOSInstallable) && (
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">
                Sådan installerer du på {instructions.platform}:
              </h4>
              <ol className="space-y-1 text-sm text-green-700">
                {instructions.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return compact ? renderCompactBanner() : renderFullBanner();
};

export default PWAInstallBanner;