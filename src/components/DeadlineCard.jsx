const DeadlineCard = ({ project, progress }) => <article className="deadline-card"><span className={`project-status ${project.status === "At Risk" ? "risk" : ""}`}>{project.status}</span><h4>{project.name}</h4><p>Due {project.deadline}</p><strong>{progress}% complete</strong></article>;
export default DeadlineCard;
