import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Projects from "./pages/Projects.jsx";
import ProjectDetails from "./pages/projectDetails.jsx";
import Tasks from "./pages/Tasks.jsx";
import Team from "./pages/Team.jsx";
import Analytics from "./pages/Analytics.jsx";
import Notifications from "./pages/Notifications.jsx";
import Tickets from "./pages/Tickets.jsx";
import QAReviews from "./pages/QAReviews.jsx";
import TeamMember from "./pages/TeamMember.jsx";

// NEW
import CompletedProjects from "./pages/CompletedProjects.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default */}
        <Route
          path="/"
          element={<Navigate to="/login" />}
        />

        {/* Authentication */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* Projects */}
        <Route
          path="/projects"
          element={<Projects />}
        />

        <Route
          path="/projects/:projectId"
          element={<ProjectDetails />}
        />

        {/* Tasks */}
        <Route
          path="/tasks"
          element={<Tasks />}
        />

        {/* Team */}
        <Route
          path="/team"
          element={<Team />}
        />

        <Route
          path="/team/:memberId"
          element={<TeamMember />}
        />

        {/* Analytics */}
        <Route
          path="/analytics"
          element={<Analytics />}
        />

        {/* Notifications */}
        <Route
          path="/notifications"
          element={<Notifications />}
        />

        {/* Tickets */}
        <Route
          path="/tickets"
          element={<Tickets />}
        />

        {/* Completed Projects */}
        <Route
          path="/completed-projects"
          element={<CompletedProjects />}
        />

        {/* QA Testing for a specific project */}
        <Route
          path="/qa-reviews/:projectId"
          element={<QAReviews />}
        />

        {/* Fallback */}
        <Route
          path="*"
          element={<Navigate to="/dashboard" />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;