import { Search, Bell } from "lucide-react";

const Navbar = () => {
  return (
    <header className="navbar">

      <div>
        <h1>Dashboard</h1>
        <p>Monitor your team's progress and performance</p>
      </div>

      <div className="navbar-right">

        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search..."
          />
        </div>

        <button className="notification-button">
          <Bell size={20} />
          <span>3</span>
        </button>

        <div className="profile">

          <div className="avatar">
            H
          </div>

          <div>
            <strong>Harshita</strong>
            <small>Manager</small>
          </div>

        </div>

      </div>

    </header>
  );
};

export default Navbar;