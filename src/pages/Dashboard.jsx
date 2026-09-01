import DashboardLayout from "../layouts/DashboardLayout.jsx";

const Dashboard = () => {
  return (
    <DashboardLayout>

      <div className="dashboard">

        <div className="welcome">
          <div>
            <h2>Good morning, Harshita 👋</h2>
            <p>
              Here's what's happening with your team today.
            </p>
          </div>

          <button className="primary-button">
            + Create Task
          </button>
        </div>

        <div className="stats-grid">

          <div className="stat-card">
            <p>Project Progress</p>
            <h2>68%</h2>
            <span className="positive">
              ↑ 8% this week
            </span>
          </div>

          <div className="stat-card">
            <p>Completed Tasks</p>
            <h2>12</h2>
            <span className="positive">
              ↑ 3 this week
            </span>
          </div>

          <div className="stat-card">
            <p>Pending Tasks</p>
            <h2>5</h2>
            <span>
              2 due this week
            </span>
          </div>

          <div className="stat-card danger-card">
            <p>Overdue Tasks</p>
            <h2>3</h2>
            <span className="danger">
              Requires attention
            </span>
          </div>

        </div>

        <div className="dashboard-grid">

          <div className="panel">

            <div className="panel-header">
              <h3>Team Progress</h3>
              <button>View All</button>
            </div>

            <div className="team-progress">

              <TeamMember
                name="Rahul"
                progress={88}
              />

              <TeamMember
                name="Priya"
                progress={67}
              />

              <TeamMember
                name="Aman"
                progress={43}
              />

              <TeamMember
                name="Neha"
                progress={92}
              />

            </div>

          </div>

          <div className="panel">

            <div className="panel-header">
              <h3>AI Alerts</h3>
              <span className="ai-badge">
                AI
              </span>
            </div>

            <div className="alert-list">

              <div className="alert danger">
                <strong>⚠ Aman has 2 overdue tasks</strong>
                <p>
                  Consider following up with him.
                </p>
              </div>

              <div className="alert warning">
                <strong>Deadline approaching</strong>
                <p>
                  Payment API is due tomorrow.
                </p>
              </div>

              <div className="alert info">
                <strong>3 tasks waiting for QA</strong>
                <p>
                  QA verification is required.
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>

    </DashboardLayout>
  );
};

const TeamMember = ({ name, progress }) => {
  return (
    <div className="member-progress">

      <div className="member-info">
        <span>{name}</span>
        <strong>{progress}%</strong>
      </div>

      <div className="progress-background">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

    </div>
  );
};

export default Dashboard;