import DashboardLayout from "../layouts/DashboardLayout.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import { useProjects } from "../context/ProjectContext.jsx";
function Analytics() { const { projects, tasks, projectProgress } = useProjects(); return <DashboardLayout><div className="teamflow-page"><section className="teamflow-heading"><p className="welcome-label">DELIVERY ANALYTICS</p><h2>Progress across the portfolio.</h2><p className="welcome-description">A simple manager view of project health and completed work.</p></section><section className="panel analytics-list">{projects.map((project) => <div className="analytics-row" key={project.id}><div><strong>{project.name}</strong><small>{tasks.filter((task) => task.projectId === project.id).length} tasks · {project.status}</small></div><ProgressBar value={projectProgress(project.id)} label="Progress" /></div>)}</section></div></DashboardLayout>; }
export default Analytics;
