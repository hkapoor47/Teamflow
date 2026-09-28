import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Ticket,
  CircleCheckBig,
  Users,
  ChartColumn,
  Bell,
  UserRound,
  LogOut,
} from "lucide-react";

const WORKSPACE = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/tickets", label: "Tickets", icon: Ticket },
  { to: "/completed-projects", label: "Completed", icon: CircleCheckBig },
];

const INSIGHTS = [
  { to: "/team", label: "Team", icon: Users },
  { to: "/analytics", label: "Analytics", icon: ChartColumn },
];

const ACCOUNT = [
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: UserRound },
];

const Sidebar = () => {
  const navigate = useNavigate();

  const renderLinks = (items) =>
    items.map(({ to, label, icon: Icon }) => (
      <NavLink
        key={to}
        to={to}
        title={label}
        className={({ isActive }) =>
          `sidebar-item${isActive ? " active" : ""}`
        }
      >
        <Icon size={18} strokeWidth={2} />
        <span>{label}</span>
      </NavLink>
    ));

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar-logo">
        <div className="logo-icon">T</div>
        <div>
          <h2>TeamFlow</h2>
          <span>AI WORKSPACE</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        <p className="sidebar-section">Workspace</p>
        {renderLinks(WORKSPACE)}

        <p className="sidebar-section">Insights</p>
        {renderLinks(INSIGHTS)}

        <p className="sidebar-section">Account</p>
        {renderLinks(ACCOUNT)}
      </nav>

      <div className="sidebar-bottom">
        <button
          type="button"
          className="sidebar-item logout"
          onClick={handleSignOut}
          title="Sign out"
        >
          <LogOut size={18} strokeWidth={2} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
