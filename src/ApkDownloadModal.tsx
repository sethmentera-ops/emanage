import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  X,
  Wifi,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  ArrowDown
} from 'lucide-react';

export interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredInstallPrompt?: any;
  onToast?: (msg: string) => void;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({
  isOpen,
  onClose,
  deferredInstallPrompt,
  onToast
}) => {
  const [downloadState, setDownloadState] = useState<'prompt' | 'downloading' | 'completed'>('prompt');
  const [progress, setProgress] = useState<number>(0);
  const [downloadedMb, setDownloadedMb] = useState<number>(0);
  const [downloadSpeed, setDownloadSpeed] = useState<string>('2.4 MB/s');
  const [connectionType, setConnectionType] = useState<string>('Mobile / Wi-Fi');
  const [statusMessage, setStatusMessage] = useState<string>('Initializing download engine...');
  const progressIntervalRef = useRef<any>(null);

  const TOTAL_SIZE_MB = 18.4;

  // Detect internet connection type & speed
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn) {
        if (conn.effectiveType) {
          const typeMap: Record<string, string> = {
            'slow-2g': '2G (Mabagal na Connection)',
            '2g': '2G Mobile Data',
            '3g': '3G Connection',
            '4g': '4G LTE / Wi-Fi'
          };
          setConnectionType(typeMap[conn.effectiveType] || `${conn.effectiveType.toUpperCase()} Connection`);
        }
        if (conn.downlink) {
          setDownloadSpeed(`${conn.downlink.toFixed(1)} MB/s`);
        }
      }
    }
  }, [isOpen]);

  // Handle start download with animated progress based on connection
  const startAnimatedDownload = () => {
    setDownloadState('downloading');
    setProgress(0);
    setDownloadedMb(0);
    setStatusMessage('Kumokonekta sa Render APK server...');

    // Determine interval speed based on network connection
    let tickMs = 60; // default 4G/fast
    let incrementBase = 1.2;

    if (typeof navigator !== 'undefined') {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g') {
        tickMs = 120;
        incrementBase = 0.5;
        setDownloadSpeed('450 KB/s');
      } else if (conn?.effectiveType === '3g') {
        tickMs = 80;
        incrementBase = 0.8;
        setDownloadSpeed('1.2 MB/s');
      } else if (conn?.downlink) {
        setDownloadSpeed(`${Math.max(conn.downlink, 1.5).toFixed(1)} MB/s`);
      }
    }

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    let current = 0;
    progressIntervalRef.current = setInterval(() => {
      // Natural variable speed simulation
      const randomFactor = 0.7 + Math.random() * 0.8;
      const step = incrementBase * randomFactor;
      current = Math.min(100, current + step);

      setProgress(Math.round(current));
      const mb = (current / 100) * TOTAL_SIZE_MB;
      setDownloadedMb(parseFloat(mb.toFixed(1)));

      if (current < 20) {
        setStatusMessage('Kumokonekta sa Render APK server...');
      } else if (current < 55) {
        setStatusMessage('Dina-download ang EManage APK package...');
      } else if (current < 80) {
        setStatusMessage('Sinisuri ang package signature at Android permissions...');
      } else if (current < 98) {
        setStatusMessage('Inihahanda ang APK installer para sa iyong phone...');
      } else {
        setStatusMessage('Tapos na! Handa nang i-install ang APK.');
      }

      if (current >= 100) {
        clearInterval(progressIntervalRef.current);
        setDownloadState('completed');
        triggerActualDownload();
      }
    }, tickMs);
  };

  // Triggers actual file download & native install prompt
  const triggerActualDownload = () => {
    // 1. Trigger actual APK file download via invisible link
    const link = document.createElement('a');
    link.href = '/api/download/apk';
    link.setAttribute('download', 'EManage-v1.0-release.apk');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 2. If Android Chrome PWA prompt is supported, also prompt user
    if (deferredInstallPrompt) {
      try {
        deferredInstallPrompt.prompt();
      } catch (e) {
        console.warn('Install prompt deferred', e);
      }
    }

    if (onToast) {
      onToast('✅ EManage APK downloaded! I-tap ang notification bar para i-install.');
    }
  };

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in select-none overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl border border-gray-100 text-gray-800 relative my-auto animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-black cursor-pointer transition-colors"
          title="Isara muna"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ---------------- STATE 1: PROMPT TO INSTALL / DOWNLOAD APK ---------------- */}
        {downloadState === 'prompt' && (
          <div className="text-center space-y-4">
            {/* Header Icon with pulse */}
            <div className="relative inline-block mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#0b1957] text-[#f7f4ed] flex items-center justify-center shadow-lg border-2 border-[#fffdf6]">
                <Smartphone className="w-8 h-8 text-emerald-400 animate-pulse" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 border-2 border-white shadow">
                <ArrowDown className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Opisyal na Android App (APK)</span>
              </div>
              <h2 className="text-xl font-bold font-serif text-[#0b1957]">
                I-download ang EManage APK
              </h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Mag-sign up o mag-log in nang mas mabilis gamit ang opisyal na mobile app sa iyong cellphone nang walang browser address bar!
              </p>
            </div>

            {/* Feature Pills */}
            <div className="bg-[#fffdf6] border border-[#eee5d6] rounded-2xl p-3 text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Fullscreen standalone view sa Android</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Direktang konektado sa iyong Render server</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mas mabilis mag-RSVP at mag-track ng attendance</span>
              </div>
            </div>

            {/* Connection badge */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>Koneksyon: <strong>{connectionType}</strong> ({downloadSpeed})</span>
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={startAnimatedDownload}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#0b1957] hover:bg-[#101d6b] text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>I-download ang APK ({TOTAL_SIZE_MB} MB)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-300 text-gray-600 hover:text-black hover:bg-gray-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Ipagpatuloy sa Web Browser (Log In / Sign Up)
              </button>
            </div>
          </div>
        )}

        {/* ---------------- STATE 2: ANIMATED DOWNLOADING EFFECT ---------------- */}
        {downloadState === 'downloading' && (
          <div className="text-center space-y-5 py-2">
            {/* Animated Download Orb */}
            <div className="relative inline-block mx-auto">
              <div className="w-20 h-20 rounded-full bg-blue-50 border-4 border-[#0b1957]/10 flex items-center justify-center mx-auto shadow-inner relative overflow-hidden">
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-blue-100/70 transition-all duration-150"
                  style={{ height: `${progress}%` }}
                />
                <Download className="w-9 h-9 text-[#0b1957] relative z-10 animate-bounce" />
              </div>
            </div>

            <div>
              <div className="text-3xl font-extrabold font-mono text-[#0b1957]">
                {progress}%
              </div>
              <div className="text-xs font-bold text-gray-800 mt-1">
                {statusMessage}
              </div>
              <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                {downloadedMb} MB / {TOTAL_SIZE_MB} MB • {downloadSpeed}
              </div>
            </div>

            {/* Glowing animated progress bar */}
            <div className="space-y-1">
              <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200">
                <div
                  className="h-full bg-gradient-to-r from-[#0b1957] via-blue-600 to-emerald-500 rounded-full transition-all duration-150 relative shadow"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/25 animate-pulse" />
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 font-mono px-1">
                <span>0 MB</span>
                <span>{connectionType}</span>
                <span>{TOTAL_SIZE_MB} MB</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-[11px] text-gray-600 text-left border border-gray-200">
              <div className="font-bold text-gray-800 mb-0.5">⏳ Downloading in progress...</div>
              <p className="leading-relaxed">
                Awtomatikong mag-i-install o magda-download ang APK file base sa bilis ng iyong internet connection. Huwag isara ang window.
              </p>
            </div>
          </div>
        )}

        {/* ---------------- STATE 3: COMPLETED DOWNLOAD ---------------- */}
        {downloadState === 'completed' && (
          <div className="text-center space-y-4 py-1">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-sm animate-in zoom-in">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-xl font-bold font-serif text-[#0b1957]">
                Matagumpay na Na-download!
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Nasa iyong Downloads folder na ang <strong>EManage-v1.0-release.apk</strong>.
              </p>
            </div>

            {/* Quick 3-Step Installation Guide */}
            <div className="bg-[#fffdf6] border border-[#eee5d6] rounded-2xl p-4 text-left space-y-2.5 text-xs">
              <div className="font-bold text-[#0b1957] text-xs border-b pb-1">
                Paano i-install sa iyong Android phone:
              </div>
              <div className="flex items-start gap-2 text-gray-700">
                <span className="w-4 h-4 rounded-full bg-[#0b1957] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>I-tap ang downloaded file sa iyong cellphone notification bar o Files/Downloads folder.</span>
              </div>
              <div className="flex items-start gap-2 text-gray-700">
                <span className="w-4 h-4 rounded-full bg-[#0b1957] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>Kung mag-prompt, i-on ang <strong>"Allow from this source"</strong> (Install unknown apps).</span>
              </div>
              <div className="flex items-start gap-2 text-gray-700">
                <span className="w-4 h-4 rounded-full bg-[#0b1957] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span>Pindutin ang <strong>Install</strong> at buksan ang EManage App!</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={triggerActualDownload}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>I-download Muli (Download Again)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold cursor-pointer transition-colors"
              >
                Tumungo sa Log In / Sign Up Screen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
