interface MotionControlsProps {
  isCameraOn: boolean;
  isLoading: boolean;
  sensitivity: number;
  humanDelay: number;
  threshold: number;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onSensitivityChange: (value: number) => void;
  onHumanDelayChange: (value: number) => void;
  onThresholdChange: (value: number) => void;
  onSensitivityLog: (value: string) => void;
  onDelayLog: (value: string) => void;
  onThresholdLog: (value: string) => void;
}

const MotionControls = ({
  isCameraOn,
  isLoading,
  sensitivity,
  humanDelay,
  threshold,
  onStartCamera,
  onStopCamera,
  onSensitivityChange,
  onHumanDelayChange,
  onThresholdChange,
  onSensitivityLog,
  onDelayLog,
  onThresholdLog
}: MotionControlsProps) => {
  return (
    <div className="panel controls-panel">
      <div className="panel-header">
        <h2><i className="fa-solid fa-sliders"></i> System Parameters</h2>
      </div>

      <div className="button-row">
        <button
          onClick={onStartCamera}
          disabled={isCameraOn || isLoading}
          className="btn btn-primary"
        >
          <i className="fa-solid fa-play"></i> Start Feed
        </button>
        <button
          onClick={onStopCamera}
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
            onChange={(e) => onSensitivityChange(parseInt(e.target.value))}
            onMouseUp={(e) => onSensitivityLog((e.target as HTMLInputElement).value)}
            onTouchEnd={(e) => onSensitivityLog((e.target as HTMLInputElement).value)}
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
            onChange={(e) => onHumanDelayChange(parseInt(e.target.value))}
            onMouseUp={(e) => onDelayLog((e.target as HTMLInputElement).value)}
            onTouchEnd={(e) => onDelayLog((e.target as HTMLInputElement).value)}
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
            onChange={(e) => onThresholdChange(parseInt(e.target.value))}
            onMouseUp={(e) => onThresholdLog((e.target as HTMLInputElement).value)}
            onTouchEnd={(e) => onThresholdLog((e.target as HTMLInputElement).value)}
          />
          <span className="hint-text">Minimum pixels changed to trigger</span>
        </div>
      </div>
    </div>
  );
};

export default MotionControls;