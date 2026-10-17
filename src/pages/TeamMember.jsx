import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { useProjects } from "../context/ProjectContext.jsx";

const idOf = (value) => value?.id ?? value?.user_id ?? value?.userId ?? value?._id ?? null;
const nameOf = (value) => value?.name || value?.username || value?.full_name || value?.email || "Unnamed member";
const statusOf = (value) => String(value ?? "").trim().toLowerCase().replace(/[_-]+/g, " ");
const taskAssigneeId = (task) => task?.assigneeId ?? task?.assigned_to ?? task?.assignee_id ?? task?.user_id ?? null;
const taskProgress = (task) => {
  const value = Number(task?.progress ?? task?.completion ?? 0);
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
};

export default function TeamMember() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { members = [], tasks = [] } = useProjects();

  // Member and task information comes from the application's API-backed ProjectContext.
  // Do not generate placeholder member details or sample history if the API has no data.
  const member = members.find((item) => String(idOf(item)) === String(memberId));

  if (!member) {
    return (
      <DashboardLayout>
        <div className="teamflow-page team-member-page">
          <section className="panel empty-state">
            <strong>Member not found</strong>
            <p>This member is not present in the users data returned by the backend.</p>
            <button className="primary-button" onClick={() => navigate("/team")}>Back to team</button>
          </section>
        </div>
      </DashboardLayout>
    );
  }

  const memberKey = String(idOf(member));
  const memberName = nameOf(member);
  const memberTasks = tasks.filter((task) => String(taskAssigneeId(task) ?? "") === memberKey);
  const completedTasks = memberTasks.filter((task) => /^(completed|done)$/.test(statusOf(task.status)));
  const activeTasks = memberTasks.filter((task) => statusOf(task.status) === "in progress");
  const blockedTasks = memberTasks.filter((task) => statusOf(task.status) === "blocked");
  const todoTasks = memberTasks.filter((task) => /^(to do|todo)$/.test(statusOf(task.status)));
  const completionRate = memberTasks.length ? Math.round((completedTasks.length / memberTasks.length) * 100) : 0;
  const averageProgress = memberTasks.length
    ? Math.round(memberTasks.reduce((sum, task) => sum + taskProgress(task), 0) / memberTasks.length)
    : 0;
  const skills = Array.isArray(member.skills)
    ? member.skills.filter(Boolean).join(", ")
    : (typeof member.skills === "string" ? member.skills.trim() : "");

  return (
    <DashboardLayout>
      <div className="teamflow-page team-member-page">
        <section className="member-profile-header panel">
          <button className="back-button" onClick={() => navigate("/team")}>← Back to team</button>
          <div className="member-profile-main">
            <div className="member-large-avatar">{memberName.charAt(0).toUpperCase()}</div>
            <div>
              <p className="welcome-label">TEAM MEMBER</p>
              <h2>{memberName}</h2>
              {member.role && <p className="member-role">{member.role}</p>}
              {member.email && <p className="member-email">{member.email}</p>}
            </div>
          </div>
        </section>

        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <div>
              <h3>Member details</h3>
              <p>Profile information returned by the backend.</p>
            </div>
          </div>
          <div className="workload-stats">
            <div className="workload-stat"><span>Department</span><strong>{member.department || "Not set"}</strong></div>
            <div className="workload-stat"><span>Skills</span><strong>{skills || "Not added"}</strong></div>
          </div>
        </section>

        <section className="overview-grid member-overview" aria-label="Member task summary">
          <div className="overview-card"><span className="overview-icon teal">✓</span><span><small>Total tasks</small><strong>{memberTasks.length}</strong><em>Currently assigned</em></span></div>
          <div className="overview-card"><span className="overview-icon blue">↗</span><span><small>Active tasks</small><strong>{activeTasks.length}</strong><em>In progress</em></span></div>
          <div className="overview-card"><span className="overview-icon violet">✓</span><span><small>Completed</small><strong>{completedTasks.length}</strong><em>{completionRate}% completion rate</em></span></div>
          <div className="overview-card"><span className="overview-icon orange">!</span><span><small>Current workload</small><strong>{averageProgress}%</strong><em>{blockedTasks.length} blocked</em></span></div>
        </section>

        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <div><h3>Current workload summary</h3><p>Counts are calculated from task records supplied by the backend.</p></div>
          </div>
          <div className="workload-stats">
            <div className="workload-stat"><span>To Do</span><strong>{todoTasks.length}</strong></div>
            <div className="workload-stat"><span>In Progress</span><strong>{activeTasks.length}</strong></div>
            <div className="workload-stat"><span>Blocked</span><strong>{blockedTasks.length}</strong></div>
            <div className="workload-stat"><span>Completed</span><strong>{completedTasks.length}</strong></div>
          </div>
          {!memberTasks.length && <p className="member-email" style={{ marginTop: 12 }}>No assigned task records were returned for this member.</p>}
        </section>
      </div>
    </DashboardLayout>
  );
}
