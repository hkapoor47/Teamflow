import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { apiGet, getArray, getCurrentUserId } from "./workspaceApi.js";

function Team() {
  const [users, setUsers] = useState([]);
  const [view, setView] = useState("my");
  const [loading, setLoading] = useState(true);
  const userId = getCurrentUserId();

  useEffect(() => {
    apiGet("/auth/users")
      .then((data) => setUsers(getArray(data, ["users", "data"])))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const currentUser = users.find((u) => String(u.id) === String(userId));
  const department = currentUser?.department || "Your department";

  const visibleUsers = useMemo(() => {
    if (view === "all") return users;
    return users.filter((u) => u.department === department);
  }, [users, view, department]);

  const grouped = useMemo(() => {
    return visibleUsers.reduce((acc, user) => {
      const key = user.department || "Other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(user);
      return acc;
    }, {});
  }, [visibleUsers]);

  return (
    <DashboardLayout>
      <div className="teamflow-page workspace-page">
        <section className="teamflow-heading">
          <p className="welcome-label">PEOPLE</p>
          <h2>Your team.</h2>
          <p className="welcome-description">
            See the people in your department or browse every team in TeamFlow.
          </p>
        </section>

        <div className="workspace-tabs">
          <button className={view === "my" ? "active" : ""} onClick={() => setView("my")}>
            My Team · {department}
          </button>
          <button className={view === "all" ? "active" : ""} onClick={() => setView("all")}>
            All Teams
          </button>
        </div>

        <section className="workspace-panel">
          {loading ? (
            <div className="workspace-empty">Loading team...</div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="workspace-empty">No team members found.</div>
          ) : (
            Object.entries(grouped).map(([name, members]) => (
              <div className="team-group" key={name}>
                <div className="team-group-head">
                  <div>
                    <p className="welcome-label">DEPARTMENT</p>
                    <h3>{name}</h3>
                  </div>
                  <span className="workspace-count">{members.length}</span>
                </div>

                <div className="team-grid">
                  {members.map((member) => (
                    <article className="team-member-card" key={member.id}>
                      <div className="team-avatar">
                        {(member.name || "U").slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <strong>{member.name || "Unnamed user"}</strong>
                        <p>{member.email || "No email"}</p>
                        <span>{member.department || "Other"}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default Team;
