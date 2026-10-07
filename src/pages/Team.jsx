import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { apiGet, getArray, getCurrentUserId } from "../../utils/workspaceApi.js";

function getId(user) {
  return user?.id ?? user?.user_id ?? user?._id;
}

function getName(user) {
  return user?.name || user?.username || user?.full_name || user?.email || "Unnamed user";
}

function getDepartment(user) {
  return String(user?.department || "").trim();
}

function initials(name) {
  return String(name || "U")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Team() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openTeam, setOpenTeam] = useState(null);

  const userId = getCurrentUserId();

  useEffect(() => {
    let mounted = true;

    apiGet("/auth/users")
      .then((data) => {
        if (mounted) setUsers(getArray(data, ["users", "data"]));
      })
      .catch((err) => {
        console.error("Load teams error:", err);
        if (mounted) setError(err.message || "Failed to load teams.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const currentUser = useMemo(
    () => users.find((user) => String(getId(user)) === String(userId)),
    [users, userId]
  );

  const currentDepartment = getDepartment(currentUser);

  // In the current backend, departments are the available team grouping.
  // We therefore present each department as a team instead of inventing
  // "Other" / "Department not available" pseudo-teams.
  const teams = useMemo(() => {
    const groups = new Map();

    users.forEach((user) => {
      const department = getDepartment(user);
      if (!department) return;

      if (!groups.has(department)) groups.set(department, []);
      groups.get(department).push(user);
    });

    return [...groups.entries()]
      .map(([name, members]) => ({ name, members }))
      .sort((a, b) => {
        if (a.name === currentDepartment) return -1;
        if (b.name === currentDepartment) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [users, currentDepartment]);

  return (
    <DashboardLayout>
      <div className="teamflow-page workspace-page teams-page">
        <section className="teamflow-heading">
          <p className="welcome-label">PEOPLE</p>
          <h2>Your teams.</h2>
          <p className="welcome-description">
            Your team is shown first. Select any team to see its members.
          </p>
        </section>

        {error && <div className="workspace-alert">{error}</div>}

        {loading ? (
          <section className="workspace-panel">
            <div className="workspace-empty">Loading teams...</div>
          </section>
        ) : teams.length === 0 ? (
          <section className="workspace-panel">
            <div className="workspace-empty">
              <strong>No teams found</strong>
              <p>Users with a registered department will appear here.</p>
            </div>
          </section>
        ) : (
          <section className="team-directory">
            {teams.map((team, index) => {
              const isMine = team.name === currentDepartment;
              const isOpen = openTeam === team.name;

              return (
                <article
                  className={`team-directory-card ${isMine ? "my-team" : ""} ${isOpen ? "is-open" : ""}`}
                  key={team.name}
                >
                  <button
                    type="button"
                    className="team-directory-header"
                    onClick={() => setOpenTeam(isOpen ? null : team.name)}
                    aria-expanded={isOpen}
                  >
                    <div className="team-directory-title">
                      <div className="team-directory-icon">
                        {initials(team.name)}
                      </div>
                      <div>
                        <div className="team-directory-kicker">
                          {isMine ? "YOUR TEAM" : `TEAM ${index + 1}`}
                        </div>
                        <h3>{team.name}</h3>
                        <p>{team.members.length} member{team.members.length === 1 ? "" : "s"}</p>
                      </div>
                    </div>
                    <span className="team-directory-arrow">{isOpen ? "−" : "+"}</span>
                  </button>

                  {isOpen && (
                    <div className="team-members-panel">
                      {team.members.map((member) => {
                        const memberId = getId(member);
                        const isCurrent = String(memberId) === String(userId);
                        const name = getName(member);

                        return (
                          <div className={`team-compact-member ${isCurrent ? "current-member" : ""}`} key={memberId}>
                            <div className="team-avatar">{initials(name)}</div>
                            <div className="team-member-main">
                              <strong>{name}</strong>
                              <span>{member.email || "No email"}</span>
                            </div>
                            {isCurrent && <em>You</em>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Team;
