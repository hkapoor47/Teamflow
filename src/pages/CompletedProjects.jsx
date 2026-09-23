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
          <p className="welcome-label">TEAMFLOW WORKSPACE</p>

          <h2>Completed Projects</h2>

          <p className="welcome-description">
            Projects where all tasks are completed and ready for QA testing.
          </p>
        </section>

        {/* Back button */}
        <div className="completed-back-wrapper">
          <button
            onClick={() => navigate("/dashboard")}
            className="secondary-button"
          >
            ← Dashboard
          </button>
        </div>

        {/* Completed Projects Panel */}
        <section className="panel completed-projects-panel">

          {/* Panel Header */}
          <div className="panel-header completed-panel-header">
            <div>
              <h3>Completed Projects</h3>
              <p>
                Select a project to begin the QA testing process.
              </p>
            </div>

            <span className="completed-count-badge">
              {completedProjects.length} Completed
            </span>
          </div>

          {/* Empty State */}
          {completedProjects.length === 0 ? (
            <div className="empty-state">
              <span className="empty-check">✓</span>

              <strong>No completed projects</strong>

              <p>
                A project will appear here once all its tasks have been
                completed.
              </p>
            </div>
          ) : (
            <div className="completed-project-list">

              {completedProjects.map((project) => (
                <div
                  key={project.id}
                  className="completed-project-card"
                >

                  {/* Top Section */}
                  <div className="completed-card-top">

                    <div className="completed-project-info">

                      <div className="project-avatar">
                        {project.name.charAt(0)}
                      </div>

                      <div>
                        <div className="completed-title-line">
                          <h3>{project.name}</h3>

                          <span className="completed-status">
                            ✓ Completed
                          </span>
                        </div>

                        <p>{project.description}</p>
                      </div>

                    </div>

                    <button
                      onClick={() =>
                        navigate(`/qa-reviews/${project.id}`)
                      }
                      className="primary-button qa-button"
                    >
                      Start QA Testing →
                    </button>

                  </div>

                  {/* Stats */}
                  <div className="completed-project-stats">

                    <div className="completed-stat">
                      <span className="stat-label">Tasks</span>
                      <strong>{project.tasks}</strong>
                      <small>Completed</small>
                    </div>

                    <div className="completed-stat">
                      <span className="stat-label">Team</span>
                      <strong>{project.members}</strong>
                      <small>Members</small>
                    </div>

                    <div className="completed-stat">
                      <span className="stat-label">Completed</span>
                      <strong>
                        {new Date(project.completedDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </strong>
                      <small>Completion date</small>
                    </div>

                    <div className="completed-stat">
                      <span className="stat-label">Progress</span>
                      <strong>{project.progress}%</strong>
                      <small>Project complete</small>
                    </div>

                  </div>

                  {/* Progress */}
                  <div className="completed-progress-section">

                    <div className="completed-progress-header">
                      <span>Project Progress</span>
                      <strong>{project.progress}%</strong>
                    </div>

                    <div className="completed-progress-bar">
                      <div
                        className="completed-progress-fill"
                        style={{
                          width: `${project.progress}%`,
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


