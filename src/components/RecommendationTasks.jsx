import { useEffect, useState } from "react";
import TaskCard from "./TaskCard.jsx";
import "./recommended-tasks.css";

const API_BASE_URL = "http://65.0.11.153:5001/api";

function normalizeTask(item) {
  const task = item.task || item;
  return {
    ...task,
    id: task.id ?? task.taskId ?? item.taskId,
    title: task.title ?? task.task_title ?? task.name ?? "Untitled task",
    status: task.status ?? "Available",
    dueDate: task.dueDate ?? task.due_date ?? task.deadline ?? "Not set",
    progress: Number(task.progress ?? task.progress_percent ?? 0),
    assigneeId:
      task.assigneeId ??
      task.assignee_id ??
      task.assigned_to ??
      task.assignedTo ??
      null,
    projectName:
      task.projectName ??
      task.project_name ??
      item.projectName ??
      item.project_name ??
      "Project",
    recommendationScore:
      item.successProbability ??
      item.recommendationScore ??
      item.score ??
      item.predicted_success_probability ??
      null,
    recommendationReason:
      item.reason ?? item.explanation ?? item.recommendationReason ?? "",
  };
}

export default function RecommendedTasks({ onClaim }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadRecommendations() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Please log in to view your task recommendations.");
        }

        const response = await fetch(
          `${API_BASE_URL}/recommendations/my-tasks`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }
        );

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            data.message ||
              data.error ||
              `Could not load recommendations (HTTP ${response.status}).`
          );
        }

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.recommendations)
            ? data.recommendations
            : Array.isArray(data.tasks)
              ? data.tasks
              : [];

        setTasks(list.map(normalizeTask).filter((task) => task.id != null));
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("User task recommendations error:", err);
          setError(err.message || "Unable to load recommended tasks.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadRecommendations();
    return () => controller.abort();
  }, []);

  return (
    <section className="recommended-tasks-section">
      <div className="recommended-tasks-heading">
        <div>
          <p className="recommended-tasks-eyebrow">AI FOR YOU</p>
          <h2>Recommended tasks</h2>
          <p>Available tasks ranked for your profile and work history.</p>
        </div>
        <button
          type="button"
          className="recommended-tasks-refresh"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>

      {loading && <p role="status">Finding tasks that fit your profile…</p>}

      {!loading && error && (
        <div className="recommended-tasks-error" role="alert">
          {error}
          <p>
            If this is an API error, confirm that the backend route
            <code> GET /api/recommendations/my-tasks </code>
            is implemented and that the server is running.
          </p>
        </div>
      )}

      {!loading && !error && tasks.length === 0 && (
        <p className="recommended-tasks-empty">
          No recommended tasks are available right now.
        </p>
      )}

      {!loading && !error && tasks.length > 0 && (
        <div className="recommended-tasks-list">
          {tasks.map((task) => (
            <div className="recommended-task-item" key={task.id}>
              {task.recommendationScore != null && (
                <div className="recommended-task-score">
                  AI match:{" "}
                  {Number(task.recommendationScore) <= 1
                    ? `${Math.round(Number(task.recommendationScore) * 100)}%`
                    : `${Math.round(Number(task.recommendationScore))}%`}
                </div>
              )}
              {task.recommendationReason && (
                <p className="recommended-task-reason">
                  {task.recommendationReason}
                </p>
              )}
              <TaskCard
                task={task}
                projectName={task.projectName}
                onClaim={onClaim}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
