import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { apiGet, getArray, getCurrentUserId, normalizeStatus } from "./workspaceApi.js";

function Analytics() {
  const [tasks, setTasks] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = getCurrentUserId();

  useEffect(() => {
    Promise.all([apiGet("/all-tasks"), apiGet("/tickets")])
      .then(([taskData, ticketData]) => {
        setTasks(getArray(taskData, ["tasks", "data"]));
        setTickets(getArray(ticketData, ["tickets", "data"]));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const myTasks = useMemo(() => tasks.filter((t) => {
    const owner = t.claimed_by ?? t.claimedBy ?? t.assigned_to ?? t.assignee_id;
    return owner != null && String(owner) === String(userId);
  }), [tasks, userId]);

  const stats = useMemo(() => {
    const completed = myTasks.filter((t) =>
      ["COMPLETED", "COMPLETE", "DONE", "CLOSED"].includes(normalizeStatus(t.status))
    ).length;

    const active = myTasks.filter((t) =>
      ["TODO", "IN PROGRESS", "IN_PROGRESS", "ASSIGNED", "CLAIMED"].includes(normalizeStatus(t.status))
    ).length;

    const overdue = myTasks.filter((t) => {
      if (!t.due_date) return false;
      const done = ["COMPLETED", "COMPLETE", "DONE", "CLOSED"].includes(normalizeStatus(t.status));
      return !done && new Date(t.due_date) < new Date();
    }).length;

    const qaPassed = myTasks.filter((t) => normalizeStatus(t.qa_status) === "PASSED").length;
    const qaFailed = myTasks.filter((t) => normalizeStatus(t.qa_status) === "FAILED").length;

    const myTickets = tickets.filter((t) => {
      const created = t.created_by ?? t.createdBy;
      const claimed = t.claimed_by ?? t.claimedBy;
      return (
        (created != null && String(created) === String(userId)) ||
        (claimed != null && String(claimed) === String(userId))
      );
    });

    const resolvedTickets = myTickets.filter((t) =>
      ["COMPLETED", "COMPLETE", "DONE", "CLOSED", "RESOLVED"].includes(normalizeStatus(t.status))
    ).length;

    return {
      total: myTasks.length,
      completed,
      active,
      overdue,
      qaPassed,
      qaFailed,
      qaTotal: qaPassed + qaFailed,
      tickets: myTickets.length,
      resolvedTickets,
    };
  }, [myTasks, tickets, userId]);

  const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  const qaRate = stats.qaTotal ? Math.round((stats.qaPassed / stats.qaTotal) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="teamflow-page workspace-page">
        <section className="teamflow-heading">
          <p className="welcome-label">INSIGHTS</p>
          <h2>Your analytics.</h2>
          <p className="welcome-description">
            A practical view of your delivery, deadlines, QA and tickets.
          </p>
        </section>

        {loading ? (
          <section className="workspace-panel">
            <div className="workspace-empty">Loading analytics...</div>
          </section>
        ) : (
          <>
            <section className="analytics-grid">
              <div className="analytics-card"><span>Total Tasks</span><strong>{stats.total}</strong><small>Assigned or claimed</small></div>
              <div className="analytics-card"><span>Completed</span><strong>{stats.completed}</strong><small>{completionRate}% completion rate</small></div>
              <div className="analytics-card"><span>In Progress</span><strong>{stats.active}</strong><small>Currently active</small></div>
              <div className="analytics-card danger"><span>Overdue</span><strong>{stats.overdue}</strong><small>Need attention</small></div>
              <div className="analytics-card"><span>QA Passed</span><strong>{stats.qaPassed}</strong><small>{qaRate}% pass rate</small></div>
              <div className="analytics-card danger"><span>QA Failed</span><strong>{stats.qaFailed}</strong><small>Current failed status</small></div>
              <div className="analytics-card"><span>My Tickets</span><strong>{stats.tickets}</strong><small>Created or claimed</small></div>
              <div className="analytics-card"><span>Resolved Tickets</span><strong>{stats.resolvedTickets}</strong><small>Completed / resolved</small></div>
            </section>

            <section className="workspace-panel">
              <div className="workspace-panel-head">
                <div>
                  <p className="welcome-label">PROGRESS</p>
                  <h3>Work completion</h3>
                </div>
                <strong className="analytics-percent">{completionRate}%</strong>
              </div>
              <div className="analytics-bar">
                <span style={{ width: `${completionRate}%` }} />
              </div>
              <div className="analytics-bar-labels">
                <span>{stats.completed} completed</span>
                <span>{stats.total - stats.completed} remaining</span>
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Analytics;
