import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout.jsx";

const API_BASE_URL = "http://65.0.11.153:5001/api";

function readLoggedInUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function Team() {
  const [users, setUsers] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUser = readLoggedInUser();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Authentication required. Please login again.");
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const text = await response.text();
        let data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          throw new Error("Invalid users API response.");
        }

        if (!response.ok) {
          throw new Error(data.message || "Failed to load team members.");
        }

        return data;
      })
      .then((data) => {
        const list =
          data.users ||
          data.data ||
          (Array.isArray(data) ? data : []);

        setUsers(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error("Team load error:", err);
        setError(err.message || "Failed to load team members.");
      })
      .finally(() => setLoading(false));
  }, []);

  const currentDepartment =
    currentUser?.department ||
    currentUser?.department_name ||
    "";

  const departments = useMemo(() => {
    const names = users
      .map(
        (user) =>
          user.department ||
          user.department_name ||
          "Other"
      )
      .filter(Boolean);

    return [...new Set(names)].sort();
  }, [users]);

  const myTeam = useMemo(() => {
    if (!currentDepartment) return [];

    return users.filter((user) => {
      const department =
        user.department ||
        user.department_name ||
        "Other";

      return (
        String(department).toLowerCase() ===
        String(currentDepartment).toLowerCase()
      );
    });
  }, [users, currentDepartment]);

  const selectedMembers = useMemo(() => {
    if (!selectedDepartment) return [];
    return users.filter((user) => {
      const department =
        user.department ||
        user.department_name ||
        "Other";

      return (
        String(department).toLowerCase() ===
        String(selectedDepartment).toLowerCase()
      );
    });
  }, [users, selectedDepartment]);

  const memberCard = (member) => {
    const name =
      member.name ||
      member.full_name ||
      member.username ||
      member.email ||
      "Unnamed user";

    const department =
      member.department ||
      member.department_name ||
      "Other";

    return (
      <article className="team-member-card" key={member.id || member.email || name}>
        <div className="team-avatar">
          {name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <strong>{name}</strong>
          <p>{member.email || "No email"}</p>
          <span>{department}</span>
        </div>
      </article>
    );
  };

  return (
    <DashboardLayout>
      <div className="teamflow-page workspace-page">
        <section className="teamflow-heading">
          <p className="welcome-label">PEOPLE</p>
          <h2>Your teams.</h2>
          <p className="welcome-description">
            See your department first, then open any team to view its members.
          </p>
        </section>

        {error && <div className="workspace-alert">{error}</div>}

        <section className="team-section">
          <div className="team-section-heading">
            <div>
              <p className="welcome-label">MY TEAM</p>
              <h3>
                {currentDepartment || "Department not available"}
              </h3>
              <p>
                {myTeam.length} member{myTeam.length === 1 ? "" : "s"} in your
                department.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="workspace-empty">Loading your team...</div>
          ) : myTeam.length === 0 ? (
            <div className="workspace-empty">
              <strong>No team members found.</strong>
              <p>
                Your registration department must be returned by the users API.
              </p>
            </div>
          ) : (
            <div className="team-grid">
              {myTeam.map(memberCard)}
            </div>
          )}
        </section>

        <section className="team-section">
          <div className="team-section-heading">
            <div>
              <p className="welcome-label">ALL TEAMS</p>
              <h3>Departments</h3>
              <p>Click a department to see members only.</p>
            </div>
          </div>

          {loading ? (
            <div className="workspace-empty">Loading teams...</div>
          ) : departments.length === 0 ? (
            <div className="workspace-empty">No departments found.</div>
          ) : (
            <div className="team-department-grid">
              {departments.map((department) => {
                const count = users.filter((user) => {
                  const value =
                    user.department ||
                    user.department_name ||
                    "Other";
                  return (
                    String(value).toLowerCase() ===
                    String(department).toLowerCase()
                  );
                }).length;

                return (
                  <button
                    type="button"
                    className="team-department-card"
                    key={department}
                    onClick={() => setSelectedDepartment(department)}
                  >
                    <div>
                      <span className="team-department-label">
                        DEPARTMENT
                      </span>
                      <h3>{department}</h3>
                      <p>{count} member{count === 1 ? "" : "s"}</p>
                    </div>
                    <span className="team-arrow">→</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {selectedDepartment && (
          <section className="team-section">
            <div className="team-section-heading">
              <div>
                <p className="welcome-label">TEAM MEMBERS</p>
                <h3>{selectedDepartment}</h3>
                <p>Members only — no tasks or project details.</p>
              </div>
              <button
                type="button"
                className="team-close-button"
                onClick={() => setSelectedDepartment(null)}
              >
                Close
              </button>
            </div>

            {selectedMembers.length === 0 ? (
              <div className="workspace-empty">
                No members found for this department.
              </div>
            ) : (
              <div className="team-grid">
                {selectedMembers.map(memberCard)}
              </div>
            )}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Team;
