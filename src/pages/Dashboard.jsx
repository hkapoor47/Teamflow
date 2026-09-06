import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { useProjects } from "../context/ProjectContext.jsx";

function Dashboard() {
  const navigate = useNavigate();

  const { projects, tasks, projectProgress, members } = useProjects();

  // --------------------------------------------------
  // BASIC TASK COUNTS
  // --------------------------------------------------

  const activeTasks = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  // --------------------------------------------------
  // TASKS NEEDING ATTENTION
  // Overdue OR due within the next 2 days
  // Completed tasks are excluded.
  // --------------------------------------------------

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const twoDaysFromNow = new Date(today);
  twoDaysFromNow.setDate(today.getDate() + 2);

  const needsAttentionTasks = tasks
    .filter((task) => {
      if (task.status === "Completed") {
        return false;
      }

      if (!task.dueDate || task.dueDate === "Not set") {
        return false;
      }

      const dueDate = new Date(`${task.dueDate}T00:00:00`);

      return dueDate <= twoDaysFromNow;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.dueDate}T00:00:00`);
      const dateB = new Date(`${b.dueDate}T00:00:00`);

      return dateA - dateB;
    });

  // --------------------------------------------------
  // ACTIVE PROJECTS
  // --------------------------------------------------

  const activeProjects = [...projects].sort(
    (a, b) => projectProgress(b.id) - projectProgress(a.id)
  );

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  const getProject = (projectId) =>
    projects.find((project) => project.id === projectId);

  const getMember = (memberId) =>
    members.find((member) => member.id === memberId);

  const getDeadlineText = (dueDate) => {
    if (!dueDate || dueDate === "Not set") {
      return "No deadline";
    }

    const date = new Date(`${dueDate}T00:00:00`);

    const differenceInTime = date - today;
    const differenceInDays = Math.ceil(
      differenceInTime / (1000 * 60 * 60 * 24)
    );

    if (differenceInDays < 0) {
      const daysOverdue = Math.abs(differenceInDays);

      return daysOverdue === 1
        ? "1 day overdue"
        : `${daysOverdue} days overdue`;
    }

    if (differenceInDays === 0) {
      return "Due today";
    }

    if (differenceInDays === 1) {
      return "Due tomorrow";
    }

    return `Due in ${differenceInDays} days`;
  };

  return (
    <DashboardLayout>
      <div className="teamflow-page dashboard">

        {/* --------------------------------------------- */}
        {/* PAGE HEADING */}
        {/* --------------------------------------------- */}

        <section className="welcome teamflow-heading">
          <div>
            <p className="welcome-label">TEAMFLOW WORKSPACE</p>

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
          className="overview-grid"
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

          {/* NEEDS ATTENTION */}

          <button
            className="overview-card"
            onClick={() => navigate("/tasks")}
          >
            <span className="overview-icon orange">
              !
            </span>

            <span>
              <small>Needs attention</small>

              <strong>{needsAttentionTasks.length}</strong>

              <em>
                {needsAttentionTasks.length === 1
                  ? "Deadline needs attention"
                  : "Deadlines need attention"}
              </em>
            </span>
          </button>

          {/* COMPLETED WORK */}

          <button
            className="overview-card"
            onClick={() => navigate("/tasks")}
          >
            <span className="overview-icon violet">
              ↗
            </span>

            <span>
              <small>Completed work</small>

              <strong>{completedTasks}</strong>

              <em>Across all teams</em>
            </span>
          </button>

        </section>

        {/* --------------------------------------------- */}
        {/* ACTIVE PROJECTS - FULL WIDTH */}
        {/* --------------------------------------------- */}

        <section className="panel active-projects-panel">

          <div className="panel-header">
            <div>
              <h3>Active projects</h3>

              <p>
                Your current projects and their progress.
              </p>
            </div>

            <button
              className="view-button"
              onClick={() => navigate("/projects")}
            >
              View all projects →
            </button>
          </div>

          <div className="active-project-list">

            {activeProjects.map((project) => {
              const progress = projectProgress(project.id);

              const projectTasks = tasks.filter(
                (task) => task.projectId === project.id
              );

              const projectActiveTasks = projectTasks.filter(
                (task) => task.status === "In Progress"
              ).length;

              return (
                <button
                  className="active-project-row"
                  key={project.id}
                  onClick={() =>
                    navigate(`/projects/${project.id}`)
                  }
                >

                  <span className="project-avatar">
                    {project.name.charAt(0)}
                  </span>

                  <span className="active-project-main">

                    <strong>
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

                  <span className="progress-number">
                    {progress}%
                  </span>

                </button>
              );
            })}

          </div>

        </section>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;