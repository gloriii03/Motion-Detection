import { useState, useRef, useCallback, useEffect } from 'react';

interface MotionBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface UseMotionDetectionProps {
  sensitivity: number;
  humanDelay: number;
  threshold: number;
  addLog: (msg: string, type?: string) => void;
  maxFps?: number; // Optional frame rate limit
}

export const useMotionDetection = ({
  sensitivity,
  humanDelay,
  threshold,
  addLog,
  maxFps = 30
}: UseMotionDetectionProps) => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [motionStatus, setMotionStatus] = useState('No Motion');
  const [motionScore, setMotionScore] = useState(0);
  const [fps, setFps] = useState(0);
  const [motionBox, setMotionBox] = useState<MotionBox | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const fpsCounterRef = useRef({ count: 0, lastTime: Date.now() });
  const frameLimiterRef = useRef({ lastFrameTime: 0, frameInterval: 1000 / maxFps });
  const motionStateRef = useRef(false);
  const isRunningRef = useRef(false);
  const motionTimeoutIdRef = useRef<number | null>(null);
  const sensitivityRef = useRef(sensitivity);
  const humanDelayRef = useRef(humanDelay);
  const thresholdRef = useRef(threshold);

  // Update refs when settings change
  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  useEffect(() => {
    humanDelayRef.current = humanDelay;
  }, [humanDelay]);

  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  // Motion detection loop - starts frame capture and analysis
  const detectMotion = useCallback(() => {
    if (!isRunningRef.current) return;

    const now = Date.now();
    const frameLimiter = frameLimiterRef.current;

    // Frame rate limiting
    if (now - frameLimiter.lastFrameTime < frameLimiter.frameInterval) {
      animationRef.current = requestAnimationFrame(detectMotion);
      return;
    }
    frameLimiter.lastFrameTime = now;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      animationRef.current = requestAnimationFrame(detectMotion);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(detectMotion);
      return;
    }

    const width = canvas.width;
    const height = canvas.height;

    ctx.drawImage(video, 0, 0, width, height);
    const currentFrame = ctx.getImageData(0, 0, width, height);

    if (prevFrameRef.current) {
      const prevData = prevFrameRef.current.data;
      const currData = currentFrame.data;

      let changedPixels = 0;
      let totalDiff = 0;

      const currentSensitivity = sensitivityRef.current;
      const step = 4;

      // Advanced Grid-Based Noise Filtering
      const gridCols = 32;
      const gridRows = 24;
      const cellW = width / gridCols;
      const cellH = height / gridRows;
      const grid = new Int32Array(gridCols * gridRows);

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const i = (y * width + x) * 4;

          const rDiff = Math.abs(prevData[i] - currData[i]);
          const gDiff = Math.abs(prevData[i + 1] - currData[i + 1]);
          const bDiff = Math.abs(prevData[i + 2] - currData[i + 2]);

          const pixelDiff = rDiff + gDiff + bDiff;

          if (pixelDiff > currentSensitivity) {
            changedPixels++;
            totalDiff += pixelDiff;

            // Map pixel to grid cell
            const gridX = Math.floor(x / cellW);
            const gridY = Math.floor(y / cellH);
            grid[gridY * gridCols + gridX]++;
          }
        }
      }

      // Calculate Bounding Box strictly from noisy-filtered grid cells
      let minX = width;
      let maxX = 0;
      let minY = height;
      let maxY = 0;
      let activeCells = 0;

      // A cell must have multiple changed pixels to be considered "real" motion
      const noiseThreshold = 2;

      for (let gy = 0; gy < gridRows; gy++) {
        for (let gx = 0; gx < gridCols; gx++) {
          if (grid[gy * gridCols + gx] >= noiseThreshold) {
            activeCells++;
            const cellX = gx * cellW;
            const cellY = gy * cellH;

            if (cellX < minX) minX = cellX;
            if (cellX + cellW > maxX) maxX = cellX + cellW;
            if (cellY < minY) minY = cellY;
            if (cellY + cellH > maxY) maxY = cellY + cellH;
          }
        }
      }

      const actualChangedPixels = changedPixels * (step * step);
      const score = Math.min(100, Math.floor(totalDiff / 2000));
      setMotionScore(score);

      const currentThreshold = thresholdRef.current;
      const isMotion = actualChangedPixels > currentThreshold && activeCells > 0 && maxX > minX && maxY > minY;

      if (isMotion) {
        if (motionTimeoutIdRef.current) {
          window.clearTimeout(motionTimeoutIdRef.current);
          motionTimeoutIdRef.current = null;
        }

        if (!motionStateRef.current) {
          motionStateRef.current = true;
          setMotionStatus('DETECTED');
          addLog(`Motion detected (Changed Area: ${actualChangedPixels}px)`, 'motion');
        }

        const boxX = minX / width * 100;
        const boxY = minY / height * 100;
        const boxW = (maxX - minX) / width * 100;
        const boxH = (maxY - minY) / height * 100;
        setMotionBox({ x: boxX, y: boxY, w: boxW, h: boxH });
      } else {
        if (motionStateRef.current && !motionTimeoutIdRef.current) {
          const currentHumanDelay = humanDelayRef.current;
          const variance = Math.random() * 100 - 50;
          const actualDelay = Math.max(50, currentHumanDelay + variance);

          motionTimeoutIdRef.current = window.setTimeout(() => {
            if (!isRunningRef.current) return;

            motionStateRef.current = false;
            setMotionStatus('Clear');
            setMotionBox(null);
            addLog('Motion ended / Area clear', 'nomotion');
            motionTimeoutIdRef.current = null;
          }, actualDelay);
        }
      }
    }

    prevFrameRef.current = currentFrame;

    fpsCounterRef.current.count++;
    if (now - fpsCounterRef.current.lastTime >= 1000) {
      setFps(fpsCounterRef.current.count);
      fpsCounterRef.current.count = 0;
      fpsCounterRef.current.lastTime = now;
    }

    animationRef.current = requestAnimationFrame(detectMotion);
  }, [addLog]);

  // Start camera
  const startCamera = async () => {
    setIsLoading(true);
    addLog('Initializing optical sensors...', 'info');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Play failed", e));
          if (canvasRef.current && videoRef.current) {
            const videoWidth = videoRef.current.videoWidth;
            const videoHeight = videoRef.current.videoHeight;

            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;

            setTimeout(() => {
              setIsCameraOn(true);
              setIsLoading(false);
            }, 600);

            addLog(`Stream active [${videoWidth}x${videoHeight}]`, 'info');

            prevFrameRef.current = null;
            isRunningRef.current = true;
            detectMotion();
          }
        };
      }
    } catch (err: any) {
      setIsLoading(false);
      addLog(`Access denied: ${err.message}`, 'error');
      alert('Could not access camera. Please check permissions.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    isRunningRef.current = false;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (motionTimeoutIdRef.current) {
      window.clearTimeout(motionTimeoutIdRef.current);
      motionTimeoutIdRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    setIsCameraOn(false);
    setMotionStatus('No Motion');
    setMotionScore(0);
    setFps(0);
    setMotionBox(null);
    prevFrameRef.current = null;

    addLog('Optical sensors disabled', 'info');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (motionTimeoutIdRef.current) clearTimeout(motionTimeoutIdRef.current);
    };
  }, []);

  return {
    // State
    isCameraOn,
    motionStatus,
    motionScore,
    fps,
    motionBox,
    isLoading,
    // Refs
    videoRef,
    canvasRef,
    // Functions
    startCamera,
    stopCamera
  };
};