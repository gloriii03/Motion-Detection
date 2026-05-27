import { useState, useCallback, useEffect } from 'react';
import '../style.css';
import VideoFeed from './components/VideoFeed';
import MotionStats from './components/MotionStats';
import MotionControls from './components/MotionControls';
import ActivityLog from './components/ActivityLog';
import { useMotionDetection } from './hooks/useMotionDetection';

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
  const [logs, setLogs] = useState<{msg: string, type: string, time: string}[]>([
    { msg: 'System initialized successfully', type: 'info', time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" }) }
  ]);

  // Settings state
  const [sensitivity, setSensitivity] = useState(25);
  const [humanDelay, setHumanDelay] = useState(400);
  const [threshold, setThreshold] = useState(500);

  // Add log entry
  const addLog = useCallback((msg: string, type: string = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" });
    setLogs(prev => [...prev.slice(-49), { msg, type, time }]);
    console.log(`[${type.toUpperCase()}] ${msg}`);
  }, []);

  // Use motion detection hook
  const {
    isCameraOn,
    motionStatus,
    motionScore,
    fps,
    motionBox,
    isLoading,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera
  } = useMotionDetection({
    sensitivity,
    humanDelay,
    threshold,
    addLog,
    maxFps: 24 // Limit to 24 FPS for better performance
  });

  const clearLogs = () => setLogs([]);
  const motionEvents = logs.filter((log) => log.type === 'motion').length;
  const lastEvent = logs.length > 0 ? logs[logs.length - 1].msg : 'Awaiting first event';

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 's':
          if (!isCameraOn && !isLoading) {
            event.preventDefault();
            startCamera();
          }
          break;
        case 'x':
          if (isCameraOn) {
            event.preventDefault();
            stopCamera();
          }
          break;
        case 'c':
          event.preventDefault();
          clearLogs();
          break;
        case 'h':
          event.preventDefault();
          addLog('Keyboard shortcuts: S (Start), X (Stop), C (Clear logs), H (Help)', 'info');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isCameraOn, isLoading, startCamera, stopCamera, clearLogs, addLog]);

  return (
    <div className="dashboard-container">
      <section className="dashboard-banner">
        <div className="banner-copy">
          <span className="badge">AI Motion Guardian</span>
          <h1>Live monitoring with immersive control</h1>
          <p>Track motion, tune detection in real time, and review activity on a sleek cyber-inspired dashboard.</p>
        </div>
        <div className="banner-summary">
          <div className="summary-chip">
            <span>System</span>
            <strong>{isCameraOn ? 'ONLINE' : 'OFFLINE'}</strong>
          </div>
          <div className="summary-chip">
            <span>Motion Alerts</span>
            <strong>{motionEvents}</strong>
          </div>
          <div className="summary-chip">
            <span>Latest Event</span>
            <strong>{lastEvent}</strong>
          </div>
        </div>
      </section>

      <div className="main-grid">
        {/* Left Column */}
        <div className="left-col">
          <VideoFeed
            videoRef={videoRef}
            canvasRef={canvasRef}
            isCameraOn={isCameraOn}
            isLoading={isLoading}
            motionBox={motionBox}
            motionStatus={motionStatus}
          />

          <MotionStats
            motionStatus={motionStatus}
            fps={fps}
            motionScore={motionScore}
          />
        </div>

        {/* Right Column */}
        <div className="right-col">
          <MotionControls
            isCameraOn={isCameraOn}
            isLoading={isLoading}
            sensitivity={sensitivity}
            humanDelay={humanDelay}
            threshold={threshold}
            onStartCamera={startCamera}
            onStopCamera={stopCamera}
            onSensitivityChange={setSensitivity}
            onHumanDelayChange={setHumanDelay}
            onThresholdChange={setThreshold}
            onSensitivityLog={(value) => addLog(`Sensitivity adjusted to ${value}`, 'info')}
            onDelayLog={(value) => addLog(`Reaction Delay adjusted to ${value}ms`, 'info')}
            onThresholdLog={(value) => addLog(`Area Threshold adjusted to ${value}`, 'info')}
          />

          <div className="panel quick-panel">
            <div className="panel-header">
              <h2><i className="fa-solid fa-brain"></i> Live Intelligence</h2>
            </div>
            <div className="insight-grid">
              <div className="insight-card">
                <span>Camera Status</span>
                <strong>{isCameraOn ? 'Live stream active' : 'Ready when activated'}</strong>
              </div>
              <div className="insight-card">
                <span>Motion Events</span>
                <strong>{motionEvents} detected</strong>
              </div>
              <div className="insight-card">
                <span>Motion Sensitivity</span>
                <strong>{sensitivity}</strong>
              </div>
              <div className="insight-card">
                <span>Current FPS</span>
                <strong>{fps}</strong>
              </div>
            </div>
          </div>

          <ActivityLog
            logs={logs}
            onClearLogs={clearLogs}
          />
        </div>
      </div>

      <footer className="footer">
        <p>Computer Vision Core V2.0 &bull; PBL Project</p>
        <p className="keyboard-shortcuts">
          <small>Keyboard: <kbd>S</kbd> Start &bull; <kbd>X</kbd> Stop &bull; <kbd>C</kbd> Clear logs &bull; <kbd>H</kbd> Help</small>
        </p>
      </footer>
    </div>
  );
}

export default App;
