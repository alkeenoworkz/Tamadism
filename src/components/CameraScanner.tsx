import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Camera,
  RotateCcw,
  Zap,
  ZapOff,
  Upload,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  HelpCircle,
  Maximize2
} from 'lucide-react';
import { AnswerKey, GradeSheetResponse } from '../types';
import { playShutterSound, playGradeSuccessSound } from '../utils/soundEffects';
import { generateSampleSheetImage } from '../utils/sampleData';

interface CameraScannerProps {
  mode: 'student-sheet' | 'answer-key';
  answerKey?: AnswerKey | null;
  onGradedSheet?: (result: GradeSheetResponse, imageSnapshot: string) => void;
  onScannedKey?: (result: any) => void;
  onClose: () => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  mode,
  answerKey,
  onGradedSheet,
  onScannedKey,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [continuousMode, setContinuousMode] = useState(true);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [lastGradedInfo, setLastGradedInfo] = useState<{ name: string; score: number; total: number } | null>(null);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Check for torch capability
      const track = stream.getVideoTracks()[0];
      const capabilities = (track.getCapabilities && track.getCapabilities()) as any;
      if (capabilities && capabilities.torch) {
        setHasTorch(true);
      } else {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in browser permissions or use file upload.'
          : 'Unable to start camera stream. You can still upload photos or test with demo sheets.'
      );
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  // Toggle torch / flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn(!torchOn);
    } catch (e) {
      console.error('Torch not supported', e);
    }
  };

  // Flip camera between environment and user
  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture frame from video stream to base64
  const captureFrame = (): string | null => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.92);
  };

  // Process image via Gemini OCR backend
  const processImage = async (base64Img: string) => {
    setIsProcessing(true);
    setCapturedPreview(base64Img);
    playShutterSound();

    try {
      if (mode === 'answer-key') {
        setProcessingStatus('Analyzing answer key with AI OCR...');
        const res = await fetch('/api/scan-answer-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Img,
            expectedItems: answerKey?.totalItems || 15,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to parse answer key from photo');
        }

        playGradeSuccessSound();
        if (onScannedKey) {
          onScannedKey(data.data);
        }
      } else {
        // Mode: student-sheet
        if (!answerKey || !answerKey.items || answerKey.items.length === 0) {
          throw new Error('Please set up or scan an Answer Key first before grading student sheets.');
        }

        setProcessingStatus('Reading student answers & scoring against key...');
        const res = await fetch('/api/grade-student-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Img,
            answerKey: answerKey,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to grade student sheet');
        }

        playGradeSuccessSound();
        setLastGradedInfo({
          name: data.data.studentName,
          score: data.data.totalScore,
          total: data.data.totalItems,
        });

        if (onGradedSheet) {
          onGradedSheet(data.data, base64Img);
        }

        if (!continuousMode) {
          // If not continuous, pause to let user inspect
          setTimeout(() => {
            setIsProcessing(false);
            setCapturedPreview(null);
          }, 1200);
          return;
        }
      }
    } catch (err: any) {
      alert(`OCR Error: ${err.message || 'Error processing image'}`);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
      if (continuousMode) {
        setCapturedPreview(null);
      }
    }
  };

  const handleCaptureClick = () => {
    const frame = captureFrame();
    if (!frame) {
      alert('Unable to capture camera frame. Ensure camera is active.');
      return;
    }
    processImage(frame);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        processImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Generate test sample sheet on the fly
  const handleTestWithSampleSheet = (type: 'high' | 'mixed' | 'perfect') => {
    if (!answerKey || answerKey.items.length === 0) {
      alert('Please setup an Answer Key first.');
      return;
    }

    const total = answerKey.totalItems;
    let sampleStudentName = 'Julian Reynolds';
    let sampleStudentId = 'STU-1088';

    if (type === 'high') {
      sampleStudentName = 'Maria Santos';
      sampleStudentId = 'STU-1055';
    } else if (type === 'perfect') {
      sampleStudentName = 'Liam Vance';
      sampleStudentId = 'STU-1099';
    }

    const items = answerKey.items.map((keyItem, index) => {
      let ans = keyItem.correctAnswer;
      // Introduce mistakes for realistic grading test
      if (type === 'mixed') {
        if (index % 3 === 0) {
          // Change answer to incorrect letter
          const letters = ['A', 'B', 'C', 'D'].filter((l) => l !== keyItem.correctAnswer);
          ans = letters[0] || 'A';
        }
      } else if (type === 'high') {
        if (index === 2) {
          ans = keyItem.correctAnswer === 'A' ? 'B' : 'A';
        }
      }
      return {
        itemNumber: keyItem.itemNumber,
        answer: ans,
      };
    });

    const testImg = generateSampleSheetImage(
      answerKey.title || 'Exam Answer Sheet',
      sampleStudentName,
      sampleStudentId,
      items,
      false
    );

    processImage(testImg);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col">
      {/* Header Bar */}
      <header className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-white z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${mode === 'answer-key' ? 'bg-amber-600' : 'bg-indigo-600'}`}>
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-base leading-tight">
              {mode === 'answer-key' ? 'Scan Official Answer Key' : 'Scan Student Answer Sheet'}
            </h2>
            <p className="text-xs text-slate-400">
              {mode === 'answer-key'
                ? 'Align the master key sheet with marked correct answers'
                : `Grading against: ${answerKey?.title || 'Active Key'} (${answerKey?.totalItems || 0} items)`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'student-sheet' && (
            <label className="hidden sm:flex items-center gap-2 text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-700 transition">
              <input
                type="checkbox"
                checked={continuousMode}
                onChange={(e) => setContinuousMode(e.target.checked)}
                className="rounded accent-indigo-500"
              />
              <span className="text-slate-200">Rapid Continuous Scan</span>
            </label>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            aria-label="Close scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Viewfinder Area */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {/* Live Camera View */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-contain ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />

        {/* Captured Snapshot Preview when processing */}
        {capturedPreview && (
          <img
            src={capturedPreview}
            alt="Captured sheet"
            className="absolute inset-0 w-full h-full object-contain bg-black/80 z-20 transition-opacity"
          />
        )}

        {/* Framing Overlay Guides */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
          <div className="relative w-full max-w-md aspect-[3/4] max-h-[82vh] border-2 border-indigo-400/40 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
            {/* 4 Corner Markers */}
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />

            {/* Target Alignment Crosshairs / Grid */}
            <div className="absolute inset-0 flex flex-col justify-between p-4">
              <div className="flex justify-between items-center text-[11px] font-mono tracking-wider text-indigo-300/80 bg-slate-900/60 backdrop-blur-xs px-2.5 py-1 rounded w-fit">
                [ ALIGN ANSWER SHEET EDGES ]
              </div>

              {/* Scanning Laser Animation during processing */}
              {isProcessing && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse"
                     style={{
                       animation: 'scannerLaser 2s ease-in-out infinite alternate',
                     }}
                />
              )}

              <div className="text-center text-[11px] text-slate-300/80 bg-slate-900/70 backdrop-blur-xs px-3 py-1.5 rounded-lg mx-auto">
                Hold phone steady &bull; Ensure good lighting &bull; Keep all items in view
              </div>
            </div>
          </div>
        </div>

        {/* Camera Error Message fallback */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-950/90 z-30 flex flex-col items-center justify-center p-6 text-center text-white">
            <AlertCircle className="w-12 h-12 text-amber-400 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Camera Stream Unavailable</h3>
            <p className="text-sm text-slate-300 max-w-md mb-6">{cameraError}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition"
              >
                <Upload className="w-4 h-4" />
                Upload Answer Sheet Photo
              </button>
              {mode === 'student-sheet' && (
                <button
                  onClick={() => handleTestWithSampleSheet('high')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition"
                >
                  <Sparkles className="w-4 h-4" />
                  Test with Sample Sheet
                </button>
              )}
            </div>
          </div>
        )}

        {/* Processing Banner */}
        {isProcessing && (
          <div className="absolute inset-x-0 top-6 z-40 flex justify-center px-4">
            <div className="bg-slate-900/95 border border-indigo-500/50 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
              <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <div className="text-sm">
                <span className="font-semibold text-indigo-300">Processing OCR: </span>
                <span className="text-slate-200">{processingStatus}</span>
              </div>
            </div>
          </div>
        )}

        {/* Last Graded Toast Notification */}
        {lastGradedInfo && !isProcessing && (
          <div className="absolute top-6 z-30 flex justify-center px-4">
            <div className="bg-emerald-950/90 border border-emerald-500/60 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-3 backdrop-blur-md">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white">{lastGradedInfo.name}</span>
                <span className="text-emerald-200 ml-1.5">
                  graded: {lastGradedInfo.score}/{lastGradedInfo.total} ({((lastGradedInfo.score / lastGradedInfo.total) * 100).toFixed(0)}%)
                </span>
                <span className="text-emerald-400 ml-2 font-mono text-[10px]">RECORD SAVED #</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Footer Bar */}
      <footer className="px-4 py-4 bg-slate-950/95 border-t border-slate-800 flex flex-col gap-3 z-10">
        {/* Test Preset Helpers for Teachers */}
        {mode === 'student-sheet' && (
          <div className="flex items-center justify-between text-xs text-slate-400 overflow-x-auto pb-1 gap-2">
            <span className="shrink-0 text-slate-400 font-medium">Quick Demo Test:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTestWithSampleSheet('high')}
                disabled={isProcessing}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 whitespace-nowrap transition disabled:opacity-50"
              >
                &bull; Sample Sheet A (High Score)
              </button>
              <button
                type="button"
                onClick={() => handleTestWithSampleSheet('mixed')}
                disabled={isProcessing}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 whitespace-nowrap transition disabled:opacity-50"
              >
                &bull; Sample Sheet B (Mixed)
              </button>
              <button
                type="button"
                onClick={() => handleTestWithSampleSheet('perfect')}
                disabled={isProcessing}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 whitespace-nowrap transition disabled:opacity-50"
              >
                &bull; Sample Sheet C (100%)
              </button>
            </div>
          </div>
        )}

        {/* Primary Scanner Action Buttons */}
        <div className="flex items-center justify-around max-w-lg mx-auto w-full">
          {/* Torch Toggle */}
          <button
            type="button"
            onClick={toggleTorch}
            disabled={!hasTorch}
            title={hasTorch ? 'Toggle Flashlight' : 'Torch not available'}
            className={`p-3.5 rounded-full transition ${
              torchOn
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30'
            }`}
          >
            {torchOn ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
          </button>

          {/* Shutter Button */}
          <button
            type="button"
            onClick={handleCaptureClick}
            disabled={isProcessing}
            className="relative group p-1 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-400 shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition disabled:opacity-60 disabled:hover:scale-100"
            aria-label="Capture Photo and Grade"
          >
            <div className="w-16 h-16 rounded-full border-4 border-slate-950 bg-white flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-indigo-600 group-hover:bg-indigo-700 transition flex items-center justify-center text-white">
                <Camera className="w-6 h-6" />
              </div>
            </div>
          </button>

          {/* Flip Camera Front/Back */}
          <button
            type="button"
            onClick={switchCamera}
            title="Flip camera"
            className="p-3.5 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Upload File Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload photo from disk"
            className="p-3.5 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
          >
            <Upload className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </footer>
    </div>
  );
};
