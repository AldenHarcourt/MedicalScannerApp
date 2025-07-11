'use client';

import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QrScanner({ onResult, isScanning }) {
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  useEffect(() => {
    if (isScanning && !html5QrRef.current) {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5Qrcode.SCAN_TYPE_CAMERA]
      };

      html5QrRef.current = new Html5Qrcode("qr-reader");
      Html5Qrcode.getCameras().then(cameras => {
        if (cameras && cameras.length) {
          html5QrRef.current.start(
            { facingMode: "environment" }, // Use back camera if available
            config,
            (decodedText, decodedResult) => {
              if (onResult) onResult({ text: decodedText, result: decodedResult });
            }
          );
        }
      }).catch(err => {
        // Handle camera errors
        console.error("Camera error:", err);
      });
    }

    return () => {
      if (html5QrRef.current) {
        html5QrRef.current.stop().then(() => {
          html5QrRef.current.clear();
          html5QrRef.current = null;
        });
      }
    };
  }, [isScanning, onResult]);

  if (!isScanning) {
    return (
      <div className="w-full h-full bg-black rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-secondary mb-4">📱</div>
          <p className="text-secondary font-semibold">Press &quot;Start Scanning&quot;</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div id="qr-reader" className="w-full h-full"></div>
    </div>
  );
} 