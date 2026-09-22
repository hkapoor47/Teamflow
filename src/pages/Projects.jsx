import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";

const API_BASE_URL = "http://65.0.11.153:5001/api";

function Projects() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [requirements, setRequirements] = useState("");
  const [deadline, setDeadline] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Fetch all projects
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/projects`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch projects"
        );
      }

      setProjects(data.projects || []);
    } catch (err) {
      console.error("Fetch projects error:", err);
      setError(
        err.message || "Unable to load projects."
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch projects when page loads
  useEffect(() => {
    fetchProjects();
  }, []);

  const closeModal = () => {
    setShowModal(false);

    setProjectName("");
    setRequirements("");
    setDeadline("");
    setError("");
  };

  // Create project using backend API
  const submit = async (event) => {
    event.preventDefault();

    if (
      !projectName.trim() ||
      !requirements.trim() ||
      !deadline
    ) {
      return;
    }

    try {
      setCreating(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/projects`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: projectName.trim(),
            description: requirements.trim(),
            deadline,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create project"
        );
      }

      /*
       * Refresh projects from backend so the newly
       * created project appears in All Projects.
       */
      await fetchProjects();

      /*
       * If backend returns the created project,
       * open its project details page.
       */
      const createdProject =
        data.project || data;

      closeModal();

      if (createdProject?.id) {
        navigate(
          `/projects/${createdProject.id}`
        );
      }
    } catch (err) {
      console.error("Create project error:", err);

      setError(
        err.message || "Unable to create project."
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="teamflow-page projects-page">

        {/* PAGE HEADER */}
        <section className="projects-page-header teamflow-heading">
          <div>
            <p className="welcome-label">
              PROJECT PORTFOLIO
            </p>

            <h1>All projects</h1>

            <p className="projects-subtitle">
              Create, review and track every company
              initiative in one place.
            </p>
          </div>

          <button
            className="create-project-button"
            onClick={() => {
              setError("");
              setShowModal(true);
            }}
          >
            <span>+</span>
            Create project
          </button>
        </section>

        {/* ERROR MESSAGE */}
        {error && !showModal && (
          <div className="project-error">
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="empty-state">
            <strong>Loading projects...</strong>
            <p>
              Getting the latest projects from the server.
            </p>
          </div>
        ) : projects.length === 0 ? (
          /* NO PROJECTS */
          <div className="empty-state">
            <strong>No projects yet</strong>
            <p>
              Create your first project to get started.
            </p>
          </div>
        ) : (
          /* PROJECTS */
          <div className="projects-grid">
            {projects.map((project) => {
              /*
               * Backend currently returns:
               * id
               * name
               * description
               * deadline
               * status
               */

              const description =
                project.description ||
                "No project description";

              const status =
                project.status || "ACTIVE";

              return (
                <button
                  className="project-card"
                  key={project.id}
                  onClick={() =>
                    navigate(
                      `/projects/${project.id}`
                    )
                  }
                >
                  <div className="project-card-header">

                    <div className="project-avatar">
                      {project.name
                        ?.charAt(0)
                        ?.toUpperCase() || "P"}
                    </div>

                    <div className="project-title">
                      <h3>{project.name}</h3>

                      <p>
                        {description}
                      </p>
                    </div>

                    <span
                      className={`project-status ${
                        status === "At Risk"
                          ? "risk"
                          : ""
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="project-card-progress">
                    <div className="progress-label">
                      <span>
                        Project progress
                      </span>

                      <strong>
                        0%
                      </strong>
                    </div>

                    <div className="progress-background">
                      <div
                        className="progress-fill"
                        style={{
                          width: "0%",
                        }}
                      />
                    </div>
                  </div>

                  <div className="project-card-footer">
                    <span>
                      Project #{project.id}
                    </span>

                    <span>
                      Due{" "}
                      {project.deadline
                        ? new Date(
                            project.deadline
                          ).toLocaleDateString()
                        : "Not set"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* CREATE PROJECT MODAL */}
        {showModal && (
          <div
            className="project-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
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
                  <h2>
                    Create new project
                  </h2>

                  <p>
                    Set the project requirements
                    and deadline.
                  </p>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={closeModal}
                  disabled={creating}
                >
                  ×
                </button>
              </div>

              {/* MODAL ERROR */}
              {error && (
                <div className="project-error">
                  {error}
                </div>
              )}

              <form onSubmit={submit}>

                <div className="project-form-grid">

                  {/* PROJECT NAME */}
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
                      disabled={creating}
                    />
                  </div>

                  {/* REQUIREMENTS */}
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
                      disabled={creating}
                    />
                  </div>

                  {/* DEADLINE */}
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
                      disabled={creating}
                    />
                  </div>

                </div>

                <div className="modal-footer">

                  <button
                    type="button"
                    className="cancel-project-button"
                    onClick={closeModal}
                    disabled={creating}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="create-project-submit"
                    disabled={creating}
                  >
                    {creating
                      ? "Creating..."
                      : "Create project"}
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