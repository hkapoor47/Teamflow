import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { useProjects } from "../context/ProjectContext.jsx";

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

  const project = projects.find(
    (item) => item.id === projectId
  );

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

  const projectTasks = tasks.filter(
    (task) => task.projectId === project.id
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
              {project.description}
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

          {/* <div className="hero-progress">
            <strong>{progress}%</strong>

            <span>
              overall progress
            </span>

            <div className="progress-background">
              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div> */}
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
          301.59 - (301.59 * progress) / 100,
      }}
    />
  </svg>

  <div className="progress-circle-text">
    <strong>{progress}%</strong>
    <span>Progress</span>
  </div>
</div>
        </section>

        <section className="project-summary">

  <article>
    <small>Deadline</small>
    <strong>
      {project.deadline}
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

       
       {/* PROJECT BRIEF */}

<div className="project-work-grid">

  {/* PROJECT BRIEF */}
  <section className="project-description-section">
    <article className="panel project-description-panel">

      <div className="panel-header">
        <div>
          <h3>Project brief</h3>
          <p>The agreed direction for this work.</p>
        </div>
      </div>

      <div className="project-description-content">
        <h4>{project.description}</h4>

        <p>
          {project.requirements}
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
        onClick={() => setShowTaskModal(true)}
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

              const member = members.find(
                (item) => item.id === task.assigneeId
              );

              return (
                <tr key={task.id}>

                  <td>
                    <strong>{task.title}</strong>
                  </td>

                  <td>
                    {member ? (
                      <div className="table-member">

                        <div className="member-avatar">
                          {member.name.charAt(0)}
                        </div>

                        <div>
                          <strong>{member.name}</strong>
                          <span>{member.role}</span>
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
                      className={`task-status ${task.status
                        .toLowerCase()
                        .replaceAll(" ", "-")}`}
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

                      <span>{task.progress}%</span>

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
                          {member.name} — {member.role}
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