import ProgressBar from "./ProgressBar.jsx";
const TaskCard = ({ task, projectName, onClaim }) => <article className="task-card"><div><span className={`task-status ${task.status.toLowerCase().replaceAll(" ", "-")}`}>{task.status}</span><h4>{task.title}</h4><p>{projectName} · Due {task.dueDate}</p></div><ProgressBar value={task.progress} label="Progress" />{!task.assigneeId && <button className="claim-button" onClick={() => onClaim(task.id)}>Claim task</button>}</article>;
export default TaskCard;
