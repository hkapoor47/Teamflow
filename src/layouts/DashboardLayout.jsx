import Navbar from "../components/Navbar.jsx";

const DashboardLayout = ({ children }) => {
  return (
    <div className="app-layout">
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