import React, { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout.jsx";

function CompletedProjects() {
  const [completedProjects, setCompletedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCompletedProjects();
  }, []);

  const fetchCompletedProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken");

      const response = await fetch(
        "http://65.0.11.153:5001/api/projects",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();

      // API kabhi array direct return kare to
      // aur kabhi { projects: [...] } return kare to dono handle honge
      const projects = Array.isArray(data)
        ? data
        : data.projects || [];

      // Sirf completed projects
      const completed = projects.filter(
        (project) =>
          String(project.status || "").toLowerCase() === "completed"
      );

      setCompletedProjects(completed);
    } catch (err) {
      console.error("Error fetching completed projects:", err);
      setError("Failed to load completed projects.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="teamflow-page completed-page">

        {/* PAGE HEADER */}
        <section className="teamflow-heading completed-heading">
          <p className="welcome-label">
            TEAMFLOW WORKSPACE
          </p>

          <h2>Completed Projects</h2>

          <p className="welcome-description">
            View all projects that have been completed.
          </p>
        </section>

        {/* MAIN PANEL */}
        <section className="completed-panel">

          {/* PANEL HEADER */}
          <div className="completed-panel-header">
            <div>
              <h3>Completed Projects</h3>

              <p>
                All completed projects are shown here.
              </p>
            </div>

            <div className="completed-total">
              {completedProjects.length} Completed
            </div>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="completed-empty">
              <h3>Loading projects...</h3>
              <p>Please wait while we fetch completed projects.</p>
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="completed-empty">
              <h3>Unable to load projects</h3>
              <p>{error}</p>

              <button
                className="secondary-button"
                onClick={fetchCompletedProjects}
              >
                Try Again
              </button>
            </div>
          )}

          {/* NO PROJECTS */}
          {!loading &&
            !error &&
            completedProjects.length === 0 && (
              <div className="completed-empty">
                <h3>No completed projects yet</h3>
                <p>
                  Projects will appear here once they are completed.
                </p>
              </div>
            )}

          {/* PROJECTS */}
          {!loading &&
            !error &&
            completedProjects.length > 0 && (
              <div className="completed-list">

                {completedProjects.map((project) => (
                  <div
                    className="completed-card"
                    key={project.id}
                  >

                    {/* TOP */}
                    <div className="completed-card-top">

                      <div className="completed-project-info">

                        <div className="completed-avatar">
                          {project.name
                            ? project.name.charAt(0).toUpperCase()
                            : "P"}
                        </div>

                        <div className="completed-project-text">

                          <div className="completed-title-row">

                            <h3>
                              {project.name}
                            </h3>

                            <span className="completed-status">
                              ✓ Completed
                            </span>

                          </div>

                          <p>
                            {project.description ||
                              "No project description available."}
                          </p>

                        </div>

                      </div>

                    </div>

                    {/* PROJECT INFO */}
                    <div className="completed-stats">

                      <div className="completed-stat">
                        <span>Status</span>

                        <strong>
                          Completed
                        </strong>

                        <small>
                          project status
                        </small>
                      </div>

                      <div className="completed-stat">
                        <span>Deadline</span>

                        <strong>
                          {formatDate(project.deadline)}
                        </strong>

                        <small>
                          project deadline
                        </small>
                      </div>

                      <div className="completed-stat">
                        <span>Completed On</span>

                        <strong>
                          {formatDate(
                            project.updated_at ||
                            project.updatedAt ||
                            project.completed_at ||
                            project.completedDate
                          )}
                        </strong>

                        <small>
                          completion date
                        </small>
                      </div>

                      <div className="completed-stat">
                        <span>Progress</span>

                        <strong>
                          100%
                        </strong>

                        <small>
                          project complete
                        </small>
                      </div>

                    </div>

                    {/* PROGRESS */}
                    <div className="completed-progress">

                      <div className="completed-progress-header">
                        <span>Project Progress</span>

                        <strong>
                          100%
                        </strong>
                      </div>

                      <div className="completed-progress-track">
                        <div
                          className="completed-progress-fill"
                          style={{
                            width: "100%",
                          }}
                        />
                      </div>

                    </div>

                  </div>
                ))}

              </div>
            )}

        </section>

      </div>
    </DashboardLayout>
  );
}

export default CompletedProjects;