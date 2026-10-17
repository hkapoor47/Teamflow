import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { useProjects } from "../context/ProjectContext.jsx";
import { getCurrentUserId } from "./workspaceApi.js";

const idOf = (value) => value?.id ?? value?.user_id ?? value?.userId ?? value?._id ?? value?.project_id ?? value?.projectId ?? null;
const text = (value, fallback = "") => String(value ?? fallback).trim();
const userName = (user) => user?.name || user?.username || user?.full_name || user?.email || "Unnamed member";
const initials = (name) => text(name, "U").split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const projectIdOf = (project) => project?.id ?? project?.project_id ?? project?._id;
const projectNameOf = (project) => project?.name || project?.project_name || project?.title || `Project ${projectIdOf(project) ?? ""}`;
const taskProjectId = (task) => task?.projectId ?? task?.project_id ?? null;
const taskAssigneeId = (task) => task?.assigneeId ?? task?.assigned_to ?? task?.assignee_id ?? task?.user_id ?? null;
const projectManagerId = (project) => project?.manager_id ?? project?.managerId ?? project?.created_by ?? project?.createdBy ?? project?.owner_id ?? project?.user_id ?? null;

function Team() {
  const navigate = useNavigate();
  const { projects = [], tasks = [], members = [], loadingProjects, loadingTasks } = useProjects();
  const currentUserId = getCurrentUserId();
  const [expandedProject, setExpandedProject] = useState(null);

  const currentUser = useMemo(() => {
    const fromApi = members.find((user) => String(idOf(user)) === String(currentUserId));
    if (fromApi) return fromApi;
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  }, [members, currentUserId]);

  const myProjects = useMemo(() => {
    const currentId = String(currentUserId ?? idOf(currentUser) ?? "");
    if (!currentId) return [];
    return projects.filter((project) => {
      const pid = String(projectIdOf(project));
      const isManager = String(projectManagerId(project) ?? "") === currentId;
      const hasAssignedTask = tasks.some((task) => String(taskProjectId(task)) === pid && String(taskAssigneeId(task) ?? "") === currentId);
      return isManager || hasAssignedTask;
    });
  }, [projects, tasks, currentUserId, currentUser]);

  const projectCards = useMemo(() => myProjects.map((project) => {
    const projectId = String(projectIdOf(project));
    const projectTasks = tasks.filter((task) => String(taskProjectId(task)) === projectId);
    const memberIds = new Set();
    const managerId = projectManagerId(project);
    if (managerId != null) memberIds.add(String(managerId));
    projectTasks.forEach((task) => {
      const assigneeId = taskAssigneeId(task);
      if (assigneeId != null) memberIds.add(String(assigneeId));
    });
    const projectMembers = [...memberIds].map((memberId) => {
      const user = members.find((candidate) => String(idOf(candidate)) === memberId);
      if (user) return user;
      if (String(idOf(currentUser)) === memberId && currentUser) return currentUser;
      return { id: memberId, name: memberId === String(managerId) ? "Project manager" : "Member", email: "" };
    });
    return { project, id: projectId, name: projectNameOf(project), tasks: projectTasks, members: projectMembers };
  }), [myProjects, tasks, members, currentUser]);

  const loading = loadingProjects || loadingTasks;

  return (
    <DashboardLayout>
      <div className="teamflow-page workspace-page teams-page">
        <section className="teamflow-heading">
          <p className="welcome-label">PEOPLE</p>
          <h2>My project teams</h2>
          <p className="welcome-description">See the projects you work on, their members, and each member's individual work profile.</p>
        </section>

        {loading ? (
          <section className="workspace-panel"><div className="workspace-empty">Loading projects and members...</div></section>
        ) : projectCards.length === 0 ? (
          <section className="workspace-panel">
            <div className="workspace-empty">
              <strong>No project teams found</strong>
              <p>Projects appear here when you manage a project or have a task assigned to you.</p>
            </div>
          </section>
        ) : (
          <section className="team-directory" aria-label="Projects and their members">
            {projectCards.map(({ project, id, name, tasks: projectTasks, members: projectMembers }) => {
              const isOpen = expandedProject === id;
              const completed = projectTasks.filter((task) => /complete|done/i.test(String(task.status || ""))).length;
              return (
                <article className={`team-directory-card ${isOpen ? "is-open" : ""}`} key={id}>
                  <button type="button" className="team-directory-header" onClick={() => setExpandedProject(isOpen ? null : id)} aria-expanded={isOpen}>
                    <div className="team-directory-title">
                      <div className="team-directory-icon">{initials(name)}</div>
                      <div>
                        <div className="team-directory-kicker">PROJECT TEAM</div>
                        <h3>{name}</h3>
                        <p>{projectMembers.length} member{projectMembers.length === 1 ? "" : "s"} · {projectTasks.length} task{projectTasks.length === 1 ? "" : "s"} · {completed} completed</p>
                      </div>
                    </div>
                    <span className="team-directory-arrow">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="team-members-panel">
                      {projectMembers.map((member) => {
                        const memberId = idOf(member);
                        const nameForMember = userName(member);
                        const isCurrent = String(memberId) === String(currentUserId ?? idOf(currentUser));
                        const memberTaskCount = projectTasks.filter((task) => String(taskAssigneeId(task) ?? "") === String(memberId)).length;
                        return (
                          <div className={`team-compact-member ${isCurrent ? "current-member" : ""}`} key={String(memberId)}>
                            <div className="team-avatar">{initials(nameForMember)}</div>
                            <div className="team-member-main">
                              <strong>{nameForMember}</strong>
                              <span>{member.email || member.department || "Project member"} · {memberTaskCount} assigned task{memberTaskCount === 1 ? "" : "s"}</span>
                            </div>
                            {isCurrent && <em>You</em>}
                            <button type="button" className="view-button" onClick={() => navigate(`/team/${encodeURIComponent(String(memberId))}`)} disabled={!memberId}>View profile</button>
                          </div>
                        );
                      })}
                      {projectMembers.length === 0 && <div className="workspace-empty">No project members could be identified from the available project/task data.</div>}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Team;
