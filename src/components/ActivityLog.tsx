interface LogEntry {
  msg: string;
  type: string;
  time: string;
}

interface ActivityLogProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

const ActivityLog = ({ logs, onClearLogs }: ActivityLogProps) => {
  return (
    <div className="panel log-panel">
      <div className="panel-header">
        <h2><i className="fa-solid fa-terminal"></i> Activity Log</h2>
        <button onClick={onClearLogs} className="btn-icon" title="Clear Logs">
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
  );
};

export default ActivityLog;