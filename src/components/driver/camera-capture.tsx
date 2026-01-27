'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, Check, X } from 'lucide-react';
import Image from 'next/image';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error('Gagal mengakses kamera:', err);
      alert('Gagal mengakses kamera. Pastikan izin kamera telah diberikan.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        // High compression as per plan
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleSave = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const handleReset = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <div className="flex flex-col gap-4 border p-4 rounded-lg bg-white shadow-sm">
      <p className="text-sm font-medium text-gray-700">Foto Bukti Pengiriman:</p>
      
      {!isCameraActive && !capturedImage && (
        <Button onClick={startCamera} className="w-full gap-2 h-32 border-2 border-dashed flex flex-col items-center justify-center bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-300">
          <Camera size={32} />
          <span>Ambil Foto</span>
        </Button>
      )}

      {isCameraActive && (
        <div className="relative rounded-md overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-64 object-cover"
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 shadow-lg flex items-center justify-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-500" />
            </button>
          </div>
          <button
            onClick={stopCamera}
            className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {capturedImage && (
        <div className="flex flex-col gap-4">
          <div className="relative h-64 w-full rounded-md overflow-hidden">
            <Image
              src={capturedImage}
              alt="Bukti Pengiriman"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleReset}
            >
              <RefreshCw size={16} />
              Ulangi
            </Button>
            <Button
              className="flex-1 gap-2 bg-sage-600 hover:bg-sage-700"
              onClick={handleSave}
            >
              <Check size={16} />
              Gunakan Foto
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
