import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout.jsx";

const API_BASE_URL = "http://65.0.11.153:5001/api";

const statusOf = (value) =>
  String(value || "").trim().toUpperCase();

const isCompleted = (value) =>
  ["COMPLETED", "COMPLETE", "DONE", "CLOSED"].includes(
    statusOf(value)
  );

function Analytics() {
  const [tasks, setTasks] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const getUserId = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId ?? payload.id ?? payload.sub ?? null;
    } catch {
      return null;
    }
  };

  const userId = getUserId();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(`${API_BASE_URL}/all-tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${API_BASE_URL}/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([taskData, ticketData]) => {
        const taskList =
          taskData?.tasks ||
          taskData?.data ||
          (Array.isArray(taskData) ? taskData : []);

        const ticketList =
          ticketData?.tickets ||
          ticketData?.data ||
          (Array.isArray(ticketData) ? ticketData : []);

        setTasks(Array.isArray(taskList) ? taskList : []);
        setTickets(Array.isArray(ticketList) ? ticketList : []);
      })
      .catch((error) => {
        console.error("Analytics load error:", error);
      })
      .finally(() => setLoading(false));
  }, []);

  const myTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const owner =
          task.claimed_by ??
          task.claimedBy ??
          task.assigned_to ??
          task.assignee_id ??
          task.assigneeId;

        return (
          owner != null &&
          userId != null &&
          String(owner) === String(userId)
        );
      }),
    [tasks, userId]
  );

  const stats = useMemo(() => {
    const completed = myTasks.filter((task) =>
      isCompleted(task.status)
    ).length;

    const inProgress = myTasks.filter((task) =>
      [
        "TODO",
        "ASSIGNED",
        "CLAIMED",
        "IN PROGRESS",
        "IN_PROGRESS",
      ].includes(statusOf(task.status))
    ).length;

    const overdue = myTasks.filter((task) => {
      if (!task.due_date) return false;
      if (isCompleted(task.status)) return false;
      const due = new Date(task.due_date);
      return !Number.isNaN(due.getTime()) && due < new Date();
    }).length;

    const qaPassed = myTasks.filter((task) =>
      ["PASSED", "PASS"].includes(
        statusOf(
          task.qa_status ??
          task.qaStatus ??
          task.qa_result
        )
      )
    ).length;

    const qaFailed = myTasks.filter((task) =>
      ["FAILED", "FAIL"].includes(
        statusOf(
          task.qa_status ??
          task.qaStatus ??
          task.qa_result
        )
      )
    ).length;

    const myTickets = tickets.filter((ticket) => {
      const created =
        ticket.created_by ??
        ticket.createdBy;

      const claimed =
        ticket.claimed_by ??
        ticket.claimedBy;

      return (
        (created != null &&
          userId != null &&
          String(created) === String(userId)) ||
        (claimed != null &&
          userId != null &&
          String(claimed) === String(userId))
      );
    });

    const resolvedTickets = myTickets.filter((ticket) =>
      [
        "COMPLETED",
        "COMPLETE",
        "DONE",
        "CLOSED",
        "RESOLVED",
      ].includes(statusOf(ticket.status))
    ).length;

    return {
      total: myTasks.length,
      completed,
      inProgress,
      overdue,
      qaPassed,
      qaFailed,
      myTickets: myTickets.length,
      resolvedTickets,
    };
  }, [myTasks, tickets, userId]);

  const completionRate = stats.total
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const qaTotal = stats.qaPassed + stats.qaFailed;

  const qaRate = qaTotal
    ? Math.round((stats.qaPassed / qaTotal) * 100)
    : 0;

  // Simple 7-day activity graph. It uses completed_at/updated_at
  // when available and needs no chart library.
  const sevenDayData = useMemo(() => {
    const result = [];
    const today = new Date();

    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);

      const next = new Date(date);
      next.setDate(next.getDate() + 1);

      const count = myTasks.filter((task) => {
        if (!isCompleted(task.status)) return false;

        const raw =
          task.completed_at ||
          task.completedAt ||
          task.updated_at ||
          task.updatedAt;

        if (!raw) return false;

        const completedAt = new Date(raw);
        return completedAt >= date && completedAt < next;
      }).length;

      result.push({
        label: date.toLocaleDateString("en-IN", {
          weekday: "short",
        }),
        count,
      });
    }

    return result;
  }, [myTasks]);

  const maxBar = Math.max(
    1,
    ...sevenDayData.map((item) => item.count)
  );

  return (
    <DashboardLayout>
      <div className="teamflow-page workspace-page">
        <section className="teamflow-heading">
          <p className="welcome-label">INSIGHTS</p>
          <h2>Your analytics.</h2>
          <p className="welcome-description">
            Track delivery, deadlines, QA and ticket performance.
          </p>
        </section>

        {loading ? (
          <section className="workspace-panel">
            <div className="workspace-empty">
              Loading analytics...
            </div>
          </section>
        ) : (
          <>
            <section className="analytics-grid">
              <div className="analytics-card">
                <span>Total Tasks</span>
                <strong>{stats.total}</strong>
                <small>Assigned or claimed</small>
              </div>

              <div className="analytics-card">
                <span>Completed</span>
                <strong>{stats.completed}</strong>
                <small>{completionRate}% completion rate</small>
              </div>

              <div className="analytics-card">
                <span>In Progress</span>
                <strong>{stats.inProgress}</strong>
                <small>Currently active</small>
              </div>

              <div className="analytics-card danger">
                <span>Overdue</span>
                <strong>{stats.overdue}</strong>
                <small>Need attention</small>
              </div>

              <div className="analytics-card">
                <span>QA Passed</span>
                <strong>{stats.qaPassed}</strong>
                <small>{qaRate}% pass rate</small>
              </div>

              <div className="analytics-card danger">
                <span>QA Failed</span>
                <strong>{stats.qaFailed}</strong>
                <small>Failed QA records</small>
              </div>

              <div className="analytics-card">
                <span>My Tickets</span>
                <strong>{stats.myTickets}</strong>
                <small>Created or claimed</small>
              </div>

              <div className="analytics-card">
                <span>Resolved Tickets</span>
                <strong>{stats.resolvedTickets}</strong>
                <small>Completed / resolved</small>
              </div>
            </section>

            <section className="analytics-chart-grid">
              <section className="workspace-panel analytics-chart-card">
                <div className="workspace-panel-head">
                  <div>
                    <p className="welcome-label">ACTIVITY</p>
                    <h3>Tasks completed</h3>
                  </div>
                  <span className="analytics-chart-value">
                    {stats.completed}
                  </span>
                </div>

                <div className="analytics-bars">
                  {sevenDayData.map((item) => (
                    <div className="analytics-bar-column" key={item.label}>
                      <span className="analytics-bar-number">
                        {item.count}
                      </span>
                      <div className="analytics-bar-track">
                        <div
                          className="analytics-bar-fill"
                          style={{
                            height: `${Math.max(
                              item.count
                                ? 10
                                : 3,
                              (item.count / maxBar) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <small>{item.label}</small>
                    </div>
                  ))}
                </div>
              </section>

              <section className="workspace-panel analytics-chart-card">
                <div className="workspace-panel-head">
                  <div>
                    <p className="welcome-label">DELIVERY</p>
                    <h3>Completion rate</h3>
                  </div>
                  <span className="analytics-chart-value">
                    {completionRate}%
                  </span>
                </div>

                <div
                  className="analytics-donut"
                  style={{
                    background: `conic-gradient(#14b8a6 ${completionRate}%, #20354d ${completionRate}% 100%)`,
                  }}
                >
                  <div className="analytics-donut-inner">
                    <strong>{completionRate}%</strong>
                    <span>complete</span>
                  </div>
                </div>

                <div className="analytics-legend">
                  <span>
                    <i className="legend-dot complete" />
                    Completed: {stats.completed}
                  </span>
                  <span>
                    <i className="legend-dot remaining" />
                    Remaining: {Math.max(0, stats.total - stats.completed)}
                  </span>
                </div>
              </section>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Analytics;
