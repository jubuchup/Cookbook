import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { haptics } from '../hooks/useHaptics';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    haptics.tap();
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      <div className="md:hidden mx-4 mb-3 p-3 bg-gradient-to-r from-neutral-900 to-neutral-800 dark:from-[#1C1C1E] dark:to-neutral-900 text-white rounded-2xl flex items-center justify-between shadow-sm border border-neutral-700/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#1E3A8A] flex items-center justify-center shrink-0">
            <Download className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-xs font-bold block">Install on Home Screen</span>
            <span className="text-[10px] text-neutral-300 block">Get full-screen native iPhone experience</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-bold active:scale-95 transition shadow-xs"
          >
            {isIOS ? 'Install' : 'Install'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-neutral-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* iOS Safari Guided Install Sheet */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-center space-y-4">
            <div className="w-12 h-12 bg-[#1E3A8A]/10 text-[#1E3A8A] rounded-2xl mx-auto flex items-center justify-center">
              <Share className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#1C1C1E] dark:text-white">
                Add to iPhone Home Screen
              </h3>
              <p className="mt-2 text-xs text-[#8E8E93] dark:text-neutral-400 leading-relaxed text-left">
                1. Tap the <strong>Share</strong> icon in Safari's toolbar at the bottom of your screen.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
                3. Tap <strong>Add</strong> in the top-right corner.
              </p>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full rounded-2xl bg-neutral-100 py-3 text-xs font-bold text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
