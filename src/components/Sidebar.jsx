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

      <div className="sidebar-logo">
        <div className="logo-icon">T</div>

        <div>
          <h2>TeamFlow</h2>
          <span>AI</span>
        </div>
      </div>

      <nav className="sidebar-menu">

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <a
              key={item.name}
              href={item.path}
              className="sidebar-item"
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </a>
          );
        })}

      </nav>

      <div className="sidebar-bottom">

        <a href="#" className="sidebar-item">
          <Settings size={20} />
          <span>Settings</span>
        </a>

        <button className="sidebar-item logout">
          <LogOut size={20} />
          <span>Logout</span>
        </button>

      </div>

    </aside>
  );
};

export default Sidebar;