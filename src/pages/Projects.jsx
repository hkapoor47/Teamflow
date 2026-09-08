import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { useProjects } from "../context/ProjectContext.jsx";

function Projects() {
  const navigate = useNavigate();

  const {
    projects,
    tasks,
    projectProgress,
    createProject,
  } = useProjects();

  const [showModal, setShowModal] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [requirements, setRequirements] = useState("");
  const [deadline, setDeadline] = useState("");

  const closeModal = () => {
    setShowModal(false);
    setProjectName("");
    setRequirements("");
    setDeadline("");
  };

  const submit = (event) => {
    event.preventDefault();

    if (
      !projectName.trim() ||
      !requirements.trim() ||
      !deadline
    ) {
      return;
    }

    const project = createProject({
      name: projectName,
      requirements,
      deadline,
    });

    closeModal();

    navigate(`/projects/${project.id}`);
  };

  return (
    <DashboardLayout>
      <div className="teamflow-page projects-page">

        <section className="projects-page-header teamflow-heading">
          <div>
            <p className="welcome-label">
              PROJECT PORTFOLIO
            </p>

            <h1>All projects</h1>

            <p className="projects-subtitle">
              Create, review and track every company initiative
              in one place.
            </p>
          </div>

          <button
            className="create-project-button"
            onClick={() => setShowModal(true)}
          >
            <span>+</span>
            Create project
          </button>
        </section>

        <div className="projects-grid">
          {projects.map((project) => {
            const progress = projectProgress(project.id);

            const projectTasks = tasks.filter(
              (task) => task.projectId === project.id
            );

            return (
              <button
                className="project-card"
                key={project.id}
                onClick={() =>
                  navigate(`/projects/${project.id}`)
                }
              >
                <div className="project-card-header">

                  <div className="project-avatar">
                    {project.name.charAt(0)}
                  </div>

                  <div className="project-title">
                    <h3>{project.name}</h3>

                    <p>
                      {project.requirements}
                    </p>
                  </div>

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

                <div className="project-card-progress">
                  <div className="progress-label">
                    <span>Project progress</span>
                    <strong>{progress}%</strong>
                  </div>

                  <div className="progress-background">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="project-card-footer">
                  <span>
                    {projectTasks.length} tasks
                  </span>

                  <span>
                    Due {project.deadline}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* CREATE PROJECT MODAL */}

        {showModal && (
          <div
            className="project-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget
              ) {
                closeModal();
              }
            }}
          >
            <div
              className="create-project-modal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <div className="modal-header">
                <div>
                  <h2>Create new project</h2>

                  <p>
                    Set the project requirements and
                    deadline.
                  </p>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={closeModal}
                >
                  ×
                </button>
              </div>

              <form onSubmit={submit}>

                <div className="project-form-grid">

                  <div className="form-group">
                    <label>
                      Project name
                    </label>

                    <input
                      required
                      value={projectName}
                      onChange={(event) =>
                        setProjectName(
                          event.target.value
                        )
                      }
                      placeholder="e.g. Customer portal"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Client requirements
                    </label>

                    <textarea
                      required
                      value={requirements}
                      onChange={(event) =>
                        setRequirements(
                          event.target.value
                        )
                      }
                      placeholder="Key scope, needs and success criteria"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Deadline
                    </label>

                    <input
                      required
                      type="date"
                      value={deadline}
                      onChange={(event) =>
                        setDeadline(
                          event.target.value
                        )
                      }
                    />
                  </div>

                </div>

                <div className="modal-footer">

                  <button
                    type="button"
                    className="cancel-project-button"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="create-project-submit"
                  >
                    Create project
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

export default Projects;