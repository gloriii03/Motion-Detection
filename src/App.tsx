import { useState, useRef, useEffect, useCallback } from 'react';
import '../style.css';

// Main App Component
function App() {
  return (
    <>
      <div className="background-effects">
        <div className="glow glow-1"></div>
        <div className="glow glow-2"></div>
      </div>
      <MotionDetectionApp />
    </>
  );
}

// Main Motion Detection Component
function MotionDetectionApp() {
  // State variables
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [motionStatus, setMotionStatus] = useState('No Motion');
  const [motionScore, setMotionScore] = useState(0);
  const [fps, setFps] = useState(0);
  const [logs, setLogs] = useState<{msg: string, type: string, time: string}[]>([
    { msg: 'System initialized successfully', type: 'info', time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" }) }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Settings state
  const [sensitivity, setSensitivity] = useState(25);
  const [humanDelay, setHumanDelay] = useState(400);
  const [threshold, setThreshold] = useState(500);

  // Use refs for settings
  const sensitivityRef = useRef(sensitivity);
  const humanDelayRef = useRef(humanDelay);
  const thresholdRef = useRef(threshold);

  // Update refs when settings change
  useEffect(() => { sensitivityRef.current = sensitivity; }, [sensitivity]);
  useEffect(() => { humanDelayRef.current = humanDelay; }, [humanDelay]);
  useEffect(() => { thresholdRef.current = threshold; }, [threshold]);

  // Refs for video and canvas
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const fpsCounterRef = useRef({ count: 0, lastTime: Date.now() });
  const lastMotionStateRef = useRef(false);
  const targetMotionStateRef = useRef(false);
  const isRunningRef = useRef(false);
  const motionTimeoutIdRef = useRef<number | null>(null);

  // Motion box position
  const [motionBox, setMotionBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

  // Add log entry
  const addLog = useCallback((msg: string, type: string = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" });
    setLogs(prev => [...prev.slice(-49), { msg, type, time }]);
    console.log(`[${type.toUpperCase()}] ${msg}`);
  }, []);

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
            lastMotionStateRef.current = false;
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

  // Motion detection loop
  const detectMotion = useCallback(() => {
    if (!isRunningRef.current) return;

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
      const isMotion = actualChangedPixels > currentThreshold;
      const hasValidBounds = isMotion && activeCells > 0 && maxX > minX && maxY > minY;

      if (isMotion !== targetMotionStateRef.current) {
        targetMotionStateRef.current = isMotion;
        if (motionTimeoutIdRef.current) window.clearTimeout(motionTimeoutIdRef.current);
        
        const currentHumanDelay = humanDelayRef.current;
        const variance = Math.random() * 100 - 50;
        const actualDelay = Math.max(50, currentHumanDelay + variance);

        motionTimeoutIdRef.current = window.setTimeout(() => {
          if (!isRunningRef.current) return;
          
          lastMotionStateRef.current = isMotion;
          if (isMotion) {
            addLog(`Motion detected (Changed Area: ${actualChangedPixels}px)`, 'motion');
            setMotionStatus('DETECTED');
          } else {
            addLog('Motion ended / Area clear', 'nomotion');
            setMotionStatus('Clear');
            setMotionBox(null);
          }
        }, actualDelay);
      }

      if (lastMotionStateRef.current && hasValidBounds) {
        const boxX = minX / width * 100;
        const boxY = minY / height * 100;
        const boxW = (maxX - minX) / width * 100;
        const boxH = (maxY - minY) / height * 100;
        setMotionBox({ x: boxX, y: boxY, w: boxW, h: boxH });
      }
    }

    prevFrameRef.current = currentFrame;

    fpsCounterRef.current.count++;
    const now = Date.now();
    if (now - fpsCounterRef.current.lastTime >= 1000) {
      setFps(fpsCounterRef.current.count);
      fpsCounterRef.current.count = 0;
      fpsCounterRef.current.lastTime = now;
    }

    animationRef.current = requestAnimationFrame(detectMotion);
  }, [addLog]);

  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (motionTimeoutIdRef.current) clearTimeout(motionTimeoutIdRef.current);
    };
  }, []);

  const clearLogs = () => setLogs([]);

  const motionBarColor = motionScore > 60 ? 'danger' : motionScore > 30 ? 'warning' : '';

  return (
    <div className="dashboard-container">
      <div className="main-grid">
        {/* Left Column */}
        <div className="left-col">
          <div className="panel video-panel">
            <div className="panel-header">
              <h2><i className="fa-solid fa-video"></i> Live Feed</h2>
              <span className={`status-indicator ${isCameraOn ? 'on' : 'off'}`}>
                <i className="fa-solid fa-circle"></i> {isCameraOn ? 'Live' : 'Off'}
              </span>
            </div>
            
            <div className="video-box" id="videoBox">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={isCameraOn ? 'active' : ''}
                id="camVideo"
              ></video>
              <canvas ref={canvasRef} id="diffCanvas"></canvas>
              
              {motionBox && isCameraOn && motionStatus === 'DETECTED' && (
                <div 
                  className="motion-highlight active"
                  style={{
                    // Apply mirroring
                    left: `calc(100% - ${motionBox.x + motionBox.w}% - 30px)`,
                    top: `calc(${motionBox.y}% - 15px)`,
                    width: `calc(${motionBox.w}% + 30px)`,
                    height: `calc(${motionBox.h}% + 30px)`
                  }}
                >
                  <span className="highlight-label">MOTION DETECTED</span>
                </div>
              )}
              
              {isLoading && (
                <div className="loading-overlay">
                  <div className="spinner"></div>
                  <p>Initializing Optical Sensors...</p>
                </div>
              )}
              
              {!isCameraOn && !isLoading && (
                <div className="idle-overlay">
                  <i className="fa-solid fa-camera-retro"></i>
                  <p>Camera is offline. Start feed to begin.</p>
                </div>
              )}
            </div>
          </div>

          <div className="panel stats-panel">
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-icon"><i className="fa-solid fa-bolt"></i></div>
                <div className="stat-info">
                  <span className="label-text">Motion Status</span>
                  <span 
                    className="value-text"
                    style={{ color: motionStatus === 'DETECTED' ? 'var(--accent-danger)' : 'var(--text-main)' }}
                  >
                    {motionStatus === 'Clear' || motionStatus === 'No Motion' ? 'No Motion' : motionStatus}
                  </span>
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-icon"><i className="fa-solid fa-gauge-high"></i></div>
                <div className="stat-info">
                  <span className="label-text">Frame Rate</span>
                  <span className="value-text"><span>{fps}</span> FPS</span>
                </div>
              </div>
            </div>
            
            <div className="motion-meter">
              <div className="meter-header">
                <span className="label-text">Motion Intensity</span>
                <span className="meter-value">{motionScore}%</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className={`progress-bar-fill ${motionBarColor}`}
                  style={{ width: `${motionScore}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="right-col">
          <div className="panel controls-panel">
            <div className="panel-header">
              <h2><i className="fa-solid fa-sliders"></i> System Parameters</h2>
            </div>
            
            <div className="button-row">
              <button 
                onClick={startCamera} 
                disabled={isCameraOn || isLoading} 
                className="btn btn-primary"
              >
                <i className="fa-solid fa-play"></i> Start Feed
              </button>
              <button 
                onClick={stopCamera} 
                disabled={!isCameraOn} 
                className="btn btn-danger"
              >
                <i className="fa-solid fa-stop"></i> Stop Feed
              </button>
            </div>

            <div className="sliders-container">
              <div className="control-group">
                <div className="control-header">
                  <label>Detection Sensitivity</label>
                  <span className="value-badge">{sensitivity}</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  value={sensitivity} 
                  onChange={(e) => setSensitivity(parseInt(e.target.value))} 
                  onMouseUp={(e) => addLog(`Sensitivity adjusted to ${(e.target as HTMLInputElement).value}`, 'info')}
                  onTouchEnd={(e) => addLog(`Sensitivity adjusted to ${(e.target as HTMLInputElement).value}`, 'info')}
                />
                <span className="hint-text">Lower value = Higher sensitivity</span>
              </div>

              <div className="control-group">
                <div className="control-header">
                  <label>Human Reaction Delay</label>
                  <span className="value-badge">{humanDelay}ms</span>
                </div>
                <input 
                  type="range" 
                  min="100" 
                  max="1000" 
                  step="50" 
                  value={humanDelay} 
                  onChange={(e) => setHumanDelay(parseInt(e.target.value))} 
                  onMouseUp={(e) => addLog(`Reaction Delay adjusted to ${(e.target as HTMLInputElement).value}ms`, 'info')}
                  onTouchEnd={(e) => addLog(`Reaction Delay adjusted to ${(e.target as HTMLInputElement).value}ms`, 'info')}
                />
              </div>

              <div className="control-group">
                <div className="control-header">
                  <label>Area Threshold</label>
                  <span className="value-badge">{threshold}</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="5000" 
                  value={threshold} 
                  onChange={(e) => setThreshold(parseInt(e.target.value))} 
                  onMouseUp={(e) => addLog(`Area Threshold adjusted to ${(e.target as HTMLInputElement).value}`, 'info')}
                  onTouchEnd={(e) => addLog(`Area Threshold adjusted to ${(e.target as HTMLInputElement).value}`, 'info')}
                />
                <span className="hint-text">Minimum pixels changed to trigger</span>
              </div>
            </div>
          </div>

          <div className="panel log-panel">
            <div className="panel-header">
              <h2><i className="fa-solid fa-terminal"></i> Activity Log</h2>
              <button onClick={clearLogs} className="btn-icon" title="Clear Logs">
                <i className="fa-solid fa-trash-can"></i>
              </button>
            </div>
            <div className="log-box">
              {logs.length === 0 ? (
                <div className="log-placeholder">Waiting for events...</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="log-entry">
                    <span className="log-time">[{log.time}]</span>
                    <span className={`log-msg-${log.type}`}>{log.msg}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>Computer Vision Core V2.0 &bull; PBL Project</p>
      </footer>
    </div>
  );
}

export default App;