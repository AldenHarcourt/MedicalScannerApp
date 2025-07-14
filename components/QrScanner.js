'use client';

import { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export default function QrScanner({ onResult, isScanning }) {
  const html5QrRef = useRef(null);

  useEffect(() => {
    if (isScanning && !html5QrRef.current) {
      const config = {
        fps: 10,
        aspectRatio: 1.0,
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5Qrcode.SCAN_TYPE_CAMERA],
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.PDF_417
        ]
      };

      html5QrRef.current = new Html5Qrcode("qr-reader");
      Html5Qrcode.getCameras().then(cameras => {
        if (cameras && cameras.length) {
          html5QrRef.current.start(
            { facingMode: "environment" },
            config,
            (decodedText, decodedResult) => {
              if (onResult) onResult({ text: decodedText, result: decodedResult });
            }
          );
        }
      }).catch(err => {
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