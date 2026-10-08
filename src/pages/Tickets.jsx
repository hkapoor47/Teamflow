import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import {
  apiGet,
  API_BASE_URL,
  getCurrentUserId,
  getToken,
  getArray,
  normalizeStatus,
  formatDate,
} from "./workspaceApi.js";

const CLOSED = ["COMPLETED", "COMPLETE", "DONE", "CLOSED", "RESOLVED"];

function valueId(value) {
  return value?.id ?? value?.project_id ?? value?.projectId ?? value?._id ?? value;
}

function sameId(a, b) {
  return a != null && b != null && String(a) === String(b);
}

function getProjectId(item) {
  return (
    item?.project_id ??
    item?.projectId ??
    item?.project?.id ??
    item?.project?.project_id ??
    item?.project?.projectId ??
    null
  );
}

function getProjectName(item) {
  return (
    item?.project_name ??
    item?.projectName ??
    item?.project?.name ??
    item?.project?.project_name ??
    ""
  );
}

function collectIds(value, output) {
  if (value == null) return;
  if (Array.isArray(value)) {
    value.forEach((entry) => collectIds(entry, output));
    return;
  }
  if (typeof value === "object") {
    const id = value.id ?? value.user_id ?? value.userId ?? value._id;
    if (id != null) output.add(String(id));
    return;
  }
  output.add(String(value));
}

function userIsInProject(project, userId) {
  if (!project || userId == null) return false;

  const userFields = [
    project.manager_id,
    project.managerId,
    project.created_by,
    project.createdBy,
    project.owner_id,
    project.ownerId,
    project.assigned_to,
    project.assignedTo,
    project.member_id,
    project.memberId,
    project.members,
    project.team_members,
    project.teamMembers,
    project.users,
    project.memberships,
  ];

  const ids = new Set();
  userFields.forEach((field) => collectIds(field, ids));
  return ids.has(String(userId));
}

function taskBelongsToUser(task, userId) {
  if (!task || userId == null) return false;

  const fields = [
    task.assigned_to,
    task.assignedTo,
    task.assignee_id,
    task.assigneeId,
    task.claimed_by,
    task.claimedBy,
    task.user_id,
    task.userId,
    task.employee_id,
    task.employeeId,
  ];

  return fields.some((field) => {
    if (Array.isArray(field)) return field.some((v) => sameId(valueId(v), userId));
    return sameId(valueId(field), userId);
  });
}

