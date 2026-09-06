import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { useProjects } from "../context/ProjectContext.jsx";

function TeamMember() {
  const { memberId } = useParams();
  const navigate = useNavigate();

  const {
    members,
    tasks,
    projects,
    activities,
  } = useProjects();

  const member = members.find(
    (item) => item.id === memberId
  );

  if (!member) {
    return (
      <DashboardLayout>
        <div className="teamflow-page">
          <section className="panel empty-state">
            <strong>Member not found</strong>
            <p>This team member does not exist.</p>
            <button
              className="primary-button"
              onClick={() => navigate("/team")}
            >
              Back to team
            </button>
          </section>
        </div>
      </DashboardLayout>
    );
  }

  const memberTasks = tasks.filter(
    (task) => task.assigneeId === member.id
  );

  const completedTasks = memberTasks.filter(
    (task) => task.status === "Completed"
  );

  const activeTasks = memberTasks.filter(
    (task) => task.status === "In Progress"
  );

  const blockedTasks = memberTasks.filter(
    (task) => task.status === "Blocked"
  );

  const memberActivities = activities.filter(
    (activity) => activity.userId === member.id
  );

  const projectIds = [
    ...new Set(
      memberTasks.map((task) => task.projectId)
    ),
  ];

  const memberProjects = projects.filter(
    (project) => projectIds.includes(project.id)
  );

  const completionRate = memberTasks.length
    ? Math.round(
        (completedTasks.length / memberTasks.length) * 100
      )
    : 0;

  const overallProgress = memberTasks.length
    ? Math.round(
        memberTasks.reduce(
          (total, task) => total + task.progress,
          0
        ) / memberTasks.length
      )
    : 0;

  return (
    <DashboardLayout>
      <div className="teamflow-page team-member-page">

        {/* HEADER */}
        <section className="member-profile-header panel">
          <button
            className="back-button"
            onClick={() => navigate("/team")}
          >
            ← Back to team
          </button>

          <div className="member-profile-main">
            <div className="member-large-avatar">
              {member.name.charAt(0)}
            </div>

            <div>
              <p className="welcome-label">
                TEAM MEMBER
              </p>

              <h2>{member.name}</h2>

              <p className="member-role">
                {member.role}
              </p>

              <p className="member-email">
                {member.email}
              </p>
            </div>
          </div>
        </section>

        {/* OVERVIEW */}
        <section
          className="overview-grid member-overview"
          aria-label="Member overview"
        >
          <div className="overview-card">
            <span className="overview-icon teal">
              ✓
            </span>

            <span>
              <small>Total tasks</small>
              <strong>{memberTasks.length}</strong>
              <em>Assigned work</em>
            </span>
          </div>

          <div className="overview-card">
            <span className="overview-icon blue">
              ↗
            </span>

            <span>
              <small>Active tasks</small>
              <strong>{activeTasks.length}</strong>
              <em>Currently in progress</em>
            </span>
          </div>

          <div className="overview-card">
            <span className="overview-icon violet">
              ✓
            </span>

            <span>
              <small>Completed</small>
              <strong>{completedTasks.length}</strong>
              <em>{completionRate}% completion rate</em>
            </span>
          </div>

          <div className="overview-card">
            <span className="overview-icon orange">
              !
            </span>

            <span>
              <small>Current workload</small>
              <strong>{overallProgress}%</strong>
              <em>
                {blockedTasks.length} blocked
              </em>
            </span>
          </div>
        </section>

        {/* MAIN CONTENT */}
        <section className="member-content-grid">

          {/* PROJECTS */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Projects worked on</h3>
                <p>
                  Projects where {member.name} has
                  contributed.
                </p>
              </div>

              <span className="panel-count">
                {memberProjects.length}
              </span>
            </div>

            <div className="member-project-list">
              {memberProjects.length ? (
                memberProjects.map((project) => {
                  const projectTasks =
                    memberTasks.filter(
                      (task) =>
                        task.projectId === project.id
                    );

                  const progress =
                    projectTasks.length
                      ? Math.round(
                          projectTasks.reduce(
                            (total, task) =>
                              total + task.progress,
                            0
                          ) / projectTasks.length
                        )
                      : 0;

                  return (
                    <div
                      className="member-project-row"
                      key={project.id}
                    >
                      <div className="project-avatar">
                        {project.name.charAt(0)}
                      </div>

                      <div className="member-project-info">
                        <strong>
                          {project.name}
                        </strong>

                        <small>
                          {projectTasks.length} task
                          {projectTasks.length !== 1
                            ? "s"
                            : ""}
                        </small>

                        <div className="mini-progress">
                          <i
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </div>
                      </div>

                      <strong className="project-progress">
                        {progress}%
                      </strong>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  <strong>No projects yet</strong>
                  <p>
                    Assigned project work will appear
                    here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* WORKLOAD */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Current workload</h3>
                <p>
                  A quick view of {member.name}'s
                  assigned work.
                </p>
              </div>
            </div>

            <div className="workload-stats">

              <div className="workload-stat">
                <span>To Do</span>

                <strong>
                  {
                    memberTasks.filter(
                      (task) =>
                        task.status === "To Do"
                    ).length
                  }
                </strong>
              </div>

              <div className="workload-stat">
                <span>In Progress</span>

                <strong>
                  {activeTasks.length}
                </strong>
              </div>

              <div className="workload-stat">
                <span>Blocked</span>

                <strong>
                  {blockedTasks.length}
                </strong>
              </div>

              <div className="workload-stat">
                <span>Completed</span>

                <strong>
                  {completedTasks.length}
                </strong>
              </div>

            </div>
          </div>
        </section>

        {/* TASK HISTORY */}
        <section className="panel member-tasks-panel">
          <div className="panel-header">
            <div>
              <h3>Task history</h3>
              <p>
                Work currently assigned to{" "}
                {member.name}.
              </p>
            </div>

            <button
              className="view-button"
              onClick={() => navigate("/tasks")}
            >
              View all tasks →
            </button>
          </div>

          {memberTasks.length ? (
            <div className="member-task-list">
              {memberTasks.map((task) => {
                const project = projects.find(
                  (item) =>
                    item.id === task.projectId
                );

                return (
                  <div
                    className="member-task-row"
                    key={task.id}
                  >
                    <div>
                      <strong>{task.title}</strong>

                      <small>
                        {project?.name} · Due{" "}
                        {task.dueDate}
                      </small>
                    </div>

                    <span
                      className={`task-status ${task.status
                        .toLowerCase()
                        .replaceAll(
                          " ",
                          "-"
                        )}`}
                    >
                      {task.status}
                    </span>

                    <div className="table-progress">
                      <div className="progress-background">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${task.progress}%`,
                          }}
                        />
                      </div>

                      <span>
                        {task.progress}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No assigned tasks</strong>
              <p>
                Tasks assigned to this member will
                appear here.
              </p>
            </div>
          )}
        </section>

        {/* ACTIVITY */}
        <section className="panel member-history-panel">
          <div className="panel-header">
            <div>
              <h3>Work activity</h3>
              <p>
                Activity recorded from TeamFlow work.
              </p>
            </div>
          </div>

          {memberActivities.length ? (
            <div className="activity-list">
              {memberActivities
                .slice(0, 10)
                .map((activity) => (
                  <div
                    className="activity-row"
                    key={activity.id}
                  >
                    <span className="activity-dot">
                      •
                    </span>

                    <div>
                      <strong>
                        {activity.details}
                      </strong>

                      <small>
                        {new Date(
                          activity.timestamp
                        ).toLocaleString()}
                      </small>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No work activity yet</strong>
              <p>
                Activity will appear as this member
                works on tasks.
              </p>
            </div>
          )}
        </section>

      </div>
    </DashboardLayout>
  );
}

export default TeamMember;