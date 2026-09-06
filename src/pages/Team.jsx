import DashboardLayout from "../layouts/DashboardLayout.jsx";
import MemberCard from "../components/MemberCard.jsx";
import { useProjects } from "../context/ProjectContext.jsx";
function Team() { const { members, tasks } = useProjects(); return <DashboardLayout><div className="teamflow-page"><section className="teamflow-heading"><p className="welcome-label">TEAM DIRECTORY</p><h2>People doing the work.</h2><p className="welcome-description">See workload and progress across every member.</p></section><div className="member-grid">{members.map((member) => { const work = tasks.filter((task) => task.assigneeId === member.id); const progress = work.length ? Math.round(work.reduce((total, task) => total + task.progress, 0) / work.length) : 0; return <MemberCard key={member.id} member={member} taskCount={work.length} progress={progress} />; })}</div></div></DashboardLayout>; }
export default Team;
