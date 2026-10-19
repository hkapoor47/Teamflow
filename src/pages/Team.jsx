import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { useProjects } from "../context/ProjectContext.jsx";
import { getCurrentUserId } from "./workspaceApi.js";

const idOf = (value) =>
  value?.id ?? value?.user_id ?? value?.userId ?? value?._id ?? value?.project_id ?? value?.projectId ?? null;
const sameId = (a, b) => a != null && b != null && String(a).trim() === String(b).trim();
const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");
const text = (value, fallback = "") => String(value ?? fallback).trim();
const userName = (user) => user?.name || user?.username || user?.full_name || user?.email || "Unnamed member";
const initials = (name) => text(name, "U").split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const projectIdOf = (project) => project?.id ?? project?.project_id ?? project?._id;
const projectNameOf = (project) => project?.name || project?.project_name || project?.title || `Project ${projectIdOf(project) ?? ""}`;
const taskProjectId = (task) => task?.projectId ?? task?.project_id ?? null;
const taskAssigneeId = (task) => firstDefined(task?.assigneeId, task?.assigned_to, task?.assignee_id, task?.assigned_user_id);
const taskClaimerId = (task) => firstDefined(task?.claimedBy, task?.claimed_by, task?.claimed_by_id);
const taskCreatorId = (task) => firstDefined(task?.created_by, task?.createdBy, task?.creator_id, task?.created_by_user_id);
const taskMemberName = (task, memberId) => {
  if (sameId(taskAssigneeId(task), memberId)) {
    return firstDefined(task?.assigned_to_name, task?.assignee_name, task?.assigneeName, task?.assigned_user_name);
  }
  if (sameId(taskClaimerId(task), memberId)) {
    return firstDefined(task?.claimed_by_name, task?.claimedByName, task?.claimer_name);
  }
  if (sameId(taskCreatorId(task), memberId)) {
    return firstDefined(task?.created_by_name, task?.creator_name, task?.createdByName);
  }
  return null;
};
const projectManagerId = (project) => project?.created_by ?? project?.manager_id ?? project?.managerId ?? project?.createdBy ?? project?.owner_id ?? project?.user_id ?? null;
const isCompleted = (task) => ["complete", "completed", "done", "closed"].includes(String(task?.status ?? task?.task_status ?? "").trim().toLowerCase());

function Team() {
  const navigate = useNavigate();
  const { projects = [], tasks = [], members = [], loadingProjects, loadingTasks } = useProjects();
  const currentUserId = getCurrentUserId();
  const [expandedProject, setExpandedProject] = useState(null);

  const currentUser = useMemo(() => {
    const fromApi = members.find((user) => String(idOf(user)) === String(currentUserId));
    if (fromApi) return fromApi;
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, [members, currentUserId]);

  const resolvedCurrentUserId = currentUserId ?? idOf(currentUser);

  // Show projects the current user created, has a task assigned in, or has claimed a task in.
  const myProjects = useMemo(() => {
    const currentId = String(resolvedCurrentUserId ?? "");
    if (!currentId) return [];

    return projects.filter((project) => {
      const projectId = String(projectIdOf(project) ?? "");
      if (!projectId) return false;

      const isCreator = sameId(projectManagerId(project), currentId);
      const participatesInTask = tasks.some((task) => {
        if (String(taskProjectId(task) ?? "") !== projectId) return false;
        return sameId(taskAssigneeId(task), currentId) || sameId(taskClaimerId(task), currentId) || sameId(taskCreatorId(task), currentId);
      });

      return isCreator || participatesInTask;
    });
  }, [projects, tasks, resolvedCurrentUserId]);

  const projectCards = useMemo(() => myProjects.map((project) => {
    const projectId = String(projectIdOf(project));
    const projectTasks = tasks.filter((task) => String(taskProjectId(task) ?? "") === projectId);
    const memberIds = new Set();
    const managerId = projectManagerId(project);
    if (managerId != null) memberIds.add(String(managerId));

    projectTasks.forEach((task) => {
      const assigneeId = taskAssigneeId(task);
      const claimerId = taskClaimerId(task);
      const creatorId = taskCreatorId(task);
      if (assigneeId != null) memberIds.add(String(assigneeId));
      if (claimerId != null) memberIds.add(String(claimerId));
      if (creatorId != null) memberIds.add(String(creatorId));
    });

    const projectMembers = [...memberIds].map((memberId) => {
      const user = members.find((candidate) => sameId(idOf(candidate), memberId));
      if (user) return user;
      if (String(idOf(currentUser) ?? "") === memberId && currentUser) return currentUser;

      const relatedTask = projectTasks.find((task) =>
        sameId(taskAssigneeId(task), memberId) ||
        sameId(taskClaimerId(task), memberId) ||
        sameId(taskCreatorId(task), memberId)
      );
      const relatedName = relatedTask ? taskMemberName(relatedTask, memberId) : null;
      return { id: memberId, name: relatedName || `User ${memberId}`, email: "" };
    }).filter(Boolean);

    return { id: projectId, name: projectNameOf(project), tasks: projectTasks, members: projectMembers };
  }), [myProjects, tasks, members, currentUser]);

  const loading = Boolean(loadingProjects || loadingTasks);

  return (
    <DashboardLayout>
      <div className="teamflow-page workspace-page teams-page">
        <section className="teamflow-heading">
          <p className="welcome-label">PEOPLE</p>
          <h2>My project teams</h2>
          <p className="welcome-description">Every project you participate in appears as its own group, with its members and their assigned work.</p>
        </section>

        {loading ? (
          <section className="workspace-panel"><div className="workspace-empty">Loading projects and members...</div></section>
        ) : projectCards.length === 0 ? (
          <section className="workspace-panel">
            <div className="workspace-empty">
              <strong>No project teams found</strong>
              <p>Projects appear here when you created them or have a task assigned to you or claimed by you.</p>
            </div>
          </section>
        ) : (
          <section className="team-directory" aria-label="Projects and their members">
            {projectCards.map(({ id, name, tasks: projectTasks, members: projectMembers }) => {
              const isOpen = expandedProject === id;
              const completed = projectTasks.filter(isCompleted).length;

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
                        const memberName = userName(member);
                        const isCurrent = String(memberId ?? "") === String(resolvedCurrentUserId ?? "");
                        const memberTaskCount = projectTasks.filter((task) =>
                          String(taskAssigneeId(task) ?? "") === String(memberId ?? "") ||
                          String(taskClaimerId(task) ?? "") === String(memberId ?? "")
                        ).length;

                        return (
                          <div className={`team-compact-member ${isCurrent ? "current-member" : ""}`} key={String(memberId ?? memberName)}>
                            <div className="team-avatar">{initials(memberName)}</div>
                            <div className="team-member-main">
                              <strong>{memberName}</strong>
                              <span>{member.email || member.department || "Project member"} · {memberTaskCount} task{memberTaskCount === 1 ? "" : "s"} assigned/claimed</span>
                            </div>
                            {isCurrent && <em>You</em>}
                            <button type="button" className="view-button" onClick={() => navigate(`/team/${encodeURIComponent(String(memberId))}`)} disabled={memberId == null}>View profile</button>
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
