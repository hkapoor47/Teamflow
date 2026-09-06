import { Bell } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <header className="navbar">

      <div>
        <h1>Teamflow</h1>
        <p>Project delivery workspace</p>
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