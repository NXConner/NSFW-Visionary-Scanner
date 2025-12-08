import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  stream: MediaStream | null;
  isActive: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureImage: () => string | null;
}

export const useCamera = (): UseCameraReturn => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsActive(true);
      
      // Wait for video element to be available and attach stream
      const attachStream = () => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(console.error);
        } else {
          // Retry attaching if video element not ready
          setTimeout(attachStream, 100);
        }
      };
      attachStream();
      
    } catch (err) {
      console.error('Camera error:', err);
      const message = err instanceof Error ? err.message : 'Failed to access camera';
      if (message.includes('Permission denied') || message.includes('NotAllowedError')) {
        setError('Camera permission denied. Please allow camera access.');
      } else if (message.includes('NotFoundError') || message.includes('DevicesNotFoundError')) {
        setError('No camera found on this device.');
      } else if (message.includes('NotReadableError')) {
        setError('Camera is in use by another application.');
      } else {
        setError(message);
      }
      setIsActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setIsActive(false);
  }, []);

  const captureImage = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Ensure video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('Video has no dimensions');
      return null;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    stream,
    isActive,
    error,
    startCamera,
    stopCamera,
    captureImage,
  };
};