function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);

  const userId = getCurrentUserId();

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      setError("");

      const results = await Promise.allSettled([
        apiGet("/tickets"),
        apiGet("/projects"),
        apiGet("/tasks"),
      ]);

      const ticketResult = results[0];
      const projectResult = results[1];
      const taskResult = results[2];

      if (ticketResult.status === "rejected") {
        throw ticketResult.reason;
      }

      setTickets(getArray(ticketResult.value, ["tickets", "data"]));
      setProjects(
        projectResult.status === "fulfilled"
          ? getArray(projectResult.value, ["projects", "data"])
          : []
      );
      setTasks(
        taskResult.status === "fulfilled"
          ? getArray(taskResult.value, ["tasks", "data"])
          : []
      );
    } catch (err) {
      console.error("Load ticket workspace error:", err);
      setError(err.message || "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  const involvedProjectKeys = useMemo(() => {
    const ids = new Set();
    const names = new Set();

    projects.forEach((project) => {
      if (!userIsInProject(project, userId)) return;
      const id = valueId(project);
      const name = getProjectName(project);
      if (id != null) ids.add(String(id));
      if (name) names.add(name.trim().toLowerCase());
    });

    tasks.forEach((task) => {
      if (!taskBelongsToUser(task, userId)) return;
      const id = getProjectId(task);
      const name = getProjectName(task);
      if (id != null) ids.add(String(id));
      if (name) names.add(name.trim().toLowerCase());
    });

    return { ids, names };
  }, [projects, tasks, userId]);

  const visibleTickets = useMemo(() => {
    return tickets
      .filter((ticket) => {
        const claimedBy = ticket.claimed_by ?? ticket.claimedBy;
        const claimedByMe = sameId(claimedBy, userId);
        const projectId = getProjectId(ticket);
        const projectName = getProjectName(ticket).trim().toLowerCase();

        // Always show a ticket already claimed by the logged-in user.
        if (claimedByMe) return true;

        // Otherwise only show tickets belonging to a project the user is involved in.
        if (projectId != null && involvedProjectKeys.ids.has(String(projectId))) return true;
        if (projectName && involvedProjectKeys.names.has(projectName)) return true;

        return false;
      })
      .filter((ticket) => !CLOSED.includes(normalizeStatus(ticket.status)));
  }, [tickets, involvedProjectKeys, userId]);

  const claimTicket = async (id) => {
    try {
      setActionId(id);
      setError("");
      const response = await fetch(`${API_BASE_URL}/tickets/${id}/claim`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Failed to claim ticket.");
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId(null);
    }
  };

  const completeTicket = async (id) => {
    try {
      setActionId(id);
      setError("");
      const response = await fetch(`${API_BASE_URL}/tickets/${id}/complete`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Failed to complete ticket.");
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="teamflow-page workspace-page tickets-page">
        <section className="teamflow-heading">
          <p className="welcome-label">PROJECT ISSUES</p>
          <h2>Tickets.</h2>
          <p className="welcome-description">
            Issues from projects you are working on. You can claim an open ticket or continue a ticket already assigned to you.
          </p>
        </section>

        {error && <div className="workspace-alert">{error}</div>}

        <section className="ticket-scope-card">
          <div>
            <span className="ticket-scope-label">YOUR WORKSPACE</span>
            <h3>{visibleTickets.length} active ticket{visibleTickets.length === 1 ? "" : "s"}</h3>
            <p>Only tickets from your involved projects are shown.</p>
          </div>
          <div className="ticket-scope-badge">{involvedProjectKeys.ids.size || involvedProjectKeys.names.size} projects</div>
        </section>

        <section className="workspace-panel ticket-workspace-panel">
          <div className="workspace-panel-head">
            <div>
              <p className="welcome-label">TICKETS</p>
              <h3>Project issues</h3>
              <p>Open issues you can work on.</p>
            </div>
            <span className="workspace-count">{visibleTickets.length}</span>
          </div>

          {loading ? (
            <div className="workspace-empty">Loading project tickets...</div>
          ) : visibleTickets.length === 0 ? (
            <div className="workspace-empty">
              <strong>No active tickets in your projects</strong>
              <p>New QA issues from projects you are involved in will appear here.</p>
            </div>
          ) : (
            <div className="workspace-list">
              {visibleTickets.map((ticket) => {
                const id = ticket.id ?? ticket.ticket_id ?? ticket.ticketId;
                const claimedBy = ticket.claimed_by ?? ticket.claimedBy;
                const claimedByMe = sameId(claimedBy, userId);
                const status = normalizeStatus(ticket.status) || "OPEN";

                return (
                  <article className="workspace-ticket improved-ticket" key={id}>
                    <div className="ticket-main-content">
                      <div className="workspace-ticket-top">
                        <span>#{id}</span>
                        <b>{status}</b>
                      </div>
                      <h3>{ticket.title || `Ticket #${id}`}</h3>
                      <p>{ticket.description || "No description provided."}</p>
                      <div className="workspace-meta">
                        <span>Project: {getProjectName(ticket) || "—"}</span>
                        <span>Priority: {ticket.priority || "Medium"}</span>
                        <span>Deadline: {formatDate(ticket.due_date || ticket.deadline)}</span>
                        <span>{claimedByMe ? "Claimed by you" : claimedBy ? "Claimed by another member" : "Open to claim"}</span>
                      </div>
                    </div>

                    <div className="ticket-action-area">
                      {!claimedBy && (
                        <button className="claim-button" onClick={() => claimTicket(id)} disabled={actionId === id}>
                          {actionId === id ? "Claiming…" : "Claim"}
                        </button>
                      )}

                      {claimedByMe && !CLOSED.includes(status) && (
                        <button className="complete-ticket-button" onClick={() => completeTicket(id)} disabled={actionId === id}>
                          {actionId === id ? "Completing…" : "Complete"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default Tickets;
