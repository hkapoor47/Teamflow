import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ProjectContext = createContext(null);

const API_BASE_URL = "http://65.0.11.153:5001/api";

const CURRENT_USER_ID = "harshita";

/* =====================================================
   HELPERS
===================================================== */

const getToken = () => {
  return localStorage.getItem("token");
};

const normalizeTask = (task) => {
  return {
    ...task,

    id: task.id,

    projectId:
      task.project_id ??
      task.projectId ??
      null,

    title: task.title || "",

    assigneeId:
      task.assigned_to ??
      task.assigneeId ??
      task.assignee_id ??
      null,

    status: task.status || "TODO",

    progress: Number(task.progress) || 0,

    dueDate:
      task.due_date ??
      task.dueDate ??
      task.deadline ??
      null,

    claimedBy:
      task.claimed_by ??
      null,

    claimedByName:
      task.claimed_by_name ??
      null,

    projectName:
      task.project_name ??
      "",
  };
};

/* =====================================================
   PROVIDER
===================================================== */

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  // No confirmed members API yet.
  const [members, setMembers] = useState([]);

  const [claimRequests, setClaimRequests] = useState([]);
  const [activities, setActivities] = useState([]);

  const [loadingProjects, setLoadingProjects] =
    useState(true);

  const [loadingTasks, setLoadingTasks] =
    useState(true);

  /* ===================================================
     FETCH PROJECTS
  =================================================== */

  const fetchProjects = async () => {
    try {
      const token = getToken();

      if (!token) {
        console.error("No authentication token found.");
        setProjects([]);
        return;
      }

      setLoadingProjects(true);

      const response = await fetch(
        `${API_BASE_URL}/projects`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      console.log(
        "PROJECT CONTEXT - PROJECTS:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch projects"
        );
      }

      const backendProjects =
        Array.isArray(data.projects)
          ? data.projects
          : [];

      setProjects(backendProjects);
    } catch (error) {
      console.error(
        "ProjectContext projects error:",
        error
      );

      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  /* ===================================================
     FETCH ALL TASKS
  =================================================== */

  const fetchTasks = async () => {
    try {
      const token = getToken();

      if (!token) {
        console.error("No authentication token found.");
        setTasks([]);
        return;
      }

      setLoadingTasks(true);

      const response = await fetch(
        `${API_BASE_URL}/all-tasks`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      console.log(
        "PROJECT CONTEXT - ALL TASKS:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch tasks"
        );
      }

      const backendTasks =
        Array.isArray(data.tasks)
          ? data.tasks.map(normalizeTask)
          : [];

      setTasks(backendTasks);
    } catch (error) {
      console.error(
        "ProjectContext tasks error:",
        error
      );

      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  /* ===================================================
     INITIAL BACKEND LOAD
  =================================================== */

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, []);

  /* ===================================================
     PROJECT PROGRESS
  =================================================== */

  const projectProgress = (projectId) => {
    const projectTasks = tasks.filter(
      (task) =>
        Number(task.projectId) ===
        Number(projectId)
    );

    if (!projectTasks.length) {
      return 0;
    }

    const completedTasks =
      projectTasks.filter((task) => {
        const status = String(
          task.status || ""
        )
          .trim()
          .toLowerCase();

        return (
          status === "completed" ||
          status === "complete" ||
          status === "done" ||
          status === "closed"
        );
      }).length;

    return Math.round(
      (completedTasks /
        projectTasks.length) *
        100
    );
  };

  /* ===================================================
     REFRESH DATA
  =================================================== */

  const refreshProjects = async () => {
    await fetchProjects();
  };

  const refreshTasks = async () => {
    await fetchTasks();
  };

  const refreshData = async () => {
    await Promise.all([
      fetchProjects(),
      fetchTasks(),
    ]);
  };

  /* ===================================================
     CREATE PROJECT
  =================================================== */

  const createProject = async ({
    name,
    requirements = "",
    deadline = "",
    description = "",
  }) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication required. Please login again."
        );
      }

      const requestBody = {
        name: name.trim(),
        description:
          description?.trim() || null,
        deadline: deadline || null,
      };

      console.log(
        "CREATE PROJECT REQUEST:",
        requestBody
      );

      const response = await fetch(
        `${API_BASE_URL}/projects`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      console.log(
        "CREATE PROJECT RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create project"
        );
      }

      await fetchProjects();

      return data.project || data;
    } catch (error) {
      console.error(
        "Create project error:",
        error
      );

      throw error;
    }
  };

  /* ===================================================
     CREATE TASK
  =================================================== */

  const createTask = async ({
    projectId,
    title,
    assigneeId = null,
    dueDate = null,
  }) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication required. Please login again."
        );
      }

      if (!projectId) {
        throw new Error(
          "Project is required."
        );
      }

      if (!title?.trim()) {
        throw new Error(
          "Task title is required."
        );
      }

      const requestBody = {
        title: title.trim(),
        assigned_to: assigneeId
          ? Number(assigneeId)
          : null,
        due_date: dueDate || null,
      };

      console.log(
        "CREATE TASK REQUEST:",
        requestBody
      );

      const response = await fetch(
        `${API_BASE_URL}/projects/${projectId}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      console.log(
        "CREATE TASK RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create task"
        );
      }

      await fetchTasks();

      return data.task || data;
    } catch (error) {
      console.error(
        "Create task error:",
        error
      );

      throw error;
    }
  };

  /* ===================================================
     ASSIGN TASK

     Backend assignment API not provided yet.
  =================================================== */

  const assignTask = async (
    taskId,
    memberId
  ) => {
    console.warn(
      "assignTask backend API is not connected yet.",
      {
        taskId,
        memberId,
      }
    );
  };

  /* ===================================================
     CLAIM TASK

     CORRECT BACKEND:
     POST /api/projects/:taskId/claim
  =================================================== */

  const requestClaim = async (taskId) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Please login again."
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/projects/${taskId}/claim`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      console.log(
        "CLAIM TASK RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to claim task"
        );
      }

      // Refresh from database.
      await fetchTasks();

      return data;
    } catch (error) {
      console.error(
        "Claim task error:",
        error
      );

      throw error;
    }
  };

  /* ===================================================
     OTHER WORKFLOW FUNCTIONS
  =================================================== */

  const approveClaim = async (
    requestId
  ) => {
    console.warn(
      "approveClaim backend API is not connected yet.",
      {
        requestId,
      }
    );
  };

  const updateTaskStatus = async (
    taskId,
    newStatus,
    userId = CURRENT_USER_ID
  ) => {
    console.warn(
      "updateTaskStatus backend API is not connected yet.",
      {
        taskId,
        newStatus,
        userId,
      }
    );
  };

  const updateTaskProgress = async (
    taskId,
    progress,
    userId = CURRENT_USER_ID
  ) => {
    console.warn(
      "updateTaskProgress backend API is not connected yet.",
      {
        taskId,
        progress,
        userId,
      }
    );
  };

  /* ===================================================
     CONTEXT VALUE
  =================================================== */

  const value = useMemo(
    () => ({
      projects,
      tasks,
      members,

      claimRequests,
      activities,

      loadingProjects,
      loadingTasks,

      projectProgress,

      refreshProjects,
      refreshTasks,
      refreshData,

      createProject,
      createTask,

      assignTask,
      requestClaim,
      approveClaim,
      updateTaskStatus,
      updateTaskProgress,
    }),
    [
      projects,
      tasks,
      members,
      claimRequests,
      activities,
      loadingProjects,
      loadingTasks,
    ]
  );

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

/* =====================================================
   HOOK
===================================================== */

export function useProjects() {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error(
      "useProjects must be used inside ProjectProvider"
    );
  }

  return context;
}