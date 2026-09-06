const ProgressBar = ({ value = 0, label }) => <div className="reusable-progress"><div className="reusable-progress-label"><span>{label}</span><strong>{value}%</strong></div><div className="progress-background"><div className="progress-fill" style={{ width: `${value}%` }} /></div></div>;
export default ProgressBar;
