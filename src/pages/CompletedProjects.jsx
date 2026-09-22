import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";

const completedProjects = [
  {
    id: "website-redesign",
    name: "Website Redesign",
    description: "Redesign company website",
    progress: 100,
    tasks: 24,
    members: 8,
    completedDate: "2026-09-15",
  },
  {
    id: "mobile-application",
    name: "Mobile Application",
    description: "Build mobile application",
    progress: 100,
    tasks: 35,
    members: 10,
    completedDate: "2026-09-14",
  },
];

function CompletedProjects() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="teamflow-page">

        {/* Header */}
        <section className="teamflow-heading">
          <p className="welcome-label">
            TEAMFLOW WORKSPACE
          </p>

          <h2>Completed Projects</h2>

          <p className="welcome-description">
            Projects where all tasks have been completed and are ready for QA testing.
          </p>
        </section>

        {/* Back button */}
        <div style={{ marginBottom: "24px" }}>
          <button
            onClick={() => navigate("/dashboard")}
            className="secondary-button"
          >
            ← Dashboard
          </button>
        </div>

        {/* Completed projects */}
        <section className="panel">

          <div className="panel-header">
            <div>
              <h3>Completed Projects</h3>
              <p>
                Start QA testing for a completed project.
              </p>
            </div>

            <span className="completed-badge">
              {completedProjects.length} Completed
            </span>
          </div>

          {completedProjects.length === 0 ? (

            <div className="empty-state">
              <span>✓</span>

              <strong>
                No completed projects
              </strong>

              <p>
                A project will appear here once all its
                tasks have been completed.
              </p>
            </div>

          ) : (

            <div className="completed-project-list">

              {completedProjects.map((project) => (

                <div
                  key={project.id}
                  className="completed-project-item"
                >

                  {/* Project information */}
                  <div className="completed-project-main">

                    <div className="project-avatar">
                      {project.name.charAt(0)}
                    </div>

                    <div className="completed-project-content">

                      <div className="completed-project-title-row">

                        <div>
                          <h3>{project.name}</h3>

                          <p>
                            {project.description}
                          </p>
                        </div>

                        <span className="completed-badge">
                          ✓ Completed
                        </span>

                      </div>

                      {/* Project details */}
                      <div className="completed-project-meta">

                        <span>
                          ✓ {project.tasks} tasks completed
                        </span>

                        <span>
                          👥 {project.members} members
                        </span>

                        <span>
                          Completed: {project.completedDate}
                        </span>

                      </div>

                      {/* Progress */}
                      <div className="project-progress-wrapper">

                        <div className="project-progress-header">
                          <span>Project Progress</span>
                          <strong>{project.progress}%</strong>
                        </div>

                        <div className="project-progress-bar">
                          <div
                            className="project-progress-fill"
                            style={{
                              width: `${project.progress}%`,
                            }}
                          />
                        </div>

                      </div>

                    </div>

                  </div>

                  {/* QA action */}
                  <div className="completed-project-action">

                    <button
                      onClick={() =>
                        navigate(`/qa-reviews/${project.id}`)
                      }
                      className="primary-button"
                    >
                      Start QA Testing →
                    </button>

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