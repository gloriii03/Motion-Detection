interface MotionStatsProps {
  motionStatus: string;
  fps: number;
  motionScore: number;
}

const MotionStats = ({ motionStatus, fps, motionScore }: MotionStatsProps) => {
  const motionBarColor = motionScore > 60 ? 'danger' : motionScore > 30 ? 'warning' : '';
  const isMotionDetected = motionStatus === 'DETECTED';
  const statusDisplay = motionStatus === 'Clear' || motionStatus === 'No Motion' ? 'No Motion Detected' : 'Motion Detected';
  const statusIcon = isMotionDetected ? 'fa-radar' : 'fa-shield-halved';
  const statusTheme = isMotionDetected ? 'status-danger' : 'status-success';

  return (
    <div className="panel stats-panel">
      <div className="status-card-inline summary-card">
        <div className="status-card-inline-icon">
          <i className={`fa-solid ${statusIcon}`}></i>
        </div>
        <div className="status-card-inline-content">
          <span className="status-card-inline-label">Motion Status</span>
          <h2 className="status-card-inline-title">{statusDisplay}</h2>
          <p className="status-card-inline-note">Response quality is optimized for live detection.</p>
        </div>
        <div className="status-card-inline-meta">
          <span className="status-indicator-chip">{isMotionDetected ? 'DETECTED' : 'CLEAR'}</span>
        </div>
      </div>

      <div className="radial-grid">
        <div className="radial-meter">
          <div
            className="radial-track"
            style={{
              background: `conic-gradient(${motionScore > 60 ? 'var(--accent-danger)' : motionScore > 30 ? 'var(--accent-warning)' : 'var(--accent-success)'} ${motionScore}%, rgba(255,255,255,0.08) ${motionScore}%)`
            }}
          >
            <div className="radial-inner">
              <span className="radial-score">{motionScore}%</span>
              <small>Intensity</small>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-icon"><i className="fa-solid fa-gauge-high"></i></div>
            <div className="stat-info">
              <span className="label-text">Frame Rate</span>
              <span className="value-text"><span>{fps}</span> FPS</span>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-icon"><i className="fa-solid fa-percent"></i></div>
            <div className="stat-info">
              <span className="label-text">Intensity</span>
              <span className="value-text"><span>{motionScore}</span>%</span>
            </div>
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
  );
};

export default MotionStats;