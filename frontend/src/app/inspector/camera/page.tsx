'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api-client';
import {
  Camera,
  X,
  Zap,
  ZapOff,
  RotateCcw,
  ScanLine,
  Upload,
  CheckCircle,
  AlertCircle,
  Crosshair,
  Maximize2,
  Loader2,
  ImageIcon,
} from 'lucide-react';

type CameraState = 'requesting' | 'active' | 'denied' | 'captured' | 'uploading' | 'error';

export default function InspectorCameraPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>('requesting');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [errorMessage, setErrorMessage] = useState('');

  const startCamera = useCallback(async () => {
    setCameraState('requesting');
    setCapturedImage(null);

    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 4 / 3 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check if torch/flashlight is supported
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
      if (capabilities && capabilities.torch) {
        setTorchSupported(true);
      } else {
        setTorchSupported(false);
      }

      setCameraState('active');
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setCameraState('denied');
          setErrorMessage('Camera access was denied. Please grant camera permission in your browser settings and reload.');
        } else if (err.name === 'NotFoundError') {
          setCameraState('error');
          setErrorMessage('No camera found on this device.');
        } else if (err.name === 'NotReadableError') {
          setCameraState('error');
          setErrorMessage('Camera is already in use by another application.');
        } else {
          setCameraState('error');
          setErrorMessage(`Camera error: ${err.message}`);
        }
      } else {
        setCameraState('error');
        setErrorMessage('An unexpected error occurred while accessing the camera.');
      }
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchOn } as MediaTrackConstraintSet & { torch: boolean }],
      });
      setTorchOn(!torchOn);
    } catch {
      // Torch not supported on this device/browser
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    setCameraState('captured');

    // Stop the camera stream after capture
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedImage(event.target.result as string);
          setCameraState('captured');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const handleUpload = async () => {
    if (!capturedImage) return;
    setCameraState('uploading');
    try {
      const blob = dataURLtoBlob(capturedImage);
      const record = await ApiClient.quickScan({
        file: blob,
        productName: 'Field Inspection Commodity',
        brand: 'Retail Inspection Sample',
        declaredMrp: 120.0,
        scanSource: 'field_inspector',
      });
      router.push(`/scan/${record.id}`);
    } catch (e) {
      console.warn('Upload fallback, navigating to scans:', e);
      router.push('/inspector/scans');
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <Link
          href="/inspector/scans"
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all active:scale-90 hover:bg-white/20"
        >
          <X className="w-5 h-5" />
        </Link>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white text-xs font-bold tracking-widest uppercase">
            Inspector Scanner
          </span>
        </div>

        <div className="flex items-center gap-2">
          {torchSupported && cameraState === 'active' && (
            <button
              onClick={toggleTorch}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                torchOn
                  ? 'bg-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.5)]'
                  : 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20'
              }`}
            >
              {torchOn ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Camera View / States */}
      <div className="flex-1 relative overflow-hidden">
        {/* Requesting Permission */}
        {cameraState === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-4 bg-zinc-950">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] animate-pulse">
              <Camera className="w-10 h-10" />
            </div>
            <div className="text-center space-y-2 px-8">
              <p className="text-lg font-bold">Camera Access Required</p>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Please allow camera access to scan product packaging for compliance inspection.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="text-xs text-zinc-500">Waiting for permission...</span>
            </div>
          </div>
        )}

        {/* Permission Denied or Insecure HTTP Origin */}
        {(cameraState === 'denied' || cameraState === 'error') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-4 bg-zinc-950 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
              <Camera className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2 max-w-sm">
              <p className="text-xl font-bold">Snap Photo with Camera</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Live browser video stream requires HTTPS. Over local Wi-Fi HTTP, tap below to open your phone&apos;s camera directly!
              </p>
            </div>

            <label className="mt-4 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-bold flex items-center gap-2.5 shadow-[0_0_25px_rgba(16,185,129,0.4)] cursor-pointer hover:scale-105 active:scale-95 transition-all">
              <Camera className="w-5 h-5" />
              <span>Open Phone Camera / Select Photo</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>

            <button
              onClick={startCamera}
              className="mt-2 text-xs text-zinc-500 underline hover:text-zinc-300"
            >
              Try live video stream again
            </button>
          </div>
        )}

        {/* Live Camera Feed */}
        {(cameraState === 'active' || cameraState === 'requesting') && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Scanner Overlay */}
            {cameraState === 'active' && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Dark vignette edges */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

                {/* Scanner frame - centered */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-[75%] max-w-[320px] aspect-[3/4]">
                    {/* Corner brackets */}
                    {/* Top-left */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl-lg" />
                    {/* Top-right */}
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr-lg" />
                    {/* Bottom-left */}
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl-lg" />
                    {/* Bottom-right */}
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br-lg" />

                    {/* Scanning line animation */}
                    <div className="absolute left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80 animate-[scan_2.5s_ease-in-out_infinite]" />

                    {/* Center crosshair */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <Crosshair className="w-6 h-6 text-white/40" />
                    </div>

                    {/* Instruction text */}
                    <div className="absolute -bottom-10 left-0 right-0 text-center">
                      <p className="text-white/80 text-xs font-medium tracking-wide bg-black/50 backdrop-blur-sm rounded-full px-4 py-1.5 inline-block">
                        Align product label within frame
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Captured Image Preview */}
        {cameraState === 'captured' && capturedImage && (
          <div className="absolute inset-0 bg-black">
            <img
              src={capturedImage}
              alt="Captured packaging"
              className="w-full h-full object-contain"
            />
            {/* Success badge */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-emerald-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-bold tracking-wide">Photo Captured</span>
            </div>
          </div>
        )}

        {/* Uploading State */}
        {cameraState === 'uploading' && capturedImage && (
          <div className="absolute inset-0 bg-black">
            <img
              src={capturedImage}
              alt="Uploading..."
              className="w-full h-full object-contain opacity-50"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-full border-[3px] border-emerald-400 border-t-transparent animate-spin" />
              <p className="text-white text-sm font-bold">Sending to Server...</p>
              <p className="text-zinc-400 text-xs">The backend will process the scan</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="relative z-10 bg-gradient-to-t from-black/90 to-transparent pt-6 pb-8 px-6">
        {cameraState === 'active' && (
          <div className="flex items-center justify-between">
            {/* Native Mobile Gallery / Camera Fallback */}
            <label className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90 cursor-pointer" title="Upload from Device">
              <ImageIcon className="w-5 h-5" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>

            {/* Capture Button */}
            <button
              onClick={capturePhoto}
              className="w-[72px] h-[72px] rounded-full bg-white border-[4px] border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center transition-all active:scale-90 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]"
            >
              <div className="w-[60px] h-[60px] rounded-full bg-white hover:bg-zinc-100 transition-colors flex items-center justify-center">
                <ScanLine className="w-6 h-6 text-zinc-800" />
              </div>
            </button>

            {/* Switch Camera */}
            <button
              onClick={switchCamera}
              className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        )}

        {cameraState === 'captured' && (
          <div className="flex items-center gap-3">
            <button
              onClick={retake}
              className="flex-1 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-white/20 transition-all active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4" />
              Retake
            </button>
            <button
              onClick={handleUpload}
              className="flex-[2] py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all active:scale-[0.98]"
            >
              <Upload className="w-4 h-4" />
              Send for Analysis
            </button>
          </div>
        )}

        {(cameraState === 'denied' || cameraState === 'error') && (
          <div className="text-center">
            <Link
              href="/inspector/scans"
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-medium transition-colors"
            >
              ← Back to Inspections
            </Link>
          </div>
        )}
      </div>

      {/* Custom scanning line animation */}
      <style jsx>{`
        @keyframes scan {
          0%, 100% {
            top: 8%;
          }
          50% {
            top: 88%;
          }
        }
      `}</style>
    </div>
  );
}
