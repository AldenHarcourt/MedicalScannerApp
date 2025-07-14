'use client';

import { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function QrScanner({ onResult, isScanning }) {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const stopStreamRef = useRef(null);

  useEffect(() => {
    if (isScanning && videoRef.current) {
      codeReaderRef.current = new BrowserMultiFormatReader();
      codeReaderRef.current.decodeFromVideoDevice(
        undefined, // use default camera
        videoRef.current,
        (result, err, controls) => {
          if (result) {
            if (onResult) onResult({ text: result.getText(), result });
            // Optionally stop after first scan:
            // controls.stop();
          }
        }
      ).then(controls => {
        stopStreamRef.current = controls;
      }).catch(err => {
        console.error('Camera error:', err);
      });
    }
    return () => {
      if (stopStreamRef.current) {
        stopStreamRef.current.stop();
        stopStreamRef.current = null;
      }
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        codeReaderRef.current = null;
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
    <div className="w-full h-full flex items-center justify-center">
      <video ref={videoRef} className="w-full h-full object-contain rounded-lg" autoPlay muted playsInline />
    </div>
  );
} 