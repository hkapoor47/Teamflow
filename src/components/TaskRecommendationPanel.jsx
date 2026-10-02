import { useEffect, useState } from "react";

const API_BASE_URL = "http://65.0.11.153:5001/api";

const formatPercent = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(2)}%` : "—";
};

const formatFeature = (key, value) => {
  if (value === null || value === undefined) return "—";

  const percentageFields = [
    "skill_match",
    "completion_rate",
    "on_time_rate",
    "qa_pass_rate",
    "similar_task_success_rate",
  ];

  if (percentageFields.includes(key)) {
    return `${(Number(value) * 100).toFixed(0)}%`;
  }

  if (key === "avg_completion_hours") {
    return `${Number(value).toFixed(1)} h`;
  }

  return String(value);
};

function TaskRecommendationPanel({ task, onClose }) {
  const [recommendations, setRecommendations] = useState([]);
  const [taskInfo, setTaskInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [assigningId, setAssigningId] = useState(null);
  const [assignedId, setAssignedId] = useState(null);

  useEffect(() => {
    const loadRecommendations = async () => {
      if (!task?.id) return;

      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Authentication required. Please login again.");
        }

        const [recommendationResponse, usersResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/recommendations/task/${task.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const data = await recommendationResponse.json();
        const usersData = await usersResponse.json();

        if (!recommendationResponse.ok) {
          throw new Error(
            data.message || data.error || "Failed to load AI recommendations"
          );
        }

        setTaskInfo(data.task || null);
        setRecommendations(
          Array.isArray(data.recommendations) ? data.recommendations : []
        );
        setUsers(
          Array.isArray(usersData.users)
            ? usersData.users
            : Array.isArray(usersData)
              ? usersData
              : []
        );
      } catch (err) {
        console.error("AI recommendation error:", err);
        setError(err.message || "Failed to load AI recommendations.");
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [task?.id]);

  const getEmployeeName = (employee) => {
    const id = employee.employeeId ?? employee.userId ?? employee.id;
    const user = users.find((item) => String(item.id) === String(id));

    return (
      employee.employeeName ||
      employee.userName ||
      employee.name ||
      user?.name ||
      user?.username ||
      user?.email ||
      `User ${id}`
    );
  };

  const assignRecommendation = async (employee) => {
    const employeeId = employee.employeeId ?? employee.userId ?? employee.id;

    if (!employeeId || !task?.id) return;

    try {
      setAssigningId(employeeId);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required. Please login again.");

      const response = await fetch(
        `${API_BASE_URL}/projects/tasks/${task.id}/assign`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ assigned_to: Number(employeeId) }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to assign task");
      }

      setAssignedId(Number(employeeId));
    } catch (err) {
      console.error("AI assignment error:", err);
      setError(err.message || "Failed to assign task.");
    } finally {
      setAssigningId(null);
    }
  };

  if (!task) return null;

  return (
    <section
      style={{
        gridColumn: "1 / -1",
        width: "100%",
        boxSizing: "border-box",
        marginTop: "20px",
        padding: "24px",
        borderRadius: "14px",
        border: "1px solid rgba(45,212,191,.25)",
        background: "rgba(15,23,42,.72)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          marginBottom: "18px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: ".08em",
              color: "#5eead4",
              marginBottom: "5px",
            }}
          >
            AI ASSIGNMENT RECOMMENDATION
          </div>
          <h3 style={{ margin: 0 }}>
            {task.title || task.name || `Task #${task.id}`}
          </h3>
          <p style={{ margin: "6px 0 0", color: "#94a3b8" }}>
            Employees are ranked using skills, workload, completion history,
            deadlines and QA performance.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            border: "1px solid rgba(148,163,184,.25)",
            borderRadius: "8px",
            padding: "7px 11px",
            background: "transparent",
            color: "#cbd5e1",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>

      {loading && (
        <div style={{ padding: "22px 0", color: "#94a3b8" }}>
          Running AI recommendation...
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "9px",
            background: "rgba(239,68,68,.10)",
            color: "#fca5a5",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {taskInfo?.requiredSkills?.length > 0 && (
            <div style={{ marginBottom: "18px" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#94a3b8",
                  marginBottom: "8px",
                }}
              >
                REQUIRED SKILLS
              </div>
              <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
                {taskInfo.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "999px",
                      background: "rgba(20,184,166,.12)",
                      border: "1px solid rgba(20,184,166,.25)",
                      color: "#5eead4",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {recommendations.length === 0 ? (
            <div style={{ color: "#94a3b8" }}>
              No recommendation data is available for this task.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {recommendations.map((employee, index) => {
                const features = employee.features || {};
                const probability = Number(employee.successProbability) || 0;

                return (
                  <div
                    key={employee.employeeId ?? index}
                    className="teamflow-ai-recommendation-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "220px minmax(0, 1fr)",
                      alignItems: "center",
                      gap: "18px",
                      padding: "16px",
                      borderRadius: "12px",
                      border:
                        index === 0
                          ? "1px solid rgba(20,184,166,.45)"
                          : "1px solid rgba(148,163,184,.16)",
                      background:
                        index === 0
                          ? "rgba(20,184,166,.06)"
                          : "rgba(30,41,59,.45)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            display: "inline-flex",
                            marginRight: "8px",
                            padding: "4px 7px",
                            borderRadius: "6px",
                            background: "rgba(148,163,184,.12)",
                            color: "#cbd5e1",
                            fontSize: "10px",
                            fontWeight: 800,
                          }}
                        >
                          #{employee.rank || index + 1}
                        </span>
                        <strong>{getEmployeeName(employee)}</strong>
                      </div>

                      <strong
                        style={{
                          color: probability >= 60 ? "#5eead4" : "#fbbf24",
                          fontSize: "18px",
                        }}
                      >
                        {formatPercent(probability)}
                      </strong>
                    </div>

                    <div
                      style={{
                        marginTop: "6px",
                        color: probability >= 50 ? "#86efac" : "#fcd34d",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      {employee.prediction || "Prediction unavailable"}
                    </div>

                    <div style={{ marginTop: "10px" }}>
                      <button
                        type="button"
                        onClick={() => assignRecommendation(employee)}
                        disabled={
                          assigningId === (employee.employeeId ?? employee.userId ?? employee.id) ||
                          assignedId === Number(employee.employeeId ?? employee.userId ?? employee.id)
                        }
                        style={{
                          border: "none",
                          borderRadius: "8px",
                          padding: "9px 14px",
                          background: assignedId === Number(employee.employeeId ?? employee.userId ?? employee.id)
                            ? "#15803d"
                            : "#14b8a6",
                          color: "white",
                          fontWeight: 800,
                          fontSize: "11px",
                          cursor: "pointer",
                        }}
                      >
                        {assignedId === Number(employee.employeeId ?? employee.userId ?? employee.id)
                          ? "Assigned"
                          : assigningId === (employee.employeeId ?? employee.userId ?? employee.id)
                            ? "Assigning..."
                            : `Assign to ${getEmployeeName(employee)}`}
                      </button>
                    </div>

                    <div
                      className="teamflow-ai-recommendation-metrics"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, minmax(110px, 1fr))",
                        gap: "8px",
                        marginTop: "0",
                      }}
                    >
                      {[
                        ["Skill match", "skill_match"],
                        ["Proficiency", "skill_proficiency"],
                        ["Active tasks", "active_tasks"],
                        ["Active tickets", "active_tickets"],
                        ["Completion", "completion_rate"],
                        ["On-time", "on_time_rate"],
                        ["QA pass", "qa_pass_rate"],
                        ["Avg. hours", "avg_completion_hours"],
                      ].map(([label, key]) => (
                        <div
                          key={key}
                          style={{
                            padding: "9px 10px",
                            borderRadius: "8px",
                            background: "rgba(15,23,42,.7)",
                          }}
                        >
                          <div
                            style={{
                              color: "#64748b",
                              fontSize: "10px",
                              marginBottom: "3px",
                            }}
                          >
                            {label}
                          </div>
                          <strong style={{ fontSize: "12px" }}>
                            {formatFeature(key, features[key])}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div
            style={{
              marginTop: "14px",
              color: "#64748b",
              fontSize: "11px",
            }}
          >
            Note: the current model is trained on synthetic data. Its
            probabilities are useful for testing the workflow, not as
            production-validated employee performance estimates.
          </div>
        </>
      )}
    <style>{`
      @media (max-width: 1050px) {
        .teamflow-ai-recommendation-row { grid-template-columns: 180px minmax(0, 1fr) !important; }
        .teamflow-ai-recommendation-metrics { grid-template-columns: repeat(2, minmax(110px, 1fr)) !important; }
      }
      @media (max-width: 700px) {
        .teamflow-ai-recommendation-row { grid-template-columns: 1fr !important; }
        .teamflow-ai-recommendation-metrics { grid-template-columns: repeat(2, minmax(100px, 1fr)) !important; }
      }
    `}</style>
    </section>
  );
}

export default TaskRecommendationPanel;
