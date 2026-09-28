import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";

const DashboardLayout = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Navbar />

        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
