'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, ScanLine, Zap, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeDetected: (barcode: string) => void;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onBarcodeDetected,
}: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  // Sample pharma barcodes for fast testing on developer/counter machines
  const quickTestBarcodes = [
    { code: '8901234567890', label: 'Dolo 650 Strip (EAN-13)' },
    { code: '8901234567891', label: 'Calpol 650 Strip' },
    { code: '8901234567892', label: 'Azithral 500 (Rx H1)' },
    { code: '8901234567893', label: 'Nitrile Gloves Box' },
    { code: '8901234567894', label: 'Dettol 500ml Bottle' },
  ];

  // Try initializing camera on physical devices
  useEffect(() => {
    if (!isOpen) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      setCameraActive(false);
      setScannedCode(null);
      return;
    }

    let stream: MediaStream | null = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
            setCameraActive(true);
          }
        })
        .catch((err) => {
          // Camera permission denied or device has no camera (e.g. desktop)
          console.warn('Camera stream unavailable, falling back to barcode emulator:', err);
          setCameraActive(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectBarcode = (code: string) => {
    setScannedCode(code);
    setTimeout(() => {
      onBarcodeDetected(code);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#12181F] border border-[#1E2631] rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2631]">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-[#00D2C4]/15 border border-[#00D2C4]/30 flex items-center justify-center text-[#00D2C4]">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Barcode Scanner HUD</h3>
              <p className="text-[11px] text-slate-400 font-mono">EAN-13 • GS1 DataBar • 1D/2D</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E2631] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport View */}
        <div className="mt-4 relative bg-[#090D11] border border-[#1E2631] rounded-xl h-56 flex flex-col items-center justify-center overflow-hidden">
          {cameraActive ? (
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center text-center p-4 space-y-2 text-slate-400">
              <Camera className="w-10 h-10 text-slate-600 animate-pulse" />
              <p className="text-xs font-mono">
                Point camera at retail medicine box or tap quick-scan below
              </p>
            </div>
          )}

          {/* Scanner Reticle Overlay */}
          <div className="absolute inset-x-12 inset-y-8 border-2 border-dashed border-[#00D2C4]/60 rounded-xl flex items-center justify-center pointer-events-none">
            {/* Animated Laser Scanning Line */}
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#00D2C4] to-transparent shadow-[0_0_8px_#00D2C4] animate-bounce" />
          </div>

          {scannedCode && (
            <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex items-center justify-center space-x-2 text-emerald-400 font-mono font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Scanned: {scannedCode}</span>
            </div>
          )}
        </div>

        {/* Quick Test Barcode Pills */}
        <div className="mt-4 pt-3 border-t border-[#1E2631]">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold block mb-2">
            Counter Quick-Scan (1-Tap Simulation):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickTestBarcodes.map((item) => (
              <button
                key={item.code}
                onClick={() => handleSelectBarcode(item.code)}
                className="flex items-center justify-between p-2 rounded-lg bg-[#090D11] hover:bg-[#1E2631] border border-[#1E2631] hover:border-[#00D2C4]/50 transition-all text-left text-xs font-mono cursor-pointer active:scale-95"
              >
                <div>
                  <span className="text-slate-200 font-bold block">{item.label}</span>
                  <span className="text-[10px] text-[#00D2C4]">{item.code}</span>
                </div>
                <Zap className="w-3.5 h-3.5 text-slate-500 hover:text-[#00D2C4]" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
