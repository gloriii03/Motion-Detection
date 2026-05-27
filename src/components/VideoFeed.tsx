import type { RefObject } from 'react';

interface VideoFeedProps {
  isCameraOn: boolean;
  isLoading: boolean;
  motionBox: { x: number; y: number; w: number; h: number } | null;
  motionStatus: string;
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
}

const VideoFeed = ({
  isCameraOn,
  isLoading,
  motionBox,
  motionStatus,
  videoRef,
  canvasRef
}: VideoFeedProps) => {

  return (
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
  );
};

VideoFeed.displayName = 'VideoFeed';

export default VideoFeed;