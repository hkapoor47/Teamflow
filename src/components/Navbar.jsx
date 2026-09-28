import { Bell } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const TITLES = [
  ["/dashboard", "Dashboard"],
  ["/projects", "Projects"],
  ["/tasks", "Tasks"],
  ["/tickets", "Tickets"],
  ["/completed-projects", "Completed projects"],
  ["/qa-reviews", "QA review"],
  ["/team", "Team"],
  ["/analytics", "Analytics"],
  ["/notifications", "Notifications"],
  ["/profile", "Profile"],
];

const Navbar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const match = TITLES.find(([path]) => pathname.startsWith(path));
  const title = match ? match[1] : "TeamFlow";

  return (
    <header className="navbar">
      <div className="navbar-title">
        <span className="navbar-crumb">TeamFlow</span>
        <h1>{title}</h1>
      </div>

      <div className="navbar-right">

        <button
          className="notification-button"
          onClick={() => navigate("/notifications")}
          aria-label="Open notifications"
        >
          <Bell size={20} />
          <span>3</span>
        </button>

        {/* Profile */}
        <button
          type="button"
          className="profile"
          onClick={() => navigate("/profile")}
          aria-label="Open profile"
        >
          <div className="avatar">
            H
          </div>

          <div>
            <strong>Harshita</strong>
            <small>Manager</small>
          </div>
        </button>

      </div>
    </header>
  );
};

export default Navbar;
