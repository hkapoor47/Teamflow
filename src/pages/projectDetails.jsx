import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { useProjects } from "../context/ProjectContext.jsx";

const API_BASE_URL = "http://65.0.11.153:5001/api";

function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const { projects, members } = useProjects();

  const numericProjectId = Number(projectId);

  const [apiProjects, setApiProjects] = useState([]);
  const [projectTasks, setProjectTasks] = useState([]);

  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);

  const [showTaskModal, setShowTaskModal] = useState(false);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");

  /* =====================================================
     FIND FRONTEND PROJECT
  ===================================================== */

  const contextProject = projects.find(
    (item) => Number(item.id) === numericProjectId
  );

  /* =====================================================
     FIND BACKEND PROJECT

     We first try the backend ID directly.
     If that does not match, we try matching by name.
  ===================================================== */

  const apiProjectById = apiProjects.find(
    (item) => Number(item.id) === numericProjectId
  );

  const apiProjectByName = apiProjects.find(
    (item) =>
      item.name?.trim().toLowerCase() ===
      contextProject?.name?.trim().toLowerCase()
  );

  const apiProject = apiProjectById || apiProjectByName || null;

  /* =====================================================
     BACKEND PROJECT ID

     This is the ID used for:
       POST /projects/:id/tasks
  ===================================================== */

  const backendProjectId = apiProject?.id ?? null;

  /* =====================================================
     PROJECT DATA

     Prefer backend project once it has loaded.
  ===================================================== */

  const project = apiProject || contextProject;

  /* =====================================================
     FETCH PROJECTS
  ===================================================== */

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          console.error("No authentication token found.");
          setLoadingProject(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/projects`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        console.log("PROJECT DETAILS - PROJECTS RESPONSE:", data);

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch projects"
          );
        }

        setApiProjects(data.projects || []);
      } catch (error) {
        console.error("Failed to load projects:", error);
      } finally {
        setLoadingProject(false);
      }
    };

    fetchProjects();
  }, []);

  /* =====================================================
     FETCH ALL TASKS

     IMPORTANT:
     There is NO need for:

       /projects/:id/tasksview

     Backend provides:

       GET /api/all-tasks

     We fetch all tasks and then filter them by
     project_id.
  ===================================================== */

  const fetchProjectTasks = async (backendId) => {
    if (!backendId) {
      console.log("Backend project ID is not available yet.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No authentication token found.");
        return;
      }

      setLoadingTasks(true);

      console.log(
        "FETCHING ALL TASKS FOR PROJECT ID:",
        backendId
      );

      const response = await fetch(`${API_BASE_URL}/all-tasks`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      console.log("ALL TASKS RESPONSE:", data);

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch tasks"
        );
      }

      const allTasks = data.tasks || [];

      /* ================================================
         FILTER TASKS FOR CURRENT PROJECT
      ================================================= */

      const currentProjectTasks = allTasks.filter(
        (task) =>
          Number(task.project_id) === Number(backendId)
      );

      console.log(
        "CURRENT PROJECT TASKS:",
        currentProjectTasks
      );

      setProjectTasks(currentProjectTasks);
    } catch (error) {
      console.error("Failed to load project tasks:", error);
      setProjectTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  /* =====================================================
     LOAD TASKS AFTER BACKEND PROJECT IS FOUND
  ===================================================== */

  useEffect(() => {
    if (!backendProjectId) {
      return;
    }

    fetchProjectTasks(backendProjectId);
  }, [backendProjectId]);

  /* =====================================================
     LOADING
  ===================================================== */

  if (loadingProject && !project) {
    return (
      <DashboardLayout>
        <div className="teamflow-page">
          <h2>Loading project...</h2>
        </div>
      </DashboardLayout>
    );
  }

  /* =====================================================
     PROJECT NOT FOUND
  ===================================================== */

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

  /* =====================================================
     PROJECT MEMBERS
  ===================================================== */

  const assignedIds = [
    ...new Set(
      projectTasks
        .map(
          (task) =>
            task.assigned_to ??
            task.assigneeId ??
            task.assignee_id
        )
        .filter(
          (value) =>
            value !== null &&
            value !== undefined
        )
        .map(Number)
    ),
  ];

  const projectMembers = members.filter((member) =>
    assignedIds.includes(Number(member.id))
  );

  /* =====================================================
     PROJECT PROGRESS
  ===================================================== */

  const completedTasks = projectTasks.filter((task) => {
    const status = String(
      task.status ||
        task.task_status ||
        ""
    ).toLowerCase();

    return (
      status === "completed" ||
      status === "closed" ||
      status === "done"
    );
  }).length;

  const progress =
    projectTasks.length > 0
      ? Math.round(
          (completedTasks / projectTasks.length) * 100
        )
      : 0;

  /* =====================================================
     CLOSE TASK MODAL
  ===================================================== */

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setTaskTitle("");
    setTaskAssignee("");
    setTaskDeadline("");
  };

  /* =====================================================
     CREATE TASK
     
     POST:
       /api/projects/:backendProjectId/tasks
  ===================================================== */

  const submitTask = async (event) => {
    event.preventDefault();

    if (!taskTitle.trim()) {
      return;
    }

    if (!backendProjectId) {
      alert(
        "Backend project ID could not be found. Please refresh the page."
      );
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert(
          "Authentication required. Please login again."
        );
        return;
      }

      setCreatingTask(true);

      const requestBody = {
        title: taskTitle.trim(),
        assigned_to: taskAssignee
          ? Number(taskAssignee)
          : null,
        due_date: taskDeadline || null,
      };

      console.log(
        "CREATE TASK REQUEST:",
        requestBody
      );

      console.log(
        "CREATE TASK BACKEND PROJECT ID:",
        backendProjectId
      );

      const response = await fetch(
        `${API_BASE_URL}/projects/${backendProjectId}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      console.log(
        "CREATE TASK RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create task"
        );
      }

      /*
       * Task successfully created.
       *
       * Instead of relying only on the POST response,
       * fetch all tasks again and filter the current project.
       */

      closeTaskModal();

      await fetchProjectTasks(
        backendProjectId
      );
    } catch (error) {
      console.error(
        "Failed to create task:",
        error
      );

      alert(
        error.message ||
          "Failed to create task."
      );
    } finally {
      setCreatingTask(false);
    }
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
                String(project.status)
                  .toLowerCase()
                  .includes("risk")
                  ? "risk"
                  : ""
              }`}
            >
              {project.status || "ACTIVE"}
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

          {/* PROJECT DESCRIPTION */}

          <section className="project-description-section">

            <article className="panel project-description-panel">

              <div className="panel-header">

                <div>

                  <h3>
                    Project description
                  </h3>

                  <p>
                    Description provided for this project.
                  </p>

                </div>

              </div>

              <div className="project-description-content">

                <h4>
                  {project.description ||
                    "No project description provided."}
                </h4>

              </div>

            </article>

          </section>

          {/* PROJECT TASKS */}

          <section className="panel project-task-panel">

            <div className="panel-header">

              <div>

                <h3>
                  Project tasks
                </h3>

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

                  {loadingTasks ? (

                    <tr>

                      <td
                        colSpan="5"
                        style={{
                          textAlign: "center",
                          padding: "40px",
                        }}
                      >
                        Loading tasks...
                      </td>

                    </tr>

                  ) : projectTasks.length === 0 ? (

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

                      const assigneeId =
                        task.assigned_to ??
                        task.assigneeId ??
                        task.assignee_id;

                      const member =
                        members.find(
                          (item) =>
                            Number(item.id) ===
                            Number(assigneeId)
                        );

                      const taskStatus =
                        task.status ||
                        task.task_status ||
                        "TODO";

                      const taskDeadline =
                        task.due_date ??
                        task.dueDate ??
                        task.deadline ??
                        null;

                      /*
                       * Backend currently does not return
                       * individual task progress.
                       */

                      const taskProgress =
                        Number(task.progress) || 0;

                      return (

                        <tr key={task.id}>

                          {/* TASK */}

                          <td>

                            <strong>
                              {task.title ||
                                task.name ||
                                "Untitled task"}
                            </strong>

                          </td>

                          {/* ASSIGNED TO */}

                          <td>

                            {member ? (

                              <div className="table-member">

                                <div className="member-avatar">

                                  {member.name
                                    ?.charAt(0)
                                    ?.toUpperCase()}

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

                            ) : task.claimed_by_name ? ||
                                task.claimedByName ? (

                              <div className="table-member">

                                <div className="member-avatar">

                                  {(task.claimed_by_name ||
                                     task.claimedByName ||
                                      ""
                                    )
                                    .charAt(0)
                                    ?.toUpperCase()}

                                </div>

                                <div>

                                  <strong>
                                    {task.claimed_by_name || task.claimedByName}
                                  </strong>

                                  <span>
                                    Claimed
                                  </span>

                                </div>

                              </div>

                            ) : (

                              <span className="unassigned">
                                Unassigned
                              </span>

                            )}

                          </td>

                          {/* STATUS */}

                          <td>

                            <span
                              className={`task-status ${String(
                                taskStatus
                              )
                                .toLowerCase()
                                .replaceAll(
                                  " ",
                                  "-"
                                )}`}
                            >
                              {taskStatus}
                            </span>

                          </td>

                          {/* DEADLINE */}

                          <td>

                            {taskDeadline
                              ? new Date(
                                  taskDeadline
                                ).toLocaleDateString()
                              : "Not set"}

                          </td>

                          {/* PROGRESS */}

                          <td>

                            <div className="table-progress">

                              <div className="progress-background">

                                <div
                                  className="progress-fill"
                                  style={{
                                    width: `${taskProgress}%`,
                                  }}
                                />

                              </div>

                              <span>
                                {taskProgress}%
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
                    disabled={creatingTask}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="create-project-submit"
                    disabled={creatingTask}
                  >
                    {creatingTask
                      ? "Creating..."
                      : "Create task"}
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