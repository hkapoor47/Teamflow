import {
  LayoutDashboard,
  FolderKanban,
  Users,
  CheckSquare,
  Ticket,
  FlaskConical,
  Bell,
  Brain,
  Settings,
  LogOut,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      name: "Projects",
      icon: FolderKanban,
      path: "/projects",
    },
    {
      name: "Team",
      icon: Users,
      path: "/team",
    },
    {
      name: "Tasks",
      icon: CheckSquare,
      path: "/tasks",
    },
    {
      name: "Tickets",
      icon: Ticket,
      path: "/tickets",
    },
    {
      name: "QA & Reviews",
      icon: FlaskConical,
      path: "/qa",
    },
    {
      name: "Notifications",
      icon: Bell,
      path: "/notifications",
    },
    {
      name: "AI Insights",
      icon: Brain,
      path: "/ai-insights",
    },
  ];

  return (
    <aside className="sidebar">

      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          T
        </div>

        <div>
          <h2>TeamFlow</h2>
          <span>AI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-menu">

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} strokeWidth={1.8} />

              <span>
                {item.name}
              </span>
            </NavLink>
          );
        })}

      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <Settings size={19} strokeWidth={1.8} />

          <span>
            Settings
          </span>
        </NavLink>

        <button className="sidebar-item logout">
          <LogOut size={19} strokeWidth={1.8} />

          <span>
            Logout
          </span>
        </button>

      </div>

    </aside>
  );
};

export default Sidebar;