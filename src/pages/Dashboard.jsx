import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { useProjects } from "../context/ProjectContext.jsx";

function Dashboard() {
  const navigate = useNavigate();

  const { projects, tasks, projectProgress } = useProjects();

  // --------------------------------------------------
  // BASIC TASK COUNTS
  // --------------------------------------------------

  const activeTasks = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;

  // --------------------------------------------------
  // COMPLETED PROJECTS
  // --------------------------------------------------

  const completedProjects = projects.filter(
    (project) => projectProgress(project.id) >= 100
  );

  // --------------------------------------------------
  // ACTIVE PROJECTS
  // Ranked by active work + deadline urgency
  // Completed projects are excluded.
  // --------------------------------------------------

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeProjects = [...projects]
    .map((project) => {
      const projectTasks = tasks.filter(
        (task) => task.projectId === project.id
      );

      const activeCount = projectTasks.filter(
        (task) => task.status === "In Progress"
      ).length;

      const dueDate =
        project.deadline && project.deadline !== "Not set"
          ? new Date(`${project.deadline}T00:00:00`)
          : null;

      const daysLeft = dueDate
        ? Math.ceil(
            (dueDate - today) / (1000 * 60 * 60 * 24)
          )
        : 999;

      const urgencyScore =
        activeCount * 2 +
        (daysLeft > 0 ? 10 / daysLeft : 20);

      return {
        project,
        urgencyScore,
      };
    })
    .filter(
      ({ project }) => projectProgress(project.id) < 100
    )
    .sort(
      (a, b) => b.urgencyScore - a.urgencyScore
    )
    .map(({ project }) => project);

  return (
    <DashboardLayout>
      <div className="teamflow-page dashboard">

        {/* --------------------------------------------- */}
        {/* PAGE HEADING */}
        {/* --------------------------------------------- */}

        <section className="welcome teamflow-heading">
          <div>
            <p className="welcome-label">
              TEAMFLOW WORKSPACE
            </p>

            <h2>Dashboard</h2>

            <p className="welcome-description">
              A clear view of delivery, deadlines and the people doing the work.
            </p>
          </div>
        </section>

        {/* --------------------------------------------- */}
        {/* OVERVIEW CARDS */}
        {/* --------------------------------------------- */}

        <section
          className="overview-grid dashboard-overview-grid"
          aria-label="Project overview"
        >

          {/* TOTAL PROJECTS */}

          <button
            className="overview-card"
            onClick={() => navigate("/projects")}
          >
            <span className="overview-icon teal">
              ▣
            </span>

            <span>
              <small>Total projects</small>

              <strong>{projects.length}</strong>

              <em>View every project</em>
            </span>
          </button>

          {/* TOTAL TASKS */}

          <button
            className="overview-card"
            onClick={() => navigate("/tasks")}
          >
            <span className="overview-icon blue">
              ✓
            </span>

            <span>
              <small>Total tasks</small>

              <strong>{tasks.length}</strong>

              <em>{activeTasks} in progress</em>
            </span>
          </button>

          {/* COMPLETED PROJECTS */}

          <button
  className="overview-card"
  onClick={() => navigate("/completed-projects")}
>
  <span className="overview-icon teal">
    ✓
  </span>

  <span>
    <small>Completed projects</small>

    <strong>{completedProjects.length}</strong>

    <em>Successfully delivered</em>
  </span>
</button>

        </section>

        {/* --------------------------------------------- */}
        {/* ACTIVE / RECENT PROJECTS */}
        {/* --------------------------------------------- */}

        <section className="panel active-projects-panel">

          <div className="panel-header">
            <div>
              <h3>Active projects</h3>

              <p>
                Projects currently being worked on.
              </p>
            </div>
          </div>

          <div className="active-project-list dashboard-project-scroll">

            {activeProjects.length === 0 ? (
              <div className="empty-state">
                <span>✓</span>

                <strong>
                  No active projects
                </strong>

                <p>
                  All projects are currently completed.
                </p>
              </div>
            ) : (
              activeProjects.map((project) => {

                const progress =
                  projectProgress(project.id);

                const projectTasks =
                  tasks.filter(
                    (task) =>
                      task.projectId === project.id
                  );

                const projectActiveTasks =
                  projectTasks.filter(
                    (task) =>
                      task.status === "In Progress"
                  ).length;

                return (
                  <button
                    className="active-project-row"
                    key={project.id}
                    onClick={() =>
                      navigate(
                        `/projects/${project.id}`
                      )
                    }
                  >

                    {/* PROJECT ICON */}

                    <span className="project-avatar">
                      {project.name.charAt(0)}
                    </span>

                    {/* PROJECT INFO */}

                    <span className="active-project-main">

                      <strong className="active-project-name">
                        {project.name}
                      </strong>

                      <small>
                        {projectActiveTasks} active tasks · Due{" "}
                        {project.deadline}
                      </small>

                      <span className="mini-progress">
                        <i
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </span>

                    </span>

                    {/* PROGRESS */}

                    <span className="progress-number">
                      {progress}%
                    </span>

                  </button>
                );
              })
            )}

          </div>

        </section>

      </div>
    </DashboardLayout>
  );
}

export default Dashboard;