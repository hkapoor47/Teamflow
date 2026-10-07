import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { apiGet, getArray, getCurrentUserId, normalizeStatus, formatDate } from "../../utils/workspaceApi.js";

function Completed() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("projects");
  const navigate = useNavigate();
  const userId = getCurrentUserId();

  useEffect(() => {
    Promise.all([apiGet("/projects"), apiGet("/all-tasks")])
      .then(([projectData, taskData]) => {
        setProjects(getArray(projectData, ["projects", "data"]));
        setTasks(getArray(taskData, ["tasks", "data"]));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const completedProjects = useMemo(
    () => projects.filter((p) => normalizeStatus(p.status) === "COMPLETED"),
    [projects]
  );

  const completedTasks = useMemo(
    () => tasks.filter((task) => {
      const owner = task.claimed_by ?? task.claimedBy ?? task.assigned_to ?? task.assignee_id;
      return String(owner) === String(userId) &&
        ["COMPLETED", "COMPLETE", "DONE", "CLOSED"].includes(normalizeStatus(task.status));
    }),
    [tasks, userId]
  );

  const data = tab === "projects" ? completedProjects : completedTasks;

  return (
    <DashboardLayout>
      <div className="teamflow-page workspace-page">
        <section className="teamflow-heading">
          <p className="welcome-label">DELIVERY HISTORY</p>
          <h2>Completed work.</h2>
          <p className="welcome-description">
            Successfully completed projects and tasks from your workspace.
          </p>
        </section>

        <div className="workspace-tabs">
          <button className={tab === "projects" ? "active" : ""} onClick={() => setTab("projects")}>
            Completed Projects
          </button>
          <button className={tab === "tasks" ? "active" : ""} onClick={() => setTab("tasks")}>
            My Completed Tasks
          </button>
        </div>

        <section className="workspace-panel">
          <div className="workspace-panel-head">
            <div>
              <p className="welcome-label">{tab === "projects" ? "PROJECTS" : "TASKS"}</p>
              <h3>{tab === "projects" ? "Completed projects" : "Completed tasks"}</h3>
            </div>
            <span className="workspace-count">{data.length}</span>
          </div>

          {loading ? (
            <div className="workspace-empty">Loading completed work...</div>
          ) : data.length === 0 ? (
            <div className="workspace-empty">
              <strong>Nothing completed yet</strong>
              <p>Completed work will appear here automatically.</p>
            </div>
          ) : (
            <div className="workspace-list">
              {data.map((item) => (
                <article
                  className="workspace-row"
                  key={item.id}
                  onClick={() => tab === "projects" && navigate(`/projects/${item.id}`)}
                  role={tab === "projects" ? "button" : undefined}
                >
                  <div className="workspace-row-icon tone-success">✓</div>
                  <div className="workspace-row-main">
                    <strong>{item.name || item.title}</strong>
                    <p>
                      {tab === "projects"
                        ? item.description || "Project successfully completed."
                        : item.project_name || item.projectName || "TeamFlow task"}
                    </p>
                  </div>
                  <time>{formatDate(item.completed_at || item.updated_at || item.created_at)}</time>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default Completed;
