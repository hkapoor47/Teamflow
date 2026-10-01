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

  const match = TITLES.find(([path]) =>
    pathname.startsWith(path)
  );

  const title = match ? match[1] : "TeamFlow";

  // ==========================================
  // GET LOGGED-IN USER
  // ==========================================
  const getCurrentUser = () => {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        return {
          name: "Team Member",
        };
      }

      const user = JSON.parse(storedUser);

      return {
        name:
          user?.name ||
          user?.username ||
          user?.email ||
          "Team Member",
      };
    } catch (error) {
      console.error(
        "Failed to read logged-in user:",
        error
      );

      return {
        name: "Team Member",
      };
    }
  };

  const currentUser = getCurrentUser();

  const userName = currentUser.name
  .trim()
  .toLowerCase()
  .split(/\s+/)
  .map(
    (word) =>
      word.charAt(0).toUpperCase() +
      word.slice(1)
  )
  .join(" ");

  // ==========================================
  // USER INITIALS
  // ==========================================
  const userInitials = userName
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="navbar">

      {/* =====================================
          PAGE TITLE
      ===================================== */}
      <div className="navbar-title">
        <span className="navbar-crumb">
          TeamFlow
        </span>

        <h1>
          {title}
        </h1>
      </div>


      {/* =====================================
          RIGHT SIDE
      ===================================== */}
      <div className="navbar-right">

        {/* Notifications */}
        <button
          className="notification-button"
          onClick={() =>
            navigate("/notifications")
          }
          aria-label="Open notifications"
        >
          <Bell size={20} />

          <span>
            3
          </span>
        </button>


        {/* ===================================
            LOGGED-IN USER
        =================================== */}
        <button
          type="button"
          className="profile"
          onClick={() =>
            navigate("/profile")
          }
          aria-label="Open profile"
        >

          <div className="avatar">
            {userInitials}
          </div>

          <div>
            <strong>
              {userName}
            </strong>
          </div>

        </button>

      </div>
    </header>
  );
};

export default Navbar;