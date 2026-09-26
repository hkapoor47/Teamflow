import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";
import { ProjectProvider } from "./context/ProjectContext.jsx";
import UserProfileProvider from "./context/UserProfileProvider.jsx";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ProjectProvider>
      <UserProfileProvider>
        <App />
      </UserProfileProvider>
    </ProjectProvider>
  </React.StrictMode>
);