import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { useProjects } from "../context/ProjectContext.jsx";

const API_BASE_URL = "http://65.0.11.153:5001/api";

function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const {
    projects,
    tasks,
    members,
    projectProgress,
    createTask,
  } = useProjects();

  const [showTaskModal, setShowTaskModal] = useState(false);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");

  // FIX: Keep backend-fetched projects locally
  const [apiProjects, setApiProjects] = useState([]);
  const [loadingProject, setLoadingProject] = useState(false);

  // FIX: projectId from URL is a string
  const numericProjectId = Number(projectId);

  // First try context projects
  let project = projects.find(
    (item) => Number(item.id) === numericProjectId
  );

  // If not found in context, try API projects
  if (!project) {
    project = apiProjects.find(
      (item) => Number(item.id) === numericProjectId
    );
  }

  // FIX: Fetch projects from backend if project isn't in context
  useEffect(() => {
    const fetchProjectFromAPI = async () => {
      // If already found in context, no need to fetch
      const existingProject = projects.find(
        (item) => Number(item.id) === numericProjectId
      );

      if (existingProject) {
        return;
      }

      try {
        setLoadingProject(true);

        const token = localStorage.getItem("token");

        if (!token) {
          console.error("No authentication token found.");
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/projects`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        console.log("PROJECT DETAILS API RESPONSE:", data);

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch projects"
          );
        }

        setApiProjects(data.projects || []);
      } catch (error) {
        console.error(
          "Failed to load project details:",
          error
        );
      } finally {
        setLoadingProject(false);
      }
    };

    fetchProjectFromAPI();
  }, [numericProjectId, projects]);

  // Loading state
  if (loadingProject && !project) {
    return (
      <DashboardLayout>
        <div className="teamflow-page">
          <h2>Loading project...</h2>
        </div>
      </DashboardLayout>
    );
  }

  // Project genuinely doesn't exist
  if (!project) {
    return (
      <DashboardLayout>
        <div className="teamflow-page">
          <h2>Project not found</h2>

          <button
            className="view-button"
            onClick={() => navigate("/projects")}
          >
            ← Back to projects
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // FIX: Compare IDs as numbers
  const projectTasks = tasks.filter(
    (task) =>
      Number(task.projectId) === Number(project.id)
  );

  /*
    Members are calculated from assigned tasks.

    So:
    - If manager directly assigns a task → member appears.
    - If a member later claims a task → member appears.
    - If a task is unassigned → nobody is added.
  */

  const assignedIds = [
    ...new Set(
      projectTasks
        .map((task) => task.assigneeId)
        .filter(Boolean)
    ),
  ];

  const projectMembers = members.filter((member) =>
    assignedIds.includes(member.id)
  );

  const progress = projectProgress(project.id);

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setTaskTitle("");
    setTaskAssignee("");
    setTaskDeadline("");
  };

  const submitTask = (event) => {
    event.preventDefault();

    if (!taskTitle.trim()) {
      return;
    }

    createTask({
      projectId: project.id,
      title: taskTitle.trim(),
      assigneeId: taskAssignee || null,
      dueDate: taskDeadline || "Not set",
    });

    closeTaskModal();
  };

  return (
    <DashboardLayout>
      <div className="teamflow-page project-detail-page">

        {/* BACK */}
        <button
          className="back-button"
          onClick={() => navigate("/projects")}
        >
          ← All projects
        </button>

        {/* PROJECT HERO */}
        <section className="project-hero">
          <div>
            <p className="welcome-label">
              PROJECT WORKSPACE
            </p>

            <h2>{project.name}</h2>

            <p>
              {project.description ||
                "No project description provided."}
            </p>

            <span
              className={`project-status ${
                project.status === "At Risk"
                  ? "risk"
                  : ""
              }`}
            >
              {project.status}
            </span>
          </div>

          <div
            className="project-progress-circle"
            title={`${progress}% project progress`}
          >
            <svg viewBox="0 0 120 120">
              <circle
                className="progress-circle-track"
                cx="60"
                cy="60"
                r="48"
              />

              <circle
                className="progress-circle-value"
                cx="60"
                cy="60"
                r="48"
                style={{
                  strokeDashoffset:
                    301.59 -
                    (301.59 * progress) / 100,
                }}
              />
            </svg>

            <div className="progress-circle-text">
              <strong>{progress}%</strong>
              <span>Progress</span>
            </div>
          </div>
        </section>

        {/* PROJECT SUMMARY */}
        <section className="project-summary">

          <article>
            <small>Deadline</small>

            <strong>
              {project.deadline
                ? new Date(
                    project.deadline
                  ).toLocaleDateString()
                : "Not set"}
            </strong>
          </article>

          <article>
            <small>Team members</small>

            <strong>
              {projectMembers.length}
            </strong>
          </article>

          <article>
            <small>Total tasks</small>

            <strong>
              {projectTasks.length}
            </strong>
          </article>

        </section>

        {/* PROJECT WORK GRID */}
        <div className="project-work-grid">

          {/* PROJECT BRIEF */}
          <section className="project-description-section">
            <article className="panel project-description-panel">

              <div className="panel-header">
                <div>
                  <h3>Project brief</h3>

                  <p>
                    The agreed direction for this work.
                  </p>
                </div>
              </div>

              <div className="project-description-content">

                <h4>
                  {project.description ||
                    "No description available."}
                </h4>

                <p>
                  {project.requirements ||
                    "No additional requirements provided."}
                </p>

              </div>

            </article>
          </section>

          {/* PROJECT TASKS */}
          <section className="panel project-task-panel">

            <div className="panel-header">

              <div>
                <h3>Project tasks</h3>

                <p>
                  Create work, assign members or leave
                  tasks open for team members to claim.
                </p>
              </div>

              <button
                className="create-project-button"
                onClick={() =>
                  setShowTaskModal(true)
                }
              >
                <span>+</span>
                Create task
              </button>

            </div>

            <div className="table-container">

              <table>

                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Assigned to</th>
                    <th>Status</th>
                    <th>Deadline</th>
                    <th>Progress</th>
                  </tr>
                </thead>

                <tbody>

                  {projectTasks.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        style={{
                          textAlign: "center",
                          padding: "40px",
                        }}
                      >
                        No tasks created yet.
                      </td>
                    </tr>
                  ) : (
                    projectTasks.map((task) => {

                      const member =
                        members.find(
                          (item) =>
                            Number(item.id) ===
                            Number(task.assigneeId)
                        );

                      return (
                        <tr key={task.id}>

                          <td>
                            <strong>
                              {task.title}
                            </strong>
                          </td>

                          <td>
                            {member ? (
                              <div className="table-member">

                                <div className="member-avatar">
                                  {member.name
                                    .charAt(0)}
                                </div>

                                <div>
                                  <strong>
                                    {member.name}
                                  </strong>

                                  <span>
                                    {member.role}
                                  </span>
                                </div>

                              </div>
                            ) : (
                              <span className="unassigned">
                                Unassigned
                              </span>
                            )}
                          </td>

                          <td>
                            <span
                              className={`task-status ${
                                task.status
                                  .toLowerCase()
                                  .replaceAll(
                                    " ",
                                    "-"
                                  )
                              }`}
                            >
                              {task.status}
                            </span>
                          </td>

                          <td>
                            {task.dueDate}
                          </td>

                          <td>
                            <div className="table-progress">

                              <div className="progress-background">
                                <div
                                  className="progress-fill"
                                  style={{
                                    width: `${task.progress}%`,
                                  }}
                                />
                              </div>

                              <span>
                                {task.progress}%
                              </span>

                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}

                </tbody>

              </table>

            </div>

          </section>

        </div>

        {/* CREATE TASK MODAL */}
        {showTaskModal && (
          <div
            className="project-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeTaskModal();
              }
            }}
          >

            <div
              className="create-project-modal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              {/* MODAL HEADER */}
              <div className="modal-header">

                <div>
                  <h2>
                    Create new task
                  </h2>

                  <p>
                    Add work to {project.name} and
                    optionally assign it to a member.
                  </p>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={closeTaskModal}
                >
                  ×
                </button>

              </div>

              {/* FORM */}
              <form onSubmit={submitTask}>

                <div className="project-form-grid">

                  {/* TASK NAME */}
                  <div className="form-group">

                    <label>
                      Task name
                    </label>

                    <input
                      required
                      value={taskTitle}
                      onChange={(event) =>
                        setTaskTitle(
                          event.target.value
                        )
                      }
                      placeholder="e.g. Build login page"
                    />

                  </div>

                  {/* ASSIGN MEMBER */}
                  <div className="form-group">

                    <label>
                      Assign to
                    </label>

                    <select
                      value={taskAssignee}
                      onChange={(event) =>
                        setTaskAssignee(
                          event.target.value
                        )
                      }
                    >
                      <option value="">
                        Leave unassigned
                      </option>

                      {members.map((member) => (
                        <option
                          key={member.id}
                          value={member.id}
                        >
                          {member.name} —{" "}
                          {member.role}
                        </option>
                      ))}
                    </select>

                  </div>

                  {/* DEADLINE */}
                  <div className="form-group">

                    <label>
                      Deadline
                    </label>

                    <input
                      type="date"
                      value={taskDeadline}
                      onChange={(event) =>
                        setTaskDeadline(
                          event.target.value
                        )
                      }
                    />

                  </div>

                </div>

                {/* MODAL FOOTER */}
                <div className="modal-footer">

                  <button
                    type="button"
                    className="cancel-project-button"
                    onClick={closeTaskModal}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="create-project-submit"
                  >
                    Create task
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default ProjectDetails;