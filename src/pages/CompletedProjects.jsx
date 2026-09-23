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
      <div className="teamflow-page completed-page">

        {/* PAGE HEADER */}
        <section className="teamflow-heading completed-heading">
          <p className="welcome-label">
            TEAMFLOW WORKSPACE
          </p>

          <h2>Completed Projects</h2>

          <p className="welcome-description">
            Projects where all tasks are completed and ready for QA testing.
          </p>
        </section>

        {/* BACK */}
        <div className="completed-back">
          <button
            className="secondary-button"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>
        </div>

        {/* MAIN PANEL */}
        <section className="completed-panel">

          {/* PANEL HEADER */}
          <div className="completed-panel-header">

            <div>
              <h3>Completed Projects</h3>

              <p>
                Select a project to begin the QA testing process.
              </p>
            </div>

            <div className="completed-total">
              {completedProjects.length} Completed
            </div>

          </div>

          {/* PROJECTS */}
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
                      {project.name.charAt(0)}
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
                        {project.description}
                      </p>

                    </div>

                  </div>

                  {/* QA BUTTON */}
                  <button
                    className="completed-qa-button"
                    onClick={() =>
                      navigate(`/qa-reviews/${project.id}`)
                    }
                  >
                    Start QA Testing →
                  </button>

                </div>

                {/* STATS */}
                <div className="completed-stats">

                  <div className="completed-stat">
                    <span>Tasks</span>
                    <strong>{project.tasks}</strong>
                    <small>completed</small>
                  </div>

                  <div className="completed-stat">
                    <span>Team</span>
                    <strong>{project.members}</strong>
                    <small>members</small>
                  </div>

                  <div className="completed-stat">
                    <span>Completed</span>
                    <strong>
                      {new Date(
                        project.completedDate
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </strong>
                    <small>completion date</small>
                  </div>

                  <div className="completed-stat">
                    <span>Progress</span>
                    <strong>{project.progress}%</strong>
                    <small>project complete</small>
                  </div>

                </div>

                {/* PROGRESS */}
                <div className="completed-progress">

                  <div className="completed-progress-header">
                    <span>Project Progress</span>
                    <strong>{project.progress}%</strong>
                  </div>

                  <div className="completed-progress-track">
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

        </section>

      </div>
    </DashboardLayout>
  );
}

export default CompletedProjects;