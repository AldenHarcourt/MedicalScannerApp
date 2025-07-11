'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QrScanner({ onResult, isScanning }) {
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  useEffect(() => {
    if (isScanning && !html5QrcodeScannerRef.current) {
      try {
        html5QrcodeScannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          false
        );

        html5QrcodeScannerRef.current.render((decodedText, decodedResult) => {
          if (onResult) {
            onResult({ text: decodedText, result: decodedResult });
          }
        }, (errorMessage) => {
          // Ignore errors during scanning
          console.log(errorMessage);
        });

        scannerRef.current = html5QrcodeScannerRef.current;
      } catch (error) {
        console.error('Scanner initialization error:', error);
        setError('Failed to initialize camera scanner');
      }
    }

    return () => {
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear();
        html5QrcodeScannerRef.current = null;
      }
    };
  }, [isScanning, onResult]);

  if (!isScanning) {
    return (
      <div className="w-full h-full bg-black rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-secondary mb-4">📱</div>
          <p className="text-secondary font-semibold">Press "Start Scanning"</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-black rounded-lg flex items-center justify-center">
        <div className="text-center text-white p-4">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="mb-2">Camera Error</p>
          <p className="text-sm text-gray-400">{error}</p>
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